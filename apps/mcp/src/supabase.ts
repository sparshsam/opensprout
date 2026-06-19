import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types.js";

export type Client = SupabaseClient<Database>;

function getSuperbaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
}

function getSuperbaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    ""
  );
}

export function createSupabaseClient(token: string): Client {
  const url = getSuperbaseUrl();
  const key = getSuperbaseAnonKey();

  if (!url || !key) {
    throw new Error(
      "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createClient<Database>(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

export async function getAuthUser(token: string) {
  const client = createSupabaseClient(token);
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);
  if (error || !user) {
    throw new Error(
      `Authentication failed: ${error?.message ?? "Invalid token"}`,
    );
  }
  return user;
}
