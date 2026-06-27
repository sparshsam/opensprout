"use client";

import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  NotebookTabs,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
} from "lucide-react";
import type { JournalFeedItem } from "@/lib/data/tasks";
import {
  listJournalFeed,
} from "@/lib/data/tasks";
import {
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  type CreateJournalInput,
} from "@/lib/data/journal";
import { uploadJournalPhotos } from "@/lib/data/photos";
import { TimelineItem } from "@/components/cards/timeline-item";
import { BottomSheet } from "@/components/sheets/bottom-sheet";
import {
  JournalForm,
  type JournalFormValues,
} from "@/components/sheets/journal-form";
import { Button } from "@/components/ui/button";
import type { TimelineEventType } from "@/lib/data/tasks";
import { Skeleton } from "@/components/ui/skeleton";

export default function JournalPage() {
  const { supabase, user, data } = useApp();
  const [feed, setFeed] = useState<JournalFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterPlant, setFilterPlant] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // New/edit entry sheet
  const [showEntrySheet, setShowEntrySheet] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalFeedItem | null>(null);
  const [, setSaving] = useState(false);

  // Delete confirm
  const [deleteEntry, setDeleteEntry] = useState<JournalFeedItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  function loadFeed() {
    const client = supabase;
    if (!client || !user) return;
    setLoading(true);
    setError(null);
    listJournalFeed(client, user.id)
      .then(setFeed)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, user]);

  // Filtered feed
  const filteredFeed = useMemo(() => {
    return feed.filter((item) => {
      if (filterPlant !== "all" && item.plantId !== filterPlant) return false;
      if (filterType !== "all" && item.type !== filterType) return false;
      return true;
    });
  }, [feed, filterPlant, filterType]);

  // ── New/Edit journal entry ──
  function openNewEntry() {
    setEditingEntry(null);
    setShowEntrySheet(true);
  }

  function openEditEntry(item: JournalFeedItem) {
    setEditingEntry(item);
    setShowEntrySheet(true);
  }

  function closeEntrySheet() {
    setShowEntrySheet(false);
    setEditingEntry(null);
  }

  async function handleSaveEntry(values: JournalFormValues) {
    const client = supabase;
    if (!client || !user) return;
    setSaving(true);
    setError(null);

    try {
      // Determine plant_id
      let plantId: string;
      if (editingEntry) {
        plantId = editingEntry.plantId;
      } else {
        // Use first plant or ask user — for now, use first plant in data
        // The form's parent should have a plant selector
        plantId = filterPlant !== "all" ? filterPlant : data.plants[0]?.id;
        if (!plantId) {
          setError("Add a plant first before creating journal entries.");
          setSaving(false);
          return;
        }
      }

      if (editingEntry) {
        // Update existing entry
        await updateJournalEntry(client, user.id, editingEntry.id, {
          title: values.title || undefined,
          body: values.body || undefined,
          observed_at: values.observed_at
            ? new Date(values.observed_at).toISOString()
            : undefined,
          health_score: values.health_score ?? undefined,
          tags: values.tags.length > 0 ? values.tags : undefined,
        });
      } else {
        // Create new entry
        const input: CreateJournalInput = {
          plant_id: plantId,
          title: values.title || undefined,
          body: values.body || undefined,
          observed_at: values.observed_at
            ? new Date(values.observed_at).toISOString()
            : undefined,
          health_score: values.health_score ?? undefined,
          tags: values.tags.length > 0 ? values.tags : undefined,
        };

        const entry = await createJournalEntry(client, user.id, input);

        // Upload photos if any
        if (values.photos.length > 0) {
          const files = values.photos
            .filter((p): p is typeof p & { blob: Blob } => Boolean(p.blob))
            .map((p) => p.blob);
          if (files.length > 0) {
            await uploadJournalPhotos(
              client,
              user.id,
              plantId,
              entry.id,
              files,
            );
          }
        }
      }

      closeEntrySheet();
      loadFeed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ──
  async function handleDelete(entry: JournalFeedItem) {
    const client = supabase;
    if (!client || !user) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteJournalEntry(client, user.id, entry.id);
      setDeleteEntry(null);
      loadFeed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete entry.");
    } finally {
      setDeleting(false);
    }
  }

  // Unique plants for filter
  const filterPlants = useMemo(() => {
    const ids = new Set(feed.map((f) => f.plantId));
    return data.plants.filter((p) => ids.has(p.id));
  }, [feed, data.plants]);

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground">
            Journal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A chronological feed of all care events and journal entries across
            your plants.
          </p>
        </div>
        <Button onClick={openNewEntry}>
          <Plus size={16} aria-hidden />
          New entry
        </Button>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadFeed}
              className="shrink-0 border-red-300 bg-white text-red-700 hover:bg-red-100 dark:bg-muted dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <RefreshCw size={14} aria-hidden />
              Retry
            </Button>
          </div>
        </div>
      )}

      <section className="py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-muted-foreground" aria-hidden />
            <select
              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm outline-none focus:border-primary dark:bg-muted"
              value={filterPlant}
              onChange={(e) => setFilterPlant(e.target.value)}
              aria-label="Filter by plant"
            >
              <option value="all">All plants</option>
              {filterPlants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <select
            className="rounded-md border border-border bg-white px-3 py-1.5 text-sm outline-none focus:border-primary dark:bg-muted"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            <option value="care_log">Care events</option>
            <option value="journal_entry">Journal entries</option>
          </select>
          {feed.length > 0 && (
            <span className="self-center text-xs text-muted-foreground">
              {filteredFeed.length} of {feed.length}
            </span>
          )}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-20 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFeed.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center shadow-panel">
            <NotebookTabs
              size={48}
              className="mx-auto text-muted-foreground/40"
              aria-hidden
            />
            <h2 className="mt-4 text-lg font-bold">No journal entries yet</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Every watering, fertilizing, and care action you log will appear
              here — along with your written journal entries and photos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFeed.map((event) => (
              <div key={event.id}>
                {/* Plant name header for each group */}
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary/30" />
                  <p className="text-xs font-semibold text-muted-foreground">
                    {event.plantName}
                  </p>
                  {/* Edit/delete actions for journal entries */}
                  {event.type === "journal_entry" && (
                    <div className="ml-auto flex gap-1">
                      <button
                        onClick={() => openEditEntry(event)}
                        className="rounded p-0.5 text-muted-foreground transition hover:text-foreground"
                        aria-label="Edit entry"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteEntry(event)}
                        className="rounded p-0.5 text-muted-foreground transition hover:text-red-600"
                        aria-label="Delete entry"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <TimelineItem
                  type={event.type as TimelineEventType}
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
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── New/Edit Journal Entry Sheet ── */}
      <BottomSheet
        open={showEntrySheet}
        onClose={closeEntrySheet}
        title={editingEntry ? "Edit entry" : "New journal entry"}
      >
        <JournalForm
          entry={
            editingEntry
              ? {
                  id: editingEntry.id,
                  title: editingEntry.title ?? null,
                  body: editingEntry.body ?? null,
                  observed_at: editingEntry.occurredAt,
                  health_score: editingEntry.health_score ?? null,
                  tags: editingEntry.tags ?? [],
                }
              : null
          }
          onSubmit={handleSaveEntry}
          onCancel={closeEntrySheet}
        />
      </BottomSheet>

      {/* ── Delete confirmation sheet ── */}
      <BottomSheet
        open={deleteEntry !== null}
        onClose={() => {
          if (!deleting) setDeleteEntry(null);
        }}
        title="Delete entry?"
      >
        {deleteEntry && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete &lsquo;
              {deleteEntry.title ?? 'this journal entry'}
              &rsquo;? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleDelete(deleteEntry)}
                disabled={deleting}
                className="bg-red-600 text-white hover:bg-red-500 dark:bg-red-800 dark:hover:bg-red-600"
              >
                {deleting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : null}
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteEntry(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
