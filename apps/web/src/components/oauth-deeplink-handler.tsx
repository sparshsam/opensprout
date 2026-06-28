"use client";

import { useEffect } from "react";

/**
 * Global Capacitor deep-link listener for OAuth callbacks.
 *
 * When the user signs in with Google on Android via the in-app Chrome
 * Custom Tab, Supabase redirects to `opensprout://auth/callback?code=...`.
 * The Android intent system opens/resumes the app, and this component
 * catches the `appUrlOpen` event to exchange the PKCE code client-side.
 *
 * Mounted once in the root layout — renders nothing.
 */
export function OAuthDeepLinkHandler() {
  useEffect(() => {
    // Guard: only run in Capacitor native
    const win = window as typeof window & {
      Capacitor?: { isNativePlatform?: () => boolean };
    };
    if (!win.Capacitor?.isNativePlatform?.()) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");

      // ── Handle OAuth redirect from Chrome Custom Tab ───────────────────
      App.addListener("appUrlOpen", async (event) => {
        try {
          const url = new URL(event.url);

          // Match opensprout://auth/callback or
          // http(s)://localhost:9999/auth/callback (dev) or
          // https://sprout.kovina.org/auth/callback (prod)
          if (!url.pathname.startsWith("/auth/callback")) return;

          const code = url.searchParams.get("code");
          if (!code) return;

          const { createClient } = await import("@/lib/supabase/browser");
          const supabase = createClient();

          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[OAuthDeepLink] exchangeCodeForSession failed:", error.message);
            return;
          }

          // Navigate to dashboard
          window.location.href = "/today";
        } catch (err) {
          console.error("[OAuthDeepLink] error handling appUrlOpen:", err);
        }
      });

      // ── Fallback: user pressed back / browser closed ───────────────────
      Browser.addListener("browserFinished", async () => {
        const { createClient } = await import("@/lib/supabase/browser");
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          window.location.href = "/today";
        }
      });
    })();

    return () => {
      cleanup?.();
    };
  }, []);

  return null;
}
