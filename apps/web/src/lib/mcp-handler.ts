/**
 * MCP Vercel handler — local copy for Next.js API route.
 *
 * (Approach 1 from MCP Build Guide: duplicate the handler in the web app's lib
 * to avoid cross-workspace TypeScript import issues.)
 *
 * For source of truth see: apps/mcp/src/vercel-handler.ts
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  StreamableHTTPServerTransport,
} from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Readable } from "node:stream";
import {
  authenticateToken,
  type Client,
} from "@opensprout/mcp/dist/supabase";
import { registerAllTools } from "@opensprout/mcp/dist/register-tools";

/**
 * Process an MCP HTTP request and return a Response.
 */
export async function handleMcpRequest(request: Request): Promise<Response> {
  // ── GET: health check ──────────────────────────
  if (request.method === "GET") {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        result: { protocolVersion: "2024-11-05" },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── POST: process JSON-RPC message ─────────────
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  // Auth
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return jsonRpcError(
      -32000,
      "Authentication required. Include an Authorization: Bearer <token> header with a valid MCP access token from Settings > AI Access.",
    );
  }

  let userId: string;
  let client: Client;
  try {
    const result = await authenticateToken(token);
    userId = result.userId;
    client = result.client;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid access token";
    return jsonRpcError(-32000, `Authentication failed: ${msg}`);
  }

  // Build the MCP server with all tools
  const server = new McpServer({
    name: "opensprout",
    version: "0.9.14",
    description:
      "OpenSprout plant care companion — plants, care schedules, logs, journal, knowledge, and export.",
  });
  registerAllTools(server, () => client, userId);

  // Convert Web request to Node.js IncomingMessage
  const body = await request.arrayBuffer();
  const req = Readable.from(Buffer.from(body)) as unknown as {
    method: string;
    url: string;
    headers: Record<string, string>;
  } & Readable;
  req.method = request.method;
  req.url = request.url;
  req.headers = Object.fromEntries(request.headers.entries());

  // Collect the Node.js ServerResponse output
  let statusCode = 200;
  const responseHeaders: Record<string, string> = {};
  const chunks: Buffer[] = [];

  const serverResponse = {
    statusCode,
    setHeader: (n: string, v: string | number) => {
      responseHeaders[n] = String(v);
      return serverResponse;
    },
    getHeader: (n: string) => responseHeaders[n],
    getHeaders: () => responseHeaders,
    writeHead: (c: number, h?: Record<string, string | number>) => {
      statusCode = c;
      if (h) for (const [k, v] of Object.entries(h)) responseHeaders[k] = String(v);
      return serverResponse;
    },
    end: (d?: Buffer | string) => {
      if (d) chunks.push(Buffer.from(d));
      return serverResponse;
    },
    write: (d: Buffer | string) => {
      chunks.push(Buffer.from(d));
      return true;
    },
    on: () => serverResponse,
    once: () => serverResponse,
    emit: () => false,
    finished: false,
    setTimeout: () => serverResponse,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  // Transport + handle
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (transport as any).handleRequest(req, serverResponse, undefined);

  return new Response(Buffer.concat(chunks), {
    status: statusCode,
    headers: responseHeaders,
  });
}

/**
 * Helper: return a JSON-RPC error Response.
 */
function jsonRpcError(code: number, message: string): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code, message },
      id: null,
    }),
    { status: 401, headers: { "Content-Type": "application/json" } },
  );
}
