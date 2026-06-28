/**
 * Auth callback route — handles the OAuth redirect from Google.
 *
 * Exchanges the PKCE auth code for a Supabase session on the server,
 * sets session cookies via the SSR client, then redirects to the app.
 * This is critical: without server-side exchange, the redirect would
 * drop the URL `code` param before the browser client could see it,
 * causing a sign-in loop.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const response = NextResponse.redirect(new URL("/today", origin));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
          },
        },
      },
    );

    // Exchange the PKCE auth code for a full session.
    // The SSR client's setAll handler writes session cookies
    // onto the redirect response so the browser arrives
    // authenticated.
    await supabase.auth.exchangeCodeForSession(code);

    return response;
  }

  // No code — redirect to login
  return NextResponse.redirect(new URL("/login", origin));
}
