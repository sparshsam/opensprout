"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/context/app-context";
import { resolveSpeciesPresets, formatCadence, type CarePreset } from "@/lib/data/care";
import { createPlantSchedules } from "@/lib/data/plants";
import { BottomSheet } from "@/components/sheets/bottom-sheet";
import { Button } from "@/components/ui/button";
import { CadencePicker } from "@/components/care/cadence-picker";
import { cn } from "@/lib/utils";
import {
  Droplets, FlaskConical, Scissors, RotateCw,
  Sprout, Search, Sun, Leaf,
  Check, Loader2,
} from "lucide-react";
import type { CareType, PlantSpeciesRow } from "@/lib/data/types";

const CARE_ICONS: Record<CareType, React.ElementType> = {
  water: Droplets,
  fertilize: FlaskConical,
  mist: Sun,
  rotate: RotateCw,
  prune: Scissors,
  repot: Sprout,
  inspect: Search,
  custom: Leaf,
};

const CARE_COLORS: Record<string, string> = {
  water: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
  fertilize: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950",
  mist: "text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950",
  rotate: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950",
  prune: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950",
  repot: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950",
  inspect: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950",
  custom: "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950",
};

interface ApplyCarePlanSheetProps {
  open: boolean;
  onClose: () => void;
  plantName: string;
  plantId: string;
  species: PlantSpeciesRow | null;
}

export function ApplyCarePlanSheet({
  open,
  onClose,
  plantName,
  plantId,
  species,
}: ApplyCarePlanSheetProps) {
  const { supabase, user, refreshDashboard } = useApp();
  const [saving, setSaving] = useState(false);
  const [editingCadence, setEditingCadence] = useState<CareType | null>(null);

  const presets = useMemo(
    () => resolveSpeciesPresets(species),
    [species],
  );

  // Track which presets are toggled on. Default: species-sourced ones ON, defaults OFF.
  const [enabled, setEnabled] = useState<Set<CareType>>(() => {
    const init = new Set<CareType>();
    // Only enable water and fertilize by default (they have species data)
    // Let user opt into the rest
    presets.forEach((p) => {
      if (p.careType === "water") init.add("water");
    });
    return init;
  });

  // Track custom cadence overrides
  const [overrides, setOverrides] = useState<Partial<Record<CareType, number>>>({});

  function toggle(ct: CareType) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(ct)) next.delete(ct);
      else next.add(ct);
      return next;
    });
  }

  function cadenceFor(preset: CarePreset): number {
    return overrides[preset.careType] ?? preset.cadenceDays;
  }

  async function handleApply() {
    if (!supabase || !user) return;
    setSaving(true);
    try {
      const selected = presets
        .filter((p) => enabled.has(p.careType))
        .map((p) => ({
          careType: p.careType,
          cadenceDays: cadenceFor(p),
        }));

      if (selected.length > 0) {
        await createPlantSchedules(supabase, user.id, plantId, selected);
      }
      await refreshDashboard();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = enabled.size;

  return (
    <BottomSheet open={open} onClose={onClose} title="Set up care plan">
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Choose what care to schedule for <strong>{plantName}</strong>
          {species && (
            <>
              {" "}(<em>{species.common_name || species.scientific_name}</em>)
            </>
          )}
          .
        </p>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {presets.map((preset) => {
            const ct = preset.careType;
            const Icon = CARE_ICONS[ct];
            const isOn = enabled.has(ct);
            const days = cadenceFor(preset);

            return (
              <div
                key={ct}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 transition",
                  isOn
                    ? "border-primary/20 bg-primary/[0.03]"
                    : "border-border/50 bg-muted/30 opacity-60",
                )}
              >
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggle(ct)}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition",
                    isOn
                      ? CARE_COLORS[ct] ?? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {isOn ? <Check size={16} /> : <Icon size={16} />}
                </button>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => toggle(ct)}
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {preset.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCadence(days)}
                      {preset.source === "species" && preset.description && (
                        <span className="ml-2 text-primary">· Species guide</span>
                      )}
                    </p>
                  </button>
                </div>

                {/* Cadence edit */}
                {isOn && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCadence(editingCadence === ct ? null : ct)
                    }
                    className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80 transition"
                  >
                    {editingCadence === ct ? "Done" : "Edit"}
                  </button>
                )}

                {/* Expanded cadence picker */}
                {isOn && editingCadence === ct && (
                  <div className="col-span-3 mt-2">
                    <CadencePicker
                      value={days}
                      onChange={(newDays) => {
                        setOverrides((prev) => ({
                          ...prev,
                          [ct]: newDays,
                        }));
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleApply}
          disabled={saving || selectedCount === 0}
          className="w-full"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Check size={16} />
          )}
          {saving
            ? "Applying..."
            : `Apply plan${selectedCount > 0 ? ` (${selectedCount} schedule${selectedCount > 1 ? "s" : ""})` : ""}`}
        </Button>

        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition"
        >
          Not now — I&apos;ll set it up later
        </button>
      </div>
    </BottomSheet>
  );
}
