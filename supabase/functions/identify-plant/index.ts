import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const PLANTNET_API_BASE = "https://my-api.plantnet.org/v2/identify/all";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Supabase Edge Function: identify-plant
 *
 * Proxies plant identification requests to the PlantNet API.
 * Accepts a base64-encoded image and returns the PlantNet results.
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed — use POST" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const apiKey = Deno.env.get("PLANTNET_API_KEY");

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "PlantNet API key is not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await req.json();

    if (!body.imageBase64 || typeof body.imageBase64 !== "string") {
      return new Response(
        JSON.stringify({
          error: "imageBase64 string is required in the request body",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Decode the base64 image
    const base64Data = body.imageBase64.replace(
      /^data:image\/\w+;base64,/,
      "",
    );
    const imageBytes = Uint8Array.from(
      atob(base64Data),
      (c) => c.charCodeAt(0),
    );

    // Determine MIME type
    const mimeMatch = body.imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const ext = mimeType.split("/")[1] || "jpg";

    // Build multipart form data
    const formData = new FormData();
    const imageBlob = new Blob([imageBytes], { type: mimeType });
    formData.append("images", imageBlob, `plant.${ext}`);
    formData.append("organs", "leaf");

    const url = `${PLANTNET_API_BASE}?api-key=${apiKey}`;

    const plantnetResponse = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await plantnetResponse.json();

    return new Response(JSON.stringify(data), {
      status: plantnetResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PlantNet API proxy error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process plant identification request",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
