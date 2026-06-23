"use client";

import { useState, useCallback } from "react";
import { useApp } from "@/lib/context/app-context";
import { useAtmosphere } from "@/lib/hooks/use-atmosphere";
import { identifyPlant, type IdentifyResult, type IdentificationMatch } from "@/lib/data/identify";
import { saveIdentification } from "@/lib/data/identify-history";
import { PhotoPicker, type PickedPhoto } from "@/components/cards/photo-picker";
import { cn } from "@/lib/utils";
import { Leaf, Loader2, Check, AlertCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve((r.result as string).split(",")[1] ?? r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function fmt(s: number) { return `${Math.round(s * 100)}%`; }

export default function IdentifyPage() {
  const { supabase, user } = useApp();
  const { greeting } = useAtmosphere();
  const router = useRouter();

  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const addPhoto = useCallback((p: PickedPhoto[]) => { setPhotos(p.slice(0, 1)); setResult(null); setError(null); setSelected(null); setCustomName(""); setShowCustom(false); setConfirmed(false); }, []);
  const removePhoto = useCallback(() => { setPhotos([]); setResult(null); setError(null); setSelected(null); setCustomName(""); setShowCustom(false); setConfirmed(false); }, []);

  async function identify() {
    if (photos.length === 0) return;
    setIdentifying(true); setError(null); setResult(null); setSelected(null); setCustomName(""); setShowCustom(false); setConfirmed(false);
    try { const b = await blobToBase64(photos[0].blob); const r = await identifyPlant(b); setResult(r); if (r.error) setError(r.error); } catch (e) { setError(e instanceof Error ? e.message : "Failed to identify"); } finally { setIdentifying(false); }
  }

  async function selectMatch(m: IdentificationMatch) {
    if (!supabase || !user) return; setSelected(m.scientificName); setSaving(true); setError(null);
    try { const c = supabase; await saveIdentification(c, user.id, { photo_path: photos[0]?.name ?? "unknown", results: result, selected_name: m.scientificName, confidence: m.score }); setConfirmed(true); setTimeout(() => router.push("/plants"), 1200); } catch (e) { setError(e instanceof Error ? e.message : "Failed to save"); setSelected(null); } finally { setSaving(false); }
  }

  async function saveCustom() {
    if (!supabase || !user || !customName.trim()) return; setSaving(true); setError(null);
    try { const c = supabase; await saveIdentification(c, user.id, { photo_path: photos[0]?.name ?? "unknown", results: result, selected_name: customName.trim() }); setConfirmed(true); setTimeout(() => router.push("/plants"), 1200); } catch (e) { setError(e instanceof Error ? e.message : "Failed to save"); } finally { setSaving(false); }
  }

  const hasPhoto = photos.length > 0;
  const canId = hasPhoto && !identifying;
  const hasResults = result && result.matches.length > 0 && !result.error;
  const isIdle = !identifying && !result && !error;

  return (
    <>
      <div className="mb-14">
        <p className="text-label mb-2 text-primary">{greeting}</p>
        <h1 className="text-hero text-foreground">Identify</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">Take or upload a photo to identify a plant species. Results are suggestions, not guarantees.</p>
      </div>

      {error && (<div className="mb-10 rounded-full bg-destructive/10 px-6 py-3 text-sm font-semibold text-destructive"><div className="flex items-center justify-between gap-3"><span>{error}</span>{hasPhoto && <button onClick={identify} disabled={identifying} className="rounded-full bg-destructive/20 px-4 py-1.5 text-xs font-bold tracking-wider uppercase">Retry</button>}</div></div>)}
      {confirmed && (<div className="mb-10 rounded-full bg-primary/10 px-6 py-3 text-sm font-semibold text-primary"><Check size={16} className="inline" /> Saved — redirecting.</div>)}

      <section className="max-w-lg space-y-10">
        {/* 1. Capture */}
        <div><p className="text-label mb-4 text-muted-foreground">1. Capture</p><div className="rounded-2xl bg-muted p-6"><PhotoPicker photos={photos} onAdd={addPhoto} onRemove={removePhoto} maxPhotos={1} disabled={identifying || saving} /></div></div>

        {/* 2. Analyze */}
        <div className="flex items-center gap-4">
          <button onClick={identify} disabled={!canId || saving} className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-40">
            {identifying ? <><Loader2 className="animate-spin inline" size={16} /> Analyzing...</> : <><Leaf size={16} className="inline" /> Identify</>}
          </button>
          {identifying && <span className="text-xs text-muted-foreground">Processing photo...</span>}
        </div>

        {/* 3. Idle */}
        {isIdle && !hasPhoto && (<div className="py-10 text-center"><p className="text-sm font-semibold text-foreground">Ready to identify</p><p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">Upload or take a photo above, then tap <strong>Identify</strong>.</p></div>)}

        {/* 3. Analyzing */}
        {identifying && (<div className="rounded-full bg-muted px-6 py-5 text-center"><Loader2 className="animate-spin inline text-primary" size={20} /><p className="mt-2 text-sm font-semibold text-foreground">Analyzing your photo</p><p className="text-xs text-muted-foreground">This may take a few seconds.</p></div>)}

        {/* 4. Results */}
        {hasResults && !identifying && (<div className="space-y-8">
          <div className="flex items-center gap-5"><img src={photos[0]?.previewUrl} alt="" className="h-20 w-20 rounded-full object-cover" /><div><p className="text-sm font-semibold text-foreground">{photos[0]?.name ?? "Photo"}</p><p className="text-xs text-muted-foreground">Best match: {result.bestMatch ? fmt(result.bestMatch.score) : "N/A"}</p></div></div>
          <div className="space-y-3">{result.matches.map((m, i) => (<div key={`${m.scientificName}-${i}`} className={cn("rounded-2xl bg-muted/50 px-6 py-5 transition", selected === m.scientificName && "ring-2 ring-primary")}>
            <div className="flex items-start justify-between gap-4"><div className="min-w-0 flex-1"><p className="text-base font-semibold italic text-foreground">{m.scientificName}</p>{m.commonNames.length > 0 && <p className="text-xs text-muted-foreground mt-1">{m.commonNames.join(", ")}</p>}</div><span className="shrink-0 text-xs font-bold text-muted-foreground">{fmt(m.score)}</span></div>
            <div className="mt-4"><button onClick={() => selectMatch(m)} disabled={saving || confirmed} className={cn("rounded-full px-6 py-2.5 text-xs font-bold tracking-wider uppercase transition", selected === m.scientificName ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80")}>{saving && selected === m.scientificName ? <Loader2 className="animate-spin inline" size={12} /> : selected === m.scientificName && confirmed ? <Check size={12} className="inline" /> : "Select this species"}</button></div>
          </div>))}</div>
          <div className="border-t border-border pt-6">{!showCustom ? <button type="button" onClick={() => setShowCustom(true)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground" disabled={saving || confirmed}><Leaf size={14} /> Custom name</button> : <div className="space-y-4"><label className="text-label block text-muted-foreground">Custom name</label><input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. My mystery plant" className="h-12 w-full rounded-full bg-muted px-5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" disabled={saving || confirmed} autoFocus /><div className="flex gap-3"><button onClick={saveCustom} disabled={!customName.trim() || saving || confirmed} className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold tracking-wider uppercase text-primary-foreground hover:brightness-110 disabled:opacity-40">{saving ? "Saving..." : "Save"}</button><button onClick={() => { setShowCustom(false); setCustomName(""); }} disabled={saving} className="rounded-full bg-muted px-6 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80">Cancel</button></div></div>}</div>
        </div>)}

        {result && result.matches.length === 0 && result.error && !identifying && (<div className="py-10 text-center"><AlertCircle size={24} className="mx-auto text-destructive" /><p className="mt-3 text-sm font-semibold text-foreground">No matches found</p><p className="text-xs text-muted-foreground">Try a different photo.</p>{hasPhoto && <button onClick={identify} className="mt-6 rounded-full bg-primary px-6 py-2.5 text-xs font-bold tracking-wider uppercase text-primary-foreground hover:brightness-110"><RefreshCw size={12} className="inline" /> Try again</button>}</div>)}
      </section>
    </>
  );
}
