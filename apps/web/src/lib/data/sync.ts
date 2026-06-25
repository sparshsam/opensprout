import {
  cacheTable,
  getPendingActions,
  markPendingRetry,
  removePendingAction,
  getLastSyncTime,
  setLastSyncTime,
  type PendingAction,
} from "@/lib/data/db";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/data/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Max times a pending action will be retried before being discarded. */
const MAX_RETRIES = 5;

/** Base delay (ms) for exponential backoff — doubles each retry. */
const BACKOFF_BASE_MS = 30_000; // 30s, then 60s, 2m, 4m, 8m

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

export type SyncStats = {
  pushed: number;
  pulled: Record<string, number>;
  pending: number;
  lastSync: string | null;
  status: SyncStatus;
};

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/**
 * Maps Supabase table names to local IndexedDB cache store names.
 */
const TABLE_TO_CACHE: Record<string, string> = {
  plants: "plants",
  care_schedules: "schedules",
  care_logs: "logs",
  task_instances: "tasks",
  journal_entries: "journalEntries",
  journal_photos: "journalPhotos",
};

/**
 * The tables that are pulled during a fresh sync.
 */
const PULL_TABLES = [
  "plants",
  "care_schedules",
  "care_logs",
  "task_instances",
  "journal_entries",
  "journal_photos",
] as const;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";

// ---------------------------------------------------------------------------
// Connectivity check
// ---------------------------------------------------------------------------

/**
 * Quick connectivity check.
 *
 * Returns `true` immediately when `navigator.onLine` is `false` (known
 * offline), otherwise attempts a lightweight fetch against the Supabase
 * auth endpoint (which responds with proper CORS headers).
 */
export async function isOnline(): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return false;
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(id);
    // Any response (including 404/401) means we have connectivity
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Push pending actions
// ---------------------------------------------------------------------------

/**
 * Replay every queued pending action against Supabase.
 *
 * Successfully replayed actions are removed from the queue. Failing
 * actions are left in place (they can be retried on the next sync) and
 * their error messages are collected.
 *
 * Retry policy:
 * - Each attempt increments the action's retryCount in memory.
 * - Exponential backoff: an action is skipped if less than
 *   BACKOFF_BASE_MS × 2^retryCount has elapsed since its last attempt.
 * - After MAX_RETRIES the action is discarded with a logged warning.
 */
/**
 * Increment the retry counter on a pending action in the queue.
 * If the action can no longer be found (e.g. it was removed externally)
 * this is a no-op.
 */
async function markRetry(action: PendingAction, table: string): Promise<void> {
  await markPendingRetry(action.id);
  const updated: PendingAction = {
    ...action,
    retryCount: action.retryCount + 1,
    createdAt: new Date().toISOString(),
  };
  console.warn(
    `[sync] retry ${updated.retryCount}/${MAX_RETRIES} for ${table}/${action.recordId} (action ${action.id})`,
  );
}

export async function pushPendingActions(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ pushed: number; errors: string[] }> {
  const pending = await getPendingActions();
  let pushed = 0;
  const errors: string[] = [];
  const now = Date.now();

  for (const action of pending) {
    const table = action.table as keyof Database["public"]["Tables"];

    // ── Exponential backoff check ──────────────────────────────────────
    const elapsed = action.createdAt
      ? now - new Date(action.createdAt).getTime()
      : Infinity;
    const minWait = BACKOFF_BASE_MS * Math.pow(2, action.retryCount);
    if (action.retryCount > 0 && elapsed < minWait) {
      // Not enough time has passed — skip this action for now
      continue;
    }

    // ── Max retries guard ──────────────────────────────────────────────
    if (action.retryCount >= MAX_RETRIES) {
      errors.push(
        `[push:${action.id}] ${table}/${action.recordId}: dropped after ${MAX_RETRIES} failed attempts`,
      );
      await removePendingAction(action.id);
      continue;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q: any = supabase.from(table);

      switch (action.action) {
        case "create": {
          const { error } = await q.insert(action.data).select().single();
          if (error) {
            await markRetry(action, table);
            errors.push(
              `[push:${action.id}] create ${table}/${action.recordId}: ${error.message}`,
            );
            continue;
          }
          break;
        }

        case "update": {
          const { error } = await q.update(action.data).eq("user_id", userId).eq("id", action.recordId);
          if (error) {
            await markRetry(action, table);
            errors.push(
              `[push:${action.id}] update ${table}/${action.recordId}: ${error.message}`,
            );
            continue;
          }
          break;
        }

        case "delete": {
          const { error } = await q.delete().eq("user_id", userId).eq("id", action.recordId);
          if (error) {
            await markRetry(action, table);
            errors.push(
              `[push:${action.id}] delete ${table}/${action.recordId}: ${error.message}`,
            );
            continue;
          }
          break;
        }

        default: {
          errors.push(
            `[push:${action.id}] unknown action "${action.action}" for ${table}/${action.recordId}`,
          );
          continue;
        }
      }

      // Success — remove the action from the queue
      await removePendingAction(action.id);
      pushed++;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      await markRetry(action, table);
      errors.push(`[push:${action.id}] ${table}/${action.recordId}: ${message}`);
    }
  }

  return { pushed, errors };
}

// ---------------------------------------------------------------------------
// Pull fresh data
// ---------------------------------------------------------------------------

/**
 * Fetch the latest records for every synced table from Supabase and
 * replace the local cache with the result.
 *
 * Returns a map of cache store name → number of records pulled.
 */
export async function pullFreshData(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Record<string, number>> {
  const pulled: Record<string, number> = {};
  const now = new Date().toISOString();

  for (const tableName of PULL_TABLES) {
    const cacheName = TABLE_TO_CACHE[tableName];
    if (!cacheName) {
      continue;
    }

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("user_id", userId);

      if (error) {
        // Log but don't fail the whole batch
        console.warn(`[sync] pull ${tableName} failed: ${error.message}`);
        pulled[cacheName] = 0;
        continue;
      }

      const records = (data ?? []) as { id: string }[];
      await cacheTable(cacheName, records);
      await setLastSyncTime(tableName, now);

      pulled[cacheName] = records.length;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      console.warn(`[sync] pull ${tableName} failed: ${message}`);
      pulled[cacheName] = 0;
    }
  }

  return pulled;
}

// ---------------------------------------------------------------------------
// Full sync (push + pull)
// ---------------------------------------------------------------------------

/**
 * Run a full synchronisation cycle:
 *
 * 1. Push any locally-queued pending actions to Supabase.
 * 2. Pull the latest data from Supabase and update the local caches.
 * 3. Return a summary of what happened.
 */
export async function syncAll(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ pushed: number; pulled: Record<string, number>; errors: string[] }> {
  const errors: string[] = [];

  // ── Push phase ──────────────────────────────────────────────────────
  const pushResult = await pushPendingActions(supabase, userId);
  errors.push(...pushResult.errors);

  // ── Pull phase ──────────────────────────────────────────────────────
  const pulled = await pullFreshData(supabase, userId);

  return {
    pushed: pushResult.pushed,
    pulled,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Convenience: build a SyncStats snapshot
// ---------------------------------------------------------------------------

/**
 * Build a user-facing sync-statistics object from the given sync result.
 *
 * This is a convenience helper — it is **not** called automatically and
 * does **not** perform any sync work itself.
 */
export async function buildSyncStats(
  result: { pushed: number; pulled: Record<string, number>; errors: string[] },
): Promise<SyncStats> {
  const pending = await getPendingActions();

  // Derive a status from the result
  let status: SyncStatus = "synced";
  if (result.errors.length > 0) {
    status = "error";
  }
  // If there were no errors but nothing was pushed/pulled and there are
  // pending actions left, the device may be offline.
  if (
    result.pushed === 0 &&
    Object.values(result.pulled).every((c) => c === 0) &&
    pending.length > 0
  ) {
    status = "offline";
  }

  // Use the most recent lastSync across all tables
  let lastSync: string | null = null;
  for (const table of PULL_TABLES) {
    const ts = await getLastSyncTime(table);
    if (ts && (lastSync === null || ts > lastSync)) {
      lastSync = ts;
    }
  }

  return {
    pushed: result.pushed,
    pulled: result.pulled,
    pending: pending.length,
    lastSync,
    status,
  };
}
