#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { authenticateToken } from "./supabase.js";
import { registerAllTools } from "./register-tools.js";

async function main() {
  const token = process.env.OPENSPROUT_ACCESS_TOKEN;
  if (!token) {
    console.error(
      "OpenSprout MCP server failed to start: OPENSPROUT_ACCESS_TOKEN is not set.\n" +
      "Generate a token from the OpenSprout web app (Settings → MCP Access Tokens → Create Token)\n" +
      "and set it as an environment variable when launching the MCP server.",
    );
    process.exit(1);
  }

  let client;
  let userId;
  try {
    const result = await authenticateToken(token);
    client = result.client;
    userId = result.userId;
  } catch (authError) {
    console.error(
      "OpenSprout MCP server failed to start: authentication error.\n" +
      "This usually means the access token is invalid, revoked, or the Supabase configuration is incorrect.\n" +
      "Error details:",
      authError instanceof Error ? authError.message : String(authError),
    );
    process.exit(1);
  }
  const getClient = () => client;

  const server = new McpServer({
    name: "opensprout",
    version: "0.9.13",
  });

  registerAllTools(server, getClient, userId);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(
    "OpenSprout MCP server encountered a fatal error and will exit.\n" +
    "Error details:",
    err instanceof Error ? `${err.name}: ${err.message}\n${err.stack}` : String(err),
  );
  process.exit(1);
});
