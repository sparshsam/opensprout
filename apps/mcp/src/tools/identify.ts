import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Simple in-memory rate limiter for identify_plant
// PlantNet API calls cost money, so limit to N calls per minute
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_CALLS_PER_WINDOW = 10;

let callTimestamps: number[] = [];

function checkRateLimit(): void {
  const now = Date.now();
  // Remove timestamps outside the current window
  callTimestamps = callTimestamps.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS,
  );

  if (callTimestamps.length >= MAX_CALLS_PER_WINDOW) {
    const oldestInWindow = callTimestamps[0];
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - oldestInWindow);
    throw new Error(
      `Rate limit exceeded. Max ${MAX_CALLS_PER_WINDOW} identify calls per minute. Retry in ~${Math.ceil(retryAfterMs / 1000)}s.`,
    );
  }

  callTimestamps.push(now);
}

// The Supabase Edge Function URL for identify-plant
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";

export function registerIdentifyTools(server: McpServer) {
  server.tool(
    "identify_plant",
    "Identify a plant species from a photo. Sends the image to PlantNet AI for identification. Rate-limited to 10 calls per minute.",
    {
      imageBase64: z
        .string()
        .describe("Base64-encoded image of the plant (JPEG or PNG)"),
    },
    async ({ imageBase64 }) => {
      // Enforce rate limit
      checkRateLimit();

      if (!SUPABASE_URL) {
        throw new Error(
          "Supabase URL not configured. Set NEXT_PUBLIC_SUPABASE_URL.",
        );
      }

      const functionUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/identify-plant`;

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await response.json();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  );
}
