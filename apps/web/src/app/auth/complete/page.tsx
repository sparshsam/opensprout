"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sprout, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

type AuthStatus = "exchanging" | "success" | "error";

/**
 * Inner component that reads search params and exchanges the PKCE code.
 * Separated from the outer shell so the Suspense boundary can catch
 * the `useSearchParams()` usage.
 */
function AuthCompleteInner() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [status, setStatus] = useState<AuthStatus>("exchanging");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!code) {
      setStatus("error");
      setErrorMsg("Missing authorization code. Please try signing in again.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (cancelled) return;

        if (error) {
          setStatus("error");
          setErrorMsg(error.message);
          return;
        }

        setStatus("success");

        // Notify the opener (PWA login tab) that sign-in is done
        if (window.opener) {
          try {
            window.opener.postMessage(
              { type: "opensprout-oauth-done" },
              window.location.origin,
            );
          } catch {
            // Cross-origin or missing opener — fall back to auto-close
          }
        }

        // Auto-close the popup after 3 seconds
        setTimeout(() => {
          if (window.opener) {
            window.close();
          }
        }, 3000);
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(
            err instanceof Error ? err.message : "Failed to complete sign-in.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="mx-auto max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sprout size={28} aria-hidden />
          </div>
        </div>

        {status === "exchanging" && (
          <>
            <Loader2
              className="mx-auto mb-4 animate-spin text-primary"
              size={32}
            />
            <h1 className="text-display mb-2 text-foreground">
              Signing you in…
            </h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we complete the sign-in.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2
              className="mx-auto mb-4 text-primary"
              size={40}
            />
            <h1 className="text-display mb-2 text-foreground">
              Signed in!
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You can now return to the app and continue managing your plants.
            </p>
            <p className="mt-4 text-xs text-muted-foreground/60">
              This window will close automatically.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto mb-4 text-destructive" size={40} />
            <h1 className="text-display mb-2 text-foreground">
              Sign-in failed
            </h1>
            <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
              {errorMsg}
            </p>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Try again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Outer shell with Suspense boundary for useSearchParams().
 */
export default function AuthCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      }
    >
      <AuthCompleteInner />
    </Suspense>
  );
}
