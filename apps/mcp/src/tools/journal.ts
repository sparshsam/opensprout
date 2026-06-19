import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Client } from "../supabase.js";

export function registerJournalTools(
  server: McpServer,
  getClient: () => Client,
  userId: string,
) {
  server.tool(
    "list_journal_entries",
    "List journal entries for a plant. Returns the most recent entries first.",
    {
      plantId: z.string().describe("The plant ID"),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Maximum number of entries to return"),
    },
    async ({ plantId, limit }) => {
      const { data, error } = await getClient()
        .from("journal_entries")
        .select("*")
        .eq("plant_id", plantId)
        .is("deleted_at", null)
        .order("observed_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );

  server.tool(
    "get_journal_entry",
    "Get a specific journal entry with full details.",
    {
      entryId: z.string().describe("The journal entry ID"),
    },
    async ({ entryId }) => {
      const { data, error } = await getClient()
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .is("deleted_at", null)
        .single();

      if (error) throw error;
      return {
        content: [
          {
            type: "text" as const,
            text: data
              ? JSON.stringify(data, null, 2)
              : "Journal entry not found",
          },
        ],
      };
    },
  );

  server.tool(
    "create_journal_entry",
    "Create a journal entry for a plant. Use this to log observations, growth notes, or any plant-related thoughts.",
    {
      plantId: z.string().describe("The plant ID"),
      body: z.string().describe("The journal entry body text"),
      title: z.string().optional().describe("Optional title for the entry"),
      healthScore: z
        .number()
        .min(0)
        .max(10)
        .optional()
        .describe("Optional health score from 0-10"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Optional tags (e.g., 'flowering', 'new-leaf')"),
    },
    async ({ plantId, body, title, healthScore, tags }) => {
      const c = getClient() as any;
      const { data, error } = await c
        .from("journal_entries")
        .insert({
          plant_id: plantId,
          user_id: userId,
          body,
          title: title ?? null,
          health_score: healthScore ?? null,
          tags: tags ?? [],
        })
        .select()
        .single();

      if (error) throw error;
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    },
  );
}
