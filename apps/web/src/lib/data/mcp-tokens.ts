import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/data/types";

type Client = SupabaseClient<Database>;

export type McpToken = {
  id: string;
  user_id: string;
  name: string;
  token_prefix: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
};

export type McpTokenWithSecret = McpToken & {
  rawToken: string;
};

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "osp_";
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  for (let i = 0; i < 32; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getTokenPrefix(token: string): string {
  return token.substring(0, 12) + "...";
}

export async function listMcpTokens(
  supabase: Client,
  userId: string,
): Promise<McpToken[]> {
  const { data, error } = await supabase
    .from("mcp_tokens")
    .select("id, user_id, name, token_prefix, last_used_at, created_at, revoked_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as McpToken[];
}

export async function createMcpToken(
  supabase: Client,
  userId: string,
  name: string,
): Promise<McpTokenWithSecret> {
  const rawToken = generateToken();
  const tokenHash = await hashToken(rawToken);
  const prefix = getTokenPrefix(rawToken);

  const { data, error } = await (supabase as any)
    .from("mcp_tokens")
    .insert({
      user_id: userId,
      name,
      token_hash: tokenHash,
      token_prefix: prefix,
    })
    .select("id, user_id, name, token_prefix, last_used_at, created_at, revoked_at")
    .single();

  if (error) throw error;

  return { ...(data as McpToken), rawToken };
}

export async function revokeMcpToken(
  supabase: Client,
  tokenId: string,
  userId: string,
): Promise<void> {
  const { error } = await (supabase as any)
    .from("mcp_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId)
    .eq("user_id", userId);

  if (error) throw error;
}
