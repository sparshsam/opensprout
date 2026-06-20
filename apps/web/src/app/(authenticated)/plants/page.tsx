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
  Save,
  History,
  ChevronDown,
  Sprout,
  RefreshCw,
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

  // Load timeline when selected plant changes
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Errors are handled by the context
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
      // Refresh timeline
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

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground">
            Plants
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, edit, delete, and inspect your plants.
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus size={16} aria-hidden />
          Add plant
        </Button>
      </header>

      {(error || notice) && (
        <div
          className={cn(
            "mt-4 rounded-md border px-4 py-3 text-sm font-medium",
            error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{error ?? notice}</span>
            {error && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshDashboard}
                className="shrink-0 border-red-300 bg-white text-red-700 hover:bg-red-100"
              >
                <RefreshCw size={14} aria-hidden />
                Retry
              </Button>
            )}
          </div>
        </div>
      )}

      <section className="grid gap-5 py-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <PullToRefresh onRefresh={refreshDashboard}>
        {/* Left: plant list */}
        <div className="space-y-5">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plants"
              className="pl-9"
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
            <div className="grid gap-3 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-md" />
              ))}
            </div>
          ) : visiblePlants.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center shadow-panel">
              <Sprout
                size={48}
                className="mx-auto text-muted-foreground/40"
                aria-hidden
              />
              <h2 className="mt-4 text-lg font-bold">No plants yet</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                {query
                  ? "No plants match that search. Try a different search term."
                  : "Add your first plant to start tracking watering, fertilizing, and care."}
              </p>
              {!query && (
                <Button onClick={openCreateForm} className="mt-5">
                  <Plus size={16} aria-hidden />
                  Add your first plant
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visiblePlants.map((plant) => (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  selected={selectedPlant?.id === plant.id}
                  onSelect={() => setSelectedId(plant.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: detail + timeline */}
        <aside className="space-y-5">
          {selectedPlant ? (
            <>
              <PlantDetail
                plant={selectedPlant}
                schedules={selectedSchedules}
                careLoading={careLoading}
                onEdit={() => openEditForm(selectedPlant)}
                onDelete={() => onDelete(selectedPlant)}
                onQuickCare={onQuickCare}
              />

              {/* Timeline */}
              <div className="rounded-md border border-border bg-card p-4 shadow-panel">
                <div className="flex items-center gap-2 mb-3">
                  <History size={18} className="text-muted-foreground" aria-hidden />
                  <h2 className="text-lg font-bold">Timeline</h2>
                </div>
                {timelineLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-md" />
                    ))}
                  </div>
                ) : timeline.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border bg-white p-4 text-sm text-muted-foreground">
                    No care events yet. Mark this plant watered or fertilized to
                    start the timeline.
                  </div>
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
            </>
          ) : dataLoading ? (
            <div className="space-y-5">
              <Skeleton className="h-64 w-full rounded-md" />
              <Skeleton className="h-48 w-full rounded-md" />
            </div>
          ) : (
            <div className="rounded-md border border-border bg-card p-4 shadow-panel">
              <h2 className="text-lg font-bold">No plant selected</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Select a plant to see details and care timeline.
              </p>
            </div>
          )}
        </aside>
        </PullToRefresh>
      </section>
    </>
  );
}

// ── Sub-components ──

function PlantCard({
  plant,
  selected,
  onSelect,
}: {
  plant: PlantRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex min-h-32 gap-4 rounded-md border border-border bg-white p-3 text-left transition hover:border-primary",
        selected && "border-primary ring-2 ring-ring",
      )}
    >
      <CoverPhoto
        coverPhotoPath={plant.cover_photo_path}
        className="h-24 w-24 shrink-0 rounded-md object-cover"
      />
      <span className="min-w-0">
        <span className="block font-bold">{plant.name}</span>
        <span className="block truncate text-sm italic text-muted-foreground">
          {plant.species ?? 'Unknown species'}
        </span>
        <span className="mt-3 block text-sm text-muted-foreground">
          {plant.location ?? 'No location'}
        </span>
        <span className="mt-3 inline-flex rounded-sm bg-emerald-100 px-2 py-1 text-xs font-bold capitalize text-emerald-800">
          {plant.health_status ?? "stable"}
        </span>
      </span>
    </button>
  );
}

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
    <div className="rounded-md border border-border bg-card p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{plant.name}</h2>
          <p className="text-sm italic text-muted-foreground">
            {plant.species ?? 'Unknown species'}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label="Edit plant" onClick={onEdit}>
            <Pencil size={18} aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Delete plant" onClick={onDelete}>
            <Trash2 size={18} aria-hidden />
          </Button>
        </div>
      </div>
      <CoverPhoto
        coverPhotoPath={plant.cover_photo_path}
        className="mt-4 aspect-[4/3] w-full rounded-md"
      />

      {/* Quick care buttons */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {careTypes.slice(0, 4).map((ct) => (
          <Button
            key={ct}
            variant="outline"
            size="sm"
            onClick={() => onQuickCare(ct)}
            disabled={careLoading !== null}
            className="capitalize"
          >
            {careLoading === ct ? (
              <Loader2 className="animate-spin mr-1" size={14} aria-hidden />
            ) : ct === "water" ? (
              <Droplets size={14} className="mr-1" aria-hidden />
            ) : ct === "fertilize" ? (
              <Leaf size={14} className="mr-1" aria-hidden />
            ) : null}
            {ct}
          </Button>
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
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
      <p className="mt-4 rounded-md bg-muted p-3 text-sm leading-6 text-muted-foreground">
        {plant.notes ?? "No notes yet."}
      </p>
    </div>
  );
}

// PlantForm is unchanged from v0.2 — keeping it inline
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
    <form className="mt-4 rounded-md border border-border bg-white p-4" onSubmit={onSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        {!editing && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 md:col-span-2">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
              <label className="text-sm font-semibold text-emerald-950">
                Care Templates
                <Input className="mt-2 bg-white" value={templateQuery}
                  onChange={(e) => setTemplateQuery(e.target.value)}
                  placeholder="Search snake plant, pothos, basil..." />
              </label>
              <label className="text-sm font-semibold text-emerald-950">
                Choose a plant
                <select className="mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
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
              <div className="mt-3 grid gap-3 text-sm text-emerald-950 md:grid-cols-3">
                <p><span className="block text-xs font-bold uppercase text-emerald-700">Light</span>{selectedSpecies.light_preference ?? "No light note yet."}</p>
                <p><span className="block text-xs font-bold uppercase text-emerald-700">Water</span>{formatWaterRange(selectedSpecies)}</p>
                <p><span className="block text-xs font-bold uppercase text-emerald-700">Difficulty</span>{selectedSpecies.difficulty ?? "Not rated"}</p>
                <p className="md:col-span-3">{selectedSpecies.care_summary}</p>
              </div>
            )}
            {selectedSpecies && (
              <>
                {/* Care Recommendations */}
                <details className="mt-3 rounded-md border border-emerald-200 bg-emerald-50/50">
                  <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-semibold text-emerald-900">
                    <ChevronDown size={14} className="transition-transform" />
                    Care Recommendations
                  </summary>
                  <div className="space-y-2 px-3 pb-3">
                    {getSpeciesRecommendations(selectedSpecies).length === 0 ? (
                      <p className="text-sm text-emerald-700">No specific recommendations for this species.</p>
                    ) : (
                      getSpeciesRecommendations(selectedSpecies).map((rec, i) => (
                        <div key={i} className="rounded-md border border-emerald-200 bg-white p-3 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-emerald-900">{rec.title}</span>
                            <span className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                              rec.priority === "high" && "bg-red-100 text-red-700",
                              rec.priority === "medium" && "bg-amber-100 text-amber-700",
                              rec.priority === "low" && "bg-emerald-100 text-emerald-700",
                            )}>
                              {rec.priority}
                            </span>
                          </div>
                          <p className="mt-1 text-emerald-800">{rec.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </details>

                {/* Expanded Species Info Grid */}
                <details className="mt-2 rounded-md border border-emerald-200 bg-emerald-50/50">
                  <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-semibold text-emerald-900">
                    <ChevronDown size={14} className="transition-transform" />
                    Species Details
                  </summary>
                  <div className="grid grid-cols-2 gap-3 px-3 pb-3 text-sm text-emerald-950 md:grid-cols-3">
                    {selectedSpecies.propagation_methods?.length > 0 && (
                      <p><span className="block text-xs font-bold uppercase text-emerald-700">Propagation</span>{selectedSpecies.propagation_methods.join(", ")}</p>
                    )}
                    {selectedSpecies.pruning_notes && (
                      <p><span className="block text-xs font-bold uppercase text-emerald-700">Pruning</span>{selectedSpecies.pruning_notes}</p>
                    )}
                    {selectedSpecies.repotting_notes && (
                      <p><span className="block text-xs font-bold uppercase text-emerald-700">Repotting</span>{selectedSpecies.repotting_notes}</p>
                    )}
                    {selectedSpecies.dormancy_period && (
                      <p><span className="block text-xs font-bold uppercase text-emerald-700">Dormancy</span>{selectedSpecies.dormancy_period}</p>
                    )}
                    {selectedSpecies.bloom_time && (
                      <p><span className="block text-xs font-bold uppercase text-emerald-700">Bloom Time</span>{selectedSpecies.bloom_time}</p>
                    )}
                    {selectedSpecies.growth_rate && (
                      <p><span className="block text-xs font-bold uppercase text-emerald-700">Growth Rate</span>{selectedSpecies.growth_rate}</p>
                    )}
                    {selectedSpecies.mature_height && (
                      <p><span className="block text-xs font-bold uppercase text-emerald-700">Mature Height</span>{selectedSpecies.mature_height}</p>
                    )}
                    {selectedSpecies.native_region && (
                      <p><span className="block text-xs font-bold uppercase text-emerald-700">Native Region</span>{selectedSpecies.native_region}</p>
                    )}
                  </div>
                </details>
              </>
            )}
          </div>
        )}
        <label className="text-sm font-semibold">Name
          <Input className="mt-2" required value={values.name} onChange={(e) => onChange({ ...values, name: e.target.value })} placeholder="Monstera by the window" />
        </label>
        <label className="text-sm font-semibold">Species
          <Input className="mt-2" value={values.species ?? ""} onChange={(e) => onChange({ ...values, species_id: "", species: e.target.value })} placeholder="Monstera deliciosa" />
        </label>
        <label className="text-sm font-semibold">Location
          <Input className="mt-2" value={values.location ?? ""} onChange={(e) => onChange({ ...values, location: e.target.value })} placeholder="Living room" />
        </label>
        <label className="text-sm font-semibold">Health
          <select className="mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
            value={values.health_status ?? "stable"}
            onChange={(e) => onChange({ ...values, health_status: e.target.value as HealthStatus })}>
            {healthOptions.map((o) => (<option key={o} value={o}>{o}</option>))}
          </select>
        </label>
        {!editing && (
          <>
            <label className="text-sm font-semibold">Water every days
              <Input className="mt-2" type="number" min={1} value={values.water_every_days ?? ""}
                onChange={(e) => onChange({ ...values, water_every_days: Number(e.target.value) || undefined })} />
            </label>
            <label className="text-sm font-semibold">Fertilize every days
              <Input className="mt-2" type="number" min={1} value={values.fertilize_every_days ?? ""}
                onChange={(e) => onChange({ ...values, fertilize_every_days: Number(e.target.value) || undefined })} />
            </label>
          </>
        )}
      </div>
      <label className="mt-3 block text-sm font-semibold">Notes
        <textarea className="mt-2 min-h-24 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
          value={values.notes ?? ""} onChange={(e) => onChange({ ...values, notes: e.target.value })}
          placeholder="Care notes, soil mix, light preference..." />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={16} aria-hidden /> : <Save size={16} aria-hidden />}
          {editing ? "Save plant" : "Create plant"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// ── Helpers ──

function scheduleCadence(schedules: CareScheduleRow[], careType: CareType) {
  return schedules.find((s) => s.care_type === careType)?.cadence_value;
}

function suggestedWaterDays(species: PlantSpeciesRow) {
  if (species.watering_min_days && species.watering_max_days) return Math.round((species.watering_min_days + species.watering_max_days) / 2);
  return species.watering_min_days ?? species.watering_max_days;
}

function formatWaterRange(species: PlantSpeciesRow) {
  if (species.watering_min_days && species.watering_max_days) return `${species.watering_min_days}-${species.watering_max_days} days`;
  const days = species.watering_min_days ?? species.watering_max_days;
  return days ? `About every ${days} days` : "No watering template yet.";
}

function formatSchedule(schedules: CareScheduleRow[], careType: CareType) {
  const schedule = schedules.find((s) => s.care_type === careType);
  return schedule ? formatDueDate(schedule.next_due_at) : "No schedule";
}
