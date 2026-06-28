"use client";

import { useState } from "react";
import { formatCadence, formatDueDate } from "@/lib/data/care";
import { updateCareSchedule, deleteCareSchedule } from "@/lib/data/plants";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { CareScheduleRow } from "@/lib/data/types";

interface ScheduleCardProps {
  schedule: CareScheduleRow;
  onEdit: (schedule: CareScheduleRow) => void;
}

export function ScheduleCard({ schedule, onEdit }: ScheduleCardProps) {
  const { supabase, user, refreshDashboard } = useApp();
  const [busy, setBusy] = useState(false);

  async function togglePause() {
    if (!supabase || !user) return;
    setBusy(true);
    try {
      await updateCareSchedule(supabase, user.id, schedule.id, {
        active: !schedule.active,
      });
      await refreshDashboard();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!supabase || !user) return;
    if (
      !window.confirm(
        `Delete the ${schedule.care_type} schedule? This cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    try {
      await deleteCareSchedule(supabase, user.id, schedule.id);
      await refreshDashboard();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-2xl border p-4 transition",
        schedule.active
          ? "border-border/50 bg-white dark:bg-muted"
          : "border-border/30 bg-muted/30 opacity-70",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold capitalize text-foreground">
            {schedule.custom_label ?? schedule.care_type}
          </p>
          {!schedule.active && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
              Paused
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatCadence(
            schedule.cadence_unit === "week"
              ? schedule.cadence_value * 7
              : schedule.cadence_unit === "month"
                ? schedule.cadence_value * 30
                : schedule.cadence_value,
          )}
          {schedule.next_due_at && (
            <span className="ml-2">
              · Due {formatDueDate(schedule.next_due_at)}
            </span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onEdit(schedule)}
          disabled={busy}
          className="rounded-full bg-muted px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80 transition disabled:opacity-40"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={togglePause}
          disabled={busy}
          className="rounded-full bg-muted px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80 transition disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="animate-spin inline" size={12} />
          ) : schedule.active ? (
            "Pause"
          ) : (
            "Resume"
          )}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="rounded-full bg-destructive/5 px-3.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
