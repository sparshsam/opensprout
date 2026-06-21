"use client";

import { useState, useMemo, type FormEvent } from "react";
import { Sprout, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithEmail, signUpWithEmail } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/data/types";

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
        "Supabase configuration is missing. Check your environment variables.",
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
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground" id="main-content">
      <section className="w-full max-w-md rounded-md border border-border bg-card p-6 shadow-panel">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sprout size={22} aria-hidden />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">OpenSprout</p>
            <p className="text-xs font-medium text-muted-foreground">
              Your plants. Your data.
            </p>
          </div>
        </div>

        <h1 className="text-3xl font-bold">Sign in to your garden</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          OpenSprout uses Supabase Auth and RLS so every plant row belongs to
          your user.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleAuth}>
          <label className="block text-sm font-semibold">
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
          <label className="block text-sm font-semibold">
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
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800" role="status">
              {message}
            </p>
          )}

          <Button className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" size={16} aria-hidden />}
            {mode === "signup" ? "Create account" : "Login"}
          </Button>
        </form>

        <button
          className="mt-4 text-sm font-semibold text-primary hover:underline"
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
      </section>
    </main>
  );
}
