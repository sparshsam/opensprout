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

// ── Helpers ──

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
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

// ── Page ──

export default function IdentifyPage() {
  const { supabase, user } = useApp();
  const router = useRouter();

  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedScientificName, setSelectedScientificName] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleAddPhoto = useCallback((newPhotos: PickedPhoto[]) => {
    setPhotos(newPhotos.slice(0, 1));
    setResult(null); setError(null); setSelectedScientificName(null);
    setCustomName(""); setShowCustomInput(false); setConfirmed(false);
  }, []);

  const handleRemovePhoto = useCallback(() => {
    setPhotos([]); setResult(null); setError(null); setSelectedScientificName(null);
    setCustomName(""); setShowCustomInput(false); setConfirmed(false);
  }, []);

  async function handleIdentify() {
    if (photos.length === 0) return;
    setIdentifying(true); setError(null); setResult(null);
    setSelectedScientificName(null); setCustomName(""); setShowCustomInput(false); setConfirmed(false);
    try {
      const base64 = await blobToBase64(photos[0].blob);
      const identifyResult = await identifyPlant(base64);
      setResult(identifyResult);
      if (identifyResult.error) setError(identifyResult.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to identify plant");
    } finally { setIdentifying(false); }
  }

  async function handleSelectMatch(match: IdentificationMatch) {
    if (!supabase || !user) return;
    setSelectedScientificName(match.scientificName); setSaving(true); setError(null);
    try {
      const client = supabase;
      await saveIdentification(client, user.id, {
        photo_path: photos[0]?.name ?? "unknown",
        results: result,
        selected_name: match.scientificName,
        confidence: match.score,
      });
      setConfirmed(true);
      setTimeout(() => router.push("/plants"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save identification");
      setSelectedScientificName(null);
    } finally { setSaving(false); }
  }

  async function handleCustomSave() {
    if (!supabase || !user || !customName.trim()) return;
    setSaving(true); setError(null);
    try {
      const client = supabase;
      await saveIdentification(client, user.id, {
        photo_path: photos[0]?.name ?? "unknown",
        results: result,
        selected_name: customName.trim(),
      });
      setConfirmed(true);
      setTimeout(() => router.push("/plants"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save identification");
    } finally { setSaving(false); }
  }

  const hasPhoto = photos.length > 0;
  const canIdentify = hasPhoto && !identifying;
  const hasResults = result && result.matches.length > 0 && !result.error;
  const isIdle = !identifying && !result && !error;
  const selectedName = customName.trim() || selectedScientificName || "";

  return (
    <>
      {/* ── Header ── */}
      <div className="mb-12">
        <p className="text-label mb-2 text-primary">Scanning station</p>
        <h1 className="text-hero text-foreground">Identify</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Take or upload a photo to identify a plant species. Results are suggestions, not guarantees.
        </p>
      </div>

      {/* ── Error / notice ── */}
      {error && (
        <div className="mb-8 rounded-full bg-destructive/10 px-6 py-3 text-sm font-semibold text-destructive">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            {hasPhoto && (
              <button
                onClick={handleIdentify}
                disabled={identifying}
                className="rounded-full bg-destructive/20 px-4 py-1.5 text-xs font-bold tracking-wider uppercase"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {confirmed && (
        <div className="mb-8 rounded-full bg-primary/10 px-6 py-3 text-sm font-semibold text-primary">
          <Check size={16} className="inline" aria-hidden />
          {selectedName
            ? `Saved "${selectedName}" — redirecting to Plants.`
            : "Identification saved."}
        </div>
      )}

      {/* ── Flow: Photo → Identify → Result ── */}
      <section className="max-w-lg space-y-8">
        {/* 1. Photo */}
        <div>
          <p className="text-label mb-4 text-muted-foreground">1. Photo</p>
          <div className="rounded-2xl bg-muted p-6 transition hover:bg-muted/80">
            <PhotoPicker
              photos={photos}
              onAdd={handleAddPhoto}
              onRemove={handleRemovePhoto}
              maxPhotos={1}
              disabled={identifying || saving}
            />
          </div>
        </div>

        {/* 2. Identify */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleIdentify}
            disabled={!canIdentify || saving}
            className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-40"
          >
            {identifying ? (
              <><Loader2 className="animate-spin inline" size={16} /> Identifying...</>
            ) : (
              <><Leaf size={16} className="inline" /> Identify</>
            )}
          </button>
          {identifying && (
            <span className="text-xs text-muted-foreground">Analyzing photo...</span>
          )}
        </div>

        {/* 3. Idle state */}
        {isIdle && !hasPhoto && (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-foreground">Ready to identify</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Upload or take a photo above, then tap <strong>Identify</strong>.
            </p>
          </div>
        )}

        {/* 3. Identifying */}
        {identifying && (
          <div className="rounded-full bg-muted px-6 py-4 text-center">
            <Loader2 className="animate-spin inline text-primary" size={20} />
            <p className="mt-2 text-sm font-semibold text-foreground">Identifying...</p>
            <p className="text-xs text-muted-foreground">Processing your photo.</p>
          </div>
        )}

        {/* 4. Results */}
        {hasResults && !identifying && (
          <div className="space-y-6">
            {/* Submitted photo */}
            <div className="flex items-center gap-4">
              <img
                src={photos[0]?.previewUrl}
                alt={photos[0]?.name ?? "Submitted photo"}
                className="h-16 w-16 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {photos[0]?.name ?? "Photo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Best match: {result.bestMatch ? formatScore(result.bestMatch.score) : "N/A"}
                </p>
              </div>
            </div>

            {/* Matches */}
            <div className="space-y-3">
              {result.matches.map((match, index) => (
                <div
                  key={`${match.scientificName}-${index}`}
                  className={cn(
                    "rounded-full bg-muted/50 px-6 py-4 transition",
                    selectedScientificName === match.scientificName && "ring-2 ring-primary",
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold italic text-foreground">{match.scientificName}</p>
                      {match.commonNames.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {match.commonNames.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-bold text-muted-foreground">{formatScore(match.score)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      onClick={() => handleSelectMatch(match)}
                      disabled={saving || confirmed}
                      className={cn(
                        "rounded-full px-5 py-2 text-xs font-semibold transition",
                        selectedScientificName === match.scientificName
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80",
                      )}
                    >
                      {saving && selectedScientificName === match.scientificName ? (
                        <><Loader2 className="animate-spin inline" size={12} /> Saving...</>
                      ) : selectedScientificName === match.scientificName && confirmed ? (
                        <><Check size={12} className="inline" /> Saved</>
                      ) : (
                        "Select"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom name */}
            <div className="border-t border-border pt-6">
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                  disabled={saving || confirmed}
                >
                  <Leaf size={14} /> Create plant with custom name
                </button>
              ) : (
                <div className="space-y-4">
                  <label className="text-label block text-muted-foreground">Custom plant name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. My mystery plant"
                    className="h-12 w-full rounded-full bg-muted px-5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={saving || confirmed}
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleCustomSave}
                      disabled={!customName.trim() || saving || confirmed}
                      className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold tracking-wider uppercase text-primary-foreground hover:brightness-110 disabled:opacity-40"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => { setShowCustomInput(false); setCustomName(""); }}
                      disabled={saving}
                      className="rounded-full bg-muted px-6 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error state (no matches) */}
        {result && result.matches.length === 0 && result.error && !identifying && (
          <div className="py-8 text-center">
            <AlertCircle size={24} className="mx-auto text-destructive" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-foreground">No matches found</p>
            <p className="mt-1 text-xs text-muted-foreground">Try a different photo.</p>
            {hasPhoto && (
              <button
                onClick={handleIdentify}
                className="mt-6 rounded-full bg-primary px-6 py-2.5 text-xs font-bold tracking-wider uppercase text-primary-foreground hover:brightness-110"
              >
                <RefreshCw size={12} className="inline" /> Try again
              </button>
            )}
          </div>
        )}
      </section>
    </>
  );
}
