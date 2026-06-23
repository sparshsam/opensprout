"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  Download, LogOut, Upload, Sun, Moon, Bell, BellOff,
  Loader2, Database, ExternalLink, ArrowRight,
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

  const plantCount = data.plants.length;

  return (
    <>
      {/* ── Header ── */}
      <div className="mb-16">
        <p className="text-label mb-2 text-primary">Settings</p>
        <h1 className="text-hero text-foreground">Profile</h1>
      </div>

      <div className="max-w-lg space-y-16">
        {/* ── Account strip ── */}
        <section>
          <p className="text-label mb-6 text-muted-foreground">Account</p>
          <div className="border-t border-border">
            <div className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Signed in</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggle}
                  className="rounded-full bg-muted px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80"
                >
                  {resolved === "dark" ? <Sun size={14} className="inline" /> : <Moon size={14} className="inline" />}
                  {resolved === "dark" ? "Light" : "Dark"}
                </button>
                <button
                  onClick={handleSignOut}
                  className="rounded-full bg-muted px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80"
                >
                  <LogOut size={14} className="inline" /> Logout
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        {plantCount > 0 && (
          <section>
            <p className="text-label mb-6 text-muted-foreground">Overview</p>
            <div className="border-t border-border space-y-0">
              <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Plants</span>
                <span className="text-sm text-muted-foreground">{plantCount}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <span className="text-sm font-semibold text-foreground">Care logs</span>
                <span className="text-sm text-muted-foreground">{data.logs.length}</span>
              </div>
            </div>
          </section>
        )}

        {/* ── Reminders ── */}
        <section>
          <p className="text-label mb-6 text-muted-foreground">Reminders</p>
          <div className="border-t border-border space-y-0">
            <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              <button
                role="switch"
                aria-checked={prefs.enabled}
                onClick={handleToggle}
                className={cn(
                  "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  prefs.enabled ? "bg-primary" : "bg-muted",
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform",
                  prefs.enabled ? "translate-x-[18px]" : "translate-x-0.5",
                )} />
              </button>
            </div>
            {prefs.enabled && (
              <>
                <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Lead time</span>
                  <select
                    value={prefs.leadTimeMinutes}
                    onChange={(e) => setPrefs((p) => ({ ...p, leadTimeMinutes: Number(e.target.value) }))}
                    className="rounded-full bg-muted px-4 py-2 text-xs font-semibold text-foreground outline-none"
                  >
                    {LEAD_TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Quiet start</span>
                  <Input
                    type="time"
                    value={prefs.quietHoursStart ?? ""}
                    onChange={(e) => setPrefs((p) => ({ ...p, quietHoursStart: e.target.value || null }))}
                    className="w-32 rounded-full bg-muted px-4 py-2 text-xs"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 py-4">
                  <span className="text-sm font-semibold text-foreground">Quiet end</span>
                  <Input
                    type="time"
                    value={prefs.quietHoursEnd ?? ""}
                    onChange={(e) => setPrefs((p) => ({ ...p, quietHoursEnd: e.target.value || null }))}
                    className="w-32 rounded-full bg-muted px-4 py-2 text-xs"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Data ── */}
        <section>
          <p className="text-label mb-6 text-muted-foreground">Data</p>
          <div className="border-t border-border space-y-0">
            <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Export</span>
              <button
                onClick={exportData}
                className="rounded-full bg-muted px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80"
              >
                <Download size={14} className="inline" /> Export
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Import</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="rounded-full bg-muted px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80 disabled:opacity-40"
              >
                {importing ? <Loader2 size={14} className="animate-spin inline" /> : <Upload size={14} className="inline" />}
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Cache</span>
              <button
                onClick={handleClearCache}
                className="rounded-full bg-muted px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80"
              >
                <Database size={14} className="inline" /> Clear
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <span className="text-sm font-semibold text-red-600">Delete account</span>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="rounded-full bg-destructive/5 px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-destructive hover:bg-destructive/10 disabled:opacity-40"
              >
                {deletingAccount ? <Loader2 size={14} className="animate-spin inline" /> : null}
                {deletingAccount ? "Deleting..." : "Delete"}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ""; }} />
          </div>

          {importResult && (
            <div className="mt-4 space-y-2">
              {importResult.errors.length === 0 && importResult.imported.plants + importResult.imported.schedules + importResult.imported.logs > 0 && (
                <p className="text-sm text-primary">
                  Imported {importResult.imported.plants} plant{importResult.imported.plants !== 1 ? "s" : ""}, {importResult.imported.schedules} schedule{importResult.imported.schedules !== 1 ? "s" : ""}, {importResult.imported.logs} log{importResult.imported.logs !== 1 ? "s" : ""}.
                </p>
              )}
              {importResult.errors.length > 0 && (
                <div className="rounded-full bg-destructive/5 px-6 py-3">
                  <p className="text-xs font-semibold text-destructive">{importResult.errors.length} error{importResult.errors.length !== 1 ? "s" : ""}</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-destructive/80">
                    {importResult.errors.map((err, i) => (<li key={i}>{err}</li>))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── AI Access ── */}
        <section>
          <p className="text-label mb-6 text-muted-foreground">AI access</p>
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-4">Personal access tokens for AI agents.</p>
            <a
              href="/settings/mcp"
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-6 py-3 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80"
            >
              Manage tokens <ArrowRight size={12} />
            </a>
          </div>
        </section>

        {/* ── About ── */}
        <section>
          <p className="text-label mb-6 text-muted-foreground">About</p>
          <div className="border-t border-border space-y-0">
            <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
              <span className="text-sm font-semibold text-foreground">OpenSprout</span>
              <span className="text-xs text-muted-foreground">v0.9.7</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Privacy</span>
              <a href="/privacy" className="rounded-full bg-muted px-5 py-2 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80">
                <ExternalLink size={12} className="inline" /> View
              </a>
            </div>
            <div className="flex items-center justify-between gap-4 py-4 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Terms</span>
              <a href="/terms" className="rounded-full bg-muted px-5 py-2 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80">
                <ExternalLink size={12} className="inline" /> View
              </a>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <span className="text-sm font-semibold text-foreground">Support</span>
              <a href="/support" className="rounded-full bg-muted px-5 py-2 text-xs font-bold tracking-wider uppercase text-foreground hover:bg-muted/80">
                <ExternalLink size={12} className="inline" /> View
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
