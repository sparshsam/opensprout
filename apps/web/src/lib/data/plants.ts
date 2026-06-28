import type { SupabaseClient } from "@supabase/supabase-js";
import type { CareLogRow, CareScheduleRow, CareType, Database, HealthStatus, PlantRow } from "@/lib/data/types";
import { validatePlantValues } from "@/lib/data/validation";

export type PlantFormValues = {
  name: string;
  species_id?: string;
  species?: string;
  location?: string;
  notes?: string;
  health_status?: HealthStatus;
};

export type DashboardData = {
  plants: PlantRow[];
  schedules: CareScheduleRow[];
  logs: CareLogRow[];
};

type Client = SupabaseClient<Database>;

// Schedule management helpers

export type ScheduleUpdateInput = {
  cadence_value?: number;
  cadence_unit?: "day" | "week" | "month";
  active?: boolean;
  notes?: string | null;
};

export async function createPlantSchedules(
  supabase: Client,
  userId: string,
  plantId: string,
  presets: { careType: CareType; cadenceDays: number }[],
): Promise<void> {
  if (presets.length === 0) return;
  const timestamp = nowIso();
  const schedules = presets.map((p) => buildSchedule(userId, plantId, p.careType, p.cadenceDays, timestamp));

  const { error } = await supabase.from("care_schedules").insert(schedules);
  if (error) throw error;
}

export async function updateCareSchedule(
  supabase: Client,
  userId: string,
  scheduleId: string,
  input: ScheduleUpdateInput,
): Promise<void> {
  const { error } = await supabase
    .from("care_schedules")
    .update({
      ...input,
      client_updated_at: nowIso(),
    })
    .eq("id", scheduleId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteCareSchedule(
  supabase: Client,
  userId: string,
  scheduleId: string,
): Promise<void> {
  const { error } = await supabase
    .from("care_schedules")
    .update({ deleted_at: new Date().toISOString(), active: false, client_updated_at: nowIso() })
    .eq("id", scheduleId)
    .eq("user_id", userId);

  if (error) throw error;
}

function nowIso() {
  return new Date().toISOString();
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function clientId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function cleanText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function listDashboardData(supabase: Client, userId: string): Promise<DashboardData> {
  const [plantsResult, schedulesResult, logsResult] = await Promise.all([
    supabase
      .from("plants")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("care_schedules")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .eq("active", true)
      .order("next_due_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("care_logs")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false })
      .limit(100),
  ]);

  if (plantsResult.error) throw plantsResult.error;
  if (schedulesResult.error) throw schedulesResult.error;
  if (logsResult.error) throw logsResult.error;

  return {
    plants: plantsResult.data ?? [],
    schedules: schedulesResult.data ?? [],
    logs: logsResult.data ?? [],
  };
}

export async function createPlant(supabase: Client, userId: string, values: PlantFormValues) {
  const validated = validatePlantValues(values);
  const timestamp = nowIso();
  const { data: plant, error } = await supabase
    .from("plants")
    .insert({
      user_id: userId,
      name: validated.name,
      species_id: cleanText(validated.species_id),
      species: cleanText(validated.species),
      location: cleanText(validated.location),
      notes: cleanText(validated.notes),
      health_status: validated.health_status ?? null,
      client_id: clientId("plant"),
      client_created_at: timestamp,
      client_updated_at: timestamp,
    })
    .select()
    .single();

  if (error) throw error;
  return plant;
}

export async function updatePlant(supabase: Client, userId: string, plantId: string, values: PlantFormValues) {
  const validated = validatePlantValues(values);
  const { data, error } = await supabase
    .from("plants")
    .update({
      name: validated.name,
      species_id: cleanText(validated.species_id),
      species: cleanText(validated.species),
      location: cleanText(validated.location),
      notes: cleanText(validated.notes),
      health_status: validated.health_status ?? "stable",
      client_updated_at: nowIso(),
    })
    .eq("id", plantId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePlant(supabase: Client, userId: string, plantId: string) {
  const { error } = await supabase
    .from("plants")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", plantId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Organization features ──

export async function archivePlant(supabase: Client, userId: string, plantId: string) {
  const { error } = await supabase
    .from("plants")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", plantId)
    .eq("user_id", userId)
    .is("deleted_at", null);
  if (error) throw error;
}

export async function restorePlant(supabase: Client, userId: string, plantId: string) {
  const { error } = await supabase
    .from("plants")
    .update({ archived_at: null })
    .eq("id", plantId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function toggleFavorite(supabase: Client, userId: string, plantId: string, isFavorite: boolean) {
  const { error } = await supabase
    .from("plants")
    .update({ is_favorite: isFavorite })
    .eq("id", plantId)
    .eq("user_id", userId);
  if (error) throw error;
}

export type PlantSortField = "name" | "created_at" | "updated_at" | "health_status" | "species";
export type SortDirection = "asc" | "desc";

export type PlantFilterOptions = {
  query?: string;
  healthFilter?: string | null;
  locationFilter?: string | null;
  showArchived?: boolean;
  favoritesOnly?: boolean;
  sortField?: PlantSortField;
  sortDirection?: SortDirection;
};

/**
 * Get unique locations across a user's plants.
 */
export async function listPlantLocations(
  supabase: Client,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("plants")
    .select("location")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .not("location", "is", null);

  if (error) throw error;
  const locations = [...new Set(data.map((r) => r.location).filter(Boolean) as string[])];
  return locations.sort();
}

/**
 * Count plants by health status.
 */
export async function getPlantHealthCounts(
  supabase: Client,
  userId: string,
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("plants")
    .select("health_status")
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data) {
    const status = row.health_status ?? "unknown";
    counts[status] = (counts[status] ?? 0) + 1;
  }
  return counts;
}

export function sortAndFilterPlants(
  plants: PlantRow[],
  options: PlantFilterOptions,
): PlantRow[] {
  let filtered = [...plants];

  // Filter by archive status
  if (!options.showArchived) {
    filtered = filtered.filter((p) => !p.archived_at);
  }

  // Filter favorites only
  if (options.favoritesOnly) {
    filtered = filtered.filter((p) => p.is_favorite);
  }

  // Search query
  if (options.query) {
    const q = options.query.toLowerCase();
    filtered = filtered.filter((p) =>
      `${p.name} ${p.species ?? ""} ${p.location ?? ""} ${p.health_status ?? ""} ${p.cultivar ?? ""} ${p.nickname ?? ""}`
        .toLowerCase().includes(q),
    );
  }

  // Health filter
  if (options.healthFilter) {
    filtered = filtered.filter((p) =>
      options.healthFilter === "unknown"
        ? !p.health_status || p.health_status === "unknown"
        : p.health_status === options.healthFilter,
    );
  }

  // Location filter
  if (options.locationFilter) {
    filtered = filtered.filter((p) => p.location === options.locationFilter);
  }

  // Sort
  const field = options.sortField ?? "updated_at";
  const dir = options.sortDirection ?? "desc";

  filtered.sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "name":
        cmp = (a.name ?? "").localeCompare(b.name ?? "");
        break;
      case "species":
        cmp = (a.species ?? "").localeCompare(b.species ?? "");
        break;
      case "health_status":
        cmp = (a.health_status ?? "").localeCompare(b.health_status ?? "");
        break;
      case "created_at":
        cmp = (a.created_at ?? "").localeCompare(b.created_at ?? "");
        break;
      case "updated_at":
        cmp = (a.updated_at ?? "").localeCompare(b.updated_at ?? "");
        break;
    }
    return dir === "desc" ? -cmp : cmp;
  });

  // Favorites first (when not already filtered by favorites only)
  if (!options.favoritesOnly) {
    filtered.sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return 0;
    });
  }

  return filtered;
}

export async function markCareDone(supabase: Client, userId: string, plantId: string, careType: CareType) {
  const { data: schedule } = await supabase
    .from("care_schedules")
    .select("*")
    .eq("user_id", userId)
    .eq("plant_id", plantId)
    .eq("care_type", careType)
    .eq("active", true)
    .is("deleted_at", null)
    .order("next_due_at", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const timestamp = nowIso();
  const labels: Record<string, string> = {
    water: "Marked watered",
    fertilize: "Marked fertilized",
    mist: "Marked misted",
    rotate: "Marked rotated",
    prune: "Marked pruned",
    repot: "Marked repotted",
    inspect: "Marked inspected",
    custom: "Marked cared for",
  };
  const { data: log, error: logError } = await supabase
    .from("care_logs")
    .insert({
      user_id: userId,
      plant_id: plantId,
      schedule_id: schedule?.id ?? null,
      care_type: careType,
      occurred_at: timestamp,
      notes: labels[careType] ?? "Marked cared for",
      client_id: clientId("care-log"),
      client_created_at: timestamp,
      client_updated_at: timestamp,
    })
    .select()
    .single();

  if (logError) throw logError;

  if (schedule) {
    const days = schedule.cadence_unit === "week"
      ? schedule.cadence_value * 7
      : schedule.cadence_unit === "month"
        ? schedule.cadence_value * 30
        : schedule.cadence_value;

    const { error: scheduleError } = await supabase
      .from("care_schedules")
      .update({
        last_completed_at: timestamp,
        next_due_at: addDaysIso(days),
        client_updated_at: timestamp,
      })
      .eq("id", schedule.id)
      .eq("user_id", userId);

    if (scheduleError) throw scheduleError;
  }

  return log;
}

function buildSchedule(userId: string, plantId: string, careType: CareType, cadenceDays: number, timestamp: string) {
  const days = Number.isFinite(cadenceDays) && cadenceDays > 0 ? cadenceDays : 7;

  return {
    user_id: userId,
    plant_id: plantId,
    care_type: careType,
    cadence_value: days,
    cadence_unit: "day" as const,
    start_date: todayIsoDate(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    next_due_at: addDaysIso(days),
    client_id: clientId(`schedule-${careType}`),
    client_created_at: timestamp,
    client_updated_at: timestamp,
  };
}
