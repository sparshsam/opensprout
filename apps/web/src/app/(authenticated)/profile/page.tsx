"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  Download, LogOut, Upload, Key, Sun, Moon, User, Bell, BellOff,
  Loader2, Flower2, ExternalLink, Trash2, Database, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadReminderPrefs, saveReminderPrefs, requestNotificationPermission } from "@/lib/data/reminders";
import type { ReminderPreferences } from "@/lib/data/reminders";
import { readImportFile, executeImport, type ImportResult } from "@/lib/data/import";
import { useTheme } from "@/lib/context/theme-context";
import { cn } from "@/lib/utils";

const LEAD_TIME_OPTIONS = [
  { value: 15, label: "15 min" }, { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" }, { value: 120, label: "2 hours" }, { value: 1440, label: "1 day" },
];

export default function ProfilePage() {
  const { user, data, handleSignOut, supabase, handleClearCache } = useApp();
  const { resolved, toggle } = useTheme();

  const [prefs, setPrefs] = useState<ReminderPreferences>(loadReminderPrefs);
  const [permRequested, setPermRequested] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDataPrivacy, setShowDataPrivacy] = useState(false);

  useEffect(() => { saveReminderPrefs(prefs); }, [prefs]);

  const handleToggle = useCallback(async () => {
    const nextEnabled = !prefs.enabled;
    if (nextEnabled && !permRequested) { setPermRequested(true); await requestNotificationPermission(); }
    setPrefs((prev) => ({ ...prev, enabled: nextEnabled }));
  }, [prefs.enabled, permRequested]);

  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function exportData() {
    const payload = JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), ...data }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "opensprout-backup.json"; anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    setImporting(true); setImportResult(null);
    try {
      const { data: parsed, errors } = await readImportFile(file);
      if (!parsed) { setImportResult({ imported: { plants: 0, schedules: 0, logs: 0 }, errors: errors.map((e) => `${e.record}: ${e.message}`), filename: file.name }); return; }
      const result = await executeImport(supabase!, user!.id, parsed);
      setImportResult({ ...result, filename: file.name });
    } catch (e) { setImportResult({ imported: { plants: 0, schedules: 0, logs: 0 }, errors: [(e as Error).message], filename: file.name }); }
    finally { setImporting(false); }
  }

  async function handleDeleteAccount() {
    if (!supabase || !user) return;
    if (!window.confirm("Are you sure you want to delete your account and all data? This cannot be undone.")) return;
    setDeletingAccount(true);
    try {
      const { error } = await supabase.rpc("delete_account");
      if (error) throw error;
      await handleSignOut();
    } catch { alert("Failed to delete account. Please contact sparshsam@gmail.com for help."); }
    finally { setDeletingAccount(false); }
  }

  return (
    <>
      <header className="pb-10">
        <h1 className="text-5xl font-bold tracking-tight md:text-6xl">Profile</h1>
        <p className="mt-2 text-xl text-muted-foreground">Your account, preferences, and data.</p>
      </header>

      <div className="space-y-6 max-w-2xl">
        {/* Account */}
        <div className="rounded-[28px] bg-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
              <User size={28} aria-hidden />
            </div>
            <div>
              <p className="text-xl font-bold">{user?.email}</p>
              <p className="text-sm text-muted-foreground">Signed in</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" onClick={toggle} className="rounded-[14px] px-5 py-2.5">
              {resolved === "dark" ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
              {resolved === "dark" ? "Light mode" : "Dark mode"}
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="rounded-[14px] px-5 py-2.5">
              <LogOut size={18} aria-hidden /> Logout
            </Button>
          </div>
        </div>

        {/* Reminders */}
        <div className="rounded-[28px] bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-muted text-foreground">
                {prefs.enabled ? <Bell size={20} aria-hidden /> : <BellOff size={20} aria-hidden />}
              </div>
              <h2 className="text-xl font-bold">Reminders</h2>
            </div>
            <button id="reminders-toggle" role="switch" aria-checked={prefs.enabled} onClick={handleToggle}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${prefs.enabled ? "bg-primary" : "bg-muted-foreground/40"}`}>
              <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${prefs.enabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
          {prefs.enabled && (
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="lead-time" className="block text-sm font-medium mb-1">Lead time</label>
                <select id="lead-time" value={prefs.leadTimeMinutes} onChange={(e) => setPrefs((p) => ({ ...p, leadTimeMinutes: Number(e.target.value) }))}
                  className="h-11 w-full rounded-[14px] border border-input bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring">
                  {LEAD_TIME_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quiet-start" className="block text-sm font-medium mb-1">Quiet start</label>
                  <Input id="quiet-start" type="time" value={prefs.quietHoursStart ?? ""} onChange={(e) => setPrefs((p) => ({ ...p, quietHoursStart: e.target.value || null }))} className="rounded-[14px] h-11" />
                </div>
                <div>
                  <label htmlFor="quiet-end" className="block text-sm font-medium mb-1">Quiet end</label>
                  <Input id="quiet-end" type="time" value={prefs.quietHoursEnd ?? ""} onChange={(e) => setPrefs((p) => ({ ...p, quietHoursEnd: e.target.value || null }))} className="rounded-[14px] h-11" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data & Privacy (collapsible) */}
        <div className="rounded-[28px] bg-white p-8 shadow-sm">
          <button onClick={() => setShowDataPrivacy(!showDataPrivacy)} className="flex w-full items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-muted text-foreground">
                <Database size={20} aria-hidden />
              </div>
              <h2 className="text-xl font-bold">Data & privacy</h2>
            </div>
            <ChevronDown size={22} className={cn("text-muted-foreground transition", showDataPrivacy && "rotate-180")} aria-hidden />
          </button>
          {showDataPrivacy && (
            <div className="mt-6 space-y-5">
              <p className="text-sm text-muted-foreground">Export or import your plant data.</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={exportData} className="rounded-[14px]"><Download size={16} aria-hidden /> Export</Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing} className="rounded-[14px]">
                  {importing ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Upload size={16} aria-hidden />}
                  {importing ? "Importing..." : "Import"}
                </Button>
                <Button variant="outline" onClick={handleClearCache} className="rounded-[14px]"><Database size={16} aria-hidden /> Clear cache</Button>
              </div>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ""; }} />
              {importResult && (
                <div className="text-sm">
                  {importResult.errors.length === 0 && importResult.imported.plants + importResult.imported.schedules + importResult.imported.logs > 0 ? (
                    <p className="text-green-600">Imported {importResult.imported.plants} plant{importResult.imported.plants !== 1 ? "s" : ""}, {importResult.imported.schedules} schedule{importResult.imported.schedules !== 1 ? "s" : ""}, {importResult.imported.logs} log{importResult.imported.logs !== 1 ? "s" : ""}.</p>
                  ) : null}
                  {importResult.errors.length > 0 && (
                    <div className="rounded-[16px] border border-red-300 bg-red-50 p-4">
                      <p className="font-medium text-red-800">{importResult.errors.length} error{importResult.errors.length !== 1 ? "s" : ""}</p>
                      <ul className="mt-1 list-inside list-disc text-red-700">{importResult.errors.map((err, i) => (<li key={i}>{err}</li>))}</ul>
                    </div>
                  )}
                </div>
              )}
              <div className="border-t border-border/40 pt-5">
                <Button variant="outline" className="rounded-[14px] text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleDeleteAccount} disabled={deletingAccount}>
                  {deletingAccount ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Trash2 size={16} aria-hidden />}
                  {deletingAccount ? "Deleting..." : "Delete account"}
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">Permanently removes all your data.</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Access */}
        <div className="rounded-[28px] bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-muted text-foreground">
              <Key size={20} aria-hidden />
            </div>
            <h2 className="text-xl font-bold">AI access</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Personal access tokens for AI agents.</p>
          <div className="mt-5">
            <a href="/settings/mcp"><Button variant="outline" className="rounded-[14px]"><Key size={16} aria-hidden /> Manage tokens</Button></a>
          </div>
        </div>

        {/* About */}
        <div className="rounded-[28px] bg-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-primary text-primary-foreground shadow-md">
              <Flower2 size={28} aria-hidden />
            </div>
            <div>
              <p className="text-xl font-bold">OpenSprout</p>
              <p className="text-sm text-muted-foreground">Version 0.9.4</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-5 text-sm">
            <a href="/privacy" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">Privacy policy <ExternalLink size={14} /></a>
            <a href="/terms" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">Terms of service <ExternalLink size={14} /></a>
            <a href="/support" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">Support <ExternalLink size={14} /></a>
          </div>
        </div>
      </div>
    </>
  );
}
