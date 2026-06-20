#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { authenticateToken } from "./supabase.js";
import { registerPlantTools } from "./tools/plants.js";
import { registerSpeciesTools } from "./tools/species.js";
import { registerCareTools } from "./tools/care.js";
import { registerJournalTools } from "./tools/journal.js";
import { registerKnowledgeTools } from "./tools/knowledge.js";
import { registerIdentifyTools } from "./tools/identify.js";

async function main() {
  const token = process.env.OPENSPROUT_ACCESS_TOKEN;
  if (!token) {
    console.error("OPENSPROUT_ACCESS_TOKEN is required");
    process.exit(1);
  }

  const { client, userId } = await authenticateToken(token);
  const getClient = () => client;

  const server = new McpServer({
    name: "opensprout",
    version: "0.1.0",
  });

  registerPlantTools(server, getClient);
  registerSpeciesTools(server, getClient);
  registerCareTools(server, getClient, userId);
  registerJournalTools(server, getClient, userId);
  registerKnowledgeTools(server, getClient);
  registerIdentifyTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server error:", err);
  process.exit(1);
});
