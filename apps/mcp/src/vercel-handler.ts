/**
 * Vercel Serverless Handler for OpenSprout MCP Server.
 *
 * Uses Streamable HTTP transport so AI agents connect via URL + token.
 * The service role key stays in Vercel env vars — never exposed to clients.
 *
 * Usage in AI agent config:
 *   URL:  https://sprout.kovina.org/api/mcp
 *   Auth: Authorization: Bearer <personal-access-token>
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport }
  from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { authenticateToken } from "./supabase.js";
import { registerAllTools } from "./register-tools.js";
import { Readable } from "node:stream";
import type { ServerResponse } from "node:http";

/**
 * Converts a Web API Request into the Node.js IncomingMessage-like
 * object that StreamableHTTPServerTransport.handleRequest expects,
 * and creates a ServerResponse shim that collects the response.
 *
 * Returns the collected HTTP status, headers, and body as a Response.
 */
async function webRequestToNodeResponse(
  request: Request,
): Promise<Response> {
  const body = await request.arrayBuffer();

  // Build a minimal Node.js IncomingMessage shim
  const req = Readable.from(Buffer.from(body)) as unknown as NodeHttpRequest;
  req.method = request.method;
  req.url = request.url;
  req.headers = Object.fromEntries(request.headers.entries());

  // Build a ServerResponse shim that captures the output
  let statusCode = 200;
  const responseHeaders: Record<string, string> = {};
  const chunks: Buffer[] = [];

  const res = {
    statusCode,
    setHeader: (name: string, value: string | number) => {
      responseHeaders[name] = String(value);
      return res;
    },
    getHeader: (name: string) => responseHeaders[name],
    getHeaders: () => responseHeaders,
    writeHead: (code: number, headers?: Record<string, string | number>) => {
      statusCode = code;
      if (headers) {
        for (const [k, v] of Object.entries(headers)) {
          responseHeaders[k] = String(v);
        }
      }
      return res;
    },
    end: (data?: Buffer | string) => {
      if (data) chunks.push(Buffer.from(data));
      return res;
    },
    write: (data: Buffer | string) => {
      chunks.push(Buffer.from(data));
      return true;
    },
    on: () => res as unknown as ServerResponse,
    once: () => res as unknown as ServerResponse,
    emit: () => false,
    finished: false,
    setTimeout: () => res as unknown as ServerResponse,
  } as unknown as ServerResponse & { statusCode: number };

  // ── Auth ────────────────────────────────────────
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message:
            "Authentication required. Include an Authorization: Bearer <token> header "
            + "with a valid MCP access token from your OpenSprout Settings > AI Access page.",
        },
        id: null,
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  let userId: string;
  let client;
  try {
    const result = await authenticateToken(token);
    userId = result.userId;
    client = result.client;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid access token";
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: `Authentication failed: ${msg}` },
        id: null,
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── Server setup ──
  const server = new McpServer({
    name: "opensprout",
    version: "0.9.14",
    description:
      "OpenSprout plant care companion — plants, care schedules, logs, journal, knowledge, and export.",
  });

  registerAllTools(server, () => client, userId);

  // ── Streamable HTTP transport ──
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  // @ts-expect-error - StreamableHTTPServerTransport.handleRequest accepts
  // Node.js IncomingMessage + ServerResponse. We supply compatible shims.
  await transport.handleRequest(req, res, undefined);

  const bodyBuffer = Buffer.concat(chunks);
  return new Response(bodyBuffer, {
    status: statusCode,
    headers: responseHeaders,
  });
}

type NodeHttpRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
} & Readable;

/**
 * Handles an incoming MCP-over-HTTP request (Vercel App Router).
 *
 * 1. Extracts the bearer token from the Authorization header
 * 2. Validates it against the DB (SHA-256 hash lookup)
 * 3. Creates a fresh McpServer with all tools scoped to the authenticated user
 * 4. Processes the JSON-RPC message and returns the response
 */
export async function handleMcpRequest(request: Request): Promise<Response> {
  if (request.method === "GET") {
    // Health-check / session-establishment GET
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, result: { protocolVersion: "2024-11-05" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (request.method === "POST") {
    return webRequestToNodeResponse(request);
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
}
