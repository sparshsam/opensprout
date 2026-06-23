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
    "List journal entries for a plant. Shows your observations, notes, and health scores over time. Returns the most recent entries first.",
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
        .eq("user_id", userId)
        .eq("plant_id", plantId)
        .is("deleted_at", null)
        .order("observed_at", { ascending: false })
        .limit(limit);

      if (error) throw new Error("Failed to list journal entries: " + error.message);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );

  server.tool(
    "get_journal_entry",
    "Get the full details of a specific journal entry by its ID. Shows the body, health score, tags, and timestamps.",
    {
      entryId: z.string().describe("The journal entry ID"),
    },
    async ({ entryId }) => {
      const { data, error } = await getClient()
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      if (error) throw new Error("Failed to get journal entry: " + error.message);
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
    "Create a journal entry for a plant. Use this to log observations, milestones, growth notes, health changes, or any plant-related thoughts. You can optionally add a health score and tags.",
    {
      plantId: z.string().describe("The plant ID"),
      body: z.string().describe("The journal entry body text"),
      title: z.string().optional().describe("Optional title for the entry"),
      healthScore: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .describe("Optional health score from 1-5 (1=poor, 5=excellent)"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Optional tags (e.g., 'flowering', 'new-leaf')"),
    },
    async ({ plantId, body, title, healthScore, tags }) => {
      const c = getClient() as any;

      // Ownership check: verify plant belongs to this user
      const { data: plant, error: plantError } = await c
        .from("plants")
        .select("id")
        .eq("id", plantId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();
      if (plantError || !plant) throw new Error("Plant not found or access denied");

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

      if (error) throw new Error("Failed to create journal entry: " + error.message);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    },
  );

  // ── Update journal entry ───────────────────────────────────────────
  server.tool(
    "update_journal_entry",
    "Update an existing journal entry. Only the fields you provide will be changed.",
    {
      entryId: z.string().describe("The journal entry ID to update"),
      body: z.string().optional().describe("New body text for the entry"),
      title: z.string().optional().describe("New title for the entry"),
      healthScore: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .describe("New health score from 1-5 (1=poor, 5=excellent)"),
      tags: z
        .array(z.string())
        .optional()
        .describe("New tags (e.g., 'flowering', 'new-leaf')"),
    },
    async ({ entryId, body, title, healthScore, tags }) => {
      const c = getClient() as any;

      // Ownership check
      const { data: entry, error: checkError } = await c
        .from("journal_entries")
        .select("id")
        .eq("id", entryId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      if (checkError || !entry) {
        throw new Error("Journal entry not found or access denied");
      }

      const updates: Record<string, unknown> = {};
      if (body !== undefined) updates.body = body;
      if (title !== undefined) updates.title = title;
      if (healthScore !== undefined) updates.health_score = healthScore;
      if (tags !== undefined) updates.tags = tags;

      const { data, error } = await c
        .from("journal_entries")
        .update(updates)
        .eq("id", entryId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update journal entry: ${error.message}`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    },
  );

  // ── Delete journal entry ───────────────────────────────────────────
  server.tool(
    "delete_journal_entry",
    "Soft-delete a journal entry. It will no longer appear in lists but is not permanently removed.",
    {
      entryId: z.string().describe("The journal entry ID to delete"),
    },
    async ({ entryId }) => {
      const c = getClient() as any;

      // Ownership check
      const { data: entry, error: checkError } = await c
        .from("journal_entries")
        .select("id")
        .eq("id", entryId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      if (checkError || !entry) {
        throw new Error("Journal entry not found or access denied");
      }

      const { error } = await c
        .from("journal_entries")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", entryId);

      if (error) throw new Error(`Failed to delete journal entry: ${error.message}`);
      return {
        content: [
          { type: "text" as const, text: `Journal entry ${entryId} deleted successfully.` },
        ],
      };
    },
  );
}
