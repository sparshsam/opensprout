import type { SupabaseClient } from "@supabase/supabase-js";
import type { CareLogRow, CareScheduleRow, CareType, Database, HealthStatus, PlantRow } from "@/lib/data/types";

export type PlantFormValues = {
  name: string;
  species_id?: string;
  species?: string;
  location?: string;
  notes?: string;
  health_status?: HealthStatus;
  water_every_days?: number;
  fertilize_every_days?: number;
};

export type DashboardData = {
  plants: PlantRow[];
  schedules: CareScheduleRow[];
  logs: CareLogRow[];
};

type Client = SupabaseClient<Database>;

const careIntervals: Record<CareType, number> = {
  water: 7,
  fertilize: 30,
  mist: 3,
  rotate: 14,
  prune: 60,
  repot: 180,
  inspect: 7,
  custom: 7,
};

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

export async function listDashboardData(supabase: Client): Promise<DashboardData> {
  const [plantsResult, schedulesResult, logsResult] = await Promise.all([
    supabase
      .from("plants")
      .select("*")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("care_schedules")
      .select("*")
      .is("deleted_at", null)
      .eq("active", true)
      .order("next_due_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("care_logs")
      .select("*")
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
  const timestamp = nowIso();
  const { data: plant, error } = await supabase
    .from("plants")
    .insert({
      user_id: userId,
      name: values.name.trim(),
      species_id: cleanText(values.species_id),
      species: cleanText(values.species),
      location: cleanText(values.location),
      notes: cleanText(values.notes),
      health_status: values.health_status ?? "stable",
      client_id: clientId("plant"),
      client_created_at: timestamp,
      client_updated_at: timestamp,
    })
    .select()
    .single();

  if (error) throw error;

  const schedules = [
    values.water_every_days
      ? buildSchedule(userId, plant.id, "water", values.water_every_days)
      : null,
    values.fertilize_every_days
      ? buildSchedule(userId, plant.id, "fertilize", values.fertilize_every_days)
      : null,
  ].filter((schedule): schedule is NonNullable<typeof schedule> => Boolean(schedule));

  if (schedules.length > 0) {
    const { error: scheduleError } = await supabase.from("care_schedules").insert(schedules);
    if (scheduleError) throw scheduleError;
  }

  return plant;
}

export async function updatePlant(supabase: Client, plantId: string, values: PlantFormValues) {
  const { data, error } = await supabase
    .from("plants")
    .update({
      name: values.name.trim(),
      species_id: cleanText(values.species_id),
      species: cleanText(values.species),
      location: cleanText(values.location),
      notes: cleanText(values.notes),
      health_status: values.health_status ?? "stable",
      client_updated_at: nowIso(),
    })
    .eq("id", plantId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePlant(supabase: Client, plantId: string) {
  const { error } = await supabase.from("plants").delete().eq("id", plantId);
  if (error) throw error;
}

export async function markCareDone(supabase: Client, userId: string, plantId: string, careType: CareType) {
  const { data: schedule } = await supabase
    .from("care_schedules")
    .select("*")
    .eq("plant_id", plantId)
    .eq("care_type", careType)
    .eq("active", true)
    .is("deleted_at", null)
    .order("next_due_at", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const timestamp = nowIso();
  const { data: log, error: logError } = await supabase
    .from("care_logs")
    .insert({
      user_id: userId,
      plant_id: plantId,
      schedule_id: schedule?.id ?? null,
      care_type: careType,
      occurred_at: timestamp,
      notes: careType === "water" ? "Marked watered from dashboard." : "Marked fertilized from dashboard.",
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
      .eq("id", schedule.id);

    if (scheduleError) throw scheduleError;
  }

  return log;
}

function buildSchedule(userId: string, plantId: string, careType: CareType, cadenceDays: number) {
  const timestamp = nowIso();
  const days = Number.isFinite(cadenceDays) && cadenceDays > 0 ? cadenceDays : careIntervals[careType];

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
