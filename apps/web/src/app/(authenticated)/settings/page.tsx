"use client";

import { useApp } from "@/lib/context/app-context";
import { Download, FileUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { user, data, handleSignOut } = useApp();

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
