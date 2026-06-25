/**
 * Supabase admin client — uses service_role key.
 * Only for use in API routes (never in client components or browser).
 * Bypasses RLS — all queries must filter by user_id.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/data/types";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(supabaseUrl, serviceKey);
}
