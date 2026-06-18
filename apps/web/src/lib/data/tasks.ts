import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CareLogRow,
  CareScheduleRow,
  CareType,
  Database,
  TaskInstanceRow,
} from "@/lib/data/types";
import { cancelTaskReminder } from "@/lib/data/reminders";

type Client = SupabaseClient<Database>;

// ──────────────────────────────────────────────
// Response types
// ──────────────────────────────────────────────

export type TaskWithPlant = TaskInstanceRow & {
  plantName: string;
  plantLocation: string | null;
};

export type TaskGroup = {
  label: string;
  tasks: TaskWithPlant[];
};

export type CompleteTaskInput = {
  amount_ml?: number;
  fertilizer_name?: string;
  fertilizer_strength?: string;
  notes?: string;
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString();
}

function clientId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

// ──────────────────────────────────────────────
// Generate task instances from schedules
// Creates one task_instance per schedule for dates
// that don't already have a pending/snoozed instance.
// ──────────────────────────────────────────────

export async function ensureTaskInstances(
  supabase: Client,
  userId: string,
): Promise<void> {
  // Fetch active schedules
  const { data: schedules, error: schedError } = await supabase
    .from("care_schedules")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .eq("active", true);

  if (schedError) throw schedError;
  if (!schedules || schedules.length === 0) return;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  for (const schedule of schedules) {
    // Find existing pending/snoozed instances for this schedule
    const { data: existing } = await supabase
      .from("task_instances")
      .select("id, due_at")
      .eq("user_id", userId)
      .eq("schedule_id", schedule.id)
      .in("status", ["pending", "snoozed"])
      .gte("due_at", `${todayStr}T00:00:00`)
      .lte("due_at", `${todayStr}T23:59:59`)
      .limit(1);

    if (existing && existing.length > 0) continue;

    // Check if the schedule's next_due_at is today or overdue
    const dueDate = schedule.next_due_at
      ? new Date(schedule.next_due_at)
      : null;
    if (!dueDate || dueDate > new Date(todayStr + "T23:59:59")) {
      // No task needed yet — future-dated
      continue;
    }

    // Check if one was already completed today
    const { data: completed } = await supabase
      .from("task_instances")
      .select("id")
      .eq("user_id", userId)
      .eq("schedule_id", schedule.id)
      .eq("status", "done")
      .gte("due_at", `${todayStr}T00:00:00`)
      .lte("due_at", `${todayStr}T23:59:59`)
      .limit(1);

    if (completed && completed.length > 0) continue;

    // Create a new task instance
    const timestamp = nowIso();
    const { error: insertError } = await supabase
      .from("task_instances")
      .insert({
        user_id: userId,
        plant_id: schedule.plant_id,
        schedule_id: schedule.id,
        care_type: schedule.care_type,
        due_at: schedule.next_due_at ?? timestamp,
        status: "pending",
        client_id: clientId("task"),
        client_created_at: timestamp,
        client_updated_at: timestamp,
      });

    if (insertError) {
      // Schedule might have just been completed — skip gracefully
      if (!insertError.message?.includes("duplicate")) {
        console.error("Failed to create task instance:", insertError);
      }
    }
  }
}

// ──────────────────────────────────────────────
// List all task instances with plant names,
// grouped by status category
// ──────────────────────────────────────────────

export async function listTasks(
  supabase: Client,
  userId: string,
): Promise<{
  overdue: TaskWithPlant[];
  today: TaskWithPlant[];
  upcoming: TaskWithPlant[];
}> {
  // Fetch plants for name resolution
  const { data: plants } = await supabase
    .from("plants")
    .select("id, name, location")
    .eq("user_id", userId)
    .is("deleted_at", null);

  const plantMap = new Map(
    (plants ?? []).map((p) => [p.id, { name: p.name, location: p.location }]),
  );

  const now = new Date();
  const todayStart = now.toISOString().slice(0, 10) + "T00:00:00";
  const todayEnd = now.toISOString().slice(0, 10) + "T23:59:59";

  const { data: tasks, error } = await supabase
    .from("task_instances")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "snoozed"])
    .is("deleted_at", null)
    .order("due_at", { ascending: true });

  if (error) throw error;
  if (!tasks) return { overdue: [], today: [], upcoming: [] };

  const withPlants: TaskWithPlant[] = tasks.map((t) => ({
    ...t,
    plantName: plantMap.get(t.plant_id)?.name ?? "Unknown plant",
    plantLocation: plantMap.get(t.plant_id)?.location ?? null,
  }));

  const overdue: TaskWithPlant[] = [];
  const today: TaskWithPlant[] = [];
  const upcoming: TaskWithPlant[] = [];

  for (const task of withPlants) {
    const dueAt = task.due_at ? new Date(task.due_at) : null;
    if (!dueAt) {
      upcoming.push(task);
    } else if (dueAt.getTime() < now.getTime()) {
      // Check if it's actually overdue (due before today)
      if (dueAt.toISOString().slice(0, 10) < todayStart.slice(0, 10)) {
        overdue.push(task);
      } else {
        today.push(task);
      }
    } else if (
      dueAt >= new Date(todayStart) &&
      dueAt <= new Date(todayEnd)
    ) {
      today.push(task);
    } else {
      upcoming.push(task);
    }
  }

  return { overdue, today, upcoming };
}

// ──────────────────────────────────────────────
// Complete a task — creates a care_log entry,
// marks task as done, updates schedule's next_due_at
// ──────────────────────────────────────────────

export async function completeTask(
  supabase: Client,
  userId: string,
  taskId: string,
  input: CompleteTaskInput = {},
): Promise<CareLogRow> {
  // Fetch the task
  const { data: task, error: taskError } = await supabase
    .from("task_instances")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single();

  if (taskError || !task) throw taskError ?? new Error("Task not found");

  const taskRow = task as unknown as TaskInstanceRow;

  // Fetch the linked schedule if present
  let schedule: CareScheduleRow | null = null;
  if (taskRow.schedule_id) {
    const { data: sched } = await supabase
      .from("care_schedules")
      .select("*")
      .eq("id", taskRow.schedule_id as string)
      .eq("user_id", userId)
      .single();

    schedule = sched;
  }

  const timestamp = nowIso();

  // Create care log
  const { data: log, error: logError } = await supabase
    .from("care_logs")
    .insert({
      user_id: userId,
      plant_id: taskRow.plant_id,
      schedule_id: taskRow.schedule_id,
      task_instance_id: taskRow.id,
      care_type: taskRow.care_type as CareType,
      occurred_at: timestamp,
      amount_ml: input.amount_ml ?? null,
      fertilizer_name: input.fertilizer_name ?? null,
      fertilizer_strength: input.fertilizer_strength ?? null,
      notes: input.notes ?? null,
      client_id: clientId("care-log"),
      client_created_at: timestamp,
      client_updated_at: timestamp,
    })
    .select()
    .single();

  if (logError) throw logError;

  // Mark task as done
  const { error: updateError } = await supabase
    .from("task_instances")
    .update({
      status: "done",
      completed_log_id: log.id,
      completed_at: timestamp,
      client_updated_at: timestamp,
    })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (updateError) throw updateError;

  await cancelTaskReminder(taskId);

  // Update schedule next_due_at if linked
  if (schedule) {
    const days =
      schedule.cadence_unit === "week"
        ? schedule.cadence_value * 7
        : schedule.cadence_unit === "month"
          ? schedule.cadence_value * 30
          : schedule.cadence_value;

    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + days);

    await supabase
      .from("care_schedules")
      .update({
        last_completed_at: timestamp,
        next_due_at: nextDue.toISOString(),
        client_updated_at: timestamp,
      })
      .eq("id", schedule.id)
      .eq("user_id", userId);
  }

  return log;
}

// ──────────────────────────────────────────────
// Skip a task
// ──────────────────────────────────────────────

export async function skipTask(
  supabase: Client,
  userId: string,
  taskId: string,
): Promise<void> {
  const timestamp = nowIso();
  const { error } = await supabase
    .from("task_instances")
    .update({
      status: "skipped",
      client_updated_at: timestamp,
    })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) throw error;

  await cancelTaskReminder(taskId);
}

// ──────────────────────────────────────────────
// Snooze a task until a specific time
// ──────────────────────────────────────────────

export async function snoozeTask(
  supabase: Client,
  userId: string,
  taskId: string,
  snoozeUntil: string,
): Promise<void> {
  const timestamp = nowIso();
  const { error } = await supabase
    .from("task_instances")
    .update({
      status: "snoozed",
      snoozed_until: snoozeUntil,
      client_updated_at: timestamp,
    })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) throw error;

  await cancelTaskReminder(taskId);
}

// ──────────────────────────────────────────────
// Reschedule a task to a new due date
// ──────────────────────────────────────────────

export async function rescheduleTask(
  supabase: Client,
  userId: string,
  taskId: string,
  newDueAt: string,
): Promise<void> {
  const timestamp = nowIso();
  const { error } = await supabase
    .from("task_instances")
    .update({
      due_at: newDueAt,
      status: "pending",
      snoozed_until: null,
      client_updated_at: timestamp,
    })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) throw error;

  await cancelTaskReminder(taskId);
}

// ──────────────────────────────────────────────
// Timeline types — combined care_logs, journal_entries,
// and journal_photos into one chronological feed
// ──────────────────────────────────────────────

export type TimelineEventType = "care_log" | "journal_entry" | "photo";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  occurredAt: string;
  // Care log fields
  careType?: CareType;
  notes: string | null;
  amount_ml: number | null;
  fertilizer_name: string | null;
  fertilizer_strength: string | null;
  // Journal entry fields
  title?: string | null;
  body?: string | null;
  health_score?: number | null;
  tags?: string[];
  // Photo fields
  object_path?: string | null;
  content_type?: string | null;
  photoCount?: number;
  status?: string;
};

export async function listPlantTimeline(
  supabase: Client,
  userId: string,
  plantId: string,
): Promise<TimelineEvent[]> {
  // Fetch care logs
  const { data: logs, error: logError } = await supabase
    .from("care_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("plant_id", plantId)
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false })
    .limit(50);

  if (logError) throw logError;

  // Fetch journal entries with their photos
  const { data: entries, error: entryError } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("plant_id", plantId)
    .is("deleted_at", null)
    .order("observed_at", { ascending: false })
    .limit(50);

  if (entryError) throw entryError;

  // Fetch photos for journal entries
  const entryPhotoMap = new Map<string, { object_path: string; content_type: string | null }[]>();
  if (entries && entries.length > 0) {
    const entryIds = entries.map((e) => e.id);
    const { data: photos, error: photosError } = await supabase
      .from("journal_photos")
      .select("journal_entry_id, object_path, content_type")
      .eq("user_id", userId)
      .in("journal_entry_id", entryIds)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (photosError) throw photosError;

    for (const photo of photos ?? []) {
      const list = entryPhotoMap.get(photo.journal_entry_id ?? "") ?? [];
      list.push({ object_path: photo.object_path, content_type: photo.content_type });
      entryPhotoMap.set(photo.journal_entry_id ?? "", list);
    }
  }

  const events: TimelineEvent[] = [];

  // Add care logs
  for (const log of logs ?? []) {
    events.push({
      id: log.id,
      type: "care_log",
      occurredAt: log.occurred_at,
      careType: log.care_type as CareType,
      notes: log.notes,
      amount_ml: log.amount_ml,
      fertilizer_name: log.fertilizer_name,
      fertilizer_strength: log.fertilizer_strength,
      status: "done",
    });
  }

  // Add journal entries
  for (const entry of entries ?? []) {
    const entryPhotos = entryPhotoMap.get(entry.id) ?? [];
    events.push({
      id: entry.id,
      type: "journal_entry",
      occurredAt: entry.observed_at,
      title: entry.title,
      body: entry.body,
      notes: entry.body,
      health_score: entry.health_score,
      tags: entry.tags ?? [],
      amount_ml: null,
      fertilizer_name: null,
      fertilizer_strength: null,
      photoCount: entryPhotos.length,
    });

    // Add individual photo events
    for (const photo of entryPhotos) {
      events.push({
        id: `${entry.id}-photo-${photo.object_path}`,
        type: "photo",
        occurredAt: entry.observed_at,
        object_path: photo.object_path,
        content_type: photo.content_type,
        notes: null,
        amount_ml: null,
        fertilizer_name: null,
        fertilizer_strength: null,
        title: entry.title,
      });
    }
  }

  // Sort by occurredAt descending
  events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return events;
}

// ──────────────────────────────────────────────
// List all care events for journal feed
// ──────────────────────────────────────────────

export type JournalFeedItem = TimelineEvent & {
  plantName: string;
  plantId: string;
};

export async function listJournalFeed(
  supabase: Client,
  userId: string,
): Promise<JournalFeedItem[]> {
  type LogFeed = Record<string, unknown> & {
    id: string;
    plant_id: string;
    care_type: string;
    occurred_at: string;
    notes: string | null;
    amount_ml: number | null;
    fertilizer_name: string | null;
    fertilizer_strength: string | null;
    plants: { name: string };
  };
  type EntryFeed = Record<string, unknown> & {
    id: string;
    plant_id: string;
    observed_at: string;
    title: string | null;
    body: string | null;
    health_score: number | null;
    tags: string[];
    plants: { name: string };
  };

  // Fetch care logs with plant name
  const logResponse = await supabase
    .from("care_logs")
    .select("*, plants!inner(name)")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false })
    .limit(100);

  const logs = logResponse.data as unknown as LogFeed[] | null;
  if (logResponse.error) throw logResponse.error;

  // Fetch journal entries with plant name
  const entryResponse = await supabase
    .from("journal_entries")
    .select("*, plants!inner(name)")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("observed_at", { ascending: false })
    .limit(100);

  const entries = entryResponse.data as unknown as EntryFeed[] | null;
  if (entryResponse.error) throw entryResponse.error;

  const feed: JournalFeedItem[] = [];

  // Map care logs
  for (const raw of (logs as unknown as LogFeed[]) ?? []) {
    feed.push({
      id: raw.id,
      type: "care_log",
      occurredAt: raw.occurred_at,
      careType: raw.care_type as CareType,
      notes: raw.notes,
      amount_ml: raw.amount_ml,
      fertilizer_name: raw.fertilizer_name,
      fertilizer_strength: raw.fertilizer_strength,
      status: "done",
      plantName: raw.plants?.name ?? "Unknown plant",
      plantId: raw.plant_id,
    });
  }

  // Map journal entries
  for (const raw of (entries as unknown as EntryFeed[]) ?? []) {
    feed.push({
      id: raw.id,
      type: "journal_entry",
      occurredAt: raw.observed_at,
      title: raw.title,
      body: raw.body,
      notes: raw.body,
      health_score: raw.health_score,
      tags: raw.tags ?? [],
      amount_ml: null,
      fertilizer_name: null,
      fertilizer_strength: null,
      plantName: raw.plants?.name ?? "Unknown plant",
      plantId: raw.plant_id,
    });
  }

  // Sort by occurredAt descending
  feed.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return feed.slice(0, 200);
}

// ──────────────────────────────────────────────
// Calendar: list tasks grouped by date
// ──────────────────────────────────────────────

export type CalendarDayGroup = {
  date: string;
  label: string;
  tasks: TaskWithPlant[];
};

export async function listUpcomingByDate(
  supabase: Client,
  userId: string,
): Promise<CalendarDayGroup[]> {
  const { overdue, today, upcoming } = await listTasks(supabase, userId);

  // Build date groups
  const groups = new Map<string, TaskWithPlant[]>();

  // Add overdue into their respective due-date groups
  for (const task of overdue) {
    const dateKey = task.due_at?.slice(0, 10) ?? "unknown";
    const arr = groups.get(dateKey) ?? [];
    arr.push(task);
    groups.set(dateKey, arr);
  }

  // Today
  for (const task of today) {
    const dateKey = "today";
    const arr = groups.get(dateKey) ?? [];
    arr.push(task);
    groups.set(dateKey, arr);
  }

  // Upcoming — group by due date
  for (const task of upcoming) {
    const dateKey = task.due_at?.slice(0, 10) ?? "unknown";
    const arr = groups.get(dateKey) ?? [];
    arr.push(task);
    groups.set(dateKey, arr);
  }

  // Sort into ordered array
  const result: CalendarDayGroup[] = [];
  const addedToday = groups.has("today");

  if (addedToday) {
    result.push({
      date: "today",
      label: "Today",
      tasks: groups.get("today")!,
    });
    groups.delete("today");
  }

  // Sort remaining by date
  const remaining = Array.from(groups.entries())
    .filter(([key]) => key !== "unknown")
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [date, tasks] of remaining) {
    const label = formatCalendarDate(date);
    result.push({ date, label, tasks });
  }

  return result;
}

function formatCalendarDate(dateStr: string) {
  if (dateStr === "unknown") return "Unknown date";
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

// Re-export formatDueDate from care for consistency
export { formatDueDate } from "@/lib/data/care";
