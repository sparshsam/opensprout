/**
 * AuthGate wraps the public homepage content.
 *
 * - **Web browser:** Shows the public marketing page to everyone.
 *   Signed-in users use the "Sign in" button (smart-redirects to /today)
 *   to reach their dashboard.
 *
 * - **Native app (Capacitor):** Redirects to /login on mount —
 *   the native first screen is the auth flow, not the marketing page.
 */

"use client";

import { useEffect, useState } from "react";
import { Sprout } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

/** True when running inside a Capacitor native shell (Android / iOS). */
function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as typeof window & {
    Capacitor?: { isNativePlatform?: () => boolean };
  };
  return !!win.Capacitor?.isNativePlatform?.();
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<
    "loading" | "public" | "redirecting"
  >("loading");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (isNativeApp()) {
        // Native app: check session, redirect to /login or /today
        try {
          const supabase = createClient();
          const { data } = await supabase.auth.getSession();
          if (cancelled) return;
          window.location.href = data.session ? "/today" : "/login";
          if (!cancelled) setState("redirecting");
        } catch {
          if (!cancelled) {
            window.location.href = "/login";
            setState("redirecting");
          }
        }
      } else {
        // Web browser: always show the public page
        if (!cancelled) setState("public");
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sprout size={24} className="animate-pulse text-primary" aria-hidden />
          <span className="text-sm font-semibold">OpenSprout</span>
        </div>
      </div>
    );
  }

  // web browser — render the public homepage
  return <>{children}</>;
}
