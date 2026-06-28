"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Camera, ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PhotoPicker — works on web and Capacitor Android.
 *
 * - Gallery button: opens native file picker for images (accept="image/*")
 * - Camera button: uses capture="environment" on web (triggers device camera
 *   directly on iOS Safari, Chrome Android, etc.) or Capacitor Camera plugin
 *   when running natively.
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
  photos: PickedPhoto[];
  onAdd: (photos: PickedPhoto[]) => void;
  onRemove: (id: string) => void;
  maxPhotos?: number;
  disabled?: boolean;
  className?: string;
};

function generateId() {
  return `photo-${crypto.randomUUID().slice(0, 8)}`;
}

function isCapacitorNative(): boolean {
  try {
    return typeof window !== "undefined" && "Capacitor" in window;
  } catch {
    return false;
  }
}

/** Check if we're on a mobile device likely to have a camera. */
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function PhotoPicker({
  photos,
  onAdd,
  onRemove,
  maxPhotos = 10,
  disabled = false,
  className,
}: PhotoPickerProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const canAdd = photos.length < maxPhotos && !disabled;

  function processFiles(files: FileList | null) {
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

  function handleGalleryChange(e: ChangeEvent<HTMLInputElement>) {
    processFiles(e.target.files);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  function handleCameraChange(e: ChangeEvent<HTMLInputElement>) {
    processFiles(e.target.files);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  async function handleCameraCapture() {
    if (!canAdd) return;

    if (isCapacitorNative()) {
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
        const fileName =
          image.path?.split("/").pop() ?? `camera-${Date.now()}.jpg`;

        const newPhoto: PickedPhoto = {
          id: generateId(),
          blob,
          previewUrl: image.webPath,
          name: fileName,
          file: null,
        };

        onAdd([newPhoto]);
      } catch {
        // Fallback to file picker
        galleryInputRef.current?.click();
      } finally {
        setLoading(false);
      }
      return;
    }

    // Web / PWA — use capture="environment" to open the native camera
    // This works on:
    //   - iOS Safari  (opens Camera app)
    //   - Chrome iOS  (opens Camera app)
    //   - Chrome Android (opens Camera app)
    //   - Samsung Internet
    //   - All modern mobile browsers
    // On desktop, it falls back to the file picker.
    cameraInputRef.current?.click();
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
        {/* Gallery — opens the standard file picker for images */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
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

        {/* Camera — uses capture attribute on web, Capacitor plugin natively */}
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
          {isCapacitorNative()
            ? "Camera"
            : isMobileDevice()
              ? "Camera"
              : "Take photo"}
        </button>

        {/* Hidden file input for gallery (standard image picker) */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryChange}
          className="hidden"
          aria-hidden
        />

        {/* Hidden file input for camera (capture="environment" triggers native camera on mobile) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple={false}
          onChange={handleCameraChange}
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
