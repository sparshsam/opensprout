import type { CareLogRow, CareScheduleRow, PlantRow } from "@/lib/data/types";

/**
 * Compute care insights from actual data.
 * Every insight includes a `reason` explaining why it was generated
 * and `dataSource` indicating which data was used.
 */

export type CareInsight = {
  id: string;
  type: "missed_care" | "streak" | "consistency" | "seasonal" | "last_watered" | "health_reminder";
  title: string;
  description: string;
  reason: string;
  dataSource: string;
  priority: "high" | "medium" | "low";
  plantId?: string;
  plantName?: string;
};

// ── Streak tracking ──

export type CareStreak = {
  plantId: string;
  plantName: string;
  careType: string;
  consecutiveDays: number;
  bestDays: number;
};

/**
 * Compute streaks per plant per care type.
 * A "streak" is consecutive days with at least one care_log of that type.
 */
export function computeCareStreaks(
  logs: CareLogRow[],
  plants: PlantRow[],
): CareStreak[] {
  const plantNames = new Map(plants.map((p) => [p.id, p.name]));
  const byPlant = new Map<string, CareLogRow[]>();

  for (const log of logs) {
    const list = byPlant.get(log.plant_id) ?? [];
    list.push(log);
    byPlant.set(log.plant_id, list);
  }

  const streaks: CareStreak[] = [];

  for (const [plantId, plantLogs] of byPlant) {
    // Group logs by care_type
    const byType = new Map<string, CareLogRow[]>();
    for (const log of plantLogs) {
      const list = byType.get(log.care_type) ?? [];
      list.push(log);
      byType.set(log.care_type, list);
    }

    for (const [careType, typeLogs] of byType) {
      // Sort by date descending
      const sorted = typeLogs
        .map((l) => l.occurred_at.slice(0, 10))
        .filter((d, i, a) => a.indexOf(d) === i) // unique days
        .sort()
        .reverse();

      // Count consecutive days from today backwards
      let consecutive = 0;
      const today = new Date().toISOString().slice(0, 10);
      const todayNum = daysSinceEpoch(today);

      for (const day of sorted) {
        if (daysSinceEpoch(day) === todayNum - consecutive) {
          consecutive++;
        } else {
          break;
        }
      }

      const bestDays = longestConsecutive(sorted.map((d) => daysSinceEpoch(d)));

      if (consecutive > 0) {
        streaks.push({
          plantId,
          plantName: plantNames.get(plantId) ?? "Unknown",
          careType,
          consecutiveDays: consecutive,
          bestDays,
        });
      }
    }
  }

  return streaks;
}

function daysSinceEpoch(d: string): number {
  return Math.floor(new Date(d).getTime() / 86_400_000);
}

function longestConsecutive(days: number[]): number {
  if (days.length === 0) return 0;
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

// ── Missed care detection ──

export type MissedCare = {
  scheduleId: string;
  plantId: string;
  plantName: string;
  careType: string;
  daysSinceDue: number;
  lastCompletedAt: string | null;
};

/**
 * Detect schedules whose next_due_at is past due with no completion.
 */
export function detectMissedCare(
  schedules: CareScheduleRow[],
  logs: CareLogRow[],
  plants: PlantRow[],
): MissedCare[] {
  const plantNames = new Map(plants.map((p) => [p.id, p.name]));
  const now = new Date();
  const missed: MissedCare[] = [];

  for (const sched of schedules) {
    if (!sched.active || !sched.next_due_at) continue;
    const due = new Date(sched.next_due_at);
    if (due > now) continue;

    // Check if there's a log after the due date for this schedule
    const recentLog = logs.find(
      (l) =>
        l.plant_id === sched.plant_id &&
        l.care_type === sched.care_type &&
        new Date(l.occurred_at) > due,
    );
    if (recentLog) continue;

    const daysOverdue = Math.floor(
      (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
    );

    missed.push({
      scheduleId: sched.id,
      plantId: sched.plant_id,
      plantName: plantNames.get(sched.plant_id) ?? "Unknown",
      careType: sched.care_type,
      daysSinceDue: daysOverdue,
      lastCompletedAt: sched.last_completed_at,
    });
  }

  return missed.sort((a, b) => b.daysSinceDue - a.daysSinceDue);
}

// ── Last watered indicators ──

export type LastWateredInfo = {
  plantId: string;
  plantName: string;
  lastWateredAt: string | null;
  daysAgo: number | null;
};

/**
 * Get the last watering time for each plant.
 */
export function getLastWatered(
  logs: CareLogRow[],
  plants: PlantRow[],
): LastWateredInfo[] {
  const waterLogs = logs
    .filter((l) => l.care_type === "water")
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

  return plants.map((plant) => {
    const last = waterLogs.find((l) => l.plant_id === plant.id);
    const daysAgo = last
      ? Math.floor(
          (Date.now() - new Date(last.occurred_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;
    return {
      plantId: plant.id,
      plantName: plant.name,
      lastWateredAt: last?.occurred_at ?? null,
      daysAgo,
    };
  });
}

// ── Seasonal tips ──

export type SeasonalTip = {
  season: string;
  tip: string;
  reason: string;
};

/**
 * Get seasonal care tips based on the current month in the user's hemisphere.
 * Uses only data-derived recommendations.
 */
export function getSeasonalTips(): SeasonalTip[] {
  const month = new Date().getMonth();
  // Northern hemisphere seasons (month 0=Jan)
  const isWarm = month >= 3 && month <= 8; // Apr–Sep
  const label = isWarm ? "Warm months" : "Cool months";

  const tips: SeasonalTip[] = [
    {
      season: label,
      tip: isWarm
        ? "Water more frequently as plants actively grow."
        : "Reduce watering — most plants need less during low-light months.",
      reason: `Based on current month (${new Date().toLocaleString("en-US", { month: "long" })}) in the growing/dormant cycle.`,
    },
    {
      season: label,
      tip: isWarm
        ? "Fertilize regularly during active growth."
        : "Hold off on fertilizing until growth resumes.",
      reason: `Seasonal growth cycles affect nutrient uptake. ${isWarm ? "Active growth" : "Dormancy"} period.`,
    },
  ];

  return tips;
}

// ── Build all insights for dashboard ──

export function buildDashboardInsights(
  plants: PlantRow[],
  schedules: CareScheduleRow[],
  logs: CareLogRow[],
): CareInsight[] {
  const insights: CareInsight[] = [];

  // Missed care
  const missed = detectMissedCare(schedules, logs, plants);
  for (const m of missed.slice(0, 3)) {
    insights.push({
      id: `missed-${m.scheduleId}`,
      type: "missed_care",
      title: `${m.plantName} needs ${m.careType}`,
      description: `Overdue by ${m.daysSinceDue} day${m.daysSinceDue !== 1 ? "s" : ""}. Last completed: ${m.lastCompletedAt ? new Date(m.lastCompletedAt).toLocaleDateString() : "never"}.`,
      reason: `Schedule next_due_at (${m.daysSinceDue} days ago) has passed with no matching care_log since.`,
      dataSource: "care_schedules.next_due_at + care_logs",
      priority: m.daysSinceDue > 7 ? "high" : "medium",
      plantId: m.plantId,
      plantName: m.plantName,
    });
  }

  // Streaks
  const streaks = computeCareStreaks(logs, plants);
  for (const s of streaks.slice(0, 3)) {
    if (s.consecutiveDays >= 3) {
      insights.push({
        id: `streak-${s.plantId}-${s.careType}`,
        type: "streak",
        title: `${s.plantName} — ${s.consecutiveDays}-day ${s.careType} streak`,
        description: `You've logged ${s.careType} for ${s.consecutiveDays} consecutive day${s.consecutiveDays !== 1 ? "s" : ""}. Best streak: ${s.bestDays}.`,
        reason: `Consecutive-day count from care_log dates: ${s.consecutiveDays} days in a row ending today.`,
        dataSource: "care_logs (unique days per care_type)",
        priority: "low",
        plantId: s.plantId,
        plantName: s.plantName,
      });
    }
  }

  // Health reminders
  for (const plant of plants) {
    if (plant.health_status === "watch" || plant.health_status === "struggling") {
      insights.push({
        id: `health-${plant.id}`,
        type: "health_reminder",
        title: `${plant.name} needs attention`,
        description: `Health status is "${plant.health_status}". Check for issues and log any observations.`,
        reason: `Plant's health_status field is "${plant.health_status}".`,
        dataSource: "plants.health_status",
        priority: plant.health_status === "struggling" ? "high" : "medium",
        plantId: plant.id,
        plantName: plant.name,
      });
    }
  }

  return insights;
}
