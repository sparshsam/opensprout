"use client";

import { useState, useMemo, useRef, type FormEvent } from "react";
import { useApp } from "@/lib/context/app-context";
import { useAtmosphere } from "@/lib/hooks/use-atmosphere";
import Link from "next/link";
import {
  Plus, Search, Trash2, Loader2, Sprout, Camera,
  Archive, ArchiveRestore, Star, SlidersHorizontal,
  ArrowUpDown, LayoutGrid, List, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ApplyCarePlanSheet } from "@/components/care/apply-care-plan-sheet";
import { sortAndFilterPlants, type PlantSortField, type SortDirection } from "@/lib/data/plants";
import type { HealthStatus, PlantRow, PlantSpeciesRow } from "@/lib/data/types";
import type { PlantFormValues } from "@/lib/data/plants";
import { identifyPlant } from "@/lib/data/identify";
import { uploadPlantPhoto, setPlantCoverPhoto } from "@/lib/data/photos";
import { CoverPhoto } from "@/components/cards/cover-photo";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Skeleton } from "@/components/ui/skeleton";

const healthOptions: HealthStatus[] = ["thriving", "stable", "watch", "struggling", "unknown"];
const emptyForm: PlantFormValues = { name: "", species_id: "", species: "", location: "", notes: "", health_status: undefined };

const SORT_OPTIONS: { field: PlantSortField; label: string }[] = [
  { field: "name", label: "Name" },
  { field: "created_at", label: "Date added" },
  { field: "updated_at", label: "Recently updated" },
  { field: "health_status", label: "Health" },
  { field: "species", label: "Species" },
];

export default function PlantsPage() {
  const { supabase, user, data, speciesList, dataLoading, error, notice, setError, handleCreatePlant, handleUpdatePlant, handleDeletePlant, handleArchivePlant, handleRestorePlant, handleToggleFavorite, refreshDashboard } = useApp();
  const { greeting } = useAtmosphere();

  // ── Search, filter, sort state ──
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [healthFilter, setHealthFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortField, setSortField] = useState<PlantSortField>("updated_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [groupByLocation, setGroupByLocation] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // ── Form state ──
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<PlantRow | null>(null);
  const [form, setForm] = useState<PlantFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // ── Care plan sheet state ──
  const [showCarePlan, setShowCarePlan] = useState(false);
  const [lastCreatedPlant, setLastCreatedPlant] = useState<PlantRow | null>(null);

  // ── Derived data ──
  const locations = useMemo(() => {
    const locs = [...new Set(data.plants.map((p) => p.location).filter(Boolean))] as string[];
    return locs.sort();
  }, [data.plants]);

  const filtered = useMemo(
    () => sortAndFilterPlants(data.plants, {
      query,
      healthFilter,
      locationFilter,
      showArchived,
      favoritesOnly,
      sortField,
      sortDirection,
    }),
    [data.plants, query, healthFilter, locationFilter, showArchived, favoritesOnly, sortField, sortDirection],
  );

  const groupedByLocation = useMemo(() => {
    if (!groupByLocation) return null;
    const groups = new Map<string, PlantRow[]>();
    const noLocation: PlantRow[] = [];
    for (const p of filtered) {
      const loc = p.location ?? "__no_location__";
      if (loc === "__no_location__") { noLocation.push(p); continue; }
      const list = groups.get(loc) ?? [];
      list.push(p);
      groups.set(loc, list);
    }
    return { groups, noLocation };
  }, [filtered, groupByLocation]);

  const stats = useMemo(() => {
    const total = data.plants.filter((p) => !p.archived_at).length;
    const archived = data.plants.filter((p) => p.archived_at).length;
    const favorites = data.plants.filter((p) => p.is_favorite && !p.archived_at).length;
    const healthCounts: Record<string, number> = {};
    for (const p of data.plants) {
      if (p.archived_at) continue;
      const s = p.health_status ?? "unknown";
      healthCounts[s] = (healthCounts[s] ?? 0) + 1;
    }
    return { total, archived, favorites, healthCounts };
  }, [data.plants]);

  const hasActiveFilters = query || healthFilter || locationFilter || showArchived || favoritesOnly;

  function clearFilters() {
    setQuery("");
    setHealthFilter(null);
    setLocationFilter(null);
    setShowArchived(false);
    setFavoritesOnly(false);
  }

  function toggleSort(field: PlantSortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function openCreate() { setEditingPlant(null); setForm(emptyForm); setCoverFile(null); setShowForm(true); }
  function openEdit(p: PlantRow) {
    setEditingPlant(p);
    setForm({
      name: p.name,
      species_id: p.species_id ?? "",
      species: p.species ?? "",
      location: p.location ?? "",
      notes: p.notes ?? "",
      health_status: p.health_status ?? undefined,
    });
    setShowForm(true);
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingPlant) {
        await handleUpdatePlant(editingPlant.id, form);
        setShowForm(false); setEditingPlant(null); setCoverFile(null);
      } else {
        const c = await handleCreatePlant(form);
        if (coverFile && supabase && user) {
          try {
            const { objectPath } = await uploadPlantPhoto(supabase, user.id, c.id, coverFile);
            await setPlantCoverPhoto(supabase, user.id, c.id, objectPath);
          } catch { setError("Plant created but photo upload failed."); }
        }
        setShowForm(false); setEditingPlant(null); setCoverFile(null);
        if (c.species_id) { setLastCreatedPlant(c); setShowCarePlan(true); }
      }
    } catch {} finally { setSaving(false); }
  }

  async function onDelete(p: PlantRow) {
    if (!window.confirm(`Delete ${p.name}? This cannot be undone.`)) return;
    await handleDeletePlant(p);
  }

  const carePlanSpecies = useMemo(() => {
    if (!lastCreatedPlant?.species_id) return null;
    return speciesList.find((s) => s.id === lastCreatedPlant.species_id) ?? null;
  }, [lastCreatedPlant, speciesList]);

  const isLoading = dataLoading && data.plants.length === 0;

  return (
    <>
      {/* Error/notice banner */}
      {(error || notice) && (
        <div className={cn("mb-10 rounded-full px-6 py-3 text-sm font-semibold", error ? "bg-destructive/10 text-destructive" : "bg-primary-light text-primary")}>
          <span>{error ?? notice}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label mb-2 text-primary">{greeting}</p>
          <h1 className="text-hero text-foreground">Plants</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            {stats.total} plant{stats.total !== 1 ? "s" : ""}
            {stats.favorites > 0 && ` · ${stats.favorites} favorite${stats.favorites !== 1 ? "s" : ""}`}
            {stats.archived > 0 && ` · ${stats.archived} archived`}
          </p>
        </div>
        <button onClick={openCreate} className="rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110 shrink-0">
          <Plus size={16} className="inline" /> Add plant
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, species, location…"
            className="h-12 w-full rounded-full pl-10 pr-10 text-sm bg-muted"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn("rounded-full h-12 px-5 text-sm font-semibold transition border", showFilters || hasActiveFilters ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-foreground border-border hover:bg-muted/80")}
        >
          <SlidersHorizontal size={14} className="inline" />
          {hasActiveFilters ? ` ${filtered.length} results` : " Filters"}
        </button>

        {/* View toggle */}
        <div className="flex rounded-full border border-border bg-muted p-0.5">
          <button onClick={() => setViewMode("grid")} className={cn("rounded-full px-3 py-2 text-xs font-semibold transition", viewMode === "grid" ? "bg-white text-foreground shadow-sm dark:bg-muted" : "text-muted-foreground")}>
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => setViewMode("list")} className={cn("rounded-full px-3 py-2 text-xs font-semibold transition", viewMode === "list" ? "bg-white text-foreground shadow-sm dark:bg-muted" : "text-muted-foreground")}>
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-8 rounded-2xl border border-border/50 bg-muted/20 p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground mr-2">Health</span>
            <button onClick={() => setHealthFilter(null)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", !healthFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>All</button>
            {healthOptions.map((h) => (
              <button key={h} onClick={() => setHealthFilter(healthFilter === h ? null : h)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition capitalize", healthFilter === h ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>{h}</button>
            ))}
          </div>

          {locations.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground mr-2">Location</span>
              <button onClick={() => setLocationFilter(null)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", !locationFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>All</button>
              {locations.map((loc) => (
                <button key={loc} onClick={() => setLocationFilter(locationFilter === loc ? null : loc)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", locationFilter === loc ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>{loc}</button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/30">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={12} className="text-muted-foreground" />
              <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Sort</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.field}
                  onClick={() => toggleSort(opt.field)}
                  className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", sortField === opt.field ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                >
                  {opt.label} {sortField === opt.field ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                </button>
              ))}
            </div>

            <span className="text-border">|</span>

            {/* Toggles */}
            <button onClick={() => setFavoritesOnly(!favoritesOnly)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", favoritesOnly ? "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
              <Star size={12} className="inline" /> Favorites
            </button>
            <button onClick={() => setShowArchived(!showArchived)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", showArchived ? "bg-muted text-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
              <Archive size={12} className="inline" /> Archived
            </button>
            <button onClick={() => setGroupByLocation(!groupByLocation)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", groupByLocation ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
              Group by room
            </button>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="rounded-full bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10">
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collection stats bar */}
      {stats.total > 0 && !showFilters && (
        <div className="mb-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {Object.entries(stats.healthCounts).map(([status, count]) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={cn(
                "inline-block h-2 w-2 rounded-full",
                status === "thriving" ? "bg-green-500" : status === "stable" ? "bg-primary" : status === "watch" ? "bg-amber-500" : status === "struggling" ? "bg-red-500" : "bg-muted-foreground/30"
              )} />
              {count} {status}
            </span>
          ))}
        </div>
      )}

      {/* Plant form */}
      {showForm && (
        <section className="mb-14 border-t border-border pt-8">
          <PlantForm
            editing={Boolean(editingPlant)}
            values={form}
            speciesList={speciesList}
            saving={saving}
            coverFile={coverFile}
            onCoverChange={setCoverFile}
            onChange={setForm}
            onCancel={() => { setShowForm(false); setEditingPlant(null); setCoverFile(null); }}
            onSubmit={handleSave}
          />
        </section>
      )}

      {/* Plant listing */}
      <PullToRefresh onRefresh={refreshDashboard}>
        {isLoading ? (
          <div className={viewMode === "grid" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
            {[...Array(6)].map((_, i) => <Skeleton key={i} className={viewMode === "grid" ? "h-52 rounded-3xl" : "h-16 rounded-full"} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-xl font-bold text-foreground">
              {query || healthFilter || locationFilter ? "No plants match those filters." : "No plants yet"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              {query || healthFilter || locationFilter ? "Try adjusting your search or filters." : "Add your first plant to start tracking care."}
            </p>
            {!query && !healthFilter && !locationFilter && (
              <button onClick={openCreate} className="mt-8 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110">
                <Plus size={16} className="inline" /> Add your first plant
              </button>
            )}
          </div>
        ) : groupedByLocation ? (
          // Grouped by location view
          <div className="space-y-10">
            {Array.from(groupedByLocation.groups.entries()).map(([loc, plants]) => (
              <section key={loc}>
                <h2 className="text-display text-foreground mb-4 flex items-center gap-2">
                  📍 {loc}
                  <span className="text-xs text-muted-foreground font-normal">({plants.length})</span>
                </h2>
                <div className={viewMode === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
                  {plants.map((plant) => <PlantCardItem key={plant.id} plant={plant} viewMode={viewMode} onEdit={openEdit} onDelete={onDelete} onArchive={handleArchivePlant} onRestore={handleRestorePlant} onToggleFavorite={handleToggleFavorite} />)}
                </div>
              </section>
            ))}
            {groupedByLocation.noLocation.length > 0 && (
              <section>
                <h2 className="text-display text-foreground mb-4 flex items-center gap-2">
                  <Sprout size={18} className="text-muted-foreground" /> Other
                  <span className="text-xs text-muted-foreground font-normal">({groupedByLocation.noLocation.length})</span>
                </h2>
                <div className={viewMode === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
                  {groupedByLocation.noLocation.map((plant) => <PlantCardItem key={plant.id} plant={plant} viewMode={viewMode} onEdit={openEdit} onDelete={onDelete} onArchive={handleArchivePlant} onRestore={handleRestorePlant} onToggleFavorite={handleToggleFavorite} />)}
                </div>
              </section>
            )}
          </div>
        ) : (
          // Standard grid/list view
          <div className={viewMode === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
            {filtered.map((plant) => (
              <PlantCardItem key={plant.id} plant={plant} viewMode={viewMode} onEdit={openEdit} onDelete={onDelete} onArchive={handleArchivePlant} onRestore={handleRestorePlant} onToggleFavorite={handleToggleFavorite} />
            ))}
          </div>
        )}
      </PullToRefresh>

      {/* Apply Care Plan Sheet */}
      {lastCreatedPlant && (
        <ApplyCarePlanSheet
          open={showCarePlan}
          onClose={() => { setShowCarePlan(false); setLastCreatedPlant(null); }}
          plantName={lastCreatedPlant.name}
          plantId={lastCreatedPlant.id}
          species={carePlanSpecies}
        />
      )}
    </>
  );
}

// ── Individual plant card/list item ──

function PlantCardItem({
  plant, viewMode, onEdit, onDelete, onArchive, onRestore, onToggleFavorite,
}: {
  plant: PlantRow;
  viewMode: "grid" | "list";
  onEdit: (p: PlantRow) => void;
  onDelete: (p: PlantRow) => void;
  onArchive: (plantId: string) => void;
  onRestore: (plantId: string) => void;
  onToggleFavorite: (plantId: string, isFavorite: boolean) => void;
}) {
  const [favBusy, setFavBusy] = useState(false);
  const isArchived = !!plant.archived_at;

  if (viewMode === "list") {
    return (
      <div className={cn(
        "flex items-center gap-4 rounded-2xl border px-5 py-3.5 transition hover:bg-muted/30",
        isArchived ? "border-border/30 bg-muted/20 opacity-70" : "border-border/40 bg-white dark:bg-muted",
      )}>
        {/* Favorite */}
        <button
          onClick={async (e) => { e.preventDefault(); setFavBusy(true); await onToggleFavorite(plant.id, !plant.is_favorite); setFavBusy(false); }}
          disabled={favBusy}
          className={cn("shrink-0 transition", plant.is_favorite ? "text-rose-500" : "text-muted-foreground/30 hover:text-rose-400")}
        >
          <Star size={14} fill={plant.is_favorite ? "currentColor" : "none"} />
        </button>

        <Link href={`/plants/${plant.id}`} className="min-w-0 flex-1 flex items-center gap-3">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            !plant.health_status || plant.health_status === "unknown" ? "bg-muted text-muted-foreground" :
            plant.health_status === "thriving" || plant.health_status === "stable" ? "bg-primary/10 text-primary" :
            "bg-destructive/10 text-destructive"
          )}>
            {plant.health_status && plant.health_status !== "unknown" ? plant.health_status.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground truncate">{plant.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {plant.species ?? "Unknown"}
              {plant.location && ` · ${plant.location}`}
              {isArchived && <span className="ml-2 text-muted-foreground/60">Archived</span>}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          {!isArchived ? (
            <>
              <button onClick={(e) => { e.preventDefault(); onEdit(plant); }} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80">Edit</button>
              <button onClick={(e) => { e.preventDefault(); onArchive(plant.id); }} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80"><Archive size={11} className="inline" /></button>
              <button onClick={(e) => { e.preventDefault(); if (window.confirm(`Delete ${plant.name}?`)) onDelete(plant); }} className="rounded-full bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"><Trash2 size={11} className="inline" /></button>
            </>
          ) : (
            <>
              <button onClick={(e) => { e.preventDefault(); onRestore(plant.id); }} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80"><ArchiveRestore size={11} className="inline" /> Restore</button>
              <button onClick={(e) => { e.preventDefault(); if (window.confirm(`Delete ${plant.name} permanently?`)) onDelete(plant); }} className="rounded-full bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"><Trash2 size={11} className="inline" /></button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className={cn(
      "group relative rounded-3xl border p-5 transition",
      isArchived ? "border-border/30 bg-muted/20 opacity-70" : "border-border/40 bg-white hover:shadow-sm dark:bg-muted",
    )}>
      {/* Favorite button */}
      <button
        onClick={async (e) => { e.preventDefault(); setFavBusy(true); await onToggleFavorite(plant.id, !plant.is_favorite); setFavBusy(false); }}
        disabled={favBusy}
        className={cn(
          "absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full transition",
          plant.is_favorite ? "text-rose-500 bg-rose-50 dark:bg-rose-950" : "text-muted-foreground/30 hover:text-rose-400 bg-background/80 opacity-0 group-hover:opacity-100",
        )}
      >
        <Star size={14} fill={plant.is_favorite ? "currentColor" : "none"} />
      </button>

      <Link href={`/plants/${plant.id}`} className="block">
        <CoverPhoto coverPhotoPath={plant.cover_photo_path} className="aspect-[4/3] w-full rounded-2xl object-cover mb-4" />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-lg font-bold text-foreground truncate">{plant.name}</p>
            {plant.species && <p className="text-sm italic text-muted-foreground truncate">{plant.species}</p>}
          </div>
          <div className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
            !plant.health_status || plant.health_status === "unknown" ? "bg-muted text-muted-foreground" :
            plant.health_status === "thriving" || plant.health_status === "stable" ? "bg-primary/10 text-primary" :
            "bg-destructive/10 text-destructive"
          )}>
            {plant.health_status && plant.health_status !== "unknown" ? plant.health_status.charAt(0).toUpperCase() : "?"}
          </div>
        </div>
        {plant.location && <p className="mt-1.5 text-xs text-muted-foreground">📍 {plant.location}</p>}
        {isArchived && plant.archived_at && <p className="mt-1.5 text-xs text-muted-foreground/60">Archived · {new Date(plant.archived_at).toLocaleDateString()}</p>}
      </Link>

      <div className="mt-4 flex gap-2 pt-3 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
        {!isArchived ? (
          <>
            <span onClick={(e) => { e.preventDefault(); onEdit(plant); }} className="rounded-full bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/80">Edit</span>
            <span onClick={(e) => { e.preventDefault(); onArchive(plant.id); }} className="rounded-full bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/80"><Archive size={11} className="inline" /></span>
            <span onClick={(e) => { e.preventDefault(); if (window.confirm(`Delete ${plant.name}?`)) onDelete(plant); }} className="rounded-full bg-destructive/5 px-4 py-1.5 text-xs font-semibold text-destructive cursor-pointer hover:bg-destructive/10"><Trash2 size={11} className="inline" /></span>
          </>
        ) : (
          <>
            <span onClick={(e) => { e.preventDefault(); onRestore(plant.id); }} className="rounded-full bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/80"><ArchiveRestore size={11} className="inline" /> Restore</span>
            <span onClick={(e) => { e.preventDefault(); if (window.confirm(`Delete ${plant.name} permanently?`)) onDelete(plant); }} className="rounded-full bg-destructive/5 px-4 py-1.5 text-xs font-semibold text-destructive cursor-pointer hover:bg-destructive/10"><Trash2 size={11} className="inline" /></span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Plant form (create/edit) ──

function PlantForm({ editing, values, speciesList, saving, coverFile, onCoverChange, onChange, onCancel, onSubmit }: {
  editing: boolean;
  values: PlantFormValues;
  speciesList: PlantSpeciesRow[];
  saving: boolean;
  coverFile: File | null;
  onCoverChange: (f: File | null) => void;
  onChange: (v: PlantFormValues) => void;
  onCancel: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}) {
  const set = (p: Partial<PlantFormValues>) => onChange({ ...values, ...p });
  const [speciesQuery, setSpeciesQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [, setIdentifyError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = speciesQuery.trim().toLowerCase();
    if (!q) return [];
    return speciesList
      .filter((s) => [s.common_name, s.scientific_name ?? "", ...s.aliases].some((v) => v.toLowerCase().includes(q)))
      .slice(0, 12);
  }, [speciesList, speciesQuery]);

  async function handleIdentify(file: File) {
    setIdentifying(true);
    setIdentifyError(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const result = await identifyPlant(base64);
          if (result.error) { setIdentifyError(result.error); setIdentifying(false); return; }
          if (result.bestMatch) {
            const matched = speciesList.find((s) => s.scientific_name?.toLowerCase() === result.bestMatch!.scientificName.toLowerCase() || s.common_name.toLowerCase() === result.bestMatch!.scientificName.toLowerCase());
            set({ species: result.bestMatch.scientificName, species_id: matched?.id ?? "" });
            setSpeciesQuery("");
          }
        } catch { setIdentifyError("Failed to identify plant."); }
        setIdentifying(false);
      };
      reader.readAsDataURL(file);
    } catch { setIdentifying(false); setIdentifyError("Failed to read image."); }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-6">
      <p className="text-display text-foreground">{editing ? "Edit plant" : "New plant"}</p>

      {!editing && (
        <div>
          <label className="text-label block mb-2 text-muted-foreground">Photo (optional)</label>
          {coverFile ? (
            <div className="flex items-center gap-3">
              <img src={URL.createObjectURL(coverFile)} alt="Preview" className="h-20 w-20 rounded-2xl object-cover" />
              <button type="button" onClick={() => onCoverChange(null)} className="rounded-full bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/80">Remove</button>
            </div>
          ) : (
            <button type="button" onClick={() => document.getElementById("cover-photo-input")?.click()} className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted text-muted-foreground hover:bg-muted/80 transition cursor-pointer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
          )}
          <input id="cover-photo-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onCoverChange(f); e.target.value = ""; }} />
        </div>
      )}

      <div>
        <label className="text-label block mb-2 text-muted-foreground">Name</label>
        <Input value={values.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Monstera by the window" className="h-12 w-full rounded-full px-5 text-sm bg-muted" required autoFocus />
      </div>

      <div>
        <label className="text-label block mb-2 text-muted-foreground">Species</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input value={values.species ?? ""} onChange={(e) => { set({ species: e.target.value, species_id: "" }); setSpeciesQuery(e.target.value); setShowDropdown(true); }} onFocus={() => { if (speciesQuery || values.species) setShowDropdown(true); }} onBlur={() => setTimeout(() => setShowDropdown(false), 200)} placeholder="e.g. Monstera deliciosa" className="h-12 w-full rounded-full px-5 text-sm bg-muted" />
            {showDropdown && matches.length > 0 && (
              <div className="absolute z-10 mt-1.5 w-full rounded-2xl border border-border bg-background shadow-lg max-h-60 overflow-y-auto dark:bg-muted">
                {matches.map((s) => (
                  <button key={s.id} type="button" className="flex w-full cursor-pointer items-center gap-2 px-5 py-3 text-left text-sm transition hover:bg-muted first:rounded-t-2xl last:rounded-b-2xl"
                    onMouseDown={(e) => { e.preventDefault(); onChange({ ...values, species: s.scientific_name ?? s.common_name, species_id: s.id }); setSpeciesQuery(""); setShowDropdown(false); }}>
                    <Sprout size={14} className="shrink-0 text-primary/60" />
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">{s.common_name}</span>
                      {s.scientific_name && <span className="ml-2 italic text-muted-foreground">{s.scientific_name}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {!editing && (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={identifying} className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/80 hover:text-foreground disabled:opacity-40" title="Identify plant from photo">
              {identifying ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleIdentify(f); e.target.value = ""; }} />
      </div>

      <div>
        <label className="text-label block mb-2 text-muted-foreground">Location / Room</label>
        <Input value={values.location ?? ""} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Living room" className="h-12 w-full rounded-full px-5 text-sm bg-muted" />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving || !values.name.trim()}>{saving ? "Saving..." : editing ? "Save changes" : "Create plant"}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
