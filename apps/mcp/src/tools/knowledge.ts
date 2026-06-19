import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Client } from "../supabase.js";

export function registerKnowledgeTools(
  server: McpServer,
  getClient: () => Client,
) {
  server.tool(
    "search_knowledge",
    "Search the plant knowledge base for care tips, diagnosis information, and general articles.",
    {
      query: z.string().describe("Search query"),
      category: z
        .enum(["care", "diagnosis", "propagation", "general"])
        .optional()
        .describe("Filter by article category"),
    },
    async ({ query, category }) => {
      let dbQuery = getClient()
        .from("knowledge_articles")
        .select("*")
        .or(`title.ilike.%${query}%,body.ilike.%${query}%`);

      if (category) {
        dbQuery = dbQuery.eq("category", category);
      }

      const { data, error } = await dbQuery.limit(20);

      if (error) throw error;
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );

  server.tool(
    "diagnose_plant",
    "Get possible plant diagnosis information for a given symptom. Returns potential causes and solutions.",
    {
      symptom: z
        .string()
        .describe("The symptom to look up (e.g., 'yellow leaves', 'wilting')"),
    },
    async ({ symptom }) => {
      const { data, error } = await getClient()
        .from("diagnosis_entries")
        .select("*")
        .or(`symptom.ilike.%${symptom}%,cause.ilike.%${symptom}%`)
        .order("sort_order")
        .limit(20);

      if (error) throw error;
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );
}
