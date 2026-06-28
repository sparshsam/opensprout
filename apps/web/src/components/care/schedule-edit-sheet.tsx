"use client";

import { useState } from "react";
import { useApp } from "@/lib/context/app-context";
import { updateCareSchedule } from "@/lib/data/plants";
import { cadenceToDays, daysToCadence } from "@/lib/data/care";
import { BottomSheet } from "@/components/sheets/bottom-sheet";
import { Button } from "@/components/ui/button";
import { CadencePicker } from "@/components/care/cadence-picker";
import { Input } from "@/components/ui/input";
import { Loader2, Save } from "lucide-react";
import type { CareScheduleRow } from "@/lib/data/types";

interface ScheduleEditSheetProps {
  open: boolean;
  onClose: () => void;
  schedule: CareScheduleRow | null;
}

export function ScheduleEditSheet({
  open,
  onClose,
  schedule,
}: ScheduleEditSheetProps) {
  const { supabase, user, refreshDashboard } = useApp();
  const [saving, setSaving] = useState(false);

  // Derive initial cadence in days
  const initialDays = schedule
    ? cadenceToDays(schedule.cadence_value, schedule.cadence_unit)
    : 7;

  const [cadenceDays, setCadenceDays] = useState(initialDays);
  const [notes, setNotes] = useState(schedule?.notes ?? "");

  async function handleSave() {
    if (!supabase || !user || !schedule) return;
    setSaving(true);
    try {
      const { value, unit } = daysToCadence(cadenceDays);
      await updateCareSchedule(supabase, user.id, schedule.id, {
        cadence_value: value,
        cadence_unit: unit,
        notes: notes || null,
      });
      await refreshDashboard();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={
        schedule
          ? `Edit ${schedule.custom_label ?? schedule.care_type} schedule`
          : "Edit schedule"
      }
    >
      <div className="space-y-6">
        <div>
          <p className="text-label mb-3 text-muted-foreground">Frequency</p>
          <CadencePicker value={cadenceDays} onChange={setCadenceDays} />
        </div>

        <div>
          <label className="text-label block mb-2 text-muted-foreground">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Use filtered water, check soil first..."
            className="min-h-20 w-full rounded-2xl bg-muted px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            Save changes
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
