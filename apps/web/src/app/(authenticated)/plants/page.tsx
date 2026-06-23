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
  Sprout,
  MapPin,
  ArrowRight,
  Heart,
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

  function getPlantNextTask(plantId: string): { careType: string; dueAt: string } | null {
    const schedule = data.schedules.find(
      (s) => s.plant_id === plantId && s.active,
    );
    if (!schedule || !schedule.next_due_at) return null;
    return { careType: schedule.care_type, dueAt: schedule.next_due_at };
  }

  return (
    <>
      {/* ── Status ── */}
      {(error || notice) && (
        <div className={cn(
          "mb-10 rounded-full px-6 py-3 text-sm font-semibold",
          error ? "bg-destructive/10 text-destructive" : "bg-primary-light text-primary",
        )}>
          <span>{error ?? notice}</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-12 flex items-center justify-between">
        <div>
          <p className="text-label mb-2 text-primary">Collection</p>
          <h1 className="text-hero text-foreground">Plants</h1>
        </div>
        <button
          onClick={openCreateForm}
          className="rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
        >
          <Plus size={16} className="inline" aria-hidden /> Add plant
        </button>
      </div>

      {/* ── Search ── */}
      <div className="mb-10">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plants"
            className="h-12 w-full rounded-full pl-10 text-sm bg-muted"
          />
        </div>
      </div>

      {/* ── Create/Edit form ── */}
      {showForm && (
        <section className="mb-12 border-t border-border pt-8">
          <PlantForm
            editing={Boolean(editingPlant)}
            values={formValues}
            speciesList={speciesList}
            saving={savingPlant}
            onChange={setFormValues}
            onCancel={() => { setShowForm(false); setEditingPlant(null); }}
            onSubmit={handleSavePlant}
          />
        </section>
      )}

      <PullToRefresh onRefresh={refreshDashboard}>
        <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-10">
          {/* ── Plant list ── */}
          <div>
            {dataLoading && visiblePlants.length === 0 ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-full" />
                ))}
              </div>
            ) : visiblePlants.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xl font-bold text-foreground">
                  {query ? "No plants match that search." : "No plants yet"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  {query
                    ? "Try a different search term."
                    : "Add your first plant to start tracking care."}
                </p>
                {!query && (
                  <button
                    onClick={openCreateForm}
                    className="mt-8 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                  >
                    <Plus size={16} className="inline" aria-hidden /> Add your first plant
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {visiblePlants.map((plant) => (
                  <PlantRow
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

          {/* ── Detail panel (desktop) ── */}
          <aside className="hidden lg:block">
            {selectedPlant ? (
              <div className="sticky top-20">
                <PlantDetail
                  plant={selectedPlant}
                  schedules={selectedSchedules}
                  timeline={timeline}
                  timelineLoading={timelineLoading}
                  careLoading={careLoading}
                  onEdit={() => openEditForm(selectedPlant)}
                  onDelete={() => onDelete(selectedPlant)}
                  onQuickCare={onQuickCare}
                />
              </div>
            ) : dataLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Select a plant to see details
                </p>
              </div>
            )}
          </aside>
        </div>
      </PullToRefresh>
    </>
  );
}

// ── Plant row ──

function PlantRow({ plant, nextTask, selected, onSelect, onEdit, onDelete }: {
  plant: PlantRow; nextTask: { careType: string; dueAt: string } | null; selected: boolean; onSelect: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 rounded-full px-6 py-3.5 text-left transition hover:bg-muted/70 active:scale-[0.99]",
        selected && "bg-muted",
      )}
    >
      <CoverPhoto
        coverPhotoPath={plant.cover_photo_path}
        className="h-12 w-12 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{plant.name}</p>
        <p className="text-xs text-muted-foreground">
          {plant.species ?? "Unknown"}
          {plant.location && ` · ${plant.location}`}
        </p>
      </div>
      {nextTask && (
        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold tracking-wider uppercase text-primary">
          {nextTask.careType}
        </span>
      )}
      <div className="hidden shrink-0 items-center gap-2 group-hover:flex sm:flex">
        <span onClick={(e) => { e.stopPropagation(); onEdit(); }} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted-foreground/20">
          Edit
        </span>
        <span onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded-full bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive cursor-pointer hover:bg-destructive/10">
          Delete
        </span>
      </div>
    </button>
  );
}

// ── Plant Detail ──

function PlantDetail({ plant, schedules, timeline, timelineLoading, careLoading, onEdit, onDelete, onQuickCare }: {
  plant: PlantRow; schedules: CareScheduleRow[]; timeline: TimelineEvent[]; timelineLoading: boolean; careLoading: string | null; onEdit: () => void; onDelete: () => void; onQuickCare: (careType: CareType) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Photo */}
      <CoverPhoto
        coverPhotoPath={plant.cover_photo_path}
        className="aspect-[4/3] w-full rounded-2xl object-cover"
      />

      {/* Name + actions */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-display text-foreground">{plant.name}</p>
            {plant.species && (
              <p className="mt-1 text-sm italic text-muted-foreground">{plant.species}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="rounded-full bg-muted px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/80">
              <Pencil size={14} className="inline" aria-hidden /> Edit
            </button>
            <button onClick={onDelete} className="rounded-full bg-destructive/5 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10">
              <Trash2 size={14} className="inline" aria-hidden /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Quick care */}
      <div>
        <p className="text-label mb-4 text-muted-foreground">Quick care</p>
        <div className="flex flex-wrap gap-2">
          {careTypes.slice(0, 4).map((ct) => (
            <button
              key={ct}
              onClick={() => onQuickCare(ct)}
              disabled={careLoading !== null}
              className="rounded-full bg-muted px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80 disabled:opacity-40"
            >
              {careLoading === ct ? <Loader2 className="animate-spin inline" size={12} /> : null}
              {ct}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule strip */}
      <div className="border-t border-border pt-6">
        <p className="text-label mb-4 text-muted-foreground">Schedule</p>
        {schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No care schedule set.</p>
        ) : (
          <div className="space-y-3">
            {schedules.filter((s) => s.active).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold capitalize text-foreground">{s.care_type}</span>
                <span className="text-xs text-muted-foreground">
                  {s.next_due_at ? `Due ${formatDueDate(s.next_due_at)}` : "No upcoming"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {plant.notes && (
        <div className="border-t border-border pt-6">
          <p className="text-label mb-3 text-muted-foreground">Notes</p>
          <p className="text-sm leading-relaxed text-foreground">{plant.notes}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="border-t border-border pt-6">
        <p className="text-label mb-4 text-muted-foreground">Timeline</p>
        {timelineLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-full" />
            ))}
          </div>
        ) : timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">No care events yet.</p>
        ) : (
          <div className="space-y-2">
            {timeline.slice(0, 8).map((event) => (
              <div key={event.id} className="flex items-center gap-3 rounded-full bg-muted/50 px-5 py-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Droplets size={12} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground capitalize">
                    {event.careType ?? event.type}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {event.occurredAt.slice(0, 10)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Plant Form ──

function PlantForm({ editing, values, speciesList, saving, onChange, onCancel, onSubmit }: {
  editing: boolean; values: PlantFormValues; speciesList: PlantSpeciesRow[]; saving: boolean;
  onChange: (v: PlantFormValues) => void; onCancel: () => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const set = (partial: Partial<PlantFormValues>) => onChange({ ...values, ...partial });

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-6">
      <p className="text-display text-foreground">{editing ? "Edit plant" : "New plant"}</p>
      <div>
        <label className="text-label block mb-2 text-muted-foreground">Name</label>
        <Input
          value={values.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Monstera Deliciosa"
          className="h-12 w-full rounded-full px-5 text-sm bg-muted"
          required
          autoFocus
        />
      </div>
      <div>
        <label className="text-label block mb-2 text-muted-foreground">Species</label>
        <Input
          value={values.species ?? ""}
          onChange={(e) => set({ species: e.target.value })}
          placeholder="e.g. Monstera deliciosa"
          className="h-12 w-full rounded-full px-5 text-sm bg-muted"
        />
      </div>
      <div>
        <label className="text-label block mb-2 text-muted-foreground">Location</label>
        <Input
          value={values.location ?? ""}
          onChange={(e) => set({ location: e.target.value })}
          placeholder="e.g. Living room"
          className="h-12 w-full rounded-full px-5 text-sm bg-muted"
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={saving || !values.name.trim()}>
          {saving ? "Saving..." : editing ? "Save changes" : "Create plant"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// ── Helpers ──

function scheduleCadence(schedules: CareScheduleRow[], type: CareType): number | null {
  const schedule = schedules.find((s) => s.active && s.care_type === type);
  if (!schedule) return null;
  // Convert cadence_value to days based on unit
  if (schedule.cadence_unit === "day") return schedule.cadence_value;
  if (schedule.cadence_unit === "week") return schedule.cadence_value * 7;
  if (schedule.cadence_unit === "month") return schedule.cadence_value * 30;
  return schedule.cadence_value;
}
