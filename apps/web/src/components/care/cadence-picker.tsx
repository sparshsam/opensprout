"use client";

import { useState } from "react";
import { CADENCE_PRESETS, formatCadence } from "@/lib/data/care";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CadencePickerProps {
  value: number; // in days
  onChange: (days: number) => void;
}

/**
 * User-friendly cadence selector.
 * Shows preset pills (Daily, Weekly, Monthly, etc.) + a Custom option
 * that reveals a numeric input.
 */
export function CadencePicker({ value, onChange }: CadencePickerProps) {
  const [custom, setCustom] = useState(
    () => !CADENCE_PRESETS.some((p) => Math.abs(p.days - value) < 0.5),
  );
  const [customDays, setCustomDays] = useState(
    () => (custom ? String(Math.round(value)) : ""),
  );

  function selectPreset(days: number) {
    setCustom(false);
    setCustomDays("");
    onChange(days);
  }

  function enableCustom() {
    setCustom(true);
    const days = CADENCE_PRESETS.some((p) => Math.abs(p.days - value) < 0.5)
      ? 7
      : value;
    setCustomDays(String(Math.round(days)));
    onChange(days);
  }

  function handleCustomInput(v: string) {
    setCustomDays(v);
    const n = parseInt(v, 10);
    if (n > 0 && n < 1000) onChange(n);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CADENCE_PRESETS.filter((_, i) => i < 8).map((preset) => (
          <button
            key={preset.days}
            type="button"
            onClick={() => selectPreset(preset.days)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold transition",
              !custom && Math.abs(preset.days - value) < 0.5
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={enableCustom}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-semibold transition",
            custom
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          )}
        >
          Custom
        </button>
      </div>

      {custom && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-muted-foreground">
            Every
          </label>
          <Input
            type="number"
            min={1}
            max={999}
            value={customDays}
            onChange={(e) => handleCustomInput(e.target.value)}
            className="h-10 w-20 rounded-full text-center text-sm"
          />
          <label className="text-xs font-semibold text-muted-foreground">
            day{customDays !== "1" ? "s" : ""}
          </label>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Current: {formatCadence(value)}
      </p>
    </div>
  );
}
