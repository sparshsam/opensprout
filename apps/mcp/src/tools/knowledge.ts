import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Client } from "../supabase.js";

export function registerKnowledgeTools(
  server: McpServer,
  getClient: () => Client,
) {
  server.tool(
    "search_knowledge",
    "Search the plant knowledge base for care tips, diagnosis information, propagation guides, and general articles. Use this to find advice about a specific topic.",
    {
      query: z.string().describe("Search query"),
      category: z
        .enum(["care", "diagnosis", "propagation", "general"])
        .optional()
        .describe("Filter by article category"),
    },
    async ({ query, category }) => {
      let dbQuery = getClient()
        .from("opensprout_knowledge_articles")
        .select("*")
        .or(`title.ilike.%${query}%,body.ilike.%${query}%`);

      if (category) {
        dbQuery = dbQuery.eq("category", category);
      }

      const { data, error } = await dbQuery.limit(20);

      if (error) throw new Error("Failed to search knowledge base: " + error.message);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );

  server.tool(
    "diagnose_plant",
    "Look up possible causes and solutions for a plant symptom. Use this when you notice issues like yellow leaves, wilting, brown spots, or drooping.",
    {
      symptom: z
        .string()
        .describe("The symptom to diagnose (e.g., 'yellow leaves', 'wilting', 'brown spots')"),
    },
    async ({ symptom }) => {
      const { data, error } = await getClient()
        .from("opensprout_diagnosis_entries")
        .select("*")
        .or(`symptom.ilike.%${symptom}%,cause.ilike.%${symptom}%`)
        .order("sort_order")
        .limit(20);

      if (error) throw new Error("Failed to look up diagnosis: " + error.message);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data ?? [], null, 2) },
        ],
      };
    },
  );
}
