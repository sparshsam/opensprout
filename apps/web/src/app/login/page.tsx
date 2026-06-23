"use client";

import { useState, useMemo, type FormEvent } from "react";
import { Sprout, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithEmail, signUpWithEmail } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/data/types";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import Link from "next/link";

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  console.error(error);
  return "Something went wrong. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();

  const supabase = useMemo<SupabaseClient<Database> | null>(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const client = supabase;
    if (!client) {
      setError(
        "App configuration is missing. Please contact support.",
      );
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
        const result = await signUpWithEmail(client, email, password);
        setMessage(
          result.session
            ? "Account created. Loading your garden..."
            : "Check your email to confirm your account, then log in.",
        );
      } else {
        await signInWithEmail(client, email, password);
        router.replace("/today");
      }
    } catch (authError) {
      setError(errorMessage(authError));
    } finally {
      setBusy(false);
    }
  }

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
              {mode === "login" ? "Welcome back" : "Create your garden"}
            </h1>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              {mode === "login"
                ? "Sign in to your garden."
                : "Start tracking your plants."}
            </p>

            <form className="space-y-4" onSubmit={handleAuth}>
              <label className="block text-sm font-semibold text-foreground">
                Email
                <Input
                  className="mt-2"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold text-foreground">
                Password
                <Input
                  className="mt-2"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {error && (
                <p
                  className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}
              {message && (
                <p
                  className="rounded-xl border border-success/20 bg-success/10 p-3 text-sm font-medium text-success"
                  role="status"
                >
                  {message}
                </p>
              )}

              <Button className="w-full" disabled={busy}>
                {busy && <Loader2 className="animate-spin" size={16} aria-hidden />}
                {mode === "signup" ? "Create account" : "Login"}
              </Button>
            </form>

            <button
              className="mt-6 w-full text-center text-sm font-semibold text-primary transition hover:underline"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setError(null);
                setMessage(null);
              }}
            >
              {mode === "signup"
                ? "Already have an account? Login"
                : "Need an account? Sign up"}
            </button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
