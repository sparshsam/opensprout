"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  Download, LogOut, Bell, Loader2, RefreshCw,
  Database, Upload, Key, Sun, Moon, User, Shield,
  Clock, Smartphone, Info, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loadReminderPrefs,
  saveReminderPrefs,
  requestNotificationPermission,
} from "@/lib/data/reminders";
import type { ReminderPreferences } from "@/lib/data/reminders";
import { readImportFile, executeImport, type ImportResult } from "@/lib/data/import";
import { useTheme } from "@/lib/context/theme-context";

const LEAD_TIME_OPTIONS = [
  { value: 5, label: "5 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 480, label: "8 hours" },
  { value: 1440, label: "1 day" },
];

export default function SettingsPage() {
  const { user, data, handleSignOut, supabase, isOnline, syncStats, handleSync, handleClearCache } = useApp();
  const { resolved, toggle } = useTheme();

  // ── Reminder preferences ──
  const [prefs, setPrefs] = useState<ReminderPreferences>(loadReminderPrefs);
  const [permRequested, setPermRequested] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => { saveReminderPrefs(prefs); }, [prefs]);

  const handleToggle = useCallback(async () => {
    const nextEnabled = !prefs.enabled;
    if (nextEnabled && !permRequested) { setPermRequested(true); await requestNotificationPermission(); }
    setPrefs((prev) => ({ ...prev, enabled: nextEnabled }));
  }, [prefs.enabled, permRequested]);

  // ── Import state ──
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function exportJson() {
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
    const confirmed = window.confirm("Are you sure you want to delete your account and ALL data? This cannot be undone. Your plants, schedules, logs, journal entries, photos, and MCP tokens will all be permanently removed.");
    if (!confirmed) return;
    setDeletingAccount(true);
    try {
      const { error } = await supabase.rpc("delete_account");
      if (error) throw error;
      await handleSignOut();
    } catch {
      alert("Failed to delete account. Please contact sparshsam@gmail.com for help.");
    } finally { setDeletingAccount(false); }
  }

  return (
    <>
      <header className="mb-10">
        <h1 className="text-hero text-foreground">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Account, notifications, data, and app preferences.</p>
      </header>

      <div className="max-w-2xl space-y-6">

        {/* ── Profile section ── */}
        <section>
          <h2 className="text-label mb-4 text-muted-foreground flex items-center gap-2"><User size={14} /> Profile</h2>
          <div className="rounded-2xl border border-border/50 bg-white p-5 space-y-4 dark:bg-muted">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Signed in as</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" onClick={toggle} aria-label="Toggle dark mode" size="sm">
                {resolved === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                {resolved === "dark" ? "Light" : "Dark"}
              </Button>
            </div>
            <div className="border-t border-border/30 pt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleSignOut} size="sm">
                <LogOut size={14} /> Logout
              </Button>
            </div>
          </div>
        </section>

        {/* ── Notifications section ── */}
        <section>
          <h2 className="text-label mb-4 text-muted-foreground flex items-center gap-2"><Bell size={14} /> Notifications</h2>
          <div className="rounded-2xl border border-border/50 bg-white p-5 dark:bg-muted">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Care reminders</p>
                <p className="text-xs text-muted-foreground">Get notified before tasks are due</p>
              </div>
              <button
                role="switch"
                aria-checked={prefs.enabled}
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${prefs.enabled ? "bg-primary" : "bg-muted-foreground/40"}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${prefs.enabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {prefs.enabled && (
              <div className="space-y-4 border-t border-border/30 pt-4">
                <div>
                  <label htmlFor="lead-time" className="text-xs font-semibold text-muted-foreground mb-1.5 block">Notify before due</label>
                  <select id="lead-time" value={prefs.leadTimeMinutes} onChange={(e) => setPrefs((p) => ({ ...p, leadTimeMinutes: Number(e.target.value) }))}
                    className="h-10 w-full rounded-full border border-input bg-background px-4 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                  >
                    {LEAD_TIME_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="quiet-start" className="text-xs font-semibold text-muted-foreground mb-1.5 block">Quiet hours start</label>
                    <Input id="quiet-start" type="time" value={prefs.quietHoursStart ?? ""} onChange={(e) => setPrefs((p) => ({ ...p, quietHoursStart: e.target.value || null }))} className="rounded-full" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="quiet-end" className="text-xs font-semibold text-muted-foreground mb-1.5 block">Quiet hours end</label>
                    <Input id="quiet-end" type="time" value={prefs.quietHoursEnd ?? ""} onChange={(e) => setPrefs((p) => ({ ...p, quietHoursEnd: e.target.value || null }))} className="rounded-full" />
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <p><Clock size={10} className="inline" /> Timezone: {prefs.timezone}</p>
                  <p><Smartphone size={10} className="inline" /> Android: native scheduled notifications. Web/PWA: notifications while tab is open.</p>
                  <p><RefreshCw size={10} className="inline" /> Dashboard refreshes every 15 minutes — missed tasks show on next reload.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Integrations section ── */}
        <section>
          <h2 className="text-label mb-4 text-muted-foreground flex items-center gap-2"><Shield size={14} /> Integrations</h2>
          <div className="rounded-2xl border border-border/50 bg-white p-5 dark:bg-muted">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">AI Agent Access (MCP)</p>
                <p className="text-xs text-muted-foreground">Personal access tokens for Claude Code, Cursor, and other AI agents</p>
              </div>
              <a href="/settings/mcp"><Button variant="outline" size="sm"><Key size={14} /> Manage</Button></a>
            </div>
          </div>
        </section>

        {/* ── Data section ── */}
        <section>
          <h2 className="text-label mb-4 text-muted-foreground flex items-center gap-2"><Database size={14} /> Data</h2>
          <div className="rounded-2xl border border-border/50 bg-white p-5 space-y-4 dark:bg-muted">
            {/* Sync status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm font-semibold text-foreground">{isOnline ? "Online" : "Offline"}</span>
                {syncStats?.lastSync && <span className="text-xs text-muted-foreground">· Last sync: {new Date(syncStats.lastSync).toLocaleString()}</span>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={async () => { setSyncing(true); await handleSync(); setSyncing(false); }} disabled={syncing || !isOnline}>
                  {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  Sync
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearCache}><Database size={12} /> Clear cache</Button>
              </div>
            </div>

            {/* Export / Import */}
            <div className="border-t border-border/30 pt-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={exportJson}><Download size={14} /> Export JSON</Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                  {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {importing ? "Importing..." : "Import"}
                </Button>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ""; }} />
              </div>
              {importResult && (
                <div className="mt-3 text-sm">
                  {importResult.errors.length === 0 && importResult.imported.plants + importResult.imported.schedules + importResult.imported.logs > 0 ? (
                    <p className="text-green-600 dark:text-green-400">Imported {importResult.imported.plants} plant{importResult.imported.plants !== 1 ? "s" : ""}, {importResult.imported.schedules} schedule{importResult.imported.schedules !== 1 ? "s" : ""}, {importResult.imported.logs} log{importResult.imported.logs !== 1 ? "s" : ""}.</p>
                  ) : null}
                  {importResult.errors.length > 0 && (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-3 dark:border-red-700 dark:bg-red-950">
                      <p className="font-medium text-red-800 dark:text-red-300">{importResult.errors.length} error{importResult.errors.length !== 1 ? "s" : ""}</p>
                      <ul className="mt-1 list-inside list-disc text-red-700 dark:text-red-400 text-xs">{importResult.errors.map((err, i) => (<li key={i}>{err}</li>))}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Danger zone ── */}
        <section>
          <h2 className="text-label mb-4 text-muted-foreground flex items-center gap-2"><AlertTriangle size={14} className="text-destructive" /> Danger Zone</h2>
          <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.02] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Delete account</p>
                <p className="text-xs text-muted-foreground">Permanently removes all your data. This cannot be undone.</p>
              </div>
              <Button variant="danger" size="sm" onClick={handleDeleteAccount} disabled={deletingAccount}>
                {deletingAccount ? <Loader2 size={14} className="animate-spin" /> : null}
                {deletingAccount ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section>
          <h2 className="text-label mb-4 text-muted-foreground flex items-center gap-2"><Info size={14} /> About</h2>
          <div className="rounded-2xl border border-border/50 bg-white p-5 dark:bg-muted">
            <p className="text-sm text-muted-foreground">Version 0.9.23</p>
            <p className="mt-2 text-sm text-muted-foreground leading-6">
              OpenSprout is free, open-source plant care tracking software licensed under AGPL v3. No subscriptions, no data lock-in. Built with Next.js, Supabase, and TypeScript.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
              <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
              <a href="/support" className="text-primary hover:underline">Support</a>
              <a href="https://github.com/sparshsam/opensprout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
