"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { resolveApiUrl } from "@/lib/data/platform";

type Diagnostic = {
  label: string;
  value: string;
  ok?: boolean;
};

export function DebugInfo() {
  const [diags, setDiags] = useState<Diagnostic[]>([]);
  const [sessionStatus, setSessionStatus] = useState<string>("checking…");

  useEffect(() => {
    const items: Diagnostic[] = [];

    // ── Environment ──────────────────────────────────────────────────────
    items.push({ label: "Origin", value: window.location.origin });
    items.push({ label: "Protocol", value: window.location.protocol });
    items.push({ label: "User Agent", value: navigator.userAgent.slice(0, 120) });

    // ── PWA detection ────────────────────────────────────────────────────
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    items.push({
      label: "PWA mode",
      value: standalone ? "Standalone" : "Browser tab",
      ok: standalone,
    });

    // ── API routing ──────────────────────────────────────────────────────
    items.push({ label: "Resolved /api/identify", value: resolveApiUrl("/api/identify") });
    items.push({ label: "Resolved /api/log", value: resolveApiUrl("/api/log") });

    // ── Supabase session ─────────────────────────────────────────────────
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSessionStatus(`Signed in as ${data.session.user.email ?? data.session.user.id}`);
        } else {
          setSessionStatus("No active session");
        }
      } catch {
        setSessionStatus("Error checking session");
      }
    })();

    setDiags(items);
  }, []);

  return (
    <div className="space-y-6">
      {/* Runtime diagnostics */}
      <section>
        <h2 className="text-sm font-bold tracking-wider uppercase text-muted-foreground mb-3">
          Runtime
        </h2>
        <table className="w-full text-sm">
          <tbody>
            {diags.map((d) => (
              <tr key={d.label} className="border-b border-border/20">
                <td className="py-2 pr-4 font-medium text-foreground/70 whitespace-nowrap">
                  {d.label}
                </td>
                <td className="py-2 text-foreground break-all font-mono text-xs">
                  {d.ok !== undefined ? (
                    <span className={d.ok ? "text-green-600" : "text-destructive"}>
                      {d.value}
                    </span>
                  ) : (
                    d.value
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Session */}
      <section>
        <h2 className="text-sm font-bold tracking-wider uppercase text-muted-foreground mb-3">
          Session
        </h2>
        <p className="text-sm font-mono text-foreground">{sessionStatus}</p>
      </section>
    </div>
  );
}
