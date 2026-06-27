"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import { Download, LogOut, Upload, Bell, BellOff, Loader2, Database, ExternalLink, ArrowRight, Leaf, Sprout, Shield, Settings, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadReminderPrefs, saveReminderPrefs, requestNotificationPermission } from "@/lib/data/reminders";
import type { ReminderPreferences } from "@/lib/data/reminders";
import { readImportFile, executeImport, type ImportResult } from "@/lib/data/import";
import { cn } from "@/lib/utils";

const LEAD_TIME_OPTIONS = [{ value: 15, label: "15 min" }, { value: 30, label: "30 min" }, { value: 60, label: "1 hour" }, { value: 120, label: "2 hours" }, { value: 1440, label: "1 day" }];

function SectionCard({ title, icon: Icon, children, className }: { title: string; icon: React.ElementType; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border/40 bg-white p-6 sm:p-8 dark:bg-muted", className)}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={18} />
        </div>
        <p className="text-sm font-bold tracking-wider uppercase text-muted-foreground">{title}</p>
      </div>
      {children}
    </section>
  );
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-border last:border-b-0">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user, data, handleSignOut, supabase, handleClearCache } = useApp();
  const [prefs, setPrefs] = useState<ReminderPreferences>(loadReminderPrefs);
  const [permRequested, setPermRequested] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => { saveReminderPrefs(prefs); }, [prefs]);
  const handleToggle = useCallback(async () => { const n = !prefs.enabled; if (n && !permRequested) { setPermRequested(true); await requestNotificationPermission(); } setPrefs((p) => ({ ...p, enabled: n })); }, [prefs.enabled, permRequested]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  function exportData() { const p = JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), ...data }, null, 2); const b = new Blob([p], { type: "application/json" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "opensprout-backup.json"; a.click(); URL.revokeObjectURL(u); }
  async function handleImport(f: File) { setImporting(true); setImportResult(null); try { const { data: parsed, errors } = await readImportFile(f); if (!parsed) { setImportResult({ imported: { plants: 0, schedules: 0, logs: 0 }, errors: errors.map((e) => `${e.record}: ${e.message}`), filename: f.name }); return; } const r = await executeImport(supabase!, user!.id, parsed); setImportResult({ ...r, filename: f.name }); } catch (e) { setImportResult({ imported: { plants: 0, schedules: 0, logs: 0 }, errors: [(e as Error).message], filename: f.name }); } finally { setImporting(false); } }
  async function deleteAccount() { if (!supabase || !user) return; if (!window.confirm("Delete your account and all data? This cannot be undone.")) return; setDeleting(true); try { const { error } = await supabase.rpc("delete_account"); if (error) throw error; await handleSignOut(); } catch { alert("Failed to delete account."); } finally { setDeleting(false); } }

  return (
    <>
      <div className="mb-12">
        <p className="text-label mb-2 text-primary">Settings</p>
        <h1 className="text-hero text-foreground">Profile</h1>
      </div>

      <div className="mx-auto max-w-5xl space-y-8">
        {/* Account bar — full width */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 dark:bg-muted">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sprout size={28} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">Signed in · {data.plants.length} plant{data.plants.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut size={14} /> Logout
            </Button>
          </div>
        </div>

        {/* Cards grid — 2 columns on md+ */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* Overview */}
          <SectionCard title="Overview" icon={Leaf}>
            <div className="space-y-0">
              <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Plants</span>
                <span className="text-sm text-muted-foreground">{data.plants.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <span className="text-sm font-semibold text-foreground">Care logs</span>
                <span className="text-sm text-muted-foreground">{data.logs.length}</span>
              </div>
            </div>
          </SectionCard>

          {/* Notifications & Reminders */}
          <SectionCard title="Reminders" icon={Bell}>
            <div className="space-y-0">
              <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                <button role="switch" aria-checked={prefs.enabled} onClick={handleToggle} className={cn("relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", prefs.enabled ? "bg-primary" : "bg-muted")}>
                  <span className={cn("pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform", prefs.enabled ? "translate-x-[18px]" : "translate-x-0.5")} />
                </button>
              </div>
              {prefs.enabled && (
                <>
                  <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">Lead time</span>
                    <select value={prefs.leadTimeMinutes} onChange={(e) => setPrefs((p) => ({ ...p, leadTimeMinutes: Number(e.target.value) }))} className="rounded-full bg-muted px-4 py-2 text-xs font-semibold text-foreground outline-none">
                      {LEAD_TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">Quiet start</span>
                    <Input type="time" value={prefs.quietHoursStart ?? ""} onChange={(e) => setPrefs((p) => ({ ...p, quietHoursStart: e.target.value || null }))} className="w-32 rounded-full bg-muted px-4 py-2 text-xs" />
                  </div>
                  <div className="flex items-center justify-between gap-4 py-4">
                    <span className="text-sm font-semibold text-foreground">Quiet end</span>
                    <Input type="time" value={prefs.quietHoursEnd ?? ""} onChange={(e) => setPrefs((p) => ({ ...p, quietHoursEnd: e.target.value || null }))} className="w-32 rounded-full bg-muted px-4 py-2 text-xs" />
                  </div>
                </>
              )}
            </div>
          </SectionCard>

          {/* Data */}
          <SectionCard title="Data" icon={Database}>
            <div className="space-y-0">
              <SettingsRow label="Export">
                <button onClick={exportData} className="rounded-full bg-muted px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80"><Download size={14} className="inline" /> Export</button>
              </SettingsRow>
              <SettingsRow label="Import">
                <button onClick={() => fileRef.current?.click()} disabled={importing} className="rounded-full bg-muted px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80 disabled:opacity-40">{importing ? <Loader2 size={14} className="animate-spin inline" /> : <Upload size={14} className="inline" />}{importing ? "Importing..." : "Import"}</button>
              </SettingsRow>
              <SettingsRow label="Cache">
                <button onClick={handleClearCache} className="rounded-full bg-muted px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80"><Database size={14} className="inline" /> Clear</button>
              </SettingsRow>
              <SettingsRow label="Delete account">
                <button onClick={deleteAccount} disabled={deleting} className="rounded-full bg-destructive/5 px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-destructive hover:bg-destructive/10 disabled:opacity-40">{deleting ? <Loader2 size={14} className="animate-spin inline" /> : null}{deleting ? "Deleting..." : "Delete"}</button>
              </SettingsRow>
            </div>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }} />
            {importResult && (
              <div className="mt-4 space-y-2">
                {importResult.errors.length === 0 && importResult.imported.plants + importResult.imported.schedules + importResult.imported.logs > 0 && (
                  <p className="text-sm text-primary">Imported {importResult.imported.plants} plant{importResult.imported.plants !== 1 ? "s" : ""}, {importResult.imported.schedules} schedule{importResult.imported.schedules !== 1 ? "s" : ""}, {importResult.imported.logs} log{importResult.imported.logs !== 1 ? "s" : ""}.</p>
                )}
                {importResult.errors.length > 0 && (
                  <div className="rounded-full bg-destructive/5 px-6 py-3">
                    <p className="text-xs font-semibold text-destructive">{importResult.errors.length} error{importResult.errors.length !== 1 ? "s" : ""}</p>
                    <ul className="mt-1 list-inside list-disc text-xs text-destructive/80">{importResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* AI Access */}
          <SectionCard title="AI Access" icon={Shield}>
            <p className="text-sm text-muted-foreground mb-5">Personal access tokens for AI agents to interact with your plant data via MCP.</p>
            <a href="/settings/mcp" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-6 py-3 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80">Manage tokens <ArrowRight size={12} /></a>
          </SectionCard>

          {/* About */}
          <SectionCard title="About" icon={Info} className="md:col-span-2">
            <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center justify-between gap-4 py-4 border-b border-border sm:border-b-0 sm:border-r sm:pr-6">
                <span className="text-sm font-semibold text-foreground">Version</span>
                <span className="text-xs text-muted-foreground">v0.9.14</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-4 border-b border-border sm:border-b-0 sm:px-6 lg:border-r">
                <span className="text-sm font-semibold text-foreground">About</span>
                <a href="/about" className="rounded-full bg-muted px-5 py-2 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80"><Leaf size={12} className="inline" /> About</a>
              </div>
              <div className="flex items-center justify-between gap-4 py-4 border-b border-border sm:border-b-0 sm:px-6 lg:border-r">
                <span className="text-sm font-semibold text-foreground">Privacy</span>
                <a href="/privacy" className="rounded-full bg-muted px-5 py-2 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80"><ExternalLink size={12} className="inline" /> View</a>
              </div>
              <div className="flex items-center justify-between gap-4 py-4 sm:pl-6">
                <span className="text-sm font-semibold text-foreground">Terms</span>
                <a href="/terms" className="rounded-full bg-muted px-5 py-2 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80"><ExternalLink size={12} className="inline" /> View</a>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-foreground">Support</span>
              <a href="/support" className="rounded-full bg-muted px-5 py-2 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80"><ExternalLink size={12} className="inline" /> View</a>
            </div>
          </SectionCard>

        </div>
      </div>
    </>
  );
}
