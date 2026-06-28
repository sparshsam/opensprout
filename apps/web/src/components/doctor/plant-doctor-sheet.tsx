"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/context/app-context";
import { getDiagnosisEntries } from "@/lib/data/knowledge";
import { BottomSheet } from "@/components/sheets/bottom-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Search, AlertTriangle, Leaf,
  Loader2, Check, ArrowRight,
} from "lucide-react";
import type { DiagnosisEntryRow, PlantSpeciesRow } from "@/lib/data/types";

interface PlantDoctorSheetProps {
  open: boolean;
  onClose: () => void;
  plantName: string;
  plantId: string;
  species: PlantSpeciesRow | null;
}

type DiagnosisStep = "welcome" | "select-symptoms" | "result";

export function PlantDoctorSheet({
  open,
  onClose,
  plantName,
  species,
}: PlantDoctorSheetProps) {
  const { supabase } = useApp();

  const [step, setStep] = useState<DiagnosisStep>("welcome");
  const [entries, setEntries] = useState<DiagnosisEntryRow[]>([]);
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Group symptoms by category
  const groupedSymptoms = useMemo(() => {
    const groups = new Map<string, { symptom: string; cause: string; solution: string; severity: string }[]>();
    for (const e of entries) {
      const list = groups.get(e.category) ?? [];
      list.push({ symptom: e.symptom, cause: e.cause, solution: e.solution, severity: e.severity });
      groups.set(e.category, list);
    }
    return groups;
  }, [entries]);

  const categoryLabels: Record<string, string> = {
    watering: "💧 Watering",
    light: "☀️ Light",
    pests: "🐛 Pests",
    disease: "🦠 Disease",
    nutrient: "🧪 Nutrient",
    environment: "🌿 Environment",
  };

  async function startDiagnosis() {
    if (!supabase) return;
    setLoading(true);
    try {
      const result = await getDiagnosisEntries(
        supabase,
        species?.id ?? undefined,
      );
      setEntries(result);
      setStep("select-symptoms");
    } finally {
      setLoading(false);
    }
  }

  function getSelectedResult(): {
    symptom: string;
    cause: string;
    solution: string;
    severity: string;
    category: string;
  } | null {
    if (!selectedSymptom) return null;
    for (const e of entries) {
      if (e.symptom === selectedSymptom) {
        return {
          symptom: e.symptom,
          cause: e.cause,
          solution: e.solution,
          severity: e.severity,
          category: e.category,
        };
      }
    }
    return null;
  }

  const result = getSelectedResult();

  function reset() {
    setStep("welcome");
    setSelectedSymptom(null);
    setEntries([]);
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={`Plant Doctor — ${plantName}`}>
      <div className="space-y-5">
        {step === "welcome" && (
          <>
            <div className="rounded-2xl bg-primary/[0.03] border border-primary/20 p-5 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Search size={24} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tell me what symptoms you&apos;re seeing on <strong>{plantName}</strong>
                {species && <em> ({species.common_name || species.scientific_name})</em>},
                and I&apos;ll help identify the issue.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
              </div>
            ) : (
              <Button onClick={startDiagnosis} className="w-full">
                <Search size={16} /> Start diagnosis
              </Button>
            )}

            <button onClick={onClose} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition">
              Cancel
            </button>
          </>
        )}

        {step === "select-symptoms" && (
          <>
            <p className="text-sm text-muted-foreground">
              Select the symptom that best matches what you see:
            </p>

            <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
              {Array.from(groupedSymptoms.entries()).map(
                ([category, symptoms]) => (
                  <div key={category}>
                    <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2">
                      {categoryLabels[category] ?? category}
                    </p>
                    <div className="space-y-1.5">
                      {symptoms.map((s) => (
                        <button
                          key={s.symptom}
                          onClick={() => {
                            setSelectedSymptom(s.symptom);
                            setStep("result");
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition hover:bg-muted/50",
                            "border-border/50 bg-white dark:bg-muted",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                              s.severity === "severe"
                                ? "bg-destructive/10 text-destructive"
                                : s.severity === "moderate"
                                  ? "bg-warning/10 text-warning"
                                  : "bg-primary/10 text-primary",
                            )}
                          >
                            {s.severity === "severe" ? "!" : "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">
                              {s.symptom}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {s.cause}
                            </p>
                          </div>
                          <ArrowRight
                            size={14}
                            className="shrink-0 text-muted-foreground/40"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>

            <Button variant="secondary" onClick={reset} className="w-full">
              Back
            </Button>
          </>
        )}

        {step === "result" && result && (
          <>
            <div
              className={cn(
                "rounded-2xl border p-5",
                result.severity === "severe"
                  ? "border-destructive/20 bg-destructive/[0.02]"
                  : result.severity === "moderate"
                    ? "border-warning/20 bg-warning/[0.02]"
                    : "border-primary/20 bg-primary/[0.02]",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    result.severity === "severe"
                      ? "bg-destructive/10 text-destructive"
                      : result.severity === "moderate"
                        ? "bg-warning/10 text-warning"
                        : "bg-primary/10 text-primary",
                  )}
                >
                  {result.severity === "severe" ? (
                    <AlertTriangle size={18} />
                  ) : (
                    <Leaf size={18} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {result.symptom}
                  </p>
                  <span
                    className={cn(
                      "mt-1 inline-block rounded-full px-3 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                      result.severity === "severe"
                        ? "bg-destructive/10 text-destructive"
                        : result.severity === "moderate"
                          ? "bg-warning/10 text-warning"
                          : "bg-primary/10 text-primary",
                    )}
                  >
                    {result.severity}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2">
                  Cause
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {result.cause}
                </p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/[0.02] p-4">
                <p className="text-xs font-bold tracking-wider uppercase text-primary mb-2">
                  Recommended action
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {result.solution}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep("select-symptoms");
                  setSelectedSymptom(null);
                }}
                className="flex-1"
              >
                Try another symptom
              </Button>
              <Button onClick={reset} className="flex-1">
                <Check size={16} /> Done
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This diagnosis is based on the species care library. Always
              consider your plant&apos;s specific environment.
            </p>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
