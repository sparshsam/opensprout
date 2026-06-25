import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/data/types";

// ──────────────────────────────────────────────
// Public types
// ──────────────────────────────────────────────

export type ImportValidationError = {
  record: string;
  field: string;
  message: string;
};

export type ImportResult = {
  imported: { plants: number; schedules: number; logs: number };
  errors: string[];
  filename: string;
};

type Client = SupabaseClient<Database>;

const EXPECTED_SCHEMA_VERSION = 1;

// ──────────────────────────────────────────────
// Required fields per record type
// ──────────────────────────────────────────────

const PLANT_REQUIRED_FIELDS: { field: string; label: string }[] = [
  { field: "name", label: "Name" },
];

const SCHEDULE_REQUIRED_FIELDS: { field: string; label: string }[] = [
  { field: "care_type", label: "Care type" },
  { field: "plant_id", label: "Plant ID" },
  { field: "cadence_value", label: "Cadence value" },
  { field: "cadence_unit", label: "Cadence unit" },
];

const LOG_REQUIRED_FIELDS: { field: string; label: string }[] = [
  { field: "care_type", label: "Care type" },
  { field: "plant_id", label: "Plant ID" },
];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}

function assertArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return [];
}

function validateRecord(
  record: unknown,
  index: number,
  recordType: string,
  requiredFields: { field: string; label: string }[],
  errors: ImportValidationError[],
): void {
  if (!isRecord(record)) {
    errors.push({
      record: `${recordType}[${index}]`,
      field: "(root)",
      message: `Expected an object, got ${typeof record}.`,
    });
    return;
  }

  for (const { field, label } of requiredFields) {
    const value = record[field];
    if (value === undefined || value === null) {
      errors.push({
        record: `${recordType}[${index}]`,
        field,
        message: `${label} is required.`,
      });
    } else if (typeof value === "string" && value.trim() === "") {
      errors.push({
        record: `${recordType}[${index}]`,
        field,
        message: `${label} is required.`,
      });
    }
  }
}

// ──────────────────────────────────────────────
// readImportFile
// ──────────────────────────────────────────────

/**
 * Parse a JSON import file and validate its structure.
 *
 * Returns `data` (the validated import payload) when no errors are found,
 * or `null` when the structure is unrecoverably invalid. Validation errors
 * for individual records are always collected into the `errors` array.
 */
export async function readImportFile(
  file: File,
): Promise<{ data: Record<string, unknown> | null; errors: ImportValidationError[] }> {
  const errors: ImportValidationError[] = [];

  // — Parse JSON —
  let parsed: unknown;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    errors.push({
      record: "(root)",
      field: "(file)",
      message: "File is not valid JSON.",
    });
    return { data: null, errors };
  }

  // — Must be an object —
  if (!isRecord(parsed)) {
    errors.push({
      record: "(root)",
      field: "(root)",
      message: "Root value must be a JSON object.",
    });
    return { data: null, errors };
  }

  // — schemaVersion —
  if (parsed.schemaVersion !== EXPECTED_SCHEMA_VERSION) {
    errors.push({
      record: "(root)",
      field: "schemaVersion",
      message: `Unsupported schema version: ${String(
        parsed.schemaVersion,
      )}. Expected ${EXPECTED_SCHEMA_VERSION}.`,
    });
    return { data: null, errors };
  }

  // — Must have arrays —
  const plants: unknown[] = assertArray(parsed.plants);
  const schedules: unknown[] = assertArray(parsed.schedules);
  const logs: unknown[] = assertArray(parsed.logs);

  for (const [key] of [
    ["plants", plants] as const,
    ["schedules", schedules] as const,
    ["logs", logs] as const,
  ]) {
    if (!Array.isArray(parsed[key])) {
      errors.push({
        record: "(root)",
        field: key,
        message: `"${key}" must be an array.`,
      });
      return { data: null, errors };
    }
  }

  // — Validate each record type —
  for (let i = 0; i < plants.length; i++) {
    validateRecord(plants[i], i, "plants", PLANT_REQUIRED_FIELDS, errors);
  }
  for (let i = 0; i < schedules.length; i++) {
    validateRecord(schedules[i], i, "schedules", SCHEDULE_REQUIRED_FIELDS, errors);
  }
  for (let i = 0; i < logs.length; i++) {
    validateRecord(logs[i], i, "logs", LOG_REQUIRED_FIELDS, errors);
  }

  // Build the return payload only if there were no hard structural failures
  if (errors.length > 0) {
    return { data: null, errors };
  }

  return { data: parsed, errors };
}

// ──────────────────────────────────────────────
// executeImport
// ──────────────────────────────────────────────

/**
 * Insert valid records from a parsed import payload into Supabase.
 *
 * Uses upsert with `client_id` as the conflict target so that re-importing
 * the same file is idempotent. Schedules and logs have their `plant_id`
 * remapped through the upserted plant rows to handle newly-generated IDs.
 */
export async function executeImport(
  supabase: Client,
  userId: string,
  data: Record<string, unknown>,
): Promise<ImportResult> {
  const errors: string[] = [];
  let importedPlants = 0;
  let importedSchedules = 0;
  let importedLogs = 0;

  const plants: Record<string, unknown>[] = Array.isArray(data?.plants)
    ? data.plants
    : [];
  const schedules: Record<string, unknown>[] = Array.isArray(data?.schedules)
    ? data.schedules
    : [];
  const logs: Record<string, unknown>[] = Array.isArray(data?.logs)
    ? data.logs
    : [];

  // — 1. Upsert plants, get back actual rows —
  if (plants.length > 0) {
    const plantRecords = plants.map((p) => ({
      ...p,
      user_id: userId,
    }));

    const { data: plantsResult, error: plantsError } = await supabase
      .from("plants")
      .upsert(plantRecords as never, {
        onConflict: "client_id",
        ignoreDuplicates: false,
      })
      .select();

    if (plantsError) {
      errors.push(`Plant import failed: ${plantsError.message}`);
    } else if (plantsResult) {
      importedPlants = plantsResult.length;
    }
  }

  // — 1b. Re-fetch upserted plants to build ID mapping —
  // We need the actual rows to map old plant IDs -> new plant IDs
  let upsertedPlants: Record<string, unknown>[] = [];
  if (importedPlants > 0) {
    const clientIds = plants
      .map((p) => getString(p.client_id))
      .filter((id): id is string => id !== undefined);

    if (clientIds.length > 0) {
      const { data: fetched } = await supabase
        .from("plants")
        .select("id, client_id")
        .eq("user_id", userId)
        .in("client_id", clientIds);

      if (fetched) {
        upsertedPlants = fetched as unknown as Record<string, unknown>[];
      }
    }
  }

  // — Build id map: old plant id from export → actual DB id after upsert —
  const plantIdMap = new Map<string, string>();

  for (const original of plants) {
    const oldId = getString(original.id);
    const clientId = getString(original.client_id);

    if (oldId && clientId) {
      const match = upsertedPlants.find((up) => up.client_id === clientId);
      const newId = match ? getString(match.id) : undefined;
      if (newId) {
        plantIdMap.set(oldId, newId);
      }
    }
  }

  // — 2. Upsert schedules (remap plant_id) —
  if (schedules.length > 0) {
    const scheduleRecords = schedules.map((s) => {
      const oldPlantId = getString(s.plant_id);
      const remappedPlantId =
        oldPlantId !== undefined
          ? plantIdMap.get(oldPlantId) ?? oldPlantId
          : undefined;
      return { ...s, user_id: userId, plant_id: remappedPlantId };
    });

    const { data: schedulesResult, error: schedulesError } = await supabase
      .from("care_schedules")
      .upsert(scheduleRecords as never, {
        onConflict: "client_id",
        ignoreDuplicates: false,
      })
      .select();

    if (schedulesError) {
      errors.push(`Schedule import failed: ${schedulesError.message}`);
    } else if (schedulesResult) {
      importedSchedules = schedulesResult.length;
    }
  }

  // — 3. Upsert logs (remap plant_id) —
  if (logs.length > 0) {
    const logRecords = logs.map((l) => {
      const oldPlantId = getString(l.plant_id);
      const remappedPlantId =
        oldPlantId !== undefined
          ? plantIdMap.get(oldPlantId) ?? oldPlantId
          : undefined;
      return { ...l, user_id: userId, plant_id: remappedPlantId };
    });

    const { data: logsResult, error: logsError } = await supabase
      .from("care_logs")
      .upsert(logRecords as never, {
        onConflict: "client_id",
        ignoreDuplicates: false,
      })
      .select();

    if (logsError) {
      errors.push(`Log import failed: ${logsError.message}`);
    } else if (logsResult) {
      importedLogs = logsResult.length;
    }
  }

  return {
    imported: {
      plants: importedPlants,
      schedules: importedSchedules,
      logs: importedLogs,
    },
    errors,
    filename: "",
  };
}
