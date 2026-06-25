import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/data/types";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase browser environment variables.");
  }

  return createBrowserClient<Database>(url, key, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
