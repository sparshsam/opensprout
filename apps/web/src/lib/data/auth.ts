import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/data/types";

type Client = SupabaseClient<Database>;

export async function signUpWithEmail(supabase: Client, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
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

export async function signOut(supabase: Client) {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
