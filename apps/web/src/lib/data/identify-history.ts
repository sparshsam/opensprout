import type { Client, Database } from "@/lib/data/types";

export type IdentificationRecord = {
  id: string;
  photo_path: string;
  results: unknown;
  selected_species_id: string | null;
  selected_name: string | null;
  confidence: number | null;
  diagnosis: unknown;
  created_at: string;
};

/**
 * Insert a new identification record for the given user.
 * Returns the ID of the newly created record.
 */
export async function saveIdentification(
  supabase: Client,
  userId: string,
  data: {
    photo_path: string;
    results: unknown;
    selected_species_id?: string;
    selected_name?: string;
    confidence?: number;
    diagnosis?: unknown;
  },
): Promise<string> {
  const { data: inserted, error } = await supabase
    .from("opensprout_identifications")
    .insert({
      user_id: userId,
      photo_path: data.photo_path,
      results: data.results as Database["public"]["Tables"]["opensprout_identifications"]["Insert"]["results"],
      selected_species_id: data.selected_species_id ?? null,
      selected_name: data.selected_name ?? null,
      confidence: data.confidence ?? null,
      diagnosis: (data.diagnosis as Database["public"]["Tables"]["opensprout_identifications"]["Insert"]["diagnosis"]) ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return inserted.id;
}

/**
 * List the user's identification history, newest first.
 */
export async function listIdentifications(
  supabase: Client,
  userId: string,
  limit?: number,
): Promise<IdentificationRecord[]> {
  let query = supabase
    .from("opensprout_identifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map(rowToRecord);
}

/**
 * Get a single identification record.
 */
export async function getIdentification(
  supabase: Client,
  userId: string,
  id: string,
): Promise<IdentificationRecord | null> {
  const { data, error } = await supabase
    .from("opensprout_identifications")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToRecord(data) : null;
}

/**
 * Update the user's selected match for an identification record.
 */
export async function updateIdentificationSelection(
  supabase: Client,
  userId: string,
  id: string,
  speciesId: string | null,
  name: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("opensprout_identifications")
    .update({
      selected_species_id: speciesId,
      selected_name: name,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

type IdentificationsRow = Database["public"]["Tables"]["opensprout_identifications"]["Row"];

/**
 * Maps a raw Supabase row to our IdentificationRecord type.
 */
function rowToRecord(row: IdentificationsRow): IdentificationRecord {
  return {
    id: row.id,
    photo_path: row.photo_path,
    results: row.results,
    selected_species_id: row.selected_species_id,
    selected_name: row.selected_name,
    confidence: row.confidence,
    diagnosis: row.diagnosis,
    created_at: row.created_at,
  };
}
