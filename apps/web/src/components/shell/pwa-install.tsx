/**
 * PWA Install Prompt
 *
 * Listens for the `beforeinstallprompt` event and renders a small
 * install banner so users can install OpenSprout as a standalone app.
 *
 * Handles desktop (Chrome/Edge address bar install icon) and
 * provides a consistent install button for browsers where the
 * native prompt is deferred.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { Sprout, X } from "lucide-react";

/** Global beforeinstallprompt event type */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const PWA_DISMISSED_KEY = "opensprout-pwa-dismissed";

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(PWA_DISMISSED_KEY) === "true";
  });

  // Capture the install prompt event
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Already installed (in standalone mode) — don't show prompt
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      setDismissed(true);
    }
  }, []);

  const handleInstall = useCallback(() => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      setDeferredPrompt(null);
    });
  }, [deferredPrompt]);

  if (!deferredPrompt || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-28 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-border/40 bg-background p-4 shadow-lg md:bottom-6"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Sprout size={20} className="text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Install OpenSprout</p>
        <p className="text-xs text-muted-foreground">
          Add to home screen for the full app experience
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Install
      </button>
      <button
        onClick={() => { localStorage.setItem(PWA_DISMISSED_KEY, "true"); setDismissed(true); }}
        className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Dismiss install prompt"
      >
        <X size={16} />
      </button>
    </div>
  );
}
