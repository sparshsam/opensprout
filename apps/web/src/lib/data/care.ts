import type { CareScheduleRow, CareType, PlantRow } from "@/lib/data/types";

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
