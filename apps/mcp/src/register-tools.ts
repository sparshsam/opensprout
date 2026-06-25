/**
 * Centralized tool registration.
 *
 * Single function shared by both stdio (index.ts) and HTTP (vercel-handler.ts)
 * transports so tool registration is always consistent.
 */
import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Client } from "./supabase.js";
import { registerPlantTools } from "./tools/plants.js";
import { registerSpeciesTools } from "./tools/species.js";
import { registerCareTools } from "./tools/care.js";
import { registerJournalTools } from "./tools/journal.js";
import { registerKnowledgeTools } from "./tools/knowledge.js";
import { registerIdentifyTools } from "./tools/identify.js";
import { registerExportTools } from "./tools/export.js";

export function registerAllTools(
  server: McpServer,
  getClient: () => Client,
  userId: string,
) {
  registerPlantTools(server, getClient, userId);
  registerSpeciesTools(server, getClient);
  registerCareTools(server, getClient, userId);
  registerJournalTools(server, getClient, userId);
  registerKnowledgeTools(server, getClient);
  registerIdentifyTools(server);
  registerExportTools(server, getClient, userId);
}
