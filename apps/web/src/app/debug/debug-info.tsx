"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { isCapacitorNative, resolveApiUrl, PRODUCTION_ORIGIN } from "@/lib/data/platform";

type Diagnostic = {
  label: string;
  value: string;
  ok?: boolean;
};

export function DebugInfo() {
  const [diags, setDiags] = useState<Diagnostic[]>([]);
  const [listeners, setListeners] = useState<string[]>([]);
  const [sessionStatus, setSessionStatus] = useState<string>("checking…");

  useEffect(() => {
    const items: Diagnostic[] = [];

    // ── Environment ──────────────────────────────────────────────────────
    items.push({
      label: "Origin",
      value: window.location.origin,
    });
    items.push({
      label: "Protocol",
      value: window.location.protocol,
    });
    items.push({
      label: "User Agent",
      value: navigator.userAgent.slice(0, 120),
    });

    // ── Platform detection ───────────────────────────────────────────────
    const capacitorNative = isCapacitorNative();
    items.push({
      label: "Capacitor detected",
      value: capacitorNative ? "Yes" : "No",
      ok: capacitorNative,
    });

    // Check Capacitor global
    const win = window as typeof window & {
      Capacitor?: { isNativePlatform?: () => boolean };
    };
    items.push({
      label: "window.Capacitor",
      value: win.Capacitor ? "Present" : "Undefined",
      ok: !!win.Capacitor,
    });
    items.push({
      label: "isNativePlatform()",
      value: capacitorNative ? "true" : "false (or not available)",
      ok: capacitorNative,
    });

    // Match media for PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    items.push({
      label: "display-mode: standalone",
      value: standalone ? "Yes" : "No",
      ok: standalone,
    });

    // ── API routing ──────────────────────────────────────────────────────
    items.push({
      label: "getApiOrigin()",
      value: capacitorNative ? PRODUCTION_ORIGIN : "(empty)",
    });
    items.push({
      label: "Resolved /api/identify",
      value: resolveApiUrl("/api/identify"),
    });
    items.push({
      label: "Resolved /api/log",
      value: resolveApiUrl("/api/log"),
    });

    // ── Capacitor plugins ────────────────────────────────────────────────
    const cap = (window as typeof window & {
      Capacitor?: { Plugins?: Record<string, unknown>; isNativePlatform?: () => boolean };
    }).Capacitor;
    const hasApp = !!(cap?.Plugins?.App);
    const hasBrowser = !!(cap?.Plugins?.Browser);
    items.push({
      label: "Capacitor Plugins — App",
      value: hasApp ? "Registered" : "Not found",
      ok: hasApp,
    });
    items.push({
      label: "Capacitor Plugins — Browser",
      value: hasBrowser ? "Registered" : "Not found",
      ok: hasBrowser,
    });

    // ── Deep-link listeners ──────────────────────────────────────────────
    const registered: string[] = [];
    if (capacitorNative) {
      registered.push("appUrlOpen — OAuthDeepLinkHandler (root layout)");
      registered.push("browserFinished — OAuthDeepLinkHandler (root layout)");
    } else {
      registered.push("Not applicable (not Capacitor)");
    }
    setListeners(registered);

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
          Supabase Session
        </h2>
        <p className="text-sm font-mono text-foreground">{sessionStatus}</p>
      </section>

      {/* Deep-link listeners */}
      <section>
        <h2 className="text-sm font-bold tracking-wider uppercase text-muted-foreground mb-3">
          Deep-Link Listeners
        </h2>
        <ul className="space-y-1">
          {listeners.map((l, i) => (
            <li key={i} className="text-sm font-mono text-foreground">
              {l.startsWith("Not") ? (
                <span className="text-muted-foreground">{l}</span>
              ) : (
                <span className="text-green-600">✓ {l}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Supabase config */}
      <section>
        <h2 className="text-sm font-bold tracking-wider uppercase text-muted-foreground mb-3">
          Supabase Config
        </h2>
        <p className="text-sm font-mono text-foreground break-all">
          URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not set"}
        </p>
      </section>
    </div>
  );
}
