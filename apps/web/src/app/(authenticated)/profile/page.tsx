"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  Download,
  LogOut,
  Upload,
  Database,
  Key,
  Sun,
  Moon,
  User,
  Bell,
  BellOff,
  Loader2,
  Flower2,
  ExternalLink,
  Trash2,
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

export default function ProfilePage() {
  const {
    user,
    data,
    handleSignOut,
    supabase,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  function exportData() {
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

  async function handleDeleteAccount() {
    if (!supabase || !user) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete your account and all data? This cannot be undone."
    );
    if (!confirmed) return;
    setDeletingAccount(true);
    try {
      const { error } = await supabase.rpc("delete_account");
      if (error) throw error;
      await handleSignOut();
    } catch {
      alert("Failed to delete account. Please contact sparshsam@gmail.com for help.");
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <>
      <header className="pb-6">
        <h1 className="text-2xl font-bold tracking-normal text-foreground">
          Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account, preferences, and data.
        </p>
      </header>

      <section className="space-y-5">
        {/* Account */}
        <Section title="Account">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User size={22} aria-hidden />
            </div>
            <div>
              <p className="font-semibold">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={toggle} className="rounded-xl">
              {resolved === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
              {resolved === "dark" ? "Light mode" : "Dark mode"}
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="rounded-xl">
              <LogOut size={16} aria-hidden />
              Logout
            </Button>
          </div>
        </Section>

        {/* Reminders */}
        <Section title="Reminders">
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
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="lead-time" className="block text-sm font-medium mb-1">Lead time</label>
                <select
                  id="lead-time"
                  value={prefs.leadTimeMinutes}
                  onChange={handleLeadTimeChange}
                  className="h-11 w-full rounded-2xl border border-input bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                >
                  {LEAD_TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quiet-start" className="block text-sm font-medium mb-1">Quiet start</label>
                  <Input id="quiet-start" type="time" value={prefs.quietHoursStart ?? ""} onChange={handleQuietStartChange} className="rounded-2xl" />
                </div>
                <div>
                  <label htmlFor="quiet-end" className="block text-sm font-medium mb-1">Quiet end</label>
                  <Input id="quiet-end" type="time" value={prefs.quietHoursEnd ?? ""} onChange={handleQuietEndChange} className="rounded-2xl" />
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Data & Privacy */}
        <Section title="Data & privacy">
          <p className="text-sm text-muted-foreground">
            Export a copy of your plant data or import data from a previous backup.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportData} className="rounded-xl">
              <Download size={16} aria-hidden />
              Export data
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing} className="rounded-xl">
              {importing ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Upload size={16} aria-hidden />}
              {importing ? "Importing..." : "Import data"}
            </Button>
            <Button variant="outline" onClick={handleClearCache} className="rounded-xl">
              <Database size={16} aria-hidden />
              Clear cache
            </Button>
          </div>
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
          {importResult && (
            <div className="mt-3 space-y-2 text-sm">
              {importResult.errors.length === 0 && importResult.imported.plants + importResult.imported.schedules + importResult.imported.logs > 0 ? (
                <p className="text-green-600 dark:text-green-400">
                  Imported {importResult.imported.plants} plant{importResult.imported.plants !== 1 ? "s" : ""}, {importResult.imported.schedules} schedule{importResult.imported.schedules !== 1 ? "s" : ""}, {importResult.imported.logs} log{importResult.imported.logs !== 1 ? "s" : ""}.
                </p>
              ) : null}
              {importResult.errors.length > 0 && (
                <div className="rounded-2xl border border-red-300 bg-red-50 p-3 dark:border-red-700 dark:bg-red-950">
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

          <div className="mt-5 border-t border-border/40 pt-5">
            <Button
              variant="outline"
              className="rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Trash2 size={16} aria-hidden />}
              {deletingAccount ? "Deleting..." : "Delete account"}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">
              Permanently removes all your data. This cannot be undone.
            </p>
          </div>
        </Section>

        {/* AI Agent access */}
        <Section title="AI agent access">
          <p className="mt-1 text-sm text-muted-foreground">
            Personal access tokens let AI agents like Claude, Hermes, and Cursor
            securely access your plant data.
          </p>
          <div className="mt-4">
            <a href="/settings/mcp">
              <Button variant="outline" className="rounded-xl">
                <Key size={16} aria-hidden />
                Manage tokens
              </Button>
            </a>
          </div>
        </Section>

        {/* About */}
        <Section title="About OpenSprout">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Flower2 size={22} aria-hidden />
            </div>
            <div>
              <p className="font-semibold">OpenSprout</p>
              <p className="text-xs text-muted-foreground">Version 0.9.2</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a href="/privacy" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              Privacy policy <ExternalLink size={12} />
            </a>
            <a href="/terms" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              Terms of service <ExternalLink size={12} />
            </a>
            <a href="/support" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              Support <ExternalLink size={12} />
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Free and open-source under{" "}
            <a href="https://github.com/sparshsam/opensprout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">AGPLv3</a>.
          </p>
        </Section>
      </section>
    </>
  );
}

// ── Reusable section component ──
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-panel">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
