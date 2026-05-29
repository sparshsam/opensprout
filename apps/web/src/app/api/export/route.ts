import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
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

  if (!checkRateLimit(`export:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many export requests." }, { status: 429 });
  }

  try {
    const entries = await Promise.all(
      exportTables.map(async (table) => {
        const { data, error } = await supabase.from(table).select("*").eq("user_id", user.id).limit(5000);
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
  } catch (error) {
    console.error("Failed to export user data", error);
    return NextResponse.json({ error: "Unable to export data." }, { status: 500 });
  }
}
