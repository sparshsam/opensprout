"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Sprout, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import Link from "next/link";

type SignInPlatform = "web" | "native" | "pwa";

/** Detect the current runtime platform to choose the right sign-in flow. */
function detectPlatform(): SignInPlatform {
  if (typeof window === "undefined") return "web";
  const win = window as typeof window & {
    Capacitor?: { isNativePlatform?: () => boolean };
  };
  if (win.Capacitor?.isNativePlatform?.()) return "native";
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  ) {
    return "pwa";
  }
  return "web";
}

export default function LoginPage() {
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for PWA postMessage listener cleanup
  const pwaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pwaMessageHandlerRef = useRef<((event: MessageEvent) => void) | null>(
    null,
  );

  // Cleanup PWA listener + timeout on unmount
  useEffect(() => {
    return () => {
      if (pwaMessageHandlerRef.current) {
        window.removeEventListener(
          "message",
          pwaMessageHandlerRef.current,
        );
      }
      if (pwaTimeoutRef.current) {
        clearTimeout(pwaTimeoutRef.current);
      }
    };
  }, []);

  /** Returns the app origin for OAuth redirect. */
  function redirectOrigin(): string {
    if (typeof window !== "undefined") return window.location.origin;
    return "https://sprout.kovina.org";
  }

  const handleGoogleSignIn = useCallback(async () => {
    if (!supabase) {
      setError("App configuration is missing. Please contact support.");
      return;
    }
    setBusy(true);
    setError(null);

    try {
      const platform = detectPlatform();

      if (platform === "web") {
        // ── Web: direct browser redirect (existing flow) ────────────────
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${redirectOrigin()}/auth/callback`,
          },
        });
        if (oauthError) throw oauthError;
        // Page navigates away — no need to reset busy state
      } else if (platform === "native") {
        // ── Capacitor native: in-app Chrome Custom Tab ──────────────────
        const { data, error: oauthError } =
          await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: "opensprout://auth/callback",
              skipBrowserRedirect: true,
            },
          });
        if (oauthError) throw oauthError;
        if (!data?.url) throw new Error("Failed to get sign-in URL.");

        // Open in in-app browser (Chrome Custom Tab on Android)
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: data.url });

        // Don't reset busy — user will return via deep link
      } else {
        // ── PWA: open system browser popup ──────────────────────────────
        const { data, error: oauthError } =
          await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${redirectOrigin()}/auth/complete`,
              skipBrowserRedirect: true,
            },
          });
        if (oauthError) throw oauthError;
        if (!data?.url) throw new Error("Failed to get sign-in URL.");

        const popup = window.open(
          data.url,
          "opensprout-google-signin",
          "width=600,height=700,menubar=no,toolbar=no,location=yes",
        );

        if (!popup) {
          // Popup was blocked — show an error
          setError(
            "Popup was blocked. Please allow popups for this site and try again.",
          );
          setBusy(false);
          return;
        }

        // Listen for success message from the popup
        const onMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type === "opensprout-oauth-done") {
            window.removeEventListener("message", onMessage);
            if (pwaTimeoutRef.current) clearTimeout(pwaTimeoutRef.current);
            window.location.href = "/today";
          }
        };
        window.addEventListener("message", onMessage);
        pwaMessageHandlerRef.current = onMessage;

        // Fallback timeout — 2 minutes
        pwaTimeoutRef.current = setTimeout(() => {
          window.removeEventListener("message", onMessage);
          setBusy(false);
          setError("Sign-in timed out. Please try again.");
        }, 120_000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign in with Google.",
      );
      setBusy(false);
    }
  }, [supabase]);

  /** Platform label shown beneath the button. */
  const platformHint = useMemo(() => {
    const p = detectPlatform();
    if (p === "native") return "You'll be taken to Google to sign in securely.";
    if (p === "pwa") return "A browser window will open to sign you in.";
    return null;
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <main id="main-content">
        <section className="px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-md">
            {/* Back link */}
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft size={16} aria-hidden />
              Back to home
            </Link>

            {/* Logo header */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sprout size={22} aria-hidden />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight text-foreground">
                  OpenSprout
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  Plant care companion
                </p>
              </div>
            </div>

            <h1 className="text-display mb-2 text-foreground">
              Welcome back
            </h1>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              Sign in to your garden with Google.
            </p>

            {error && (
              <p
                className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border/60 bg-background text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {busy ? "Signing in..." : "Continue with Google"}
            </button>

            {platformHint && (
              <p className="mt-4 text-center text-xs text-muted-foreground/60">
                {platformHint}
              </p>
            )}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing in, you agree to our{" "}
              <Link
                href="/terms"
                className="text-primary hover:underline"
              >
                Terms
              </Link>
              {" "}and{" "}
              <Link
                href="/privacy"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
