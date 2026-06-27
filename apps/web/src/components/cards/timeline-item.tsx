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
  water: { bg: "bg-sky-50 border-sky-200 dark:bg-sky-950 dark:border-sky-800", dot: "bg-sky-400 dark:bg-sky-500", icon: "text-sky-600 dark:text-sky-400" },
  fertilize: { bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800", dot: "bg-emerald-400 dark:bg-emerald-500", icon: "text-emerald-600 dark:text-emerald-400" },
  mist: { bg: "bg-cyan-50 border-cyan-200 dark:bg-cyan-950 dark:border-cyan-800", dot: "bg-cyan-400 dark:bg-cyan-500", icon: "text-cyan-600 dark:text-cyan-400" },
  rotate: { bg: "bg-violet-50 border-violet-200 dark:bg-violet-950 dark:border-violet-800", dot: "bg-violet-400 dark:bg-violet-500", icon: "text-violet-600 dark:text-violet-400" },
  prune: { bg: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800", dot: "bg-orange-400 dark:bg-orange-500", icon: "text-orange-600 dark:text-orange-400" },
  repot: { bg: "bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800", dot: "bg-rose-400 dark:bg-rose-500", icon: "text-rose-600 dark:text-rose-400" },
  inspect: { bg: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800", dot: "bg-amber-400 dark:bg-amber-500", icon: "text-amber-600 dark:text-amber-400" },
  custom: { bg: "bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800", dot: "bg-slate-400 dark:bg-slate-500", icon: "text-slate-600 dark:text-slate-400" },
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
  if (score >= 5) return { label: "Thriving", color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800" };
  if (score >= 4) return { label: "Good", color: "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800" };
  if (score >= 3) return { label: "Stable", color: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800" };
  if (score >= 2) return { label: "Needs attention", color: "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800" };
  return { label: "Struggling", color: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800" };
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
