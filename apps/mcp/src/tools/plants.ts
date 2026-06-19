import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Client } from "../supabase.js";

export function registerPlantTools(
  server: McpServer,
  getClient: () => Client,
) {
  server.tool(
    "list_plants",
    "List all plants in the user's collection with their species, health status, and location.",
    {},
    async () => {
      const { data, error } = await getClient()
        .from("plants")
        .select("*")
        .is("deleted_at", null)
        .order("name");

      if (error) throw error;
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "get_plant",
    "Get detailed information about a specific plant by its ID.",
    {
      plantId: z.string().describe("The ID of the plant to retrieve"),
    },
    async ({ plantId }) => {
      const { data, error } = await getClient()
        .from("plants")
        .select("*")
        .eq("id", plantId)
        .is("deleted_at", null)
        .single();

      if (error) throw error;
      return {
        content: [
          {
            type: "text" as const,
            text: data
              ? JSON.stringify(data, null, 2)
              : "Plant not found",
          },
        ],
      };
    },
  );

  server.tool(
    "update_plant",
    "Update a plant's name, location, notes, or health status.",
    {
      plantId: z.string().describe("The ID of the plant to update"),
      name: z.string().optional().describe("New plant name"),
      location: z.string().optional().describe("New location"),
      notes: z.string().optional().describe("New notes"),
      healthStatus: z
        .enum(["unknown", "thriving", "stable", "watch", "struggling"])
        .optional()
        .describe("New health status"),
    },
    async ({ plantId, name, location, notes, healthStatus }) => {
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (location !== undefined) updates.location = location;
      if (notes !== undefined) updates.notes = notes;
      if (healthStatus !== undefined) updates.health_status = healthStatus;

      if (Object.keys(updates).length === 0) {
        return {
          content: [
            { type: "text" as const, text: "No fields provided to update." },
          ],
        };
      }

      const c = getClient() as any;
      const { data, error } = await c
        .from("plants")
        .update(updates)
        .eq("id", plantId)
        .is("deleted_at", null)
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
