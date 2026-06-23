import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Client } from "../supabase.js";

export function registerPlantTools(
  server: McpServer,
  getClient: () => Client,
  userId: string,
) {
  server.tool(
    "list_plants",
    "List all your plants with their species, health status, and location. Use this to get an overview of your entire plant collection.",
    {},
    async () => {
      const { data, error } = await getClient()
        .from("plants")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("name");

      if (error) throw new Error("Failed to list plants: " + error.message);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  // ── Search plants ──────────────────────────────────────────────────
  server.tool(
    "search_plants",
    "Search your plants by name, location, or species name. Use this instead of list_plants when you're looking for specific plants rather than everything.",
    {
      query: z.string().describe("Search query to match against plant name, location, or species name"),
    },
    async ({ query }) => {
      const { data, error } = await getClient()
        .from("plants")
        .select("*")
        .eq("user_id", userId)
        .or(`name.ilike.%${query}%,location.ilike.%${query}%,species.ilike.%${query}%`)
        .is("deleted_at", null)
        .order("name")
        .limit(50);

      if (error) throw new Error("Failed to search plants: " + error.message);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data ?? [], null, 2) }],
      };
    },
  );

  server.tool(
    "get_plant",
    "Get complete details for one of your plants by its ID, including species, care history, health status, and location.",
    {
      plantId: z.string().describe("The ID of the plant to retrieve"),
    },
    async ({ plantId }) => {
      const { data, error } = await getClient()
        .from("plants")
        .select("*")
        .eq("id", plantId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      if (error) throw new Error("Failed to get plant: " + error.message);
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
    "Update a plant's name, location, notes, or health status. Only the fields you provide will be changed. Use this to keep your plant records up to date.",
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

      // Ownership check: verify plant belongs to this user
      const { data: plant, error: plantError } = await getClient()
        .from("plants")
        .select("id")
        .eq("id", plantId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();
      if (plantError || !plant) throw new Error("Plant not found or access denied");

      const c = getClient() as any;
      const { data, error } = await c
        .from("plants")
        .update(updates)
        .eq("id", plantId)
        .is("deleted_at", null)
        .select()
        .single();

      if (error) throw new Error("Failed to update plant: " + error.message);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    },
  );

  // ── Add plant ──────────────────────────────────────────────────────
  server.tool(
    "add_plant",
    "Add a new plant to the user's collection with optional species, location, notes, health status, nickname, and acquisition date.",
    {
      name: z.string().describe("The plant's name"),
      speciesId: z.string().optional().describe("The species ID from the plant species database"),
      species: z.string().optional().describe("The common or scientific species name (free text)"),
      location: z.string().optional().describe("Where the plant is located (e.g. 'Living room', 'Kitchen window')"),
      notes: z.string().optional().describe("Optional notes about the plant"),
      healthStatus: z
        .enum(["unknown", "thriving", "stable", "watch", "struggling"])
        .optional()
        .describe("Initial health status of the plant"),
      nickname: z.string().optional().describe("A fun nickname for the plant"),
      acquiredOn: z.string().optional().describe("Date the plant was acquired (ISO 8601)"),
    },
    async ({ name, speciesId, species, location, notes, healthStatus, nickname, acquiredOn }) => {
      const c = getClient() as any;
      const { data, error } = await c
        .from("plants")
        .insert({
          name,
          user_id: userId,
          species_id: speciesId ?? null,
          species: species ?? null,
          location: location ?? null,
          notes: notes ?? null,
          health_status: healthStatus ?? null,
          nickname: nickname ?? null,
          acquired_on: acquiredOn ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to add plant: ${error.message}`);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    },
  );

  // ── Delete plant (soft-delete) ─────────────────────────────────────
  server.tool(
    "delete_plant",
    "Soft-delete a plant by setting its deleted_at timestamp. The plant is not permanently removed from the database.",
    {
      plantId: z.string().describe("The ID of the plant to delete"),
    },
    async ({ plantId }) => {
      const c = getClient() as any;

      // Ownership check
      const { data: plant, error: checkError } = await c
        .from("plants")
        .select("id")
        .eq("id", plantId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      if (checkError || !plant) {
        throw new Error("Plant not found or access denied");
      }

      const { error } = await c
        .from("plants")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", plantId);

      if (error) throw new Error(`Failed to delete plant: ${error.message}`);
      return {
        content: [
          { type: "text" as const, text: `Plant ${plantId} deleted successfully.` },
        ],
      };
    },
  );

  // ── Archive plant ──────────────────────────────────────────────────
  server.tool(
    "archive_plant",
    "Archive a plant so it no longer appears in the active list. The plant can be restored later.",
    {
      plantId: z.string().describe("The ID of the plant to archive"),
    },
    async ({ plantId }) => {
      const c = getClient() as any;

      // Ownership check
      const { data: plant, error: checkError } = await c
        .from("plants")
        .select("id")
        .eq("id", plantId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      if (checkError || !plant) {
        throw new Error("Plant not found or access denied");
      }

      const { error } = await c
        .from("plants")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", plantId);

      if (error) throw new Error(`Failed to archive plant: ${error.message}`);
      return {
        content: [
          { type: "text" as const, text: `Plant ${plantId} archived successfully.` },
        ],
      };
    },
  );

  // ── Restore plant ──────────────────────────────────────────────────
  server.tool(
    "restore_plant",
    "Restore an archived plant so it appears in the active list again.",
    {
      plantId: z.string().describe("The ID of the plant to restore"),
    },
    async ({ plantId }) => {
      const c = getClient() as any;

      // Ownership check
      const { data: plant, error: checkError } = await c
        .from("plants")
        .select("id")
        .eq("id", plantId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      if (checkError || !plant) {
        throw new Error("Plant not found or access denied");
      }

      const { error } = await c
        .from("plants")
        .update({ archived_at: null })
        .eq("id", plantId);

      if (error) throw new Error(`Failed to restore plant: ${error.message}`);
      return {
        content: [
          { type: "text" as const, text: `Plant ${plantId} restored successfully.` },
        ],
      };
    },
  );
}
