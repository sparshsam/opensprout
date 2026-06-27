"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/context/app-context";
import { CoverPhoto } from "@/components/cards/cover-photo";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/sheets/bottom-sheet";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Droplets, FlaskConical, Scissors, RotateCw,
  Loader2, Sprout, Pencil, Trash2, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CareType, CareScheduleRow, CareLogRow } from "@/lib/data/types";
import type { CompleteTaskInput, TaskWithPlant } from "@/lib/data/tasks";
import { formatDueDate } from "@/lib/data/care";
import Link from "next/link";

// ── Helpers ──

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
  const { supabase, user, data, handleMarkCare, handleDeletePlant } = useApp();

  const [submitting, setSubmitting] = useState<CareType | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Find this plant
  const plant = data.plants.find((p) => p.id === id) ?? null;
  const schedules = useMemo(
    () => data.schedules.filter((s) => s.plant_id === id && s.active),
    [data.schedules, id],
  );
  const careLogs = useMemo(
    () =>
      [...data.logs]
        .filter((l) => l.plant_id === id)
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()),
    [data.logs, id],
  );

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

  // Toast helper
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function doQuickCare(ct: CareType) {
    if (!plant || !supabase || !user) return;
    setSubmitting(ct);
    try {
      await handleMarkCare(plant.id, ct, plant.name);
      // If there's a matching task for today, find and complete it
      const todayStr = new Date().toISOString().slice(0, 10);
      // Just show confirmation
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

  // ── Loading state ──
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

      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.push("/plants")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to plants
        </button>

        {/* Photo or empty state */}
        <div className="mb-8">
          {plant.cover_photo_path ? (
            <CoverPhoto
              coverPhotoPath={plant.cover_photo_path}
              className="aspect-[4/3] w-full rounded-3xl object-cover"
            />
          ) : (
            <div className="aspect-[4/3] w-full rounded-3xl bg-muted flex items-center justify-center">
              <div className="text-center">
                <Sprout size={48} className="mx-auto text-muted-foreground/40" aria-hidden />
                <p className="mt-3 text-sm text-muted-foreground">No photo yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Name + actions */}
        <div className="mb-10">
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

        {/* Basic tracker mode */}
        {!plant.cover_photo_path && !plant.species && (
          <section className="mb-12">
            <p className="text-label mb-4 text-muted-foreground">Tracking mode</p>
            <div className="border-t border-border pt-6">
              <span className="inline-block rounded-full bg-muted px-5 py-2 text-xs font-bold tracking-wider uppercase text-muted-foreground">
                Basic tracker
              </span>
              <p className="mt-2 text-xs text-muted-foreground">
                Add a species or photo to unlock care guidance.
              </p>
            </div>
          </section>
        )}

        {/* Health status */}
        <section className="mb-12">
          <p className="text-label mb-4 text-muted-foreground">Health</p>
          <div className="border-t border-border pt-6">
            <span className={cn("inline-block rounded-full px-5 py-2 text-xs font-bold tracking-wider uppercase", healthLabel.color)}>
              {healthLabel.label}
            </span>
            {(!plant.health_status || plant.health_status === "unknown") && (
              <p className="mt-2 text-xs text-muted-foreground">Edit this plant to set health status.</p>
            )}
          </div>
        </section>

        {/* Quick care */}
        <section className="mb-12">
          <p className="text-label mb-4 text-muted-foreground">Log care</p>
          <div className="border-t border-border pt-6">
            <div className="flex flex-wrap gap-2">
              {CARE_TYPES.map((ct) => (
                <button
                  key={ct}
                  onClick={() => doQuickCare(ct)}
                  disabled={submitting !== null}
                  className="rounded-full bg-muted px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground transition hover:bg-muted/80 disabled:opacity-40"
                >
                  {submitting === ct ? (
                    <Loader2 className="animate-spin inline" size={12} />
                  ) : null}
                  {ct}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Log a care action for today. If you have a schedule for this, the task will be marked complete.
            </p>
          </div>
        </section>

        {/* Care schedule */}
        <section className="mb-12">
          <p className="text-label mb-4 text-muted-foreground">Care schedule</p>
          <div className="border-t border-border pt-6">
            {schedules.length === 0 ? (
              <div>
                <p className="text-sm text-muted-foreground">No care schedule yet.</p>
                <Link
                  href={`/plants?id=${plant.id}`}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80"
                >
                  <Plus size={14} /> Create care schedule
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold capitalize text-foreground">{s.care_type}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.next_due_at ? `Due ${formatDueDate(s.next_due_at)}` : "No upcoming date"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Care log */}
        <section className="mb-12">
          <p className="text-label mb-4 text-muted-foreground">Care history</p>
          <div className="border-t border-border pt-6">
            {careLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No care logged yet. Use the buttons above to log your first care action.</p>
            ) : (
              <div className="space-y-2">
                {careLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 rounded-full bg-muted/50 px-5 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Droplets size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground capitalize">{log.care_type}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatTimeAgo(log.occurred_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Notes */}
        {plant.notes && (
          <section className="mb-12">
            <p className="text-label mb-4 text-muted-foreground">Notes</p>
            <div className="border-t border-border pt-6">
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{plant.notes}</p>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
