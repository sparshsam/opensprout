import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types.js";

export type Client = SupabaseClient<Database>;

function env(key: string): string {
  return process.env[key] ?? "";
}

/**
 * Authenticates an osp_ access token:
 * 1. SHA-256 hash the raw token
 * 2. Look up the hash in mcp_tokens (via service-role client)
 * 3. Update last_used_at
 * 4. Return a service-role client + userId
 *
 * The service role key is needed for token hash lookup (mcp_tokens table).
 * All subsequent data queries must filter by userId — the application
 * layer enforces user data isolation the same way RLS would.
 */
export async function authenticateToken(
  rawToken: string,
): Promise<{ client: Client; userId: string }> {
  const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL") || env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey =
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") || env("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for token validation.");
  }

  // SHA-256 hash the raw token
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(rawToken),
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const tokenHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Create service-role client for auth-only queries
  const admin = createClient(supabaseUrl, serviceKey);

  // Look up the token hash
  const { data: records, error: lookupError } = await (admin
    .from("mcp_tokens") as any)
    .select("user_id, id")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null);

  if (lookupError) throw new Error(`Token lookup failed: ${lookupError.message}`);
  if (!records || records.length === 0) {
    throw new Error("Authentication failed: Invalid or revoked token");
  }

  const record = records[0] as { user_id: string; id: string };

  // Update last_used_at
  await (admin.from("mcp_tokens") as any)
    .update({ last_used_at: new Date().toISOString() } as any)
    .eq("id", record.id);

  // Return a service-role client for data queries.
  // All tool handlers receive userId and filter queries explicitly.
  const client = createClient<Database>(supabaseUrl, serviceKey);
  return { client, userId: record.user_id };
}
