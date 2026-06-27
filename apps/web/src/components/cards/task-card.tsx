"use client";

import { Flower2, Timer, AlertTriangle } from "lucide-react";
import type { CareType } from "@/lib/data/types";
import type { TaskWithPlant } from "@/lib/data/tasks";
import { formatDueDate } from "@/lib/data/care";
import { cn } from "@/lib/utils";

const careColors: Record<CareType, { bg: string; text: string; icon: string }> = {
  water: { bg: "bg-sky-50", text: "text-sky-700", icon: "bg-sky-100" },
  fertilize: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "bg-emerald-100" },
  mist: { bg: "bg-cyan-50", text: "text-cyan-700", icon: "bg-cyan-100" },
  rotate: { bg: "bg-violet-50", text: "text-violet-700", icon: "bg-violet-100" },
  prune: { bg: "bg-orange-50", text: "text-orange-700", icon: "bg-orange-100" },
  repot: { bg: "bg-rose-50", text: "text-rose-700", icon: "bg-rose-100" },
  inspect: { bg: "bg-amber-50", text: "text-amber-700", icon: "bg-amber-100" },
  custom: { bg: "bg-slate-50", text: "text-slate-700", icon: "bg-slate-100" },
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

function isOverdue(dueAt: string | null): boolean {
  if (!dueAt) return false;
  return new Date(dueAt).getTime() < Date.now();
}

function isDueToday(dueAt: string | null): boolean {
  if (!dueAt) return false;
  const now = new Date();
  const due = new Date(dueAt);
  return due.toDateString() === now.toDateString();
}

export function TaskCard({
  task,
  onClick,
}: {
  task: TaskWithPlant;
  onClick: () => void;
}) {
  const color = careColors[task.care_type as CareType] ?? careColors.custom;
  const overdue = isOverdue(task.due_at);
  const dueToday = isDueToday(task.due_at);
  const snoozed = task.status === "snoozed";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border border-border bg-white p-4 text-left shadow-sm transition active:scale-[0.98] md:hover:border-primary md:hover:shadow-md dark:bg-muted",
        overdue && "border-l-4 border-l-red-400",
        dueToday && !overdue && "border-l-4 border-l-amber-400",
        snoozed && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Care type icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            color.icon,
            color.text,
          )}
        >
          <Flower2 size={20} aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-foreground">
              {labels[task.care_type as CareType] ?? "Care"}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                overdue
                  ? "bg-red-100 text-red-700"
                  : snoozed
                    ? "bg-slate-100 text-slate-600"
                    : "bg-amber-100 text-amber-700",
              )}
            >
              {overdue && <AlertTriangle size={12} aria-hidden />}
              {snoozed && <Timer size={12} aria-hidden />}
              {snoozed ? "Snoozed" : overdue ? "Overdue" : "Due today"}
            </span>
          </div>

          <p className="mt-0.5 text-sm text-muted-foreground">
            {task.plantName}
            {task.plantLocation ? ` · ${task.plantLocation}` : ""}
          </p>

          <p className="mt-1 text-xs font-medium text-foreground">
            {task.due_at ? formatDueDate(task.due_at) : "No due date"}
          </p>
        </div>
      </div>
    </button>
  );
}
