"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhotoPicker, type PickedPhoto } from "@/components/cards/photo-picker";

export type JournalFormValues = {
  title: string;
  body: string;
  observed_at: string;
  health_score: number | null;
  tags: string[];
  photos: PickedPhoto[];
};

export type JournalFormProps = {
  /** If set, we're editing an existing entry */
  entry?: {
    id: string;
    title: string | null;
    body: string | null;
    observed_at: string;
    health_score: number | null;
    tags: string[];
  } | null;
  /** Called on submit with form values */
  onSubmit: (values: JournalFormValues) => Promise<void>;
  /** Called to cancel/close */
  onCancel: () => void;
};

const healthOptions = [
  { value: null as number | null, label: "Not rated" },
  { value: 5, label: "5 — Thriving" },
  { value: 4, label: "4 — Good" },
  { value: 3, label: "3 — Stable" },
  { value: 2, label: "2 — Needs attention" },
  { value: 1, label: "1 — Struggling" },
];

export function JournalForm({
  entry,
  onSubmit,
  onCancel,
}: JournalFormProps) {
  const [values, setValues] = useState<JournalFormValues>(() => ({
    title: entry?.title ?? "",
    body: entry?.body ?? "",
    observed_at: entry?.observed_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    health_score: entry?.health_score ?? null,
    tags: entry?.tags ?? [],
    photos: [],
  }));
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  function setValue<K extends keyof JournalFormValues>(
    key: K,
    value: JournalFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || values.tags.includes(tag)) return;
    setValue("tags", [...values.tags, tag]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setValue("tags", values.tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!values.title.trim()) return;
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <label className="block">
        <span className="text-sm font-semibold">Title</span>
        <Input
          className="mt-1"
          value={values.title}
          onChange={(e) => setValue("title", e.target.value)}
          placeholder="e.g. New leaf unfurled"
          required
        />
      </label>

      {/* Body */}
      <label className="block">
        <span className="text-sm font-semibold">Notes</span>
        <textarea
          className="mt-1 min-h-24 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
          value={values.body}
          onChange={(e) => setValue("body", e.target.value)}
          placeholder="Describe what you observed..."
        />
      </label>

      {/* Date + Health Score */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-semibold">Date observed</span>
          <Input
            className="mt-1"
            type="date"
            value={values.observed_at}
            onChange={(e) => setValue("observed_at", e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Health score</span>
          <select
            className="mt-1 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
            value={values.health_score ?? ""}
            onChange={(e) =>
              setValue(
                "health_score",
                e.target.value ? Number(e.target.value) : null,
              )
            }
          >
            {healthOptions.map((opt) => (
              <option key={String(opt.value)} value={opt.value ?? ""}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Tags */}
      <div>
        <span className="text-sm font-semibold">Tags</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {values.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove tag ${tag}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add tag..."
              className="w-24 rounded border border-border px-2 py-1 text-xs outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-border"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div>
        <span className="text-sm font-semibold">Photos</span>
        <p className="mb-2 text-xs text-muted-foreground">
          Attach photos to this journal entry.
        </p>
        <PhotoPicker
          photos={values.photos}
          onAdd={(newPhotos) =>
            setValue("photos", [...values.photos, ...newPhotos])
          }
          onRemove={(id) =>
            setValue(
              "photos",
              values.photos.filter((p) => p.id !== id),
            )
          }
          maxPhotos={10}
          disabled={saving}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving || !values.title.trim()}>
          {saving ? (
            <Loader2 className="animate-spin" size={16} aria-hidden />
          ) : (
            <Save size={16} aria-hidden />
          )}
          {entry ? "Save changes" : "Create entry"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
