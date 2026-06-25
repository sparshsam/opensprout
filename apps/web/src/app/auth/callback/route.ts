/**
 * Auth callback route — handles the OAuth redirect from Google.
 *
 * Supabase exchanges the auth code for a session via PKCE flow.
 * The browser client's `detectSessionInUrl: true` setting handles
 * session extraction automatically. We redirect to the app on success.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // Supabase SSR client handles the code exchange via the
    // detectSessionInUrl flow on the client side. We just
    // redirect to the app and let the client finish the flow.
    return NextResponse.redirect(new URL("/today", requestUrl.origin));
  }

  // No code — redirect to login
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
