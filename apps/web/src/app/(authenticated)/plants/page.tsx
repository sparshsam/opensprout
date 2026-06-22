"use client";

import { useState, useMemo, useEffect, type FormEvent } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Droplets,
  Leaf,
  Loader2,
  History,
  ChevronDown,
  Sprout,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDueDate } from "@/lib/data/care";
import type {
  CareScheduleRow,
  CareType,
  HealthStatus,
  PlantRow,
  PlantSpeciesRow,
} from "@/lib/data/types";
import type { PlantFormValues } from "@/lib/data/plants";
import type { TimelineEvent } from "@/lib/data/tasks";
import { listPlantTimeline } from "@/lib/data/tasks";
import { TimelineItem } from "@/components/cards/timeline-item";
import { getSpeciesRecommendations } from "@/lib/data/recommendations";
import { CoverPhoto } from "@/components/cards/cover-photo";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Skeleton } from "@/components/ui/skeleton";

const careTypes: CareType[] = [
  "water", "fertilize", "mist", "rotate", "prune", "repot", "inspect", "custom",
];

const healthOptions: HealthStatus[] = [
  "thriving", "stable", "watch", "struggling", "unknown",
];

const emptyForm: PlantFormValues = {
  name: "",
  species_id: "",
  species: "",
  location: "",
  notes: "",
  health_status: "stable",
  water_every_days: 7,
  fertilize_every_days: 30,
};

export default function PlantsPage() {
  const {
    supabase,
    user,
    data,
    speciesList,
    dataLoading,
    error,
    notice,
    setError,
    handleCreatePlant,
    handleUpdatePlant,
    handleDeletePlant,
    handleMarkCare,
    refreshDashboard,
  } = useApp();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<PlantRow | null>(null);
  const [formValues, setFormValues] = useState<PlantFormValues>(emptyForm);
  const [savingPlant, setSavingPlant] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [careLoading, setCareLoading] = useState<string | null>(null);

  const selectedPlant =
    data.plants.find((p) => p.id === selectedId) ?? data.plants[0] ?? null;
  const selectedSchedules = selectedPlant
    ? data.schedules.filter((s) => s.plant_id === selectedPlant.id)
    : [];

  const visiblePlants = useMemo(
    () =>
      data.plants.filter((plant) =>
        `${plant.name} ${plant.species ?? ""} ${plant.location ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [data.plants, query],
  );

  useEffect(() => {
    if (!selectedPlant || !supabase || !user) return;
    let mounted = true;
    setTimelineLoading(true);
    const client = supabase;
    if (!client) return;
    listPlantTimeline(client, user.id, selectedPlant.id)
      .then((events) => { if (mounted) setTimeline(events); })
      .catch(() => { if (mounted) setTimeline([]); })
      .finally(() => { if (mounted) setTimelineLoading(false); });
    return () => { mounted = false; };
  }, [selectedPlant?.id, supabase, user]);

  function openCreateForm() {
    setEditingPlant(null);
    setFormValues(emptyForm);
    setShowForm(true);
  }

  function openEditForm(plant: PlantRow) {
    const schedules = data.schedules.filter((s) => s.plant_id === plant.id);
    setEditingPlant(plant);
    setFormValues({
      name: plant.name,
      species_id: plant.species_id ?? "",
      species: plant.species ?? "",
      location: plant.location ?? "",
      notes: plant.notes ?? "",
      health_status: plant.health_status ?? "stable",
      water_every_days: scheduleCadence(schedules, "water") ?? 7,
      fertilize_every_days: scheduleCadence(schedules, "fertilize") ?? 30,
    });
    setShowForm(true);
  }

  async function handleSavePlant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formValues.name.trim()) return;
    setSavingPlant(true);
    setError(null);
    try {
      if (editingPlant) {
        await handleUpdatePlant(editingPlant.id, formValues);
      } else {
        const created = await handleCreatePlant(formValues);
        setSelectedId(created.id);
      }
      setShowForm(false);
      setEditingPlant(null);
    } catch {
      // Errors handled by context
    } finally {
      setSavingPlant(false);
    }
  }

  async function onDelete(plant: PlantRow) {
    const confirmed = window.confirm(
      `Delete ${plant.name}? This removes its schedules, logs, and journal entries.`,
    );
    if (!confirmed) return;
    await handleDeletePlant(plant);
    if (selectedId === plant.id) setSelectedId(null);
  }

  async function onQuickCare(careType: CareType) {
    if (!selectedPlant) return;
    setCareLoading(careType);
    try {
      await handleMarkCare(selectedPlant.id, careType, selectedPlant.name);
      if (supabase && user) {
        const client = supabase;
        if (client) {
          const events = await listPlantTimeline(client, user.id, selectedPlant.id);
          setTimeline(events);
        }
      }
    } finally {
      setCareLoading(null);
    }
  }

  // Compute next task for each plant
  function getPlantNextTask(plantId: string): { careType: string; dueAt: string } | null {
    const schedule = data.schedules.find(
      (s) => s.plant_id === plantId && s.active,
    );
    if (!schedule || !schedule.next_due_at) return null;
    return { careType: schedule.care_type, dueAt: schedule.next_due_at };
  }

  return (
    <>
      <header className="pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Plants</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Your plant collection, all in one place.
            </p>
          </div>
          <Button onClick={openCreateForm} className="rounded-xl px-5 py-2.5 text-base">
            <Plus size={18} aria-hidden />
            Add plant
          </Button>
        </div>
      </header>

      {(error || notice) && (
        <div className={cn("mb-6 rounded-2xl border px-5 py-4 text-base font-medium", error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800")}>
          <div className="flex items-center justify-between gap-3">
            <span>{error ?? notice}</span>
            {error && (
              <Button variant="outline" size="sm" onClick={refreshDashboard} className="shrink-0 rounded-xl border-red-300 bg-white text-red-700 hover:bg-red-100">
                <RefreshCw size={14} aria-hidden /> Retry
              </Button>
            )}
          </div>
        </div>
      )}

      <section className="space-y-6 lg:grid lg:grid-cols-[1fr_400px] lg:gap-8 lg:space-y-0">
        <PullToRefresh onRefresh={refreshDashboard}>
          <div className="space-y-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search plants"
                className="h-12 rounded-2xl pl-11 text-base"
              />
            </label>

            {showForm && (
              <PlantForm
                editing={Boolean(editingPlant)}
                values={formValues}
                speciesList={speciesList}
                saving={savingPlant}
                onChange={setFormValues}
                onCancel={() => { setShowForm(false); setEditingPlant(null); }}
                onSubmit={handleSavePlant}
              />
            )}

            {dataLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-3xl" />
                ))}
              </div>
            ) : visiblePlants.length === 0 ? (
              <div className="rounded-3xl bg-white px-8 pb-10 pt-12 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-md">
                  <Sprout size={28} className="text-primary-foreground" aria-hidden />
                </div>
                <h2 className="mt-5 text-2xl font-bold">No plants yet</h2>
                <p className="mx-auto mt-2 max-w-sm text-base text-muted-foreground">
                  {query
                    ? "No plants match that search."
                    : "Add your first plant to start tracking care."}
                </p>
                {!query && (
                  <Button onClick={openCreateForm} className="mt-6 rounded-xl px-6 py-3 text-base">
                    <Plus size={18} aria-hidden />
                    Add your first plant
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {visiblePlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    nextTask={getPlantNextTask(plant.id)}
                    selected={selectedPlant?.id === plant.id}
                    onSelect={() => setSelectedId(plant.id)}
                    onEdit={() => openEditForm(plant)}
                    onDelete={() => onDelete(plant)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <aside className="hidden lg:block">
            {selectedPlant ? (
              <div className="space-y-5 sticky top-24">
                <PlantDetail
                  plant={selectedPlant}
                  schedules={selectedSchedules}
                  careLoading={careLoading}
                  onEdit={() => openEditForm(selectedPlant)}
                  onDelete={() => onDelete(selectedPlant)}
                  onQuickCare={onQuickCare}
                />
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <History size={18} className="text-muted-foreground" aria-hidden />
                    <h2 className="text-lg font-bold">Timeline</h2>
                  </div>
                  {timelineLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : timeline.length === 0 ? (
                    <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                      No care events yet. Mark this plant watered or fertilized to start the timeline.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {timeline.map((event) => (
                        <TimelineItem
                          key={event.id}
                          type={event.type}
                          careType={event.careType}
                          occurredAt={event.occurredAt}
                          notes={event.notes}
                          amount_ml={event.amount_ml}
                          fertilizer_name={event.fertilizer_name}
                          title={event.title}
                          body={event.body}
                          health_score={event.health_score}
                          tags={event.tags}
                          object_path={event.object_path}
                          photoCount={event.photoCount}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : dataLoading ? (
              <div className="space-y-5">
                <Skeleton className="h-72 w-full rounded-3xl" />
                <Skeleton className="h-48 w-full rounded-3xl" />
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <p className="text-lg font-semibold text-muted-foreground">
                  Select a plant to see details
                </p>
              </div>
            )}
          </aside>
        </PullToRefresh>
      </section>
    </>
  );
}

// ── Plant Card (visual) ──

function PlantCard({
  plant,
  nextTask,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  plant: PlantRow;
  nextTask: { careType: string; dueAt: string } | null;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative flex gap-5 rounded-3xl bg-white p-5 text-left shadow-sm transition hover:shadow-md active:scale-[0.99]",
        selected && "ring-2 ring-primary",
      )}
    >
      {/* Photo */}
      <CoverPhoto
        coverPhotoPath={plant.cover_photo_path}
        className="h-28 w-28 shrink-0 rounded-2xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-lg font-bold">{plant.name}</p>
            {plant.species && (
              <p className="text-sm italic text-muted-foreground">{plant.species}</p>
            )}
          </div>
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold",
            plant.health_status === "thriving" || plant.health_status === "stable"
              ? "bg-green-100 text-green-700"
              : plant.health_status === "watch" || plant.health_status === "struggling"
              ? "bg-amber-100 text-amber-700"
              : "bg-muted text-muted-foreground",
          )}>
            {plant.health_status ? plant.health_status.charAt(0).toUpperCase() : "?"}
          </div>
        </div>

        {plant.location && (
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin size={14} aria-hidden />
            {plant.location}
          </p>
        )}

        {nextTask && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary">
            <Droplets size={14} aria-hidden />
          {nextTask.careType} • {formatDueDate(nextTask.dueAt)}
          </p>
        )}

        {/* Edit/delete on hover */}
        <div className="mt-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted-foreground/20"
            aria-label="Edit plant"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
            aria-label="Delete plant"
          >
            Delete
          </button>
        </div>
      </div>
    </button>
  );
}

// ── Plant Detail (desktop side panel) ──

function PlantDetail({
  plant,
  schedules,
  careLoading,
  onEdit,
  onDelete,
  onQuickCare,
}: {
  plant: PlantRow;
  schedules: CareScheduleRow[];
  careLoading: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onQuickCare: (careType: CareType) => void;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{plant.name}</h2>
          <p className="text-sm italic text-muted-foreground">
            {plant.species ?? "Unknown species"}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label="Edit" onClick={onEdit}>
            <Pencil size={18} aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Delete" onClick={onDelete}>
            <Trash2 size={18} aria-hidden />
          </Button>
        </div>
      </div>

      <CoverPhoto
        coverPhotoPath={plant.cover_photo_path}
        className="mt-5 aspect-[4/3] w-full rounded-2xl"
      />

      {/* Quick care */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {careTypes.slice(0, 4).map((ct) => (
          <Button
            key={ct}
            variant="outline"
            size="sm"
            onClick={() => onQuickCare(ct)}
            disabled={careLoading !== null}
            className="rounded-xl capitalize"
          >
            {careLoading === ct ? <Loader2 className="animate-spin mr-1" size={14} /> : ct === "water" ? <Droplets size={14} className="mr-1" /> : ct === "fertilize" ? <Leaf size={14} className="mr-1" /> : null}
            {ct}
          </Button>
        ))}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="font-semibold text-muted-foreground">Location</dt>
          <dd>{plant.location ?? "Not set"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted-foreground">Status</dt>
          <dd className="capitalize">{plant.health_status ?? "stable"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted-foreground">Water</dt>
          <dd>{formatSchedule(schedules, "water")}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted-foreground">Fertilize</dt>
          <dd>{formatSchedule(schedules, "fertilize")}</dd>
        </div>
      </dl>
      {plant.notes && (
        <p className="mt-4 rounded-xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
          {plant.notes}
        </p>
      )}
    </div>
  );
}

// ── PlantForm (unchanged functionally) ──

function PlantForm({
  editing,
  values,
  speciesList,
  saving,
  onChange,
  onCancel,
  onSubmit,
}: {
  editing: boolean;
  values: PlantFormValues;
  speciesList: PlantSpeciesRow[];
  saving: boolean;
  onChange: (values: PlantFormValues) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [templateQuery, setTemplateQuery] = useState("");
  const selectedSpecies = speciesList.find((s) => s.id === values.species_id) ?? null;
  const visibleSpecies = speciesList.filter((species) => {
    const q = templateQuery.trim().toLowerCase();
    if (!q) return true;
    return [species.common_name, species.scientific_name ?? "", ...species.aliases].some(
      (v) => v.toLowerCase().includes(q),
    );
  });

  function applySpeciesTemplate(speciesId: string) {
    const species = speciesList.find((s) => s.id === speciesId);
    if (!species) { onChange({ ...values, species_id: "", species: "" }); return; }
    onChange({
      ...values,
      name: values.name || species.common_name,
      species_id: species.id,
      species: species.scientific_name ?? species.common_name,
      water_every_days: suggestedWaterDays(species) ?? values.water_every_days,
      fertilize_every_days: species.fertilizing_frequency_days ?? values.fertilize_every_days,
    });
  }

  return (
    <form className="rounded-3xl bg-white p-6 shadow-sm" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        {!editing && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:col-span-2">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <label className="text-sm font-semibold text-emerald-950">
                Care Templates
                <Input className="mt-2 rounded-xl bg-white" value={templateQuery}
                  onChange={(e) => setTemplateQuery(e.target.value)}
                  placeholder="Search snake plant, pothos, basil..." />
              </label>
              <label className="text-sm font-semibold text-emerald-950">
                Choose a plant
                <select className="mt-2 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                  value={values.species_id ?? ""}
                  onChange={(e) => applySpeciesTemplate(e.target.value)}>
                  <option value="">Custom or unknown plant</option>
                  {visibleSpecies.map((s) => (
                    <option key={s.id} value={s.id}>{s.common_name}{s.scientific_name ? ` (${s.scientific_name})` : ""}</option>
                  ))}
                </select>
              </label>
            </div>
            {selectedSpecies && (
              <div className="mt-4 grid gap-3 text-sm text-emerald-950 md:grid-cols-3">
                <p><span className="block text-xs font-bold uppercase text-emerald-700">Light</span>{selectedSpecies.light_preference ?? "No light note yet."}</p>
                <p><span className="block text-xs font-bold uppercase text-emerald-700">Water</span>{formatWaterRange(selectedSpecies)}</p>
                <p><span className="block text-xs font-bold uppercase text-emerald-700">Difficulty</span>{selectedSpecies.difficulty ?? "Not rated"}</p>
                <p className="md:col-span-3">{selectedSpecies.care_summary}</p>
              </div>
            )}
            {selectedSpecies && (
              <details className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-semibold text-emerald-900">
                  <ChevronDown size={14} className="transition-transform" />
                  Care Recommendations
                </summary>
                <div className="space-y-2 px-3 pb-3">
                  {getSpeciesRecommendations(selectedSpecies).length === 0 ? (
                    <p className="text-sm text-emerald-700">No specific recommendations for this species.</p>
                  ) : (
                    getSpeciesRecommendations(selectedSpecies).map((rec, i) => (
                      <div key={i} className="rounded-xl border border-emerald-200 bg-white p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-emerald-900">{rec.title}</span>
                          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", rec.priority === "high" && "bg-red-100 text-red-700", rec.priority === "medium" && "bg-amber-100 text-amber-700", rec.priority === "low" && "bg-emerald-100 text-emerald-700")}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-emerald-800">{rec.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </details>
            )}
          </div>
        )}

        <label className="text-sm font-semibold block">
          Plant name
          <Input className="mt-1 rounded-xl text-base" required value={values.name} onChange={(e) => onChange({ ...values, name: e.target.value })} placeholder="e.g. My Monstera" />
        </label>
        <label className="text-sm font-semibold block">
          Location
          <Input className="mt-1 rounded-xl text-base" value={values.location ?? ""} onChange={(e) => onChange({ ...values, location: e.target.value })} placeholder="e.g. Living room" />
        </label>
        <label className="text-sm font-semibold block">
          Water every (days)
          <Input className="mt-1 rounded-xl text-base" type="number" min={1} value={values.water_every_days} onChange={(e) => onChange({ ...values, water_every_days: Number(e.target.value) })} />
        </label>
        <label className="text-sm font-semibold block">
          Fertilize every (days)
          <Input className="mt-1 rounded-xl text-base" type="number" min={0} value={values.fertilize_every_days} onChange={(e) => onChange({ ...values, fertilize_every_days: Number(e.target.value) })} />
        </label>
        <label className="text-sm font-semibold block md:col-span-2">
          Notes
          <textarea className="mt-1 min-h-20 w-full rounded-xl border border-input bg-white px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring" value={values.notes ?? ""} onChange={(e) => onChange({ ...values, notes: e.target.value })} placeholder="Any care notes..." />
        </label>
        <label className="text-sm font-semibold block">
          Health status
          <select className="mt-2 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring" value={values.health_status ?? "stable"} onChange={(e) => onChange({ ...values, health_status: e.target.value as HealthStatus })}>
            {healthOptions.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-3 md:col-span-2">
          <Button type="submit" disabled={saving} className="rounded-xl px-6 py-2.5 text-base">
            {saving ? <Loader2 className="animate-spin" size={16} aria-hidden /> : null}
            {editing ? "Save changes" : "Add plant"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl px-6 py-2.5 text-base">
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

// ── Helpers ──

function scheduleCadence(schedules: CareScheduleRow[], type: CareType): number | null {
  const s = schedules.find((s) => s.care_type === type && s.active);
  if (!s) return null;
  return s.cadence_value;
}

function formatSchedule(schedules: CareScheduleRow[], type: CareType): string {
  const s = schedules.find((s) => s.care_type === type && s.active);
  if (!s) return "Not set";
  return `Every ${s.cadence_value} ${s.cadence_unit}${s.cadence_value > 1 ? "s" : ""}`;
}

function formatWaterRange(species: PlantSpeciesRow): string {
  if (species.watering_min_days && species.watering_max_days) {
    return `Every ${species.watering_min_days}-${species.watering_max_days} days`;
  }
  if (species.watering_min_days) return `Every ${species.watering_min_days} days`;
  return "Not specified";
}

function suggestedWaterDays(species: PlantSpeciesRow): number | null {
  if (species.watering_min_days && species.watering_max_days) {
    return Math.round((species.watering_min_days + species.watering_max_days) / 2);
  }
  return species.watering_min_days ?? null;
}
