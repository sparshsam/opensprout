import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PlantSpeciesRow, KnowledgeArticleRow, DiagnosisEntryRow } from "@/lib/data/types";

type Client = SupabaseClient<Database>;

export async function getSpeciesById(
  supabase: Client,
  id: string,
): Promise<PlantSpeciesRow | null> {
  const { data, error } = await supabase
    .from("plant_species")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function searchSpecies(
  supabase: Client,
  query: string,
): Promise<PlantSpeciesRow[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const lowered = trimmed.toLowerCase();

  const { data, error } = await supabase
    .from("plant_species")
    .select("*")
    .limit(50);

  if (error) throw error;

  return (data ?? []).filter((species) =>
    [
      species.common_name,
      species.scientific_name ?? "",
      ...species.aliases,
    ].some((value) => value.toLowerCase().includes(lowered)),
  ).slice(0, 20);
}

export async function listCategories(): Promise<string[]> {
  return [
    "tropical foliage",
    "succulent foliage",
    "trailing foliage",
    "flowering foliage",
    "culinary herb",
    "flowering epiphyte",
    "tree foliage",
    "fern",
    "palm",
    "colorful foliage",
    "trailing succulent",
    "flowering tabletop",
    "flowering herb",
    "rhizomatous foliage",
    "arching foliage",
    "trailing vine",
    "cane foliage",
  ];
}

export async function getKnowledgeArticles(
  supabase: Client,
  speciesId: string,
): Promise<KnowledgeArticleRow[]> {
  const { data, error } = await supabase
    .from("knowledge_articles")
    .select("*")
    .eq("species_id", speciesId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getDiagnosisEntries(
  supabase: Client,
  speciesId?: string,
): Promise<DiagnosisEntryRow[]> {
  let query = supabase
    .from("diagnosis_entries")
    .select("*")
    .order("sort_order", { ascending: true });

  if (speciesId) {
    // Return species-specific entries + universal entries (where species_id is null)
    query = query.or(`species_id.eq.${speciesId},species_id.is.null`);
  } else {
    // Return all universal entries only
    query = query.is("species_id", null);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

export async function getDiagnosisByCategory(
  supabase: Client,
  category: DiagnosisEntryRow["category"],
): Promise<DiagnosisEntryRow[]> {
  const { data, error } = await supabase
    .from("diagnosis_entries")
    .select("*")
    .eq("category", category)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
