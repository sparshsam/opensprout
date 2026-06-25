/**
 * MCP Token Management — Revoke
 *
 * DELETE /api/mcp/tokens/[id] — Revoke (soft-delete) a specific token
 *
 * Sets revoked_at timestamp. The MCP server rejects revoked tokens during auth.
 * The database record is retained for audit but the token_hash can no longer
 * authenticate.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/browser";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { id } = await params;

  // Verify the token belongs to the current user
  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await (admin
    .from("mcp_tokens") as any)
    .select("id, user_id, revoked_at")
    .eq("id", id)
    .single();

  if (lookupError || !existing) {
    return NextResponse.json(
      { error: "Token not found." },
      { status: 404 },
    );
  }

  const token = existing as unknown as { user_id: string; revoked_at: string | null };

  if (token.user_id !== user.id) {
    return NextResponse.json(
      { error: "Access denied. This token does not belong to you." },
      { status: 403 },
    );
  }

  if (token.revoked_at) {
    return NextResponse.json(
      { message: "Token was already revoked." },
    );
  }

  await (admin
    .from("mcp_tokens") as any)
    .update({ revoked_at: new Date().toISOString() } as any)
    .eq("id", id);

  return NextResponse.json({ message: "Token revoked successfully." });
}
