import { NextRequest, NextResponse } from "next/server";

const PLANTNET_API_BASE = "https://my-api.plantnet.org/v2/identify/all";

/**
 * POST /api/identify
 *
 * Proxies plant identification requests to the PlantNet API.
 * Accepts a base64-encoded image and returns the PlantNet results.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.PLANTNET_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "PlantNet API key is not configured" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  }

  try {
    const body = await request.json();

    if (!body.imageBase64 || typeof body.imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 string is required in the request body" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        },
      );
    }

    // Decode the base64 image and prepare multipart form data
    const imageBuffer = Buffer.from(body.imageBase64, "base64");

    // Determine MIME type from base64 prefix or default to image/jpeg
    const mimeType = body.imageBase64.startsWith("data:image/")
      ? body.imageBase64.split(";")[0].split(":")[1]
      : "image/jpeg";

    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: mimeType });
    formData.append("images", blob, `plant.${mimeType.split("/")[1] || "jpg"}`);
    formData.append("organs", "leaf");

    const url = `${PLANTNET_API_BASE}?api-key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("PlantNet API proxy error:", error);
    return NextResponse.json(
      { error: "Failed to process plant identification request" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  }
}

/**
 * OPTIONS /api/identify
 *
 * Handle CORS preflight requests.
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  );
}
