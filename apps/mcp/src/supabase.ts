import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types.js";

export type Client = SupabaseClient<Database>;

function env(key: string): string {
  return process.env[key] ?? "";
}

/**
 * Computes the SHA-256 hex digest of a string.
 * Reusable — used by both the auth layer and token creation endpoints.
 */
export async function sha256Hex(input: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a cryptographically random MCP access token.
 * Format: osp_<32-random-hex-chars>
 * Reusable — used by both the CLI and token creation API.
 */
export function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "osp_";
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  for (let i = 0; i < 32; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
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

  const tokenHash = await sha256Hex(rawToken);

  // Create service-role client for auth-only queries
  const admin = createClient(supabaseUrl, serviceKey);

  // Look up the token hash
  const { data: records, error: lookupError } = await (admin
    .from("opensprout_mcp_tokens") as any)
    .select("user_id, id, revoked_at")
    .eq("token_hash", tokenHash);

  if (lookupError)
    throw new Error(
      `Token validation failed: unable to verify access token. ${lookupError.message}`,
    );
  if (!records || records.length === 0) {
    throw new Error(
      "Authentication failed: Invalid access token. The token provided does not match any active token. Generate a new token from Settings > MCP Access Tokens.",
    );
  }

  const record = records[0] as { user_id: string; id: string; revoked_at: string | null };

  if (record.revoked_at) {
    throw new Error(
      "Authentication failed: This access token has been revoked. Generate a new token from Settings > MCP Access Tokens.",
    );
  }

  // Update last_used_at
  await (admin.from("opensprout_mcp_tokens") as any)
    .update({ last_used_at: new Date().toISOString() } as any)
    .eq("id", record.id);

  // Return a service-role client for data queries.
  // All tool handlers receive userId and filter queries explicitly.
  const client = createClient<Database>(supabaseUrl, serviceKey);
  return { client, userId: record.user_id };
}
