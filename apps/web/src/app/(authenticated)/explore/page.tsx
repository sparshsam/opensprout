"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/context/app-context";
import { getSpeciesById, listCategories } from "@/lib/data/knowledge";
import { getSpeciesRecommendations, type CareRecommendation } from "@/lib/data/recommendations";
import { searchPlantSpecies } from "@/lib/data/species";
import type { PlantSpeciesRow } from "@/lib/data/types";
import { Search, Leaf, FlaskConical, AlertTriangle, BookOpen, RefreshCw } from "lucide-react";
import { BottomSheet } from "@/components/sheets/bottom-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DetailTab = "care" | "recommendations" | "problems";

export default function ExplorePage() {
  const { supabase } = useApp();

  // ── State ──
  const [speciesList, setSpeciesList] = useState<PlantSpeciesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Detail sheet state
  const [selectedSpecies, setSelectedSpecies] = useState<PlantSpeciesRow | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("care");
  const [recommendations, setRecommendations] = useState<CareRecommendation[]>([]);

  // ── Load categories on mount ──
  useEffect(() => {
    listCategories().then(setCategories).catch(console.error);
  }, []);

  // ── Load all species on mount / supabase change ──
  const loadSpecies = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const results = await searchPlantSpecies(supabase, "");
      setSpeciesList(results);
    } catch (err) {
      console.error("[explore] Failed to load species:", err);
      setError("Could not load plant species. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadSpecies();
  }, [loadSpecies]);

  // ── Filtered species list ──
  const filteredSpecies = useMemo(() => {
    let list = speciesList;

    // Apply category filter
    if (selectedCategory) {
      list = list.filter(
        (s) => s.category?.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const lowered = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.common_name.toLowerCase().includes(lowered) ||
          (s.scientific_name ?? "").toLowerCase().includes(lowered) ||
          s.aliases?.some((a) => a.toLowerCase().includes(lowered)),
      );
    }

    return list;
  }, [speciesList, selectedCategory, searchQuery]);

  // ── Open detail sheet ──
  const openDetail = useCallback(
    async (species: PlantSpeciesRow) => {
      setSelectedSpecies(species);
      setDetailTab("care");

      // Fetch fresh data if available
      if (supabase) {
        try {
          const fresh = await getSpeciesById(supabase, species.id);
          if (fresh) setSelectedSpecies(fresh);
        } catch {
          // Fall back to the species from the list
        }
      }

      // Compute recommendations
      setRecommendations(getSpeciesRecommendations(species));
    },
    [supabase],
  );

  const closeDetail = useCallback(() => {
    setSelectedSpecies(null);
    setDetailTab("care");
  }, []);

  // ── Helpers ──
  const difficultyColor = (d: string | null) => {
    switch (d) {
      case "beginner":
        return "bg-emerald-100 text-emerald-800";
      case "easy":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-amber-100 text-amber-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const priorityBadge = (p: CareRecommendation["priority"]) => {
    switch (p) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-amber-100 text-amber-700";
      case "low":
        return "bg-sky-100 text-sky-700";
    }
  };

  const wateringRange = (s: PlantSpeciesRow) => {
    if (s.watering_min_days == null && s.watering_max_days == null) return "Unknown";
    if (s.watering_min_days == null) return `Up to ${s.watering_max_days} days`;
    if (s.watering_max_days == null) return `At least ${s.watering_min_days} days`;
    return `${s.watering_min_days}–${s.watering_max_days} days`;
  };

  // ── Render ──
  return (
    <>
      {/* ── Header ── */}
      <header className="flex flex-col gap-1 border-b border-border pb-5">
        <h1 className="text-3xl font-bold tracking-normal text-foreground">
          Plant Knowledge
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse care guides and plant information
        </p>
      </header>

      {/* ── Search ── */}
      <div className="relative mt-5">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="text"
          placeholder="Search plants by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* ── Category filter chips ── */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition",
            selectedCategory === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setSelectedCategory(cat === selectedCategory ? null : cat)
            }
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition",
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSpecies}
              className="shrink-0 border-red-300 bg-white text-red-700 hover:bg-red-100"
            >
              <RefreshCw size={14} aria-hidden />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* ── Results section ── */}
      <section className="mt-6">
        {loading ? (
          <div className="grid min-h-40 place-items-center text-muted-foreground">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Leaf size={18} className="animate-pulse" aria-hidden />
              Loading plants
            </div>
          </div>
        ) : filteredSpecies.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center shadow-panel">
            <BookOpen size={40} className="mx-auto text-muted-foreground/50" aria-hidden />
            <h2 className="mt-4 text-lg font-bold">No plants found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery || selectedCategory
                ? "Try a different search or category."
                : "No plant species data available yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSpecies.map((species) => (
              <button
                key={species.id}
                onClick={() => void openDetail(species)}
                className="group relative flex flex-col rounded-lg border border-border bg-card p-4 text-left shadow-panel transition hover:shadow-md active:scale-[0.98]"
              >
                {/* Name */}
                <h3 className="font-bold text-foreground">
                  {species.common_name}
                </h3>
                {species.scientific_name && (
                  <p className="mt-0.5 text-xs italic text-muted-foreground">
                    {species.scientific_name}
                  </p>
                )}

                {/* Badges */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {species.category && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-blue-700">
                      {species.category}
                    </span>
                  )}
                  {species.difficulty && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        difficultyColor(species.difficulty),
                      )}
                    >
                      {species.difficulty}
                    </span>
                  )}
                </div>

                {/* Care summary preview */}
                {species.care_summary && (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {species.care_summary}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Species Detail Bottom Sheet ── */}
      <BottomSheet
        open={selectedSpecies !== null}
        onClose={closeDetail}
        title={selectedSpecies?.common_name ?? ""}
      >
        {selectedSpecies && (
          <div className="space-y-5">
            {/* Scientific name subtitle */}
            {selectedSpecies.scientific_name && (
              <p className="-mt-3 text-sm italic text-muted-foreground">
                {selectedSpecies.scientific_name}
              </p>
            )}

            {/* Section tabs */}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {(
                [
                  { key: "care", label: "Care Guide", icon: Leaf },
                  { key: "recommendations", label: "Recommendations", icon: FlaskConical },
                  { key: "problems", label: "Problems", icon: AlertTriangle },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setDetailTab(key)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition",
                    detailTab === key
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon size={14} aria-hidden />
                  {label}
                </button>
              ))}
            </div>

            {/* Care Guide Tab */}
            {detailTab === "care" && (
              <div className="space-y-4">
                {/* Overview fields */}
                <DetailGrid
                  rows={[
                    { label: "Light", value: selectedSpecies.light_preference },
                    { label: "Watering", value: wateringRange(selectedSpecies) },
                    {
                      label: "Fertilizing",
                      value: selectedSpecies.fertilizing_frequency_days
                        ? `Every ${selectedSpecies.fertilizing_frequency_days} days`
                        : null,
                    },
                    { label: "Humidity", value: selectedSpecies.humidity_preference },
                    { label: "Soil", value: selectedSpecies.soil_notes },
                    { label: "Toxicity", value: selectedSpecies.toxicity },
                    {
                      label: "Difficulty",
                      value: selectedSpecies.difficulty ?? null,
                    },
                  ]}
                />

                {/* Extended fields */}
                <div className="border-t border-border pt-4">
                  <h4 className="mb-3 text-sm font-bold text-foreground">
                    Additional Details
                  </h4>
                  <DetailGrid
                    rows={[
                      {
                        label: "Propagation",
                        value: selectedSpecies.propagation_methods?.length
                          ? selectedSpecies.propagation_methods.join(", ")
                          : null,
                      },
                      {
                        label: "Pruning",
                        value: selectedSpecies.pruning_notes,
                      },
                      {
                        label: "Repotting",
                        value: selectedSpecies.repotting_notes,
                      },
                      {
                        label: "Dormancy",
                        value: selectedSpecies.dormancy_period,
                      },
                      {
                        label: "Growth Rate",
                        value: selectedSpecies.growth_rate ?? null,
                      },
                      {
                        label: "Mature Height",
                        value: selectedSpecies.mature_height,
                      },
                      {
                        label: "Bloom Time",
                        value: selectedSpecies.bloom_time,
                      },
                      {
                        label: "Pet Safe",
                        value: selectedSpecies.pet_safe ? "Yes" : "No",
                      },
                      {
                        label: "Native Region",
                        value: selectedSpecies.native_region,
                      },
                    ]}
                  />
                </div>

                {/* Care summary full text */}
                {selectedSpecies.care_summary && (
                  <div className="border-t border-border pt-4">
                    <h4 className="mb-2 text-sm font-bold text-foreground">
                      Care Summary
                    </h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {selectedSpecies.care_summary}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations Tab */}
            {detailTab === "recommendations" && (
              <div className="space-y-3">
                {recommendations.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No specific recommendations for this plant.
                  </p>
                ) : (
                  recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-border bg-card p-4 shadow-panel"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-foreground">
                          {rec.title}
                        </h4>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                            priorityBadge(rec.priority),
                          )}
                        >
                          {rec.priority}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {rec.description}
                      </p>
                      <p className="mt-2 text-[11px] italic text-muted-foreground/70">
                        {rec.reason}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Problems Tab */}
            {detailTab === "problems" && (
              <div className="space-y-3">
                {!selectedSpecies.common_problems ||
                selectedSpecies.common_problems.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No common problems listed for this plant.
                  </p>
                ) : (
                  selectedSpecies.common_problems.map((problem, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-panel"
                    >
                      <AlertTriangle
                        size={16}
                        className="mt-0.5 shrink-0 text-amber-500"
                        aria-hidden
                      />
                      <p className="text-sm leading-relaxed text-foreground">
                        {problem}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Close button */}
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={closeDetail}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

// ── Sub-components ──

function DetailGrid({
  rows,
}: {
  rows: { label: string; value: string | null }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {rows.map(
        (row) =>
          row.value && (
            <div key={row.label}>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                {row.label}
              </p>
              <p className="mt-0.5 text-sm text-foreground">{row.value}</p>
            </div>
          ),
      )}
    </div>
  );
}
