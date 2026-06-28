import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, JournalPhotoRow } from "@/lib/data/types";

type Client = SupabaseClient<Database>;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const BUCKET = "plant-photos";

function nowIso() {
  return new Date().toISOString();
}

function clientId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

// ──────────────────────────────────────────────
// Storage path helpers
// ──────────────────────────────────────────────

function photoPath(userId: string, plantId: string, filename: string) {
  return `${userId}/${plantId}/${filename}`;
}

// ──────────────────────────────────────────────
// Upload a photo file to Supabase Storage and
// save metadata to journal_photos
// ──────────────────────────────────────────────

export type PhotoUploadResult = {
  photoRow: JournalPhotoRow;
  objectPath: string;
};

export async function uploadPlantPhoto(
  supabase: Client,
  userId: string,
  plantId: string,
  file: File | Blob,
  options?: {
    journalEntryId?: string;
    contentType?: string;
    takenAt?: string;
    sortOrder?: number;
  },
): Promise<PhotoUploadResult> {
  const ext = (options?.contentType ?? file.type).split("/").pop() ?? "jpg";
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const objectPath = photoPath(userId, plantId, filename);

  // Upload to Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file, {
      contentType: options?.contentType ?? file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const timestamp = nowIso();

  // Save metadata to journal_photos
  const { data: photoRow, error: insertError } = await supabase
    .from("journal_photos")
    .insert({
      user_id: userId,
      plant_id: plantId,
      journal_entry_id: options?.journalEntryId ?? null,
      bucket_id: BUCKET,
      object_path: objectPath,
      content_type: options?.contentType ?? file.type,
      size_bytes: file.size,
      taken_at: options?.takenAt ?? timestamp,
      sort_order: options?.sortOrder ?? 0,
      client_id: clientId("photo"),
      client_created_at: timestamp,
      client_updated_at: timestamp,
    })
    .select()
    .single();

  if (insertError) {
    // Clean up storage on metadata failure
    await supabase.storage.from(BUCKET).remove([objectPath]);
    throw insertError;
  }

  return {
    photoRow: photoRow as JournalPhotoRow,
    objectPath,
  };
}

// ──────────────────────────────────────────────
// Upload multiple photos for a journal entry
// ──────────────────────────────────────────────

export async function uploadJournalPhotos(
  supabase: Client,
  userId: string,
  plantId: string,
  journalEntryId: string,
  files: (File | Blob)[],
): Promise<PhotoUploadResult[]> {
  const results: PhotoUploadResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const result = await uploadPlantPhoto(supabase, userId, plantId, files[i], {
      journalEntryId,
      sortOrder: i,
    });
    results.push(result);
  }
  return results;
}

// ──────────────────────────────────────────────
// Get a signed URL for a photo object
// Uses signed URLs so bucket stays private
// ──────────────────────────────────────────────

export async function getPhotoSignedUrl(
  supabase: Client,
  objectPath: string,
  expiresIn = 60 * 60, // 1 hour
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

// ──────────────────────────────────────────────
// Batch resolve signed URLs for photo rows
// ──────────────────────────────────────────────

export async function resolvePhotoUrls(
  supabase: Client,
  photos: { object_path: string }[],
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();
  if (photos.length === 0) return urlMap;

  for (const photo of photos) {
    try {
      const url = await getPhotoSignedUrl(supabase, photo.object_path);
      urlMap.set(photo.object_path, url);
    } catch {
      // If a photo can't be resolved, skip it
      urlMap.set(photo.object_path, "");
    }
  }
  return urlMap;
}

// ──────────────────────────────────────────────
// Set a photo as the plant cover photo
// ──────────────────────────────────────────────

export async function setPlantCoverPhoto(
  supabase: Client,
  userId: string,
  plantId: string,
  coverObjectPath: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("plants")
    .update({ cover_photo_path: coverObjectPath })
    .eq("id", plantId)
    .eq("user_id", userId);

  if (error) throw error;
}

// ──────────────────────────────────────────────
// Get the cover photo URL for a plant
// ──────────────────────────────────────────────

export async function getPlantCoverUrl(
  supabase: Client,
  coverObjectPath: string | null,
): Promise<string | null> {
  if (!coverObjectPath) return null;
  try {
    return await getPhotoSignedUrl(supabase, coverObjectPath);
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// Delete a photo — marks deleted_at in metadata
// and removes the Storage object
// ──────────────────────────────────────────────

export async function deletePhoto(
  supabase: Client,
  userId: string,
  photoId: string,
): Promise<void> {
  // Fetch photo to get object path
  const { data: photo, error: fetchError } = await supabase
    .from("journal_photos")
    .select("object_path")
    .eq("id", photoId)
    .eq("user_id", userId)
    .single();

  if (fetchError) throw fetchError;
  if (!photo) throw new Error("Photo not found");

  // Remove from Storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([photo.object_path]);

  if (storageError) throw storageError;

  // Soft delete metadata
  const { error: deleteError } = await supabase
    .from("journal_photos")
    .update({ deleted_at: nowIso() })
    .eq("id", photoId)
    .eq("user_id", userId);

  if (deleteError) throw deleteError;
}

/**
 * List all non-deleted photos for a plant, ordered by sort_order.
 */
export async function listPlantPhotos(
  supabase: Client,
  userId: string,
  plantId: string,
): Promise<JournalPhotoRow[]> {
  const { data, error } = await supabase
    .from("journal_photos")
    .select("*")
    .eq("user_id", userId)
    .eq("plant_id", plantId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ──────────────────────────────────────────────
// Get a public download URL (NOT recommended for
// private photos — use signed URLs instead)
// Used only for temporary upload preview
// ──────────────────────────────────────────────

export function getPublicUrl(supabase: Client, objectPath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}
