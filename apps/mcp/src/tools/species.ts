import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Client } from "../supabase.js";

export function registerSpeciesTools(
  server: McpServer,
  getClient: () => Client,
) {
  server.tool(
    "search_species",
    "Search plant species by common name or scientific name. Returns matching species with their light, water, and care requirements. Use this to find species information when adding a new plant or researching care needs.",
    {
      query: z.string().describe("Search query (common or scientific name)"),
    },
    async ({ query }) => {
      const { data, error } = await getClient()
        .from("opensprout_plant_species")
        .select("*")
        .or(`common_name.ilike.%${query}%,scientific_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw new Error("Failed to search species: " + error.message);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );

  server.tool(
    "get_species",
    "Get a complete care guide for a plant species by its ID. Returns care requirements, growing tips, common problems, and any associated knowledge articles.",
    {
      speciesId: z.string().describe("The ID of the species to retrieve"),
    },
    async ({ speciesId }) => {
      const client = getClient();
      const { data: species, error: speciesError } = await client
        .from("opensprout_plant_species")
        .select("*")
        .eq("id", speciesId)
        .single();

      if (speciesError) throw new Error("Failed to get species: " + speciesError.message);
      if (!species) {
        return {
          content: [{ type: "text" as const, text: "Species not found" }],
        };
      }

      const { data: articles } = await client
        .from("opensprout_knowledge_articles")
        .select("*")
        .eq("species_id", speciesId)
        .order("sort_order");

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { species, articles: articles ?? [] },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
