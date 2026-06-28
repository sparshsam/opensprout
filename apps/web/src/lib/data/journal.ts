import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, JournalEntryRow, JournalPhotoRow } from "@/lib/data/types";

type Client = SupabaseClient<Database>;

// ──────────────────────────────────────────────
// Response types
// ──────────────────────────────────────────────

export type JournalEntryWithPhotos = JournalEntryRow & {
  photos: JournalPhotoRow[];
};

export type JournalFilter = {
  plantId?: string;
  type?: "care_log" | "journal_entry" | "all";
  dateFrom?: string;
  dateTo?: string;
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
// Journal Entry CRUD
// ──────────────────────────────────────────────

export type CreateJournalInput = {
  plant_id: string;
  title?: string;
  body?: string;
  observed_at?: string;
  health_score?: number;
  tags?: string[];
};

export type UpdateJournalInput = {
  title?: string;
  body?: string;
  observed_at?: string;
  health_score?: number;
  tags?: string[];
};

export async function createJournalEntry(
  supabase: Client,
  userId: string,
  input: CreateJournalInput,
): Promise<JournalEntryRow> {
  const timestamp = nowIso();
  const { data, error } = await supabase
    .from("opensprout_journal_entries")
    .insert({
      user_id: userId,
      plant_id: input.plant_id,
      title: input.title?.trim() || null,
      body: input.body?.trim() || null,
      observed_at: input.observed_at ?? timestamp,
      health_score: input.health_score ?? null,
      tags: input.tags ?? [],
      client_id: clientId("journal"),
      client_created_at: timestamp,
      client_updated_at: timestamp,
    })
    .select()
    .single();

  if (error) throw error;
  return data as JournalEntryRow;
}

export async function updateJournalEntry(
  supabase: Client,
  userId: string,
  entryId: string,
  input: UpdateJournalInput,
): Promise<JournalEntryRow> {
  const timestamp = nowIso();
  const { data, error } = await supabase
    .from("opensprout_journal_entries")
    .update({
      title: input.title?.trim() ?? undefined,
      body: input.body?.trim() ?? undefined,
      observed_at: input.observed_at ?? undefined,
      health_score: input.health_score ?? undefined,
      tags: input.tags ?? undefined,
      client_updated_at: timestamp,
    })
    .eq("id", entryId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as JournalEntryRow;
}

export async function deleteJournalEntry(
  supabase: Client,
  userId: string,
  entryId: string,
): Promise<void> {
  // Soft delete — mark deleted_at
  const { error } = await supabase
    .from("opensprout_journal_entries")
    .update({ deleted_at: nowIso() })
    .eq("id", entryId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function getJournalEntry(
  supabase: Client,
  userId: string,
  entryId: string,
): Promise<JournalEntryWithPhotos | null> {
  const { data: entry, error: entryError } = await supabase
    .from("opensprout_journal_entries")
    .select("*")
    .eq("id", entryId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .single();

  if (entryError) throw entryError;
  if (!entry) return null;

  const { data: photos, error: photosError } = await supabase
    .from("opensprout_journal_photos")
    .select("*")
    .eq("journal_entry_id", entryId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (photosError) throw photosError;

  return {
    ...(entry as JournalEntryRow),
    photos: (photos ?? []) as JournalPhotoRow[],
  };
}

export async function listJournalEntries(
  supabase: Client,
  userId: string,
  filter?: JournalFilter,
): Promise<JournalEntryWithPhotos[]> {
  let query = supabase
    .from("opensprout_journal_entries")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (filter?.plantId) {
    query = query.eq("plant_id", filter.plantId);
  }
  if (filter?.dateFrom) {
    query = query.gte("observed_at", filter.dateFrom);
  }
  if (filter?.dateTo) {
    query = query.lte("observed_at", filter.dateTo);
  }

  query = query.order("observed_at", { ascending: false }).limit(50);

  const { data: entries, error } = await query;
  if (error) throw error;

  if (!entries || entries.length === 0) return [];

  // Fetch photos for all entries in one query
  const entryIds = entries.map((e) => e.id);
  const { data: allPhotos, error: photosError } = await supabase
    .from("opensprout_journal_photos")
    .select("*")
    .eq("user_id", userId)
    .in("journal_entry_id", entryIds)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (photosError) throw photosError;

  const photoMap = new Map<string, JournalPhotoRow[]>();
  for (const photo of allPhotos ?? []) {
    const list = photoMap.get(photo.journal_entry_id ?? "") ?? [];
    list.push(photo as JournalPhotoRow);
    photoMap.set(photo.journal_entry_id ?? "", list);
  }

  return (entries as JournalEntryRow[]).map((entry) => ({
    ...entry,
    photos: photoMap.get(entry.id) ?? [],
  }));
}
