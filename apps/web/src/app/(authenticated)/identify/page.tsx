"use client";

import { useState, useCallback } from "react";
import { useApp } from "@/lib/context/app-context";
import { identifyPlant, type IdentifyResult, type IdentificationMatch } from "@/lib/data/identify";
import { saveIdentification } from "@/lib/data/identify-history";
import { PhotoPicker, type PickedPhoto } from "@/components/cards/photo-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Camera, Leaf, Loader2, Check, AlertCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

// ── Helpers ────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data:image/...;base64, prefix
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

// ── Page ───────────────────────────────────────────────────

export default function IdentifyPage() {
  const { supabase, user } = useApp();
  const router = useRouter();

  // Photo state
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  // Identify flow state
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedScientificName, setSelectedScientificName] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // ── Photo handlers ──────────────────────────────────────

  const handleAddPhoto = useCallback((newPhotos: PickedPhoto[]) => {
    // Enforce max 1 photo
    setPhotos(newPhotos.slice(0, 1));
    // Reset results when new photo is picked
    setResult(null);
    setError(null);
    setSelectedScientificName(null);
    setCustomName("");
    setShowCustomInput(false);
    setConfirmed(false);
  }, []);

  const handleRemovePhoto = useCallback(() => {
    setPhotos([]);
    setResult(null);
    setError(null);
    setSelectedScientificName(null);
    setCustomName("");
    setShowCustomInput(false);
    setConfirmed(false);
  }, []);

  // ── Identify ─────────────────────────────────────────────

  async function handleIdentify() {
    if (photos.length === 0) return;

    setIdentifying(true);
    setError(null);
    setResult(null);
    setSelectedScientificName(null);
    setCustomName("");
    setShowCustomInput(false);
    setConfirmed(false);

    try {
      const base64 = await blobToBase64(photos[0].blob);
      const identifyResult = await identifyPlant(base64);
      setResult(identifyResult);

      if (identifyResult.error) {
        setError(identifyResult.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to identify plant";
      setError(message);
    } finally {
      setIdentifying(false);
    }
  }

  // ── Select match ──────────────────────────────────────────

  async function handleSelectMatch(match: IdentificationMatch) {
    if (!supabase || !user) return;
    setSelectedScientificName(match.scientificName);
    setSaving(true);
    setError(null);

    try {
      const client = supabase;
      await saveIdentification(client, user.id, {
        photo_path: photos[0]?.name ?? "unknown",
        results: result,
        selected_name: match.scientificName,
        confidence: match.score,
      });

      setConfirmed(true);
      setTimeout(() => {
        router.push("/plants");
      }, 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save identification";
      setError(message);
      setSelectedScientificName(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleCustomSave() {
    if (!supabase || !user || !customName.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const client = supabase;
      await saveIdentification(client, user.id, {
        photo_path: photos[0]?.name ?? "unknown",
        results: result,
        selected_name: customName.trim(),
      });

      setConfirmed(true);
      setTimeout(() => {
        router.push("/plants");
      }, 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save identification";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  // ── Derived state ─────────────────────────────────────────

  const hasPhoto = photos.length > 0;
  const canIdentify = hasPhoto && !identifying;
  const hasResults = result && result.matches.length > 0 && !result.error;
  const isIdle = !identifying && !result && !error;
  const selectedName = customName.trim() || selectedScientificName || "";

  // ── Render ────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground">
            Plant Identifier
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Take or upload a photo to identify a plant species. Results are
            suggestions, not guarantees.
          </p>
        </div>
      </header>

      {/* Disclaimer banner */}
      <div className="mt-4 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
        <p className="leading-5">
          <strong>AI Suggestion.</strong> Identification results are generated by
          an AI model and may be inaccurate or incomplete. Always verify with a
          trusted source before acting on care advice.
        </p>
      </div>

      {/* Error / notice */}
      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          <div className="flex items-center justify-between gap-3">
            <span className="flex-1">{error}</span>
            {hasPhoto && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleIdentify}
                disabled={identifying}
                className="shrink-0 border-red-300 bg-white text-red-700 hover:bg-red-100"
              >
                <RefreshCw size={14} aria-hidden />
                Retry
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation banner */}
      {confirmed && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <Check size={18} aria-hidden />
          {selectedName
            ? `Saved "${selectedName}" — redirecting to plants.`
            : "Identification saved — redirecting to plants."}
        </div>
      )}

      {/* Main content */}
      <section className="mt-6 space-y-6">
        {/* Photo picker */}
        <div className="rounded-md border border-border bg-card p-5 shadow-panel">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Camera size={20} aria-hidden />
            Photo
          </h2>
          <PhotoPicker
            photos={photos}
            onAdd={handleAddPhoto}
            onRemove={handleRemovePhoto}
            maxPhotos={1}
            disabled={identifying || saving}
          />
        </div>

        {/* Identify button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleIdentify}
            disabled={!canIdentify || saving}
            className="min-w-36"
          >
            {identifying ? (
              <>
                <Loader2 className="animate-spin" size={16} aria-hidden />
                Identifying...
              </>
            ) : (
              <>
                <Leaf size={16} aria-hidden />
                Identify
              </>
            )}
          </Button>
          {identifying && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" size={14} aria-hidden />
              Analyzing photo...
            </span>
          )}
        </div>

        {/* Empty / initial state */}
        {isIdle && !hasPhoto && (
          <div className="rounded-md border border-dashed border-border bg-white p-8 text-center">
            <Leaf
              size={48}
              className="mx-auto mb-3 text-muted-foreground/40"
              aria-hidden
            />
            <h3 className="text-lg font-semibold text-foreground">
              Ready to identify
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload or take a photo of a plant above, then tap{" "}
              <strong>Identify</strong> to get AI-powered species suggestions.
            </p>
          </div>
        )}

        {/* Loading state (during identification) */}
        {identifying && (
          <div className="grid min-h-48 place-items-center rounded-md border border-border bg-card shadow-panel">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Loader2
                  className="animate-spin text-primary"
                  size={28}
                  aria-hidden
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Identifying...
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Processing your photo. This may take a few seconds.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results area */}
        {hasResults && !identifying && (
          <div className="space-y-5">
            {/* Submitted photo thumbnail */}
            <div className="rounded-md border border-border bg-card p-5 shadow-panel">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                Submitted photo
              </h3>
              <div className="flex items-center gap-4">
                <img
                  src={photos[0]?.previewUrl}
                  alt={photos[0]?.name ?? "Submitted plant photo"}
                  className="h-24 w-24 rounded-md border border-border object-cover"
                />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {photos[0]?.name ?? "Photo"}
                  </p>
                  <p>
                    Best match confidence:{" "}
                    {result.bestMatch
                      ? formatScore(result.bestMatch.score)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Top matches */}
            <div>
              <h2 className="mb-3 text-lg font-bold">Top matches</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.matches.map((match, index) => (
                  <div
                    key={`${match.scientificName}-${index}`}
                    className={cn(
                      "rounded-md border bg-white p-4 transition",
                      selectedScientificName === match.scientificName
                        ? "border-primary ring-2 ring-ring"
                        : "border-border",
                    )}
                  >
                    {/* Scientific name (italic) */}
                    <h3 className="text-base font-semibold italic text-foreground">
                      {match.scientificName}
                    </h3>

                    {/* Common names */}
                    {match.commonNames.length > 0 && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {match.commonNames.join(", ")}
                      </p>
                    )}

                    {/* Confidence bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Confidence</span>
                        <span>{formatScore(match.score)}</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            match.score >= 0.7
                              ? "bg-emerald-500"
                              : match.score >= 0.4
                                ? "bg-amber-500"
                                : "bg-red-400",
                          )}
                          style={{ width: `${Math.min(match.score * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Genu s hint */}
                    {match.genus && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Genus: <span className="italic">{match.genus}</span>
                      </p>
                    )}

                    {/* Select button */}
                    <Button
                      variant={
                        selectedScientificName === match.scientificName
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => handleSelectMatch(match)}
                      disabled={saving || confirmed}
                    >
                      {saving &&
                      selectedScientificName === match.scientificName ? (
                        <>
                          <Loader2 className="animate-spin" size={14} aria-hidden />
                          Saving...
                        </>
                      ) : selectedScientificName === match.scientificName &&
                        confirmed ? (
                        <>
                          <Check size={14} aria-hidden />
                          Saved
                        </>
                      ) : (
                        "Select this species"
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Create plant with custom name */}
              <div className="mt-4 rounded-md border border-dashed border-border bg-white p-4">
                {!showCustomInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                    disabled={saving || confirmed}
                  >
                    <Leaf size={16} aria-hidden />
                    Create plant with custom name
                  </button>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-foreground">
                      Custom plant name
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. My mystery plant"
                      className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={saving || confirmed}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleCustomSave}
                        disabled={
                          !customName.trim() || saving || confirmed
                        }
                      >
                        {saving ? (
                          <>
                            <Loader2
                              className="animate-spin"
                              size={14}
                              aria-hidden
                            />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomName("");
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error state in results (no matches from API) */}
        {result && result.matches.length === 0 && result.error && !identifying && (
          <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle
              size={32}
              className="mx-auto mb-2 text-red-400"
              aria-hidden
            />
            <p className="text-sm font-medium text-red-800">
              {result.error}
            </p>
            <p className="mt-1 text-xs text-red-600">
              Try a different photo with better lighting and a clear view of the
              leaves and flowers.
            </p>
          </div>
        )}

        {/* Empty result from API (no matches, no error) */}
        {result &&
          result.matches.length === 0 &&
          !result.error &&
          !identifying && (
            <div className="rounded-md border border-dashed border-border bg-white p-6 text-center">
              <Leaf
                size={32}
                className="mx-auto mb-2 text-muted-foreground/40"
                aria-hidden
              />
              <p className="text-sm font-medium text-foreground">
                No matches found
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                The AI couldn&apos;t identify this plant. Try a different photo
                with better lighting.
              </p>
            </div>
          )}
      </section>
    </>
  );
}
