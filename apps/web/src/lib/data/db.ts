import { openDB, type IDBPDatabase } from "idb";

// ---------------------------------------------------------------------------
// Database schema constants
// ---------------------------------------------------------------------------

const DB_NAME = "opensprout";
const DB_VERSION = 1;

/**
 * Cache stores mirror relevant Supabase tables.
 * They use the record's `id` as the key path.
 */
const CACHE_STORES = [
  "opensprout_plants",
  "opensprout_care_schedules",
  "opensprout_task_instances",
  "opensprout_care_logs",
  "opensprout_journal_entries",
  "opensprout_journal_photos",
] as const;


/** Pending-sync action queue. Auto-increment key path. */
const PENDING_STORE = "pendingActions";

/** Per-table sync metadata. Key path is the table name. */
const SYNC_META_STORE = "syncMeta";

const ALL_STORES = [...CACHE_STORES, PENDING_STORE, SYNC_META_STORE] as const;

// ---------------------------------------------------------------------------
// Pending-action type
// ---------------------------------------------------------------------------

export interface PendingAction {
  id: number;
  table: string;
  action: "create" | "update" | "delete";
  recordId: string;
  data: unknown;
  createdAt: string;
  retryCount: number;
}

// ---------------------------------------------------------------------------
// Sync-meta type
// ---------------------------------------------------------------------------

export interface SyncMeta {
  id: string;
  lastSyncedAt: string;
}

// ---------------------------------------------------------------------------
// DB promise (lazy singleton)
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBPDatabase<unknown>> | null = null;

function createDb(): Promise<IDBPDatabase<unknown>> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Cache stores (keyed by record id)
      for (const store of CACHE_STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      }

      // Pending-action queue (auto-increment)
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        db.createObjectStore(PENDING_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      // Sync metadata (keyed by table name)
      if (!db.objectStoreNames.contains(SYNC_META_STORE)) {
        db.createObjectStore(SYNC_META_STORE, { keyPath: "id" });
      }
    },
  });
}

/**
 * Return a reusable, lazily-opened connection to the IndexedDB database.
 */
export function getDb(): Promise<IDBPDatabase<unknown>> {
  if (!dbPromise) {
    dbPromise = createDb();
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Bulk cache helpers
// ---------------------------------------------------------------------------

/**
 * Atomically replace the entire contents of a cache store.
 *
 * 1. Clears the store.
 * 2. Inserts every record in `records`.
 *
 * Records are keyed by their `id` property  (the store's key path).
 */
export async function cacheTable<T extends { id: string }>(
  table: string,
  records: T[],
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(table, "readwrite");
  const store = tx.objectStore(table);

  await store.clear();

  for (const record of records) {
    await store.put(record);
  }

  await tx.done;
}

/**
 * Retrieve every cached record from a store.
 */
export async function getCached<T>(table: string): Promise<T[]> {
  const db = await getDb();
  return (await db.getAll(table)) as T[];
}

// ---------------------------------------------------------------------------
// Pending-action queue
// ---------------------------------------------------------------------------

/**
 * Enqueue a sync action that will be applied when connectivity is restored.
 */
export async function queueAction(
  table: string,
  action: string,
  recordId: string,
  data?: unknown,
): Promise<void> {
  const db = await getDb();
  const pending: PendingAction = {
    id: 0, // auto-increment; 0 is ignored by IDB
    table,
    action: action as PendingAction["action"],
    recordId,
    data: data ?? null,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  await db.add(PENDING_STORE, pending);
}

/**
 * Return all pending actions ordered by creation time (oldest first).
 */
export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await getDb();
  return db.getAll(PENDING_STORE);
}

/**
 * Increment the retry count for a pending action.
 */
export async function markPendingRetry(id: number): Promise<void> {
  const db = await getDb();
  const existing = await db.get(PENDING_STORE, id);
  if (existing) {
    existing.retryCount = (existing.retryCount ?? 0) + 1;
    existing.createdAt = new Date().toISOString();
    await db.put(PENDING_STORE, existing);
  }
}

/**
 * Remove a completed (or failed) pending action by its auto-increment id.
 */
export async function removePendingAction(id: number): Promise<void> {
  const db = await getDb();
  await db.delete(PENDING_STORE, id);
}

// ---------------------------------------------------------------------------
// Full-cache reset
// ---------------------------------------------------------------------------

/**
 * Delete every record in every store.
 */
export async function clearCache(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(ALL_STORES as unknown as string[], "readwrite");

  for (const store of ALL_STORES) {
    await tx.objectStore(store).clear();
  }

  await tx.done;
}

// ---------------------------------------------------------------------------
// Sync-timestamp helpers
// ---------------------------------------------------------------------------

/**
 * Read the last-sync timestamp for a given table.
 * Returns `null` when no sync has ever been recorded.
 */
export async function getLastSyncTime(table: string): Promise<string | null> {
  const db = await getDb();
  const meta = await db.get(SYNC_META_STORE, table);
  return (meta as SyncMeta | undefined)?.lastSyncedAt ?? null;
}

/**
 * Record (or overwrite) the last-sync timestamp for a given table.
 */
export async function setLastSyncTime(
  table: string,
  time: string,
): Promise<void> {
  const db = await getDb();
  await db.put(SYNC_META_STORE, { id: table, lastSyncedAt: time } satisfies SyncMeta);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

/**
 * Return the record count for every store in the database.
 */
export async function getCacheStats(): Promise<
  { table: string; count: number }[]
> {
  const db = await getDb();
  const stats: { table: string; count: number }[] = [];

  for (const store of ALL_STORES) {
    const count = await db.count(store);
    stats.push({ table: store, count });
  }

  return stats;
}
