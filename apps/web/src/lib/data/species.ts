import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PlantSpeciesRow } from "@/lib/data/types";

type Client = SupabaseClient<Database>;

export async function listPlantSpecies(supabase: Client): Promise<PlantSpeciesRow[]> {
  const { data, error } = await supabase
    .from("plant_species")
    .select("*")
    .order("common_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function searchPlantSpecies(supabase: Client, query: string): Promise<PlantSpeciesRow[]> {
  const trimmed = query.trim();
  if (!trimmed) return listPlantSpecies(supabase);

  const lowered = trimmed.toLowerCase();
  return (await listPlantSpecies(supabase))
    .filter((species) =>
      [
        species.common_name,
        species.scientific_name ?? "",
        ...species.aliases,
      ].some((value) => value.toLowerCase().includes(lowered)),
    )
    .slice(0, 20);
}

export async function getPlantSpeciesById(supabase: Client, id: string): Promise<PlantSpeciesRow | null> {
  const { data, error } = await supabase
    .from("plant_species")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
