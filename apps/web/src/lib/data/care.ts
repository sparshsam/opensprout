import type { CareScheduleRow, CareType, PlantRow, PlantSpeciesRow } from "@/lib/data/types";

// ── Species care preset ──

export type CarePreset = {
  careType: CareType;
  label: string;
  cadenceDays: number;
  source: "species" | "default";
  description?: string;
};

/** Default intervals used when species data is unavailable. */
const DEFAULT_CARE_INTERVALS: Record<CareType, number> = {
  water: 7,
  fertilize: 30,
  mist: 3,
  rotate: 14,
  prune: 60,
  repot: 180,
  inspect: 7,
  custom: 7,
};

const CARE_LABELS: Record<CareType, string> = {
  water: "Water",
  fertilize: "Fertilize",
  mist: "Mist",
  rotate: "Rotate",
  prune: "Prune",
  repot: "Repot",
  inspect: "Inspect",
  custom: "Care",
};

/**
 * Resolve care presets from species knowledge + fallback defaults.
 * Returns all 8 care types in a consistent order.
 */
export function resolveSpeciesPresets(
  species: PlantSpeciesRow | null,
): CarePreset[] {
  const presets: CarePreset[] = [];

  const add = (ct: CareType, days: number, source: "species" | "default", desc?: string) => {
    presets.push({
      careType: ct,
      label: CARE_LABELS[ct],
      cadenceDays: days,
      source,
      description: desc,
    });
  };

  // Water — from species data or default
  if (species?.watering_min_days && species?.watering_max_days) {
    const avg = Math.round((species.watering_min_days + species.watering_max_days) / 2);
    add("water", avg, "species", `Based on ${species.common_name}'s needs (${species.watering_min_days}–${species.watering_max_days} days)`);
  } else {
    add("water", DEFAULT_CARE_INTERVALS.water, "default");
  }

  // Fertilize — from species data or default
  if (species?.fertilizing_frequency_days) {
    add("fertilize", species.fertilizing_frequency_days, "species", `Recommended for ${species.common_name}`);
  } else {
    add("fertilize", DEFAULT_CARE_INTERVALS.fertilize, "default");
  }

  // Mist, Rotate, Prune, Repot, Inspect — defaults only
  add("mist", DEFAULT_CARE_INTERVALS.mist, "default");
  add("rotate", DEFAULT_CARE_INTERVALS.rotate, "default");
  add("prune", DEFAULT_CARE_INTERVALS.prune, "default");
  add("repot", DEFAULT_CARE_INTERVALS.repot, "default");
  add("inspect", DEFAULT_CARE_INTERVALS.inspect, "default");

  return presets;
}

// ── User-friendly cadence formatting ──

export interface CadenceOption {
  label: string;
  days: number;
}

export const CADENCE_PRESETS: CadenceOption[] = [
  { label: "Daily", days: 1 },
  { label: "Every 2 days", days: 2 },
  { label: "Every 3 days", days: 3 },
  { label: "Twice a week", days: 3.5 },  // not an integer, but for display only
  { label: "Weekly", days: 7 },
  { label: "Every 2 weeks", days: 14 },
  { label: "Every 3 weeks", days: 21 },
  { label: "Monthly", days: 30 },
  { label: "Every 2 months", days: 60 },
  { label: "Every 3 months", days: 90 },
  { label: "Every 6 months", days: 180 },
  { label: "Yearly", days: 365 },
];

/**
 * Format a number of days into a human-readable cadence label.
 */
export function formatCadence(days: number): string {
  if (days <= 0) return "Custom";
  // Find closest preset
  const preset = CADENCE_PRESETS.find((p) => Math.abs(p.days - days) < 0.5);
  if (preset) return preset.label;
  if (days === 1) return "Daily";
  if (days < 7) return `Every ${days} days`;
  if (days === 7) return "Weekly";
  if (days % 7 === 0) return `Every ${days / 7} weeks`;
  if (days >= 28 && days <= 31) return "Monthly";
  return `Every ${days} days`;
}

/**
 * Convert a (cadence_value, cadence_unit) pair to total days.
 */
export function cadenceToDays(value: number, unit: "day" | "week" | "month"): number {
  switch (unit) {
    case "week": return value * 7;
    case "month": return value * 30;
    default: return value;
  }
}

/**
 * Convert total days back to (cadence_value, cadence_unit) for storage.
 * Prefers "day" unit for < 7 days, "week" for multiples of 7, "month" for 28+.
 */
export function daysToCadence(days: number): { value: number; unit: "day" | "week" | "month" } {
  if (days >= 28 && days <= 31) return { value: 1, unit: "month" };
  if (days % 7 === 0 && days >= 7) return { value: days / 7, unit: "week" };
  return { value: Math.max(1, Math.round(days)), unit: "day" };
}

/**
 * Find the closest preset option for a given cadence days value.
 */
export function findClosestPreset(days: number): CadenceOption {
  return (
    CADENCE_PRESETS.find((p) => Math.abs(p.days - days) < 0.5) ?? {
      label: formatCadence(days),
      days,
    }
  );
}

export type CareTask = {
  id: string;
  plantId: string;
  plantName: string;
  careType: CareType;
  label: string;
  dueAt: string | null;
  status: "Overdue" | "Due" | "Upcoming" | "No date";
};

const labels: Record<CareType, string> = {
  water: "Water",
  fertilize: "Fertilize",
  mist: "Mist",
  rotate: "Rotate",
  prune: "Prune",
  repot: "Repot",
  inspect: "Inspect",
  custom: "Care",
};

export function buildCareTasks(plants: PlantRow[], schedules: CareScheduleRow[]) {
  const plantNames = new Map(plants.map((plant) => [plant.id, plant.name]));
  const now = Date.now();
  const tomorrow = now + 24 * 60 * 60 * 1000;

  return schedules
    .filter((schedule) => plantNames.has(schedule.plant_id))
    .map<CareTask>((schedule) => {
      const dueTime = schedule.next_due_at ? new Date(schedule.next_due_at).getTime() : null;
      const status = dueTime === null
        ? "No date"
        : dueTime < now
          ? "Overdue"
          : dueTime <= tomorrow
            ? "Due"
            : "Upcoming";

      return {
        id: schedule.id,
        plantId: schedule.plant_id,
        plantName: plantNames.get(schedule.plant_id) ?? "Plant",
        careType: schedule.care_type,
        label: schedule.custom_label ?? labels[schedule.care_type],
        dueAt: schedule.next_due_at,
        status,
      };
    })
    .sort((a, b) => {
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
}

export function formatDueDate(dueAt: string | null) {
  if (!dueAt) return "No date";

  const date = new Date(dueAt);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}
