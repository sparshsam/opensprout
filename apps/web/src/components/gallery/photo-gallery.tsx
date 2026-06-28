"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  listPlantPhotos,
  getPhotoSignedUrl,
  deletePhoto,
  uploadPlantPhoto,
} from "@/lib/data/photos";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Trash2, Upload, X,
  Loader2, Image as ImageIcon,
} from "lucide-react";
import type { JournalPhotoRow } from "@/lib/data/types";

interface PhotoGalleryProps {
  plantId: string;
  currentCoverPath: string | null;
  onCoverChanged: () => void;
}

export function PhotoGallery({
  plantId,
  currentCoverPath,
  onCoverChanged,
}: PhotoGalleryProps) {
  const { supabase, user, refreshDashboard } = useApp();
  const [photos, setPhotos] = useState<(JournalPhotoRow & { url: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    try {
      const rows = await listPlantPhotos(supabase, user.id, plantId);
      const withUrls = await Promise.all(
        rows.map(async (row) => {
          try {
            const url = await getPhotoSignedUrl(supabase, row.object_path);
            return { ...row, url };
          } catch {
            return { ...row, url: "" };
          }
        }),
      );
      setPhotos(withUrls);
    } finally {
      setLoading(false);
    }
  }, [supabase, user, plantId]);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(file: File) {
    if (!supabase || !user) return;
    setUploading(true);
    try {
      await uploadPlantPhoto(supabase, user.id, plantId, file, {
        sortOrder: photos.length,
      });
      await load();
      await refreshDashboard();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photoId: string) {
    if (!supabase || !user) return;
    if (!window.confirm("Delete this photo?")) return;
    setDeletingId(photoId);
    try {
      await deletePhoto(supabase, user.id, photoId);
      await load();
      await refreshDashboard();
      if (selectedIndex !== null) {
        setSelectedIndex(
          selectedIndex >= photos.length - 1 ? null : selectedIndex,
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  // Show "no photos" upload prompt when empty
  if (!loading && photos.length === 0) {
    return (
      <div className="aspect-[4/3] w-full rounded-3xl bg-muted flex flex-col items-center justify-center gap-4">
        <ImageIcon size={40} className="text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No photos yet</p>
        <label className="cursor-pointer rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:brightness-110 transition">
          {uploading ? <Loader2 className="animate-spin inline" size={12} /> : <Upload size={12} className="inline" />}
          {" "}Upload photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    );
  }

  return (
    <div>
      {/* Main photo or first photo as cover */}
      <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-muted">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : photos.length > 0 ? (
          <img
            src={photos[selectedIndex ?? 0].url}
            alt="Plant photo"
            className="h-full w-full object-cover"
          />
        ) : null}

        {/* Nav arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() =>
                setSelectedIndex(
                  ((selectedIndex ?? 0) - 1 + photos.length) % photos.length,
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() =>
                setSelectedIndex(
                  ((selectedIndex ?? 0) + 1) % photos.length,
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Photo count badge */}
        {photos.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white">
            {(selectedIndex ?? 0) + 1} / {photos.length}
          </span>
        )}

        {/* Delete button */}
        {photos.length > 0 && (
          <button
            onClick={() =>
              handleDelete(photos[selectedIndex ?? 0].id)
            }
            disabled={deletingId !== null}
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition disabled:opacity-40"
          >
            {deletingId ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "h-14 w-14 shrink-0 rounded-xl overflow-hidden border-2 transition",
                (selectedIndex ?? 0) === i
                  ? "border-primary"
                  : "border-transparent hover:border-border",
              )}
            >
              <img
                src={photo.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
          {/* Upload button */}
          <label className="h-14 w-14 shrink-0 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition">
            {uploading ? (
              <Loader2 className="animate-spin text-muted-foreground" size={16} />
            ) : (
              <Upload size={16} className="text-muted-foreground" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}

      {/* Upload button when only 1 photo */}
      {photos.length === 1 && (
        <div className="mt-3 flex justify-center">
          <label className="cursor-pointer rounded-full bg-muted px-5 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/80 transition">
            {uploading ? (
              <Loader2 className="animate-spin inline" size={12} />
            ) : (
              <Upload size={12} className="inline" />
            )}
            {" "}Add photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
