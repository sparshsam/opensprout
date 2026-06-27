"use client";

import { useState, useMemo, useEffect, useRef, type FormEvent } from "react";
import { useApp } from "@/lib/context/app-context";
import { useAtmosphere } from "@/lib/hooks/use-atmosphere";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Loader2, Sprout, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDueDate } from "@/lib/data/care";
import type { CareScheduleRow, CareType, HealthStatus, PlantRow, PlantSpeciesRow } from "@/lib/data/types";
import type { PlantFormValues } from "@/lib/data/plants";
import { identifyPlant } from "@/lib/data/identify";
import { uploadPlantPhoto, setPlantCoverPhoto } from "@/lib/data/photos";
import { CoverPhoto } from "@/components/cards/cover-photo";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Skeleton } from "@/components/ui/skeleton";

const healthOptions: HealthStatus[] = ["thriving", "stable", "watch", "struggling", "unknown"];
const emptyForm: PlantFormValues = { name: "", species_id: "", species: "", location: "", notes: "", health_status: undefined, water_every_days: undefined, fertilize_every_days: undefined };

export default function PlantsPage() {
  const { supabase, user, data, speciesList, dataLoading, error, notice, setError, handleCreatePlant, handleUpdatePlant, handleDeletePlant, refreshDashboard } = useApp();
  const { greeting } = useAtmosphere();

  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<PlantRow | null>(null);
  const [form, setForm] = useState<PlantFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const visible = useMemo(() => data.plants.filter((p) => `${p.name} ${p.species ?? ""} ${p.location ?? ""}`.toLowerCase().includes(query.toLowerCase())), [data.plants, query]);

  function openCreate() { setEditingPlant(null); setForm(emptyForm); setCoverFile(null); setShowForm(true); }
  function openEdit(p: PlantRow) {
    const s = data.schedules.filter((s) => s.plant_id === p.id);
    setEditingPlant(p); setForm({ name: p.name, species_id: p.species_id ?? "", species: p.species ?? "", location: p.location ?? "", notes: p.notes ?? "", health_status: p.health_status ?? undefined, water_every_days: cadence(s, "water"), fertilize_every_days: cadence(s, "fertilize") }); setShowForm(true);
  }
  async function handleSave(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (!form.name.trim()) return; setSaving(true); setError(null); try { if (editingPlant) { await handleUpdatePlant(editingPlant.id, form); } else { const c = await handleCreatePlant(form); if (coverFile && supabase && user) { try { const { objectPath } = await uploadPlantPhoto(supabase, user.id, c.id, coverFile); await setPlantCoverPhoto(supabase, user.id, c.id, objectPath); } catch { setError("Plant created but photo upload failed."); } } } setShowForm(false); setEditingPlant(null); setCoverFile(null); } catch {} finally { setSaving(false); } }
  async function onDelete(p: PlantRow) { if (!window.confirm(`Delete ${p.name}?`)) return; await handleDeletePlant(p); }

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

      {showForm && (<section className="mb-14 border-t border-border pt-8"><PlantForm editing={Boolean(editingPlant)} values={form} speciesList={speciesList} saving={saving} coverFile={coverFile} onCoverChange={setCoverFile} onChange={setForm} onCancel={() => { setShowForm(false); setEditingPlant(null); setCoverFile(null); }} onSubmit={handleSave} /></section>)}

      <PullToRefresh onRefresh={refreshDashboard}>
        {dataLoading && visible.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52 rounded-3xl" />)}</div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-xl font-bold text-foreground">{query ? "No plants match that search." : "No plants yet"}</p>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{query ? "Try a different search." : "Add your first plant to start."}</p>
            {!query && <button onClick={openCreate} className="mt-8 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110"><Plus size={16} className="inline" /> Add your first plant</button>}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((plant) => (
              <Link key={plant.id} href={`/plants/${plant.id}`} className="group block rounded-3xl border border-border/40 bg-white p-6 transition hover:shadow-sm dark:bg-muted">
                <CoverPhoto coverPhotoPath={plant.cover_photo_path} className="aspect-[4/3] w-full rounded-2xl object-cover mb-5" />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-foreground">{plant.name}</p>
                    {plant.species && <p className="text-sm italic text-muted-foreground">{plant.species}</p>}
                  </div>
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", !plant.health_status || plant.health_status === "unknown" ? "bg-muted text-muted-foreground" : plant.health_status === "thriving" || plant.health_status === "stable" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
                    {plant.health_status && plant.health_status !== "unknown" ? plant.health_status.charAt(0).toUpperCase() : "?"}
                  </div>
                </div>
                {plant.location && <p className="mt-2 text-xs text-muted-foreground">{plant.location}</p>}
                <div className="mt-4 flex gap-2 pt-2 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
                  <span onClick={(e) => { e.preventDefault(); openEdit(plant); }} className="rounded-full bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/80">Edit</span>
                  <span onClick={(e) => { e.preventDefault(); onDelete(plant); }} className="rounded-full bg-destructive/5 px-4 py-1.5 text-xs font-semibold text-destructive cursor-pointer hover:bg-destructive/10">Delete</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PullToRefresh>
    </>
  );
}

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
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = speciesQuery.trim().toLowerCase();
    if (!q) return [];
    return speciesList
      .filter((s) =>
        [s.common_name, s.scientific_name ?? "", ...s.aliases].some((v) =>
          v.toLowerCase().includes(q),
        ),
      )
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
          if (result.error) {
            setIdentifyError(result.error);
            setIdentifying(false);
            return;
          }
          if (result.bestMatch) {
            const matched = speciesList.find(
              (s) =>
                s.scientific_name?.toLowerCase() ===
                  result.bestMatch!.scientificName.toLowerCase() ||
                s.common_name.toLowerCase() ===
                  result.bestMatch!.scientificName.toLowerCase(),
            );
            set({
              species: result.bestMatch.scientificName,
              species_id: matched?.id ?? "",
            });
            setSpeciesQuery("");
          }
        } catch {
          setIdentifyError("Failed to identify plant.");
        }
        setIdentifying(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIdentifying(false);
      setIdentifyError("Failed to read image.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-6">
      <p className="text-display text-foreground">
        {editing ? "Edit plant" : "New plant"}
      </p>

      {/* Cover photo */}
      {!editing && (
        <div>
          <label className="text-label block mb-2 text-muted-foreground">Photo (optional)</label>
          {coverFile ? (
            <div className="flex items-center gap-3">
              <img
                src={URL.createObjectURL(coverFile)}
                alt="Preview"
                className="h-20 w-20 rounded-2xl object-cover"
              />
              <button
                type="button"
                onClick={() => onCoverChange(null)}
                className="rounded-full bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/80"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => document.getElementById("cover-photo-input")?.click()}
              className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted text-muted-foreground hover:bg-muted/80 transition cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
          )}
          <input
            id="cover-photo-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onCoverChange(f);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Name */}
      <div>
        <label className="text-label block mb-2 text-muted-foreground">Name</label>
        <Input
          value={values.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Monstera by the window"
          className="h-12 w-full rounded-full px-5 text-sm bg-muted"
          required
          autoFocus
        />
      </div>

      {/* Species + photo identify */}
      <div>
        <label className="text-label block mb-2 text-muted-foreground">Species</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={values.species ?? ""}
              onChange={(e) => {
                set({ species: e.target.value, species_id: "" });
                setSpeciesQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (speciesQuery || values.species) setShowDropdown(true);
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="e.g. Monstera deliciosa"
              className="h-12 w-full rounded-full px-5 text-sm bg-muted"
            />
            {showDropdown && matches.length > 0 && (
              <div className="absolute z-10 mt-1.5 w-full rounded-2xl border border-border bg-background shadow-lg max-h-60 overflow-y-auto dark:bg-muted">
                {matches.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2 px-5 py-3 text-left text-sm transition hover:bg-muted first:rounded-t-2xl last:rounded-b-2xl"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange({
                        ...values,
                        species: s.scientific_name ?? s.common_name,
                        species_id: s.id,
                      });
                      setSpeciesQuery("");
                      setShowDropdown(false);
                    }}
                  >
                    <Sprout size={14} className="shrink-0 text-primary/60" />
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">
                        {s.common_name}
                      </span>
                      {s.scientific_name && (
                        <span className="ml-2 italic text-muted-foreground">
                          {s.scientific_name}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={identifying}
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/80 hover:text-foreground disabled:opacity-40"
              title="Identify plant from photo"
            >
              {identifying ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Camera size={18} />
              )}
            </button>
          )}
        </div>
        {identifyError && (
          <p className="mt-2 text-xs text-destructive">{identifyError}</p>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">
          Start typing to search your species library, or use the{" "}
          <Camera size={12} className="inline" /> camera to identify from a
          photo.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleIdentify(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* Location */}
      <div>
        <label className="text-label block mb-2 text-muted-foreground">Location</label>
        <Input
          value={values.location ?? ""}
          onChange={(e) => set({ location: e.target.value })}
          placeholder="e.g. Living room"
          className="h-12 w-full rounded-full px-5 text-sm bg-muted"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving || !values.name.trim()}>
          {saving ? "Saving..." : editing ? "Save changes" : "Create plant"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function cadence(schedules: CareScheduleRow[], type: CareType): number | undefined {
  const s = schedules.find((s) => s.active && s.care_type === type); if (!s) return undefined;
  if (s.cadence_unit === "day") return s.cadence_value; if (s.cadence_unit === "week") return s.cadence_value * 7; if (s.cadence_unit === "month") return s.cadence_value * 30; return s.cadence_value;
}
