import type { CareType } from "@/lib/data/types";

// ──────────────────────────────────────────────
// Reminder Preferences (stored in localStorage
// with Supabase profiles fallback)
// ──────────────────────────────────────────────

const STORAGE_KEY = "opensprout_reminder_prefs";

export type ReminderPreferences = {
  enabled: boolean;
  leadTimeMinutes: number;       // How many minutes before due to fire
  quietHoursStart: string | null; // "22:00" format, null = no quiet hours
  quietHoursEnd: string | null;   // "07:00" format
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
}

// ──────────────────────────────────────────────
// Notification ID helpers
// Consistent IDs so we can cancel/replace them
// ──────────────────────────────────────────────

const NOTIF_PREFIX = "opensprout-task";
const CHANNEL_ID = "opensprout-care-reminders";

export function taskNotifId(taskId: string): string {
  return `${NOTIF_PREFIX}-${taskId}`;
}

// ──────────────────────────────────────────────
// Check if we are running in Capacitor native
// ──────────────────────────────────────────────

function isCapacitorNative(): boolean {
  try {
    return typeof window !== "undefined" && "Capacitor" in window;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────
// Schedule a single task reminder
// Uses Capacitor Local Notifications on Android,
// falls back to no-op on web (PWA push in future)
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
  if (!isCapacitorNative()) {
    // Web: no local notification API — future PWA push
    // Store in a "pending reminders" list for web badge
    return;
  }

  const due = new Date(input.dueAt).getTime();
  const leadMs = prefs.leadTimeMinutes * 60 * 1000;
  let fireAt = due - leadMs;
  const now = Date.now();

  // Don't schedule in the past
  if (fireAt <= now) {
    // Schedule for "now" if it's already overdue
    fireAt = now + 1000;
  }

  // Apply quiet hours
  if (prefs.quietHoursStart && prefs.quietHoursEnd) {
    const fireDate = new Date(fireAt);
    const fireMinutes = fireDate.getHours() * 60 + fireDate.getMinutes();
    const [startH, startM] = prefs.quietHoursStart.split(":").map(Number);
    const [endH, endM] = prefs.quietHoursEnd.split(":").map(Number);
    const quietStart = startH * 60 + startM;
    const quietEnd = endH * 60 + endM;

    let adjusted = false;
    if (quietStart < quietEnd) {
      // Same-day range e.g. 22:00-07:00 spans midnight
      if (fireMinutes >= quietStart || fireMinutes < quietEnd) {
        // Schedule for after quiet hours end
        const afterQuiet = new Date(fireDate);
        afterQuiet.setHours(endH, endM, 0, 0);
        fireAt = afterQuiet.getTime();
        adjusted = true;
      }
    } else {
      // Wraps midnight — 22:00-07:00
      if (fireMinutes >= quietStart || fireMinutes < quietEnd) {
        if (fireMinutes >= quietStart) {
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

    if (adjusted && fireAt <= now) {
      // If adjusted time is past, skip notification entirely
      return;
    }
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

  try {
    const { LocalNotifications } = await import(
      "@capacitor/local-notifications"
    );

    // Cancel any existing notification for this task first
    await LocalNotifications.cancel({
      notifications: [{ id: notifIdFromTask(input.taskId) }],
    });

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: notifIdFromTask(input.taskId),
          schedule: { at: new Date(fireAt), allowWhileIdle: true },
          extra: {
            taskId: input.taskId,
            plantId: input.plantId,
            screen: "plants",
          },
          channelId: CHANNEL_ID,
          smallIcon: "ic_stat_sprout",
          iconColor: "#16784f",
          actionTypeId: "",
        },
      ],
    });
  } catch (err) {
    console.warn("LocalNotifications not available:", err);
  }
}

// ──────────────────────────────────────────────
// Cancel a task reminder
// ──────────────────────────────────────────────

export async function cancelTaskReminder(taskId: string): Promise<void> {
  if (!isCapacitorNative()) return;
  try {
    const { LocalNotifications } = await import(
      "@capacitor/local-notifications"
    );
    await LocalNotifications.cancel({
      notifications: [{ id: notifIdFromTask(taskId) }],
    });
  } catch {
    // Silently fail if plugin not available
  }
}

// ──────────────────────────────────────────────
// Reschedule all reminders for a user's tasks
// Called after refreshDashboard
// ──────────────────────────────────────────────

import type { TaskInstanceRow } from "@/lib/data/types";

export async function rescheduleAllReminders(
  tasks: { overdue: TaskInstanceRow[]; today: TaskInstanceRow[]; upcoming: TaskInstanceRow[] },
  plantMap: Map<string, string>,
): Promise<void> {
  const prefs = loadReminderPrefs();
  if (!prefs.enabled) return;

  // Cancel all existing, then reschedule
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
}

// ──────────────────────────────────────────────
// Request notification permissions (Android)
// ──────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isCapacitorNative()) return true; // No permissions needed on web
  try {
    const { LocalNotifications } = await import(
      "@capacitor/local-notifications"
    );
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === "granted";
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────
// Create a numeric notification ID from a UUID
// ──────────────────────────────────────────────

function notifIdFromTask(taskId: string): number {
  // Hash the UUID to a positive 32-bit int
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) {
    const char = taskId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit int
  }
  return Math.abs(hash);
}
