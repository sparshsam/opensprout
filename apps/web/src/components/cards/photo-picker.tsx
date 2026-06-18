"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Camera, ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PhotoPicker — works on both web and Capacitor Android.
 *
 * On web: opens the native file picker for images.
 * On Capacitor Android: also supports camera capture via @capacitor/camera.
 *
 * Props are designed so the parent controls the file list. The picker
 * just produces Blob objects; the parent decides when/where to upload.
 */

export type PickedPhoto = {
  id: string;
  blob: Blob;
  previewUrl: string;
  name: string;
  file: File | null;
};

export type PhotoPickerProps = {
  /** Current set of picked photos (from parent state) */
  photos: PickedPhoto[];
  /** Called when new photos are added */
  onAdd: (photos: PickedPhoto[]) => void;
  /** Called when a photo is removed */
  onRemove: (id: string) => void;
  /** Max number of photos allowed (default 10) */
  maxPhotos?: number;
  /** Whether the picker is disabled (e.g. during upload) */
  disabled?: boolean;
  /** Additional className */
  className?: string;
};

function generateId() {
  return `photo-${crypto.randomUUID().slice(0, 8)}`;
}

// Detect if we're running in a Capacitor native context
function isCapacitorNative(): boolean {
  try {
    return typeof window !== "undefined" && "Capacitor" in window;
  } catch {
    return false;
  }
}

export function PhotoPicker({
  photos,
  onAdd,
  onRemove,
  maxPhotos = 10,
  disabled = false,
  className,
}: PhotoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const canAdd = photos.length < maxPhotos && !disabled;

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!canAdd) return;

    setLoading(true);
    const remaining = maxPhotos - photos.length;
    const batch = Array.from(files).slice(0, remaining);

    const newPhotos: PickedPhoto[] = batch.map((file) => ({
      id: generateId(),
      blob: file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      file,
    }));

    onAdd(newPhotos);
    setLoading(false);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    // Reset so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleCameraCapture() {
    if (!canAdd) return;

    // Check Capacitor native context
    if (!isCapacitorNative()) {
      // On web, open the file picker directly
      fileInputRef.current?.click();
      return;
    }

    // Capacitor native — use Camera plugin
    setLoading(true);
    try {
      const { Camera, CameraResultType } = await import(
        "@capacitor/camera"
      );
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        quality: 80,
        width: 1920,
        height: 1920,
        saveToGallery: false,
      });

      if (!image.webPath) {
        setLoading(false);
        return;
      }

      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const fileName = image.path?.split("/").pop() ?? `camera-${Date.now()}.jpg`;

      const newPhoto: PickedPhoto = {
        id: generateId(),
        blob,
        previewUrl: image.webPath,
        name: fileName,
        file: null,
      };

      onAdd([newPhoto]);
    } catch {
      // Fall back to file picker on error
      fileInputRef.current?.click();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Existing photos */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative">
              <img
                src={photo.previewUrl}
                alt={photo.name}
                className="h-20 w-20 rounded-md border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(photo.id)}
                disabled={disabled}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
                aria-label="Remove photo"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAdd}
          className={cn(
            "flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition",
            canAdd
              ? "hover:border-primary hover:text-primary"
              : "cursor-not-allowed opacity-50",
          )}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ImagePlus size={16} />
          )}
          {loading ? "Loading..." : "Gallery"}
        </button>

        <button
          type="button"
          onClick={handleCameraCapture}
          disabled={!canAdd}
          className={cn(
            "flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition",
            canAdd
              ? "hover:border-primary hover:text-primary"
              : "cursor-not-allowed opacity-50",
          )}
        >
          <Camera size={16} />
          {isCapacitorNative() ? "Camera" : "File picker"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-hidden
        />
      </div>

      {photos.length >= maxPhotos && (
        <p className="text-xs text-muted-foreground">
          Max {maxPhotos} photos reached.
        </p>
      )}
    </div>
  );
}
