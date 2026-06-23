"use client";

import { useState, useMemo, useEffect, type FormEvent } from "react";
import { useApp } from "@/lib/context/app-context";
import { useAtmosphere } from "@/lib/hooks/use-atmosphere";
import { Plus, Search, Pencil, Trash2, Droplets, Loader2, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDueDate } from "@/lib/data/care";
import type { CareScheduleRow, CareType, HealthStatus, PlantRow, PlantSpeciesRow } from "@/lib/data/types";
import type { PlantFormValues } from "@/lib/data/plants";
import type { TimelineEvent } from "@/lib/data/tasks";
import { listPlantTimeline } from "@/lib/data/tasks";
import { CoverPhoto } from "@/components/cards/cover-photo";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Skeleton } from "@/components/ui/skeleton";

const healthOptions: HealthStatus[] = ["thriving", "stable", "watch", "struggling", "unknown"];
const emptyForm: PlantFormValues = { name: "", species_id: "", species: "", location: "", notes: "", health_status: "stable", water_every_days: 7, fertilize_every_days: 30 };

export default function PlantsPage() {
  const { supabase, user, data, speciesList, dataLoading, error, notice, setError, handleCreatePlant, handleUpdatePlant, handleDeletePlant, handleMarkCare, refreshDashboard } = useApp();
  const { greeting } = useAtmosphere();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<PlantRow | null>(null);
  const [form, setForm] = useState<PlantFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [tlLoading, setTlLoading] = useState(false);
  const [careLoading, setCareLoading] = useState<string | null>(null);

  const selectedPlant = data.plants.find((p) => p.id === selectedId) ?? data.plants[0] ?? null;
  const selectedSchedules = selectedPlant ? data.schedules.filter((s) => s.plant_id === selectedPlant.id) : [];

  const visible = useMemo(() => data.plants.filter((p) => `${p.name} ${p.species ?? ""} ${p.location ?? ""}`.toLowerCase().includes(query.toLowerCase())), [data.plants, query]);

  useEffect(() => {
    if (!selectedPlant || !supabase || !user) return;
    let m = true; setTlLoading(true);
    const c = supabase; if (!c) return;
    listPlantTimeline(c, user.id, selectedPlant.id).then((e) => { if (m) setTimeline(e); }).catch(() => { if (m) setTimeline([]); }).finally(() => { if (m) setTlLoading(false); });
    return () => { m = false; };
  }, [selectedPlant?.id, supabase, user]);

  function openCreate() { setEditingPlant(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(p: PlantRow) {
    const s = data.schedules.filter((s) => s.plant_id === p.id);
    setEditingPlant(p); setForm({ name: p.name, species_id: p.species_id ?? "", species: p.species ?? "", location: p.location ?? "", notes: p.notes ?? "", health_status: p.health_status ?? "stable", water_every_days: cadence(s, "water") ?? 7, fertilize_every_days: cadence(s, "fertilize") ?? 30 }); setShowForm(true);
  }
  async function handleSave(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (!form.name.trim()) return; setSaving(true); setError(null); try { if (editingPlant) { await handleUpdatePlant(editingPlant.id, form); } else { const c = await handleCreatePlant(form); setSelectedId(c.id); } setShowForm(false); setEditingPlant(null); } catch {} finally { setSaving(false); } }
  async function onDelete(p: PlantRow) { if (!window.confirm(`Delete ${p.name}?`)) return; await handleDeletePlant(p); if (selectedId === p.id) setSelectedId(null); }
  async function onQuickCare(ct: CareType) { if (!selectedPlant) return; setCareLoading(ct); try { await handleMarkCare(selectedPlant.id, ct, selectedPlant.name); if (supabase && user) { const c = supabase; if (c) { const e = await listPlantTimeline(c, user.id, selectedPlant.id); setTimeline(e); } } } finally { setCareLoading(null); } }
  function nextTask(id: string) { const s = data.schedules.find((s) => s.plant_id === id && s.active); if (!s || !s.next_due_at) return null; return { careType: s.care_type, dueAt: s.next_due_at }; }

  return (
    <>
      {(error || notice) && (<div className={cn("mb-10 rounded-full px-6 py-3 text-sm font-semibold", error ? "bg-destructive/10 text-destructive" : "bg-primary-light text-primary")}><span>{error ?? notice}</span></div>)}

      <div className="mb-14 flex items-center justify-between">
        <div>
          <p className="text-label mb-2 text-primary">{greeting}</p>
          <h1 className="text-hero text-foreground">Plants</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">{data.plants.length} plant{data.plants.length !== 1 ? "s" : ""} in your collection</p>
        </div>
        <button onClick={openCreate} className="rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110"><Plus size={16} className="inline" /> Add plant</button>
      </div>

      <div className="relative max-w-sm mb-10">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search plants" className="h-12 w-full rounded-full pl-10 text-sm bg-muted" />
      </div>

      {showForm && (<section className="mb-14 border-t border-border pt-8"><PlantForm editing={Boolean(editingPlant)} values={form} speciesList={speciesList} saving={saving} onChange={setForm} onCancel={() => { setShowForm(false); setEditingPlant(null); }} onSubmit={handleSave} /></section>)}

      <PullToRefresh onRefresh={refreshDashboard}>
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-12">
          <div>
            {dataLoading && visible.length === 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52 rounded-3xl" />)}</div>
            ) : visible.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-xl font-bold text-foreground">{query ? "No plants match that search." : "No plants yet"}</p>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{query ? "Try a different search." : "Add your first plant to start."}</p>
                {!query && <button onClick={openCreate} className="mt-8 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110"><Plus size={16} className="inline" /> Add your first plant</button>}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {visible.map((plant) => (
                  <div key={plant.id} onClick={() => setSelectedId(plant.id)} className={cn("group cursor-pointer rounded-3xl border border-border/40 bg-white p-6 transition hover:shadow-sm", selectedPlant?.id === plant.id && "border-primary/30")}>
                    <CoverPhoto coverPhotoPath={plant.cover_photo_path} className="aspect-[4/3] w-full rounded-2xl object-cover mb-5" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-foreground">{plant.name}</p>
                        {plant.species && <p className="text-sm italic text-muted-foreground">{plant.species}</p>}
                      </div>
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", plant.health_status === "thriving" || plant.health_status === "stable" ? "bg-primary/10 text-primary" : plant.health_status === "watch" || plant.health_status === "struggling" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
                        {plant.health_status ? plant.health_status.charAt(0).toUpperCase() : "?"}
                      </div>
                    </div>
                    {plant.location && <p className="mt-2 text-xs text-muted-foreground">{plant.location}</p>}
                    {nextTask(plant.id) && <p className="mt-3 rounded-full bg-primary/10 px-3 py-1 inline-block text-xs font-bold tracking-wider uppercase text-primary">{nextTask(plant.id)!.careType}</p>}
                    <div className="mt-4 flex gap-2 pt-2 border-t border-border/30">
                      <span onClick={(e) => { e.stopPropagation(); openEdit(plant); }} className="rounded-full bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/80">Edit</span>
                      <span onClick={(e) => { e.stopPropagation(); onDelete(plant); }} className="rounded-full bg-destructive/5 px-4 py-1.5 text-xs font-semibold text-destructive cursor-pointer hover:bg-destructive/10">Delete</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="hidden lg:block">
            {selectedPlant ? (
              <div className="sticky top-20 space-y-10">
                <CoverPhoto coverPhotoPath={selectedPlant.cover_photo_path} className="aspect-[4/3] w-full rounded-2xl object-cover" />
                <div><div className="flex items-start justify-between gap-3"><div><p className="text-display text-foreground">{selectedPlant.name}</p>{selectedPlant.species && <p className="mt-1 text-sm italic text-muted-foreground">{selectedPlant.species}</p>}</div><div className="flex gap-2"><button onClick={() => openEdit(selectedPlant)} className="rounded-full bg-muted px-4 py-2 text-xs font-semibold hover:bg-muted/80"><Pencil size={14} className="inline" /> Edit</button><button onClick={() => onDelete(selectedPlant)} className="rounded-full bg-destructive/5 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"><Trash2 size={14} className="inline" /> Delete</button></div></div></div>
                <div><p className="text-label mb-4 text-muted-foreground">Quick care</p><div className="flex flex-wrap gap-2">{["water", "fertilize", "mist", "rotate"].map((ct) => (<button key={ct} onClick={() => onQuickCare(ct as CareType)} disabled={careLoading !== null} className="rounded-full bg-muted px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80 disabled:opacity-40">{careLoading === ct ? <Loader2 className="animate-spin inline" size={12} /> : null}{ct}</button>))}</div></div>
                <div className="border-t border-border pt-6"><p className="text-label mb-4 text-muted-foreground">Schedule</p>{selectedSchedules.filter((s) => s.active).length === 0 ? <p className="text-sm text-muted-foreground">No care schedule set.</p> : <div className="space-y-3">{selectedSchedules.filter((s) => s.active).map((s) => (<div key={s.id} className="flex items-center justify-between gap-4"><span className="text-sm font-semibold capitalize text-foreground">{s.care_type}</span><span className="text-xs text-muted-foreground">{s.next_due_at ? `Due ${formatDueDate(s.next_due_at)}` : "No upcoming"}</span></div>))}</div>}</div>
                {selectedPlant.notes && (<div className="border-t border-border pt-6"><p className="text-label mb-3 text-muted-foreground">Notes</p><p className="text-sm leading-relaxed text-foreground">{selectedPlant.notes}</p></div>)}
                <div className="border-t border-border pt-6"><p className="text-label mb-4 text-muted-foreground">Timeline</p>{tlLoading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded-full" />)}</div> : timeline.length === 0 ? <p className="text-sm text-muted-foreground">No care events yet.</p> : <div className="space-y-2">{timeline.slice(0, 8).map((e) => (<div key={e.id} className="flex items-center gap-3 rounded-full bg-muted/50 px-5 py-2.5"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Droplets size={12} /></div><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-foreground capitalize">{e.careType ?? e.type}</p></div><span className="shrink-0 text-xs text-muted-foreground">{e.occurredAt.slice(0, 10)}</span></div>))}</div>}</div>
              </div>
            ) : dataLoading ? <div className="space-y-4"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div> : <div className="py-16 text-center"><p className="text-sm text-muted-foreground">Select a plant to see details</p></div>}
          </aside>
        </div>
      </PullToRefresh>
    </>
  );
}

function PlantForm({ editing, values, speciesList, saving, onChange, onCancel, onSubmit }: { editing: boolean; values: PlantFormValues; speciesList: PlantSpeciesRow[]; saving: boolean; onChange: (v: PlantFormValues) => void; onCancel: () => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void }) {
  const set = (p: Partial<PlantFormValues>) => onChange({ ...values, ...p });
  return (<form onSubmit={onSubmit} className="max-w-lg space-y-6"><p className="text-display text-foreground">{editing ? "Edit plant" : "New plant"}</p>
    <div><label className="text-label block mb-2 text-muted-foreground">Name</label><Input value={values.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Monstera Deliciosa" className="h-12 w-full rounded-full px-5 text-sm bg-muted" required autoFocus /></div>
    <div><label className="text-label block mb-2 text-muted-foreground">Species</label><Input value={values.species ?? ""} onChange={(e) => set({ species: e.target.value })} placeholder="e.g. Monstera deliciosa" className="h-12 w-full rounded-full px-5 text-sm bg-muted" /></div>
    <div><label className="text-label block mb-2 text-muted-foreground">Location</label><Input value={values.location ?? ""} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Living room" className="h-12 w-full rounded-full px-5 text-sm bg-muted" /></div>
    <div className="flex gap-3"><Button type="submit" disabled={saving || !values.name.trim()}>{saving ? "Saving..." : editing ? "Save changes" : "Create plant"}</Button><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button></div>
  </form>);
}

function cadence(schedules: CareScheduleRow[], type: CareType): number | null {
  const s = schedules.find((s) => s.active && s.care_type === type); if (!s) return null;
  if (s.cadence_unit === "day") return s.cadence_value; if (s.cadence_unit === "week") return s.cadence_value * 7; if (s.cadence_unit === "month") return s.cadence_value * 30; return s.cadence_value;
}
