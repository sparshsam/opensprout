"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/context/app-context";
import { PhotoGallery } from "@/components/gallery/photo-gallery";
import { ScheduleCard } from "@/components/care/schedule-card";
import { ScheduleEditSheet } from "@/components/care/schedule-edit-sheet";
import { ApplyCarePlanSheet } from "@/components/care/apply-care-plan-sheet";
import { PlantDoctorSheet } from "@/components/doctor/plant-doctor-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getKnowledgeArticles, getSpeciesById } from "@/lib/data/knowledge";
import { updatePlant } from "@/lib/data/plants";
import {
  ArrowLeft, Droplets, FlaskConical, Scissors, RotateCw,
  Loader2, Sprout, Pencil, Trash2, Plus, Sun, Search,
  Leaf, Heart, Stethoscope, Clock, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CareType, CareScheduleRow, KnowledgeArticleRow, PlantSpeciesRow } from "@/lib/data/types";
import Link from "next/link";

// ── Care type icon map ──

const CARE_ICONS: Record<string, React.ElementType> = {
  water: Droplets,
  fertilize: FlaskConical,
  mist: Sun,
  rotate: RotateCw,
  prune: Scissors,
  repot: Sprout,
  inspect: Search,
  custom: Leaf,
};

function formatTimeAgo(d: string): string {
  const dt = new Date(d);
  const m = Math.round((Date.now() - dt.getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const CARE_TYPES: CareType[] = ["water", "fertilize", "mist", "rotate", "prune", "repot", "inspect"];

export default function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { supabase, user, data, speciesList, handleMarkCare, handleDeletePlant, refreshDashboard } = useApp();

  // ── State ──
  const [submitting, setSubmitting] = useState<CareType | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CareScheduleRow | null>(null);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showCarePlan, setShowCarePlan] = useState(false);
  const [showDoctor, setShowDoctor] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [, setSpeciesDetail] = useState<PlantSpeciesRow | null>(null);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticleRow[]>([]);
  const [showSpeciesInfo, setShowSpeciesInfo] = useState(false);
  const [activeTimelineTab, setActiveTimelineTab] = useState<"care" | "health">("care");

  // ── Derived data ──
  const plant = data.plants.find((p) => p.id === id) ?? null;

  const schedules = useMemo(
    () => data.schedules.filter((s) => s.plant_id === id && !s.deleted_at),
    [data.schedules, id],
  );

  const careLogs = useMemo(
    () => [...data.logs]
      .filter((l) => l.plant_id === id)
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()),
    [data.logs, id],
  );

  const healthLogs = useMemo(
    () => {
      // Journal entries with health_score serve as health check-ins
      // We'll also track health status from plants table
      const entries: { date: string; status: string; note: string }[] = [];
      if (plant?.health_status && plant.health_status !== "unknown") {
        // Use created_at as proxy for when the status was set
        entries.push({
          date: plant.updated_at,
          status: plant.health_status,
          note: "Current status set on plant",
        });
      }
      // Add journal entries with health_score
      // These aren't in the data context by default, so we'd need to fetch them
      return entries;
    },
    [plant],
  );

  const plantSpecies = useMemo(() => {
    if (!plant?.species_id) return null;
    return speciesList.find((s) => s.id === plant.species_id) ?? null;
  }, [plant, speciesList]);

  // Fetch species detail + knowledge articles
  useEffect(() => {
    if (!plant?.species_id || !supabase) return;
    getSpeciesById(supabase, plant.species_id).then(setSpeciesDetail).catch(() => {});
    getKnowledgeArticles(supabase, plant.species_id)
      .then(setKnowledgeArticles)
      .catch(() => {});
  }, [plant?.species_id, supabase]);

  // Health display
  const healthLabel = (() => {
    if (!plant?.health_status || plant.health_status === "unknown")
      return { label: "Not assessed", color: "bg-muted text-muted-foreground" };
    const map: Record<string, { label: string; color: string }> = {
      thriving: { label: "Thriving", color: "bg-primary/10 text-primary" },
      stable: { label: "Stable", color: "bg-primary/10 text-primary" },
      watch: { label: "Needs attention", color: "bg-warning/10 text-warning" },
      struggling: { label: "Struggling", color: "bg-destructive/10 text-destructive" },
    };
    return map[plant.health_status] ?? { label: "Not assessed", color: "bg-muted text-muted-foreground" };
  })();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function doQuickCare(ct: CareType) {
    if (!plant || !supabase || !user) return;
    setSubmitting(ct);
    try {
      await handleMarkCare(plant.id, ct, plant.name);
      showToast(`${ct} logged for today`);
    } catch {
      showToast("Failed to log care");
    } finally {
      setSubmitting(null);
    }
  }

  async function doDelete() {
    if (!plant) return;
    if (!window.confirm(`Delete ${plant.name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await handleDeletePlant(plant);
      router.replace("/plants");
    } finally {
      setDeleting(false);
    }
  }

  async function doSaveNotes() {
    if (!supabase || !user || !plant) return;
    setSavingNotes(true);
    try {
      await updatePlant(supabase, user.id, plant.id, {
        name: plant.name,
        species_id: plant.species_id ?? "",
        species: plant.species ?? "",
        location: plant.location ?? "",
        notes: notesText,
        health_status: plant.health_status ?? undefined,
      });
      await refreshDashboard();
      setEditNotes(false);
      showToast("Notes saved");
    } catch {
      showToast("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  }

  function handleEditSchedule(s: CareScheduleRow) {
    setEditingSchedule(s);
    setShowEditSheet(true);
  }

  // ── Loading / Not found ──
  if (!plant) {
    if (data.plants.length === 0) {
      return (
        <div className="py-20 text-center">
          <p className="text-lg font-bold text-foreground">Plant not found</p>
          <Link href="/plants" className="mt-4 inline-block rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground">
            Back to plants
          </Link>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-8 w-48 rounded-full" />
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        {/* Back */}
        <button
          onClick={() => router.push("/plants")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to plants
        </button>

        {/* ═══ Desktop: two-column layout ═══ */}
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-14">

          {/* ── Left column: photos + quick actions ── */}
          <div className="lg:col-span-2">
            {/* Photo gallery */}
            <PhotoGallery
              plantId={plant.id}
              currentCoverPath={plant.cover_photo_path}
              onCoverChanged={refreshDashboard}
            />

            {/* Quick care buttons */}
            <section className="mt-8">
              <p className="text-label mb-4 text-muted-foreground">Log care</p>
              <div className="flex flex-wrap gap-2">
                {CARE_TYPES.map((ct) => (
                  <button
                    key={ct}
                    onClick={() => doQuickCare(ct)}
                    disabled={submitting !== null}
                    className="rounded-full bg-muted px-4 py-2 text-[11px] font-bold tracking-wider uppercase text-foreground transition hover:bg-muted/80 disabled:opacity-40"
                  >
                    {submitting === ct ? (
                      <Loader2 className="animate-spin inline" size={10} />
                    ) : null}
                    {ct}
                  </button>
                ))}
              </div>
            </section>

            {/* Plant Doctor entry point */}
            {plant.species_id && (
              <section className="mt-6">
                <button
                  onClick={() => setShowDoctor(true)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-border/50 bg-primary/[0.02] p-4 text-left transition hover:bg-primary/[0.04]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Stethoscope size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Plant Doctor</p>
                    <p className="text-xs text-muted-foreground">Diagnose issues with your {plantSpecies?.common_name || plant.name}</p>
                  </div>
                </button>
              </section>
            )}

            {/* Species info card */}
            {plantSpecies && (
              <section className="mt-6">
                <button
                  onClick={() => setShowSpeciesInfo(!showSpeciesInfo)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-border/50 bg-muted/30 p-4 text-left transition hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BookOpen size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{plantSpecies.common_name}</p>
                    {plantSpecies.scientific_name && (
                      <p className="text-xs italic text-muted-foreground">{plantSpecies.scientific_name}</p>
                    )}
                  </div>
                  <ChevronDownIcon open={showSpeciesInfo} />
                </button>

                {showSpeciesInfo && (
                  <div className="mt-3 space-y-3 rounded-2xl border border-border/40 bg-muted/20 p-4">
                    <SpeciesField label="Light" value={plantSpecies.light_preference} />
                    <SpeciesField label="Water" value={plantSpecies.watering_min_days && plantSpecies.watering_max_days
                      ? `${plantSpecies.watering_min_days}–${plantSpecies.watering_max_days} days`
                      : null} />
                    <SpeciesField label="Fertilize" value={plantSpecies.fertilizing_frequency_days
                      ? `Every ${plantSpecies.fertilizing_frequency_days} days`
                      : null} />
                    <SpeciesField label="Humidity" value={plantSpecies.humidity_preference} />
                    <SpeciesField label="Soil" value={plantSpecies.soil_notes} />
                    <SpeciesField label="Difficulty" value={plantSpecies.difficulty} />
                    <SpeciesField label="Toxicity" value={plantSpecies.toxicity} />
                    <SpeciesField label="Growth" value={plantSpecies.growth_rate ? `${plantSpecies.growth_rate} growing` : null} />
                    <SpeciesField label="Mature height" value={plantSpecies.mature_height} />
                    <SpeciesField label="Native region" value={plantSpecies.native_region} />
                    <SpeciesField label="Pet safe" value={plantSpecies.pet_safe ? "Yes" : "No"} />
                    {plantSpecies.care_summary && (
                      <div>
                        <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-1">Care summary</p>
                        <p className="text-sm text-foreground leading-relaxed">{plantSpecies.care_summary}</p>
                      </div>
                    )}
                    {knowledgeArticles.length > 0 && (
                      <div className="border-t border-border pt-3 mt-3">
                        <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2">Articles</p>
                        {knowledgeArticles.slice(0, 4).map((a) => (
                          <details key={a.id} className="mt-2">
                            <summary className="cursor-pointer text-sm font-semibold text-foreground hover:text-primary transition">
                              {a.title}
                            </summary>
                            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {a.body}
                            </p>
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Quick stats */}
            <section className="mt-8">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-muted/30 p-4 text-center">
                  <p className="text-display text-foreground">{schedules.length}</p>
                  <p className="text-xs text-muted-foreground">Schedule{schedules.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4 text-center">
                  <p className="text-display text-foreground">{careLogs.length}</p>
                  <p className="text-xs text-muted-foreground">Care log{careLogs.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </section>
          </div>

          {/* ── Right column: info + schedules + timeline ── */}
          <div className="lg:col-span-3">

            {/* Name + actions */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-hero text-foreground">{plant.name}</h1>
                  <p className="mt-1 text-sm italic text-muted-foreground">
                    {plant.species ?? "Unknown species"}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/plants?id=${plant.id}`}
                    className="rounded-full bg-muted px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/80"
                  >
                    <Pencil size={14} className="inline" /> Edit
                  </Link>
                  <button
                    onClick={doDelete}
                    disabled={deleting}
                    className="rounded-full bg-destructive/5 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    {deleting ? <Loader2 size={14} className="animate-spin inline" /> : <Trash2 size={14} className="inline" />}
                    Delete
                  </button>
                </div>
              </div>
              {plant.location && (
                <p className="mt-3 text-sm text-muted-foreground">📍 {plant.location}</p>
              )}
            </div>

            {/* Health status */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={14} className="text-muted-foreground" />
                <p className="text-label text-muted-foreground">Health</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("rounded-full px-5 py-2 text-xs font-bold tracking-wider uppercase", healthLabel.color)}>
                  {healthLabel.label}
                </span>
                {(!plant.health_status || plant.health_status === "unknown") && (
                  <Link href={`/plants?id=${plant.id}`} className="text-xs font-semibold text-primary hover:underline">
                    Set health status
                  </Link>
                )}
              </div>
            </section>

            {/* Care schedules */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <p className="text-label text-muted-foreground">Schedule</p>
                </div>
                {plant.species_id && (
                  <button
                    onClick={() => setShowCarePlan(true)}
                    className="rounded-full bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80 transition"
                  >
                    <Plus size={12} className="inline" /> Add
                  </button>
                )}
              </div>
              {schedules.length === 0 ? (
                <div className="rounded-2xl border border-border/40 bg-muted/20 p-5 text-center">
                  <p className="text-sm text-muted-foreground">No care schedule yet.</p>
                  {plant.species_id ? (
                    <button
                      onClick={() => setShowCarePlan(true)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase text-primary-foreground hover:brightness-110 transition"
                    >
                      <Plus size={14} /> Set up care plan
                    </button>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Add a species to get recommended care schedules.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {schedules.map((s) => (
                    <ScheduleCard key={s.id} schedule={s} onEdit={handleEditSchedule} />
                  ))}
                </div>
              )}
            </section>

            {/* Timeline: Care / Health tabs */}
            <section className="mb-10">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setActiveTimelineTab("care")}
                  className={cn(
                    "text-xs font-bold tracking-wider uppercase transition pb-1 border-b-2",
                    activeTimelineTab === "care"
                      ? "text-foreground border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground",
                  )}
                >
                  Care history
                </button>
                <button
                  onClick={() => setActiveTimelineTab("health")}
                  className={cn(
                    "text-xs font-bold tracking-wider uppercase transition pb-1 border-b-2",
                    activeTimelineTab === "health"
                      ? "text-foreground border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground",
                  )}
                >
                  Health history
                </button>
              </div>

              {activeTimelineTab === "care" ? (
                careLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No care logged yet. Use the buttons above to log your first care action.</p>
                ) : (
                  <div className="space-y-1.5">
                    {careLogs.map((log) => {
                      const Icon = CARE_ICONS[log.care_type] ?? Sprout;
                      return (
                        <div key={log.id} className="flex items-center gap-3 rounded-full bg-muted/40 px-5 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon size={12} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground capitalize">{log.care_type}</p>
                            {log.amount_ml && <span className="text-xs text-muted-foreground">{log.amount_ml}ml</span>}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">{formatTimeAgo(log.occurred_at)}</span>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Health history tab */
                healthLogs.length === 0 ? (
                  <div className="rounded-2xl border border-border/40 bg-muted/20 p-5 text-center">
                    <p className="text-sm text-muted-foreground">
                      {plant?.health_status && plant.health_status !== "unknown"
                        ? `Current status: ${plant.health_status}. Edit the plant to update.`
                        : "No health history yet."}
                    </p>
                    <Link
                      href={`/plants?id=${plant.id}`}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/80"
                    >
                      <Pencil size={12} /> Update health status
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {healthLogs.map((h, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-full bg-muted/40 px-5 py-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Heart size={12} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground capitalize">{h.status}</p>
                          <p className="text-xs text-muted-foreground">{h.note}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatTimeAgo(h.date)}</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </section>

            {/* Notes */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Leaf size={14} className="text-muted-foreground" />
                  <p className="text-label text-muted-foreground">Notes</p>
                </div>
                {!editNotes && plant.notes && (
                  <button
                    onClick={() => { setEditNotes(true); setNotesText(plant.notes ?? ""); }}
                    className="rounded-full bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80 transition"
                  >
                    <Pencil size={12} className="inline" /> Edit
                  </button>
                )}
              </div>
              {editNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Care notes, observations, reminders..."
                    className="min-h-28 w-full rounded-2xl bg-muted px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button onClick={doSaveNotes} disabled={savingNotes} size="sm">
                      {savingNotes ? <Loader2 className="animate-spin" size={14} /> : null}
                      Save
                    </Button>
                    <Button variant="secondary" onClick={() => setEditNotes(false)} size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : plant.notes ? (
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{plant.notes}</p>
              ) : (
                <button
                  onClick={() => { setEditNotes(true); setNotesText(""); }}
                  className="w-full rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-center text-sm text-muted-foreground hover:bg-muted/40 transition"
                >
                  <Leaf size={16} className="inline" /> Add notes
                </button>
              )}
            </section>

          </div>
        </div>
      </div>

      {/* ── Sheets ── */}
      <ScheduleEditSheet
        open={showEditSheet}
        onClose={() => { setShowEditSheet(false); setEditingSchedule(null); }}
        schedule={editingSchedule}
      />

      {plant && (
        <ApplyCarePlanSheet
          open={showCarePlan}
          onClose={() => setShowCarePlan(false)}
          plantName={plant.name}
          plantId={plant.id}
          species={plantSpecies}
        />
      )}

      {plant && (
        <PlantDoctorSheet
          open={showDoctor}
          onClose={() => setShowDoctor(false)}
          plantName={plant.name}
          plantId={plant.id}
          species={plantSpecies}
        />
      )}
    </>
  );
}

// ── Small helper components ──

function SpeciesField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "shrink-0 text-muted-foreground transition-transform",
        open && "rotate-180",
      )}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
