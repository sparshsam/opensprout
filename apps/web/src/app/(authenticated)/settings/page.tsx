"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  Download,
  LogOut,
  Bell,
  BellOff,
  Loader2,
  RefreshCw,
  Database,
  Upload,
  Key,
  Sun,
  Moon,
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
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 1440, label: "1 day" },
];

export default function SettingsPage() {
  const {
    user,
    data,
    handleSignOut,
    supabase,
    isOnline,
    syncStats,
    handleSync,
    handleClearCache,
  } = useApp();
  const { resolved, toggle } = useTheme();

  // ── Reminder preferences ──
  const [prefs, setPrefs] = useState<ReminderPreferences>(loadReminderPrefs);
  const [permRequested, setPermRequested] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    saveReminderPrefs(prefs);
  }, [prefs]);

  const handleToggle = useCallback(async () => {
    const nextEnabled = !prefs.enabled;
    if (nextEnabled && !permRequested) {
      setPermRequested(true);
      await requestNotificationPermission();
    }
    setPrefs((prev) => ({ ...prev, enabled: nextEnabled }));
  }, [prefs.enabled, permRequested]);

  const handleLeadTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPrefs((prev) => ({ ...prev, leadTimeMinutes: Number(e.target.value) }));
    }, [],
  );

  const handleQuietStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPrefs((prev) => ({ ...prev, quietHoursStart: e.target.value || null }));
    }, [],
  );

  const handleQuietEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPrefs((prev) => ({ ...prev, quietHoursEnd: e.target.value || null }));
    }, [],
  );

  // ── Import state ──
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function exportJson() {
    const payload = JSON.stringify(
      { schemaVersion: 1, exportedAt: new Date().toISOString(), ...data },
      null,
      2,
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "opensprout-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    setImportResult(null);
    try {
      const { data: parsed, errors } = await readImportFile(file);
      if (!parsed) {
        setImportResult({
          imported: { plants: 0, schedules: 0, logs: 0 },
          errors: errors.map((e) => `${e.record}: ${e.message}`),
          filename: file.name,
        });
        return;
      }
      const result = await executeImport(supabase!, user!.id, parsed);
      setImportResult({ ...result, filename: file.name });
    } catch (e) {
      setImportResult({
        imported: { plants: 0, schedules: 0, logs: 0 },
        errors: [(e as Error).message],
        filename: file.name,
      });
    } finally {
      setImporting(false);
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    try {
      await handleSync();
    } finally {
      setSyncing(false);
    }
  }

  async function handleDeleteAccount() {
    if (!supabase || !user) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete your account and ALL data? This cannot be undone. " +
      "Your plants, schedules, logs, journal entries, photos, and MCP tokens will all be permanently removed."
    );
    if (!confirmed) return;
    setDeletingAccount(true);
    try {
      // Delete user data via admin function
      const { error } = await supabase.rpc("delete_account");
      if (error) throw error;
      await handleSignOut();
    } catch (e) {
      console.error("Failed to delete account:", e);
      alert("Failed to delete account. Please contact sparshsam@gmail.com for help.");
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Account, data, and app preferences.
          </p>
        </div>
      </header>

      <section className="space-y-5 py-6 max-w-2xl">
        {/* Account */}
        <div className="rounded-md border border-border bg-card p-4 shadow-panel">
          <h2 className="text-lg font-bold">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as <strong>{user?.email}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Authentication is handled by Supabase Auth with RLS-scoped data.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={toggle} aria-label="Toggle dark mode">
              {resolved === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
              {resolved === "dark" ? "Light mode" : "Dark mode"}
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut size={16} aria-hidden />
              Logout
            </Button>
          </div>
          {user && (
            <div className="mt-4 border-t border-border pt-4">
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
                {deletingAccount ? "Deleting..." : "Delete Account"}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                Permanently removes all your data. This cannot be undone.
              </p>
            </div>
          )}
        </div>

        {/* MCP Access Tokens */}
        <div className="rounded-md border border-border bg-card p-4 shadow-panel">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Key size={18} aria-hidden />
            AI Agent Access
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Personal access tokens for AI agents (Claude Code, Hermes, Cursor)
            to read and manage your plant data via MCP.
          </p>
          <div className="mt-4">
            <a href="/settings/mcp">
              <Button variant="outline">
                <Key size={16} aria-hidden />
                Manage Tokens
              </Button>
            </a>
          </div>
        </div>

        {/* Reminders */}
        <div className="rounded-md border border-border bg-card p-4 shadow-panel">
          <h2 className="text-lg font-bold">Reminders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure care task notification preferences.
          </p>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="reminders-toggle" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                {prefs.enabled ? <Bell size={16} aria-hidden /> : <BellOff size={16} aria-hidden />}
                Enable reminders
              </label>
              <button
                id="reminders-toggle"
                role="switch"
                aria-checked={prefs.enabled}
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  prefs.enabled ? "bg-primary" : "bg-muted-foreground/40"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                    prefs.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            {prefs.enabled && (
              <>
                <div>
                  <label htmlFor="lead-time" className="block text-sm font-medium mb-1">Lead time</label>
                  <select
                    id="lead-time"
                    value={prefs.leadTimeMinutes}
                    onChange={handleLeadTimeChange}
                    className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  >
                    {LEAD_TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="quiet-start" className="block text-sm font-medium mb-1">Quiet hours start</label>
                  <Input id="quiet-start" type="time" value={prefs.quietHoursStart ?? ""} onChange={handleQuietStartChange} />
                </div>
                <div>
                  <label htmlFor="quiet-end" className="block text-sm font-medium mb-1">Quiet hours end</label>
                  <Input id="quiet-end" type="time" value={prefs.quietHoursEnd ?? ""} onChange={handleQuietEndChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <p className="text-sm text-muted-foreground">{prefs.timezone}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sync */}
        <div className="rounded-md border border-border bg-card p-4 shadow-panel">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <RefreshCw size={18} aria-hidden />
            Sync
          </h2>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={`inline-block h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
              {isOnline ? "Online" : "Offline"}
            </div>
            {syncStats?.lastSync && (
              <p className="text-sm text-muted-foreground">
                Last synced: {new Date(syncStats.lastSync).toLocaleString()}
              </p>
            )}
            {syncStats !== null && (
              <p className="text-sm text-muted-foreground">Pending actions: {syncStats.pending}</p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleSyncNow} disabled={syncing || !isOnline}>
              {syncing ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <RefreshCw size={16} aria-hidden />}
              Sync now
            </Button>
            <Button variant="outline" onClick={handleClearCache}>
              <Database size={16} aria-hidden />
              Clear local cache
            </Button>
          </div>
        </div>

        {/* Data management */}
        <div className="rounded-md border border-border bg-card p-4 shadow-panel">
          <h2 className="text-lg font-bold">Data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Export or import your plant data as JSON.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportJson}>
              <Download size={16} aria-hidden />
              Export JSON
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Upload size={16} aria-hidden />}
              {importing ? "Importing..." : "Import"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = "";
              }}
            />
          </div>
          {importResult && (
            <div className="mt-3 space-y-2 text-sm">
              {importResult.errors.length === 0 && importResult.imported.plants + importResult.imported.schedules + importResult.imported.logs > 0 ? (
                <p className="text-green-600 dark:text-green-400">
                  Imported {importResult.imported.plants} plant{importResult.imported.plants !== 1 ? "s" : ""}, {importResult.imported.schedules} schedule{importResult.imported.schedules !== 1 ? "s" : ""}, {importResult.imported.logs} log{importResult.imported.logs !== 1 ? "s" : ""}{importResult.filename ? ` from ${importResult.filename}` : ""}.
                </p>
              ) : null}
              {importResult.errors.length > 0 && (
                <div className="rounded-md border border-red-300 bg-red-50 p-3 dark:border-red-700 dark:bg-red-950">
                  <p className="font-medium text-red-800 dark:text-red-300">{importResult.errors.length} error{importResult.errors.length !== 1 ? "s" : ""}</p>
                  <ul className="mt-1 list-inside list-disc text-red-700 dark:text-red-400">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* About */}
        <div className="rounded-md border border-border bg-card p-4 shadow-panel">
          <h2 className="text-lg font-bold">About OpenSprout</h2>
          <p className="mt-1 text-sm text-muted-foreground">Version 0.9.2</p>
          <p className="mt-2 text-sm text-muted-foreground leading-6">
            OpenSprout is free, open-source plant care tracking software licensed under AGPL v3. No subscriptions, no data lock-in. Built with Next.js, Supabase, and TypeScript.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
            <a href="/support" className="text-primary hover:underline">Support</a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <a href="https://github.com/sparshsam/opensprout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              github.com/sparshsam/opensprout
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
