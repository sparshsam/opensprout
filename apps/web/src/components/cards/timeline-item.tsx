"use client";

import { useState, useEffect } from "react";
import {
  Droplets,
  Leaf,
  Notebook,
  CameraIcon,
  Heart,
  Tag,
  ImageIcon,
  Loader2,
} from "lucide-react";
import type { CareType } from "@/lib/data/types";
import type { TimelineEventType } from "@/lib/data/tasks";
import { formatDueDate } from "@/lib/data/care";
import { cn } from "@/lib/utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { getPhotoSignedUrl } from "@/lib/data/photos";

const careColors: Record<
  string,
  { bg: string; dot: string; icon: string }
> = {
  water: { bg: "bg-sky-50 border-sky-200", dot: "bg-sky-400", icon: "text-sky-600" },
  fertilize: { bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400", icon: "text-emerald-600" },
  mist: { bg: "bg-cyan-50 border-cyan-200", dot: "bg-cyan-400", icon: "text-cyan-600" },
  rotate: { bg: "bg-violet-50 border-violet-200", dot: "bg-violet-400", icon: "text-violet-600" },
  prune: { bg: "bg-orange-50 border-orange-200", dot: "bg-orange-400", icon: "text-orange-600" },
  repot: { bg: "bg-rose-50 border-rose-200", dot: "bg-rose-400", icon: "text-rose-600" },
  inspect: { bg: "bg-amber-50 border-amber-200", dot: "bg-amber-400", icon: "text-amber-600" },
  custom: { bg: "bg-slate-50 border-slate-200", dot: "bg-slate-400", icon: "text-slate-600" },
};

const careLabels: Record<CareType, string> = {
  water: "Watered",
  fertilize: "Fertilized",
  mist: "Misted",
  rotate: "Rotated",
  prune: "Pruned",
  repot: "Repotted",
  inspect: "Inspected",
  custom: "Care",
};

function healthBar(score: number) {
  if (score >= 5) return { label: "Thriving", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  if (score >= 4) return { label: "Good", color: "text-green-600 bg-green-50 border-green-200" };
  if (score >= 3) return { label: "Stable", color: "text-amber-600 bg-amber-50 border-amber-200" };
  if (score >= 2) return { label: "Needs attention", color: "text-orange-600 bg-orange-50 border-orange-200" };
  return { label: "Struggling", color: "text-red-600 bg-red-50 border-red-200" };
}

function PhotoThumbnail({ objectPath }: { objectPath: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let supabase: SupabaseClient | null = null;
    try {
      supabase = createClient();
    } catch {
      setLoading(false);
      return;
    }
    getPhotoSignedUrl(supabase, objectPath, 3600)
      .then((signedUrl) => {
        if (mounted) setUrl(signedUrl);
      })
      .catch(() => {
        if (mounted) setUrl(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [objectPath]);

  if (loading) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-md bg-muted">
        <Loader2 size={16} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!url) return null;

  return (
    <img
      src={url}
      alt="Plant photo"
      className="h-20 w-20 rounded-md border border-border object-cover"
    />
  );
}

export type TimelineItemProps = {
  type: TimelineEventType;
  occurredAt: string;
  // Care log fields
  careType?: CareType;
  notes?: string | null;
  amount_ml?: number | null;
  fertilizer_name?: string | null;
  // Journal entry fields
  title?: string | null;
  body?: string | null;
  health_score?: number | null;
  tags?: string[];
  // Photo fields
  object_path?: string | null;
  photoCount?: number;
};

export function TimelineItem(props: TimelineItemProps) {
  const {
    type,
    occurredAt,
    careType,
    notes,
    amount_ml,
    fertilizer_name,
    title,
    body,
    health_score,
    tags,
    object_path,
    photoCount,
  } = props;

  if (type === "photo" && object_path) {
    return (
      <div className="flex gap-3 rounded-lg border border-border bg-white p-3 dark:bg-muted">
        <div className="flex flex-col items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-violet-400" />
          <div className="w-px flex-1 bg-border" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              <CameraIcon size={14} className="mr-1 inline text-violet-500" />
              Photo
            </p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDueDate(occurredAt)}
            </span>
          </div>
          {title && (
            <p className="mt-0.5 text-xs text-muted-foreground italic">
              {title}
            </p>
          )}
          <div className="mt-2">
            <PhotoThumbnail objectPath={object_path} />
          </div>
        </div>
      </div>
    );
  }

  if (type === "journal_entry") {
    const health = health_score ? healthBar(health_score) : null;
    return (
      <div className={cn("flex gap-3 rounded-lg border p-3", "bg-white border-border dark:bg-muted")}>
        <div className="flex flex-col items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <div className="w-px flex-1 bg-border" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-foreground">
              <Notebook size={14} className="mr-1 inline text-amber-500" />
              {title ?? "Journal entry"}
            </p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDueDate(occurredAt)}
            </span>
          </div>

          {health && (
            <span
              className={cn(
                "mt-1 inline-flex rounded-sm px-2 py-0.5 text-xs font-semibold",
                health.color,
              )}
            >
              <Heart size={12} className="mr-1" />
              {health.label}
            </span>
          )}

          {body && (
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {body}
            </p>
          )}

          {tags && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {photoCount != null && photoCount > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              <ImageIcon size={12} className="mr-1 inline" />
              {photoCount} photo{photoCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default: care_log
  const color = careColors[careType ?? "custom"] ?? careColors.custom;

  return (
    <div className={cn("flex gap-3 rounded-lg border p-3", color.bg)}>
      <div className="flex flex-col items-center gap-1">
        <div className={cn("h-3 w-3 rounded-full", color.dot)} />
        <div className="w-px flex-1 bg-border" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-foreground">
            {careLabels[careType ?? "custom"] ?? "Care"}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDueDate(occurredAt)}
          </span>
        </div>
        {amount_ml && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            <Droplets size={14} className="mr-1 inline" aria-hidden />
            {amount_ml}ml
          </p>
        )}
        {fertilizer_name && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            <Leaf size={14} className="mr-1 inline" aria-hidden />
            {fertilizer_name}
          </p>
        )}
        {notes && (
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {notes}
          </p>
        )}
      </div>
    </div>
  );
}
