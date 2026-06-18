"use client";

import { useApp } from "@/lib/context/app-context";
import { Download, FileUp, LogOut, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback } from "react";
import {
  loadReminderPrefs,
  saveReminderPrefs,
  requestNotificationPermission,
} from "@/lib/data/reminders";
import type { ReminderPreferences } from "@/lib/data/reminders";

const LEAD_TIME_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 1440, label: "1 day" },
];

export default function SettingsPage() {
  const { user, data, handleSignOut } = useApp();
  const [prefs, setPrefs] = useState<ReminderPreferences>(loadReminderPrefs);
  const [permRequested, setPermRequested] = useState(false);

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
      setPrefs((prev) => ({
        ...prev,
        leadTimeMinutes: Number(e.target.value),
      }));
    },
    [],
  );

  const handleQuietStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPrefs((prev) => ({
        ...prev,
        quietHoursStart: e.target.value || null,
      }));
    },
    [],
  );

  const handleQuietEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPrefs((prev) => ({
        ...prev,
        quietHoursEnd: e.target.value || null,
      }));
    },
    [],
  );

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
          <div className="mt-4">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut size={16} aria-hidden />
              Logout
            </Button>
          </div>
        </div>

        {/* Reminders */}
        <div className="rounded-md border border-border bg-card p-4 shadow-panel">
          <h2 className="text-lg font-bold">Reminders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure care task notification preferences.
          </p>

          <div className="mt-4 space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="reminders-toggle"
                className="flex items-center gap-2 text-sm font-medium cursor-pointer"
              >
                {prefs.enabled ? (
                  <Bell size={16} aria-hidden />
                ) : (
                  <BellOff size={16} aria-hidden />
                )}
                Enable reminders
              </label>
              <button
                id="reminders-toggle"
                role="switch"
                aria-checked={prefs.enabled}
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  prefs.enabled
                    ? "bg-primary"
                    : "bg-muted-foreground/40"
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
                {/* Lead time */}
                <div>
                  <label
                    htmlFor="lead-time"
                    className="block text-sm font-medium mb-1"
                  >
                    Lead time
                  </label>
                  <select
                    id="lead-time"
                    value={prefs.leadTimeMinutes}
                    onChange={handleLeadTimeChange}
                    className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  >
                    {LEAD_TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quiet hours start */}
                <div>
                  <label
                    htmlFor="quiet-start"
                    className="block text-sm font-medium mb-1"
                  >
                    Quiet hours start
                  </label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={prefs.quietHoursStart ?? ""}
                    onChange={handleQuietStartChange}
                  />
                </div>

                {/* Quiet hours end */}
                <div>
                  <label
                    htmlFor="quiet-end"
                    className="block text-sm font-medium mb-1"
                  >
                    Quiet hours end
                  </label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={prefs.quietHoursEnd ?? ""}
                    onChange={handleQuietEndChange}
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Timezone
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {prefs.timezone}
                  </p>
                </div>
              </>
            )}
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
            <Button variant="outline" disabled title="Import is planned for the backup milestone.">
              <FileUp size={16} aria-hidden />
              Import
            </Button>
          </div>
        </div>

        {/* About */}
        <div className="rounded-md border border-border bg-card p-4 shadow-panel">
          <h2 className="text-lg font-bold">About OpenSprout</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Version 0.1.0
          </p>
          <p className="mt-2 text-sm text-muted-foreground leading-6">
            OpenSprout is free, open-source plant care tracking software
            licensed under AGPL v3. No subscriptions, no data lock-in.
            Built with Next.js, Supabase, and TypeScript.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            <a
              href="https://github.com/sparshsam/opensprout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              github.com/sparshsam/opensprout
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
