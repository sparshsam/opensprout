/**
 * OpenSprout MCP Server — HTTP Endpoint (Streamable HTTP)
 *
 * AI agents connect here with their personal MCP access token.
 * The Supabase service role key stays server-side in Vercel env vars.
 *
 * Configure your AI agent with:
 *   url:     https://sprout.kovina.org/api/mcp
 *   headers: { Authorization: "Bearer <your-token>" }
 *
 * Token must use format: osp_<32-char-hex>
 * Generate one at: Settings → AI Access → Create Token
 */
import { handleMcpRequest } from "@/lib/mcp-handler";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST — Main MCP JSON-RPC message handler.
 * All tool calls, resource reads, and prompts flow through this method.
 */
export async function POST(request: NextRequest) {
  return handleMcpRequest(request);
}

/**
 * GET — Some MCP clients use GET for SSE-style connection
 * establishment or health checks before sending JSON-RPC messages.
 */
export async function GET(request: NextRequest) {
  return handleMcpRequest(request);
}
