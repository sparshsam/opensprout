"use client";

import { useState, useEffect } from "react";
import { Loader2, CameraIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { getPlantCoverUrl } from "@/lib/data/photos";

/**
 * CoverPhoto — resolves a plant's cover_photo_path from Supabase Storage
 * and displays it as a thumbnail. Falls back to a placeholder if none set.
 */
export function CoverPhoto({
  coverPhotoPath,
  className,
}: {
  coverPhotoPath: string | null;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coverPhotoPath) {
      setUrl(null);
      return;
    }

    let mounted = true;
    setLoading(true);

    try {
      const supabase = createClient();
      getPlantCoverUrl(supabase, coverPhotoPath)
        .then((signedUrl) => {
          if (mounted) setUrl(signedUrl);
        })
        .catch(() => {
          if (mounted) setUrl(null);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    } catch {
      if (mounted) setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [coverPhotoPath]);

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted",
          className,
        )}
      >
        <Loader2 size={16} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (url) {
    return (
      <img
        src={url}
        alt="Plant cover"
        className={cn("object-cover", className)}
      />
    );
  }

  // Fallback placeholder
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted text-muted-foreground/40",
        className,
      )}
    >
      <CameraIcon size={32} aria-hidden />
    </div>
  );
}
