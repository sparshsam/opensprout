/**
 * AuthGate wraps the public homepage content.
 *
 * Shows the public marketing page to everyone.
 * Signed-in users use the "Sign in" button (smart-redirects to /today)
 * to reach their dashboard.
 */

"use client";

import { useEffect, useState } from "react";
import { Sprout } from "lucide-react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "public">("loading");

  useEffect(() => {
    setState("public");
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

  return <>{children}</>;
}
