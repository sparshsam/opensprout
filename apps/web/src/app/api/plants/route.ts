import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plants")
    .select("id,name,species,location,health_status,next_due_at:care_schedules(next_due_at)")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plants: data });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("plants")
    .insert({
      user_id: user.id,
      name: payload.name,
      species: payload.species ?? null,
      location: payload.location ?? null,
      notes: payload.notes ?? null,
      client_id: payload.client_id ?? null,
      client_created_at: payload.client_created_at ?? null,
      client_updated_at: payload.client_updated_at ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ plant: data }, { status: 201 });
}
