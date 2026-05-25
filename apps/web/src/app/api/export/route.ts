import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const exportTables = [
  "plants",
  "care_schedules",
  "task_instances",
  "care_logs",
  "journal_entries",
  "journal_photos",
] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const entries = await Promise.all(
    exportTables.map(async (table) => {
      const { data, error } = await supabase.from(table).select("*").eq("user_id", user.id);
      if (error) {
        throw new Error(`${table}: ${error.message}`);
      }
      return [table, data] as const;
    }),
  );

  return NextResponse.json({
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    tables: Object.fromEntries(entries),
  });
}
