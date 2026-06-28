"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  buildDashboardInsights,
  getSeasonalTips,
} from "@/lib/data/insights";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, TrendingUp, Droplets, Sun,
  Heart, Calendar, Info,
} from "lucide-react";
import Link from "next/link";

const INSIGHT_ICONS: Record<string, React.ElementType> = {
  missed_care: AlertTriangle,
  streak: TrendingUp,
  consistency: Calendar,
  seasonal: Sun,
  last_watered: Droplets,
  health_reminder: Heart,
};

const INSIGHT_COLORS: Record<string, string> = {
  missed_care: "text-destructive bg-destructive/10",
  streak: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950",
  consistency: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
  seasonal: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950",
  last_watered: "text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950",
  health_reminder: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950",
};

export function InsightCards() {
  const { data } = useApp();

  const insights = useMemo(
    () => buildDashboardInsights(data.plants, data.schedules, data.logs),
    [data.plants, data.schedules, data.logs],
  );

  const seasonalTips = useMemo(() => getSeasonalTips(), []);

  if (insights.length === 0 && seasonalTips.length === 0) return null;

  return (
    <section className="mb-12">
      <p className="text-label mb-5 text-muted-foreground">Insights</p>
      <div className="space-y-2">
        {/* Care insights from user data */}
        {insights.slice(0, 4).map((insight) => {
          const Icon = INSIGHT_ICONS[insight.type] ?? Info;
          const colorClass = INSIGHT_COLORS[insight.type] ?? "bg-muted text-muted-foreground";

          return (
            <div
              key={insight.id}
              className={cn(
                "rounded-2xl border p-4 transition",
                insight.priority === "high"
                  ? "border-destructive/20 bg-destructive/[0.02]"
                  : "border-border/50 bg-white dark:bg-muted",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    colorClass,
                  )}
                >
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {insight.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {insight.description}
                  </p>
                  <details className="mt-1.5">
                    <summary className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition">
                      <Info size={10} />
                      Why this recommendation?
                    </summary>
                    <p className="mt-1 text-[11px] text-muted-foreground/60 leading-relaxed">
                      {insight.reason}
                      <br />
                      <span className="italic">Source: {insight.dataSource}</span>
                    </p>
                  </details>
                  {insight.plantId && (
                    <Link
                      href={`/plants/${insight.plantId}`}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      View plant <span aria-hidden>&rarr;</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Seasonal tips */}
        {seasonalTips.map((tip, i) => (
          <div
            key={`seasonal-${i}`}
            className="rounded-2xl border border-border/40 bg-muted/20 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Sun size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {tip.tip}
                </p>
                <details className="mt-1.5">
                  <summary className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition">
                    <Info size={10} />
                    Why?
                  </summary>
                  <p className="mt-1 text-[11px] text-muted-foreground/60 leading-relaxed">
                    {tip.reason}
                  </p>
                </details>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
