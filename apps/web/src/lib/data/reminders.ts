import type { CareType, TaskInstanceRow } from "@/lib/data/types";

// ──────────────────────────────────────────────
// Reminder Preferences (stored in localStorage
// with Supabase profiles fallback)
// ──────────────────────────────────────────────

const STORAGE_KEY = "opensprout_reminder_prefs";

export type ReminderPreferences = {
  enabled: boolean;
  leadTimeMinutes: number;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
};

const defaultPrefs: ReminderPreferences = {
  enabled: true,
  leadTimeMinutes: 60,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
};

export function loadReminderPrefs(): ReminderPreferences {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    return defaultPrefs;
  }
}

export function saveReminderPrefs(prefs: ReminderPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  // If enabled changed, setup or teardown background polling
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("opensprout-prefs-changed", { detail: prefs }));
  }
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const NOTIF_PREFIX = "opensprout-task";

export function taskNotifId(taskId: string): string {
  return `${NOTIF_PREFIX}-${taskId}`;
}

// ──────────────────────────────────────────────
// Web Notification API helpers (PWA + desktop)
// Requires user interaction to grant permission.
// Works on all platforms where the PWA is installed.
// ──────────────────────────────────────────────

/** Request Notification API permission (web path). */
export async function requestWebNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Show a web notification immediately. */
function showWebNotification(title: string, body: string, tag: string, data?: Record<string, string>) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      tag,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: data ?? {},
      silent: false,
    });
  } catch {
    // Silently fail
  }
}

// ──────────────────────────────────────────────
// Track shown notifications across page loads
// using a Set in sessionStorage
// ──────────────────────────────────────────────

function getShownSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem("opensprout-shown-notifs");
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markShown(tag: string) {
  try {
    const set = getShownSet();
    set.add(tag);
    sessionStorage.setItem("opensprout-shown-notifs", JSON.stringify([...set]));
  } catch {
    // noop
  }
}

function isShown(tag: string): boolean {
  return getShownSet().has(tag);
}

// ──────────────────────────────────────────────
// Show a "missed reminders" summary on app load
// ──────────────────────────────────────────────

export function showMissedReminders(
  tasks: { overdue: TaskInstanceRow[]; today: TaskInstanceRow[] },
  plantMap: Map<string, string>,
): void {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const tag = "opensprout-missed-care";
  if (isShown(tag)) return;

  const totalOverdue = tasks.overdue.length;
  const totalToday = tasks.today.length;

  if (totalOverdue > 0 || totalToday > 0) {
    const parts: string[] = [];
    if (totalOverdue > 0) parts.push(`${totalOverdue} overdue`);
    if (totalToday > 0) parts.push(`${totalToday} due today`);
    const plantNames = [...tasks.overdue, ...tasks.today]
      .map((t) => plantMap.get(t.plant_id))
      .filter(Boolean) as string[];
    const uniquePlants = [...new Set(plantNames)];

    showWebNotification(
      "Care needed 🌱",
      `${parts.join(" + ")} — ${uniquePlants.slice(0, 3).join(", ")}${uniquePlants.length > 3 ? "…" : ""}`,
      tag,
    );
    markShown(tag);
  }
}

// ──────────────────────────────────────────────
// Web: due-soon notification — fire when a task
// becomes due within the current browsing session
// ──────────────────────────────────────────────

const dueSoonTags = new Set<string>();

export function showDueSoonNotification(
  taskId: string,
  plantName: string,
  careType: string,
  dueAt: string,
): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (dueSoonTags.has(taskId)) return;

  const tag = `opensprout-due-${taskId}`;
  if (isShown(tag)) return;

  showWebNotification(
    `${plantName} — ${careType}`,
    `Due ${new Date(dueAt).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })}`,
    tag,
    { taskId },
  );
  dueSoonTags.add(taskId);
  markShown(tag);
}

// ──────────────────────────────────────────────
// Schedule a single task reminder
// Uses Web Notification API (PWA/desktop)
// ──────────────────────────────────────────────

export type TaskReminderInput = {
  taskId: string;
  plantId: string;
  plantName: string;
  careType: CareType;
  dueAt: string;
  label?: string;
};

export async function scheduleTaskReminder(
  input: TaskReminderInput,
  prefs: ReminderPreferences = loadReminderPrefs(),
): Promise<void> {
  if (!prefs.enabled) return;

  const due = new Date(input.dueAt).getTime();
  const leadMs = prefs.leadTimeMinutes * 60 * 1000;
  let fireAt = due - leadMs;
  const now = Date.now();

  // Don't schedule in the past unless it's already due
  if (fireAt <= now) {
    fireAt = now + 1000;
  }

  // Apply quiet hours
  if (prefs.quietHoursStart && prefs.quietHoursEnd) {
    const adjusted = applyQuietHours(fireAt, prefs.quietHoursStart, prefs.quietHoursEnd);
    if (adjusted === null) return; // Skip if adjusted time is in the past
    fireAt = adjusted;
  }

  const title = input.label
    ? `${input.plantName}: ${input.label}`
    : `${input.plantName}: ${input.careType} care due`;
  const body = `Due ${new Date(input.dueAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;

  // Schedule via setTimeout (session-scoped)
  scheduleWebNotification(input.taskId, title, body, fireAt - Date.now(), input);
}

function applyQuietHours(fireAt: number, quietStart: string, quietEnd: string): number | null {
  const fireDate = new Date(fireAt);
  const fireMinutes = fireDate.getHours() * 60 + fireDate.getMinutes();
  const [startH, startM] = quietStart.split(":").map(Number);
  const [endH, endM] = quietEnd.split(":").map(Number);
  const quietStartMin = startH * 60 + startM;
  const quietEndMin = endH * 60 + endM;

  let adjusted = false;
  if (quietStartMin < quietEndMin) {
    // Same-day range like 08:00-17:00
    if (fireMinutes >= quietStartMin && fireMinutes < quietEndMin) {
      // Quiet hours are currently active — schedule for after
      const afterQuiet = new Date(fireDate);
      afterQuiet.setHours(endH, endM, 0, 0);
      fireAt = afterQuiet.getTime();
      adjusted = true;
    }
  } else {
    // Wraps midnight — 22:00-07:00
    if (fireMinutes >= quietStartMin || fireMinutes < quietEndMin) {
      if (fireMinutes >= quietStartMin) {
        const nextDay = new Date(fireDate);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(endH, endM, 0, 0);
        fireAt = nextDay.getTime();
      } else {
        const today = new Date(fireDate);
        today.setHours(endH, endM, 0, 0);
        fireAt = today.getTime();
      }
      adjusted = true;
    }
  }

  if (adjusted && fireAt <= Date.now()) return null;
  return fireAt;
}

/** Web notification timers — keyed by taskId so we can cancel. */
const webTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleWebNotification(
  taskId: string,
  title: string,
  body: string,
  delayMs: number,
  input: TaskReminderInput,
) {
  // Cancel existing timer
  const existing = webTimers.get(taskId);
  if (existing) clearTimeout(existing);

  if (delayMs < 0) delayMs = 0;
  // Cap at ~24 days (max setTimeout)
  if (delayMs > 2_147_483_647) return;

  const timer = setTimeout(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    showWebNotification(title, body, `opensprout-task-${taskId}`, {
      taskId: taskId,
      plantId: input.plantId,
    });
    webTimers.delete(taskId);
  }, delayMs);

  webTimers.set(taskId, timer);
}

// ──────────────────────────────────────────────
// Cancel a task reminder
// ──────────────────────────────────────────────

export async function cancelTaskReminder(taskId: string): Promise<void> {
  // Cancel web timer
  const timer = webTimers.get(taskId);
  if (timer) {
    clearTimeout(timer);
    webTimers.delete(taskId);
  }
  dueSoonTags.delete(taskId);
}

// ──────────────────────────────────────────────
// Reschedule all reminders for a user's tasks
// Called after refreshDashboard
// ──────────────────────────────────────────────

export async function rescheduleAllReminders(
  tasks: { overdue: TaskInstanceRow[]; today: TaskInstanceRow[]; upcoming: TaskInstanceRow[] },
  plantMap: Map<string, string>,
): Promise<void> {
  const prefs = loadReminderPrefs();
  if (!prefs.enabled) return;

  const allTasks = [...tasks.overdue, ...tasks.today, ...tasks.upcoming];

  for (const task of allTasks) {
    if (task.status === "done" || task.status === "skipped" || task.status === "cancelled") {
      await cancelTaskReminder(task.id);
      continue;
    }

    await scheduleTaskReminder(
      {
        taskId: task.id,
        plantId: task.plant_id,
        plantName: plantMap.get(task.plant_id) ?? "Plant",
        careType: task.care_type as CareType,
        dueAt: task.due_at,
      },
      prefs,
    );
  }

  // Show missed reminders banner (web)
  showMissedReminders(
    { overdue: tasks.overdue, today: tasks.today },
    plantMap,
  );
}

// ──────────────────────────────────────────────
// Request notification permissions (web / PWA)
// ──────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  return requestWebNotificationPermission();
}

