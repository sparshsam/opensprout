/**
 * MCP Token Management API
 *
 * POST /api/mcp/tokens — Create a new MCP access token
 * GET  /api/mcp/tokens — List all tokens for the authenticated user
 *
 * The raw token is returned only once during creation.
 * Only the SHA-256 hash and a display prefix are stored.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/browser";
import { createAdminClient } from "@/lib/supabase/admin";
import { sha256Hex, generateToken } from "@/lib/mcp-auth";

/**
 * Generate a display prefix for the token (first 12 chars + "...").
 */
function getTokenPrefix(token: string): string {
  return token.substring(0, 12) + "...";
}

/**
 * POST — Create a new MCP access token.
 *
 * Body: { name: string }
 * Returns: { token: string, message: string }
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required. Sign in to create MCP tokens." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "Token name is required. Give your token a descriptive name (e.g. 'Claude Code', 'Cursor')." },
      { status: 400 },
    );
  }

  if (name.length > 100) {
    return NextResponse.json(
      { error: "Token name must be 100 characters or fewer." },
      { status: 400 },
    );
  }

  // Generate token and hash
  const rawToken = generateToken();
  const tokenHash = await sha256Hex(rawToken);
  const prefix = getTokenPrefix(rawToken);

  // Store hash + prefix
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (admin.from("mcp_tokens") as any)
    .insert({
      name,
      user_id: user.id,
      token_hash: tokenHash,
      token_prefix: prefix,
    });

  if (insertError) {
    return NextResponse.json(
      { error: `Failed to create token: ${insertError.message}` },
      { status: 500 },
    );
  }

  // Return raw token ONCE
  return NextResponse.json({
    token: rawToken,
    message: "Token created. This is the only time it will be shown. Save it now.",
  });
}

/**
 * GET — List all MCP tokens for the authenticated user.
 *
 * Returns metadata only — never exposes token_hash.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from("mcp_tokens") as any)
    .select("id, name, token_prefix, last_used_at, created_at, revoked_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: `Failed to list tokens: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ tokens: data ?? [] });
}
