import type { PlantSpeciesRow } from "@/lib/data/types";

export type CareRecommendation = {
  type: "water" | "fertilize" | "repot" | "prune" | "monitor";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  reason: string;
};

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

export function getSpeciesRecommendations(
  species: PlantSpeciesRow,
): CareRecommendation[] {
  const recommendations: CareRecommendation[] = [];

  // Watering recommendation
  if (species.watering_max_days != null && species.watering_max_days > 14) {
    recommendations.push({
      type: "water",
      title: "Water sparingly — let soil dry out",
      description:
        "This plant prefers to dry out between waterings. Always check soil moisture before watering.",
      priority: "medium",
      reason: `Watering interval is up to ${species.watering_max_days} days; overwatering is a common issue.`,
    });
  }

  // Difficulty-based recommendation
  if (species.difficulty === "advanced") {
    recommendations.push({
      type: "monitor",
      title: "Monitor closely — advanced care needed",
      description:
        "This plant needs specific conditions. Keep a close eye on light, humidity, and watering.",
      priority: "high",
      reason: "Advanced difficulty rating indicates the plant is sensitive to environmental changes.",
    });
  }

  // Light preference recommendation
  if (
    species.light_preference &&
    species.light_preference.toLowerCase().includes("direct sun")
  ) {
    recommendations.push({
      type: "monitor",
      title: "Place in a sunny window",
      description:
        "This plant thrives with direct sunlight. A south- or west-facing window is ideal.",
      priority: "medium",
      reason: `Light preference mentions direct sun: "${species.light_preference}".`,
    });
  }

  // Humidity recommendation
  if (
    species.humidity_preference &&
    species.humidity_preference.toLowerCase().includes("high")
  ) {
    recommendations.push({
      type: "monitor",
      title: "Increase humidity around the plant",
      description:
        "This plant prefers high humidity. Use a humidifier, pebble tray, or mist regularly.",
      priority: "medium",
      reason: `Humidity preference is "${species.humidity_preference}".`,
    });
  }

  // Pruning recommendation
  if (species.pruning_notes) {
    recommendations.push({
      type: "prune",
      title: "Prune as needed",
      description:
        species.pruning_notes,
      priority: "low",
      reason: "Pruning notes are available for this species.",
    });
  }

  // Repotting recommendation
  if (species.repotting_notes) {
    recommendations.push({
      type: "repot",
      title: "Consider repotting periodically",
      description:
        species.repotting_notes,
      priority: "low",
      reason: "Repotting notes are available for this species.",
    });
  }

  // Fertilizing recommendation
  if (species.fertilizing_frequency_days != null) {
    recommendations.push({
      type: "fertilize",
      title: "Fertilize during growing season",
      description: `This plant benefits from fertilizing every ${species.fertilizing_frequency_days} days during spring and summer.`,
      priority: "low",
      reason: `Fertilizing frequency is set to every ${species.fertilizing_frequency_days} days.`,
    });
  }

  return recommendations;
}

export function getPersonalizedRecommendations(
  species: PlantSpeciesRow,
  userSchedule: {
    care_type: string;
    last_completed_at: string | null;
    next_due_at: string | null;
  }[],
  logs: { care_type: string; occurred_at: string }[],
): CareRecommendation[] {
  const recommendations: CareRecommendation[] = [];

  const lastFertilizeLog = logs
    .filter((l) => l.care_type === "fertilize")
    .sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    )[0];

  const daysSinceLastFertilize = daysSince(
    lastFertilizeLog?.occurred_at ?? null,
  );

  if (
    (daysSinceLastFertilize == null || daysSinceLastFertilize > 60) &&
    species.fertilizing_frequency_days != null
  ) {
    recommendations.push({
      type: "fertilize",
      title: "Consider fertilizing during growing season",
      description: `This plant was last fertilized ${
        daysSinceLastFertilize != null
          ? `${daysSinceLastFertilize} days ago`
          : "a while ago"
      }. Consider giving it nutrients if it's spring or summer.`,
      priority: "medium",
      reason: `No fertilize log in the last ${
        daysSinceLastFertilize != null ? `${daysSinceLastFertilize} days` : "60+ days"
      }.`,
    });
  }

  const lastWaterLog = logs
    .filter((l) => l.care_type === "water")
    .sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    )[0];

  const daysSinceLastWater = daysSince(lastWaterLog?.occurred_at ?? null);

  if (
    daysSinceLastWater != null &&
    species.watering_max_days != null &&
    daysSinceLastWater > species.watering_max_days
  ) {
    recommendations.push({
      type: "water",
      title: "Watering may be overdue",
      description: `It's been ${daysSinceLastWater} days since the last watering, which exceeds the suggested max of ${species.watering_max_days} days. Check soil moisture.`,
      priority: "high",
      reason: `Last watered ${daysSinceLastWater} days ago; max interval is ${species.watering_max_days} days.`,
    });
  }

  if (
    daysSinceLastWater != null &&
    species.watering_min_days != null &&
    daysSinceLastWater < species.watering_min_days
  ) {
    recommendations.push({
      type: "water",
      title: "Hold off on watering",
      description: `It's only been ${daysSinceLastWater} days since the last watering. This plant prefers at least ${species.watering_min_days} days between waterings.`,
      priority: "low",
      reason: `Last watered ${daysSinceLastWater} days ago; min interval is ${species.watering_min_days} days.`,
    });
  }

  // Check for schedules without recent completion
  for (const schedule of userSchedule) {
    if (schedule.care_type === "water" || schedule.care_type === "fertilize") {
      continue; // Already handled above
    }

    const lastLog = logs
      .filter((l) => l.care_type === schedule.care_type)
      .sort(
        (a, b) =>
          new Date(b.occurred_at).getTime() -
          new Date(a.occurred_at).getTime(),
      )[0];

    const daysSinceLast = daysSince(lastLog?.occurred_at ?? null);

    if (daysSinceLast != null && daysSinceLast > 90) {
      recommendations.push({
        type: "monitor",
        title: `Check ${schedule.care_type} schedule`,
        description: `It's been over 90 days since the last "${schedule.care_type}" care was logged. Consider performing this task.`,
        priority: "low",
        reason: `Last "${schedule.care_type}" log was ${daysSinceLast} days ago.`,
      });
    }
  }

  return recommendations;
}

export function getOverdueCareAlerts(
  schedules: {
    care_type: string;
    last_completed_at: string | null;
    next_due_at: string | null;
  }[],
): { type: string; message: string; daysOverdue: number }[] {
  const now = new Date();
  const alerts: { type: string; message: string; daysOverdue: number }[] = [];

  for (const schedule of schedules) {
    if (!schedule.next_due_at) continue;

    const dueDate = new Date(schedule.next_due_at);
    if (dueDate >= now) continue;

    const daysOverdue = Math.floor(
      (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    alerts.push({
      type: schedule.care_type,
      message: `${schedule.care_type.charAt(0).toUpperCase() + schedule.care_type.slice(1)} was due ${daysOverdue === 0 ? "today" : `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} ago`}.`,
      daysOverdue,
    });
  }

  return alerts.sort((a, b) => b.daysOverdue - a.daysOverdue);
}
