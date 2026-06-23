"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

/**
 * AuthGate checks the Supabase session on mount.
 * If the user is signed in, it redirects to /today.
 * If not, it renders the public children.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "authenticated" | "public">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;

        if (data.session) {
          setState("authenticated");
          window.location.href = "/today";
        } else {
          setState("public");
        }
      } catch {
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
          <img src="/app-icon.png" alt="" className="h-6 w-6 animate-pulse" aria-hidden />
          <span className="text-sm font-semibold">OpenSprout</span>
        </div>
      </div>
    );
  }

  if (state === "authenticated") {
    return null;
  }

  return <>{children}</>;
}
