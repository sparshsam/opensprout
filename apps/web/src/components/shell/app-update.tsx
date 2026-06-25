/**
 * App Update Notification
 *
 * Detects when a new service worker is available (deploy update)
 * and shows a prompt to reload for the latest version.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, X } from "lucide-react";

export function AppUpdate() {
  const [waitingWorker, setWaitingWorker] =
    useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Register the SW and listen for updates
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      // Check if a waiting worker already exists (from a previous registration)
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
      }

      // Listen for new updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New version available
            setWaitingWorker(newWorker);
          }
        });
      });
    });

    // When the new SW takes over, reload to use the latest
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  const handleUpdate = useCallback(() => {
    if (!waitingWorker) return;
    // Send skipWaiting message to the waiting worker
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, [waitingWorker]);

  if (!waitingWorker || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-border/40 bg-background p-4 shadow-lg"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <RefreshCw size={20} className="text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Update available</p>
        <p className="text-xs text-muted-foreground">
          A new version is ready. Reload to get the latest features.
        </p>
      </div>
      <button
        onClick={handleUpdate}
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Update
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Dismiss update prompt"
      >
        <X size={16} />
      </button>
    </div>
  );
}
