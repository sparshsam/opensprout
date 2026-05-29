import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { validatePlantValues, ValidationError } from "@/lib/data/validation";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!checkRateLimit(`plants:list:${user.id}`, 120, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { data, error } = await supabase
    .from("plants")
    .select("id,name,species,location,health_status,next_due_at:care_schedules(next_due_at)")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to list plants", error);
    return NextResponse.json({ error: "Unable to load plants." }, { status: 500 });
  }

  return NextResponse.json({ plants: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!checkRateLimit(`plants:create:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  let values;
  try {
    values = validatePlantValues(payload);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to validate plant payload", error);
    return NextResponse.json({ error: "Invalid plant payload." }, { status: 400 });
  }

  const timestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from("plants")
    .insert({
      user_id: user.id,
      name: values.name,
      species_id: values.species_id ?? null,
      species: values.species ?? null,
      location: values.location ?? null,
      notes: values.notes ?? null,
      health_status: values.health_status ?? "stable",
      client_id: `plant-${crypto.randomUUID()}`,
      client_created_at: timestamp,
      client_updated_at: timestamp,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create plant", error);
    return NextResponse.json({ error: "Unable to create plant." }, { status: 400 });
  }

  return NextResponse.json({ plant: data }, { status: 201 });
}
