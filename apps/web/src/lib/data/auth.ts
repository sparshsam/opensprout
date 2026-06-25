import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/data/types";

type Client = SupabaseClient<Database>;

/**
 * Get the current app's origin for auth redirects.
 * Falls back to production URL if window is not available (SSR).
 */
function appOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://sprout.kovina.org";
}

export async function signUpWithEmail(supabase: Client, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appOrigin()}/login`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(supabase: Client, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function resetPassword(supabase: Client, email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appOrigin()}/login`,
  });
  if (error) throw error;
  return data;
}

export async function signOut(supabase: Client) {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
