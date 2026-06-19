import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, DiagnosisEntryRow } from "@/lib/data/types";
import { getDiagnosisEntries } from "@/lib/data/knowledge";

type Client = SupabaseClient<Database>;

export type IdentificationMatch = {
  scientificName: string;
  commonNames: string[];
  score: number;
  genus: string;
};

export type IdentifyResult = {
  matches: IdentificationMatch[];
  bestMatch: IdentificationMatch | null;
  error?: string;
};

export type DiagnosisResult = {
  possibleIssues: {
    symptom: string;
    cause: string;
    solution: string;
    confidence: string;
  }[];
  disclaimer: string;
};

/**
 * Sends a base64-encoded image to the PlantNet API proxy (/api/identify).
 * Parses the PlantNet response into IdentifyResult.
 * Returns matches sorted by score descending.
 */
export async function identifyPlant(imageBase64: string): Promise<IdentifyResult> {
  try {
    const response = await fetch("/api/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Unknown error" }));
      return {
        matches: [],
        bestMatch: null,
        error: err.error ?? `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    // PlantNet v2 returns:
    // { results: [{ species: { scientificNameWithoutAuthor, scientificName, commonNames, genus: { scientificNameWithoutAuthor } }, score }] }
    const rawMatches: Array<{ species: Record<string, unknown>; score: number }> = data.results ?? [];

    const matches: IdentificationMatch[] = rawMatches.map((m) => ({
      scientificName:
        (m.species?.scientificNameWithoutAuthor as string) ??
        (m.species?.scientificName as string) ??
        "Unknown",
      commonNames: (m.species?.commonNames as string[]) ?? [],
      score: m.score ?? 0,
      genus: (m.species?.genus as Record<string, unknown>)?.scientificNameWithoutAuthor as string ?? "",
    }));

    matches.sort((a, b) => b.score - a.score);

    return {
      matches,
      bestMatch: matches[0] ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to identify plant";
    return { matches: [], bestMatch: null, error: message };
  }
}

const DIAGNOSIS_DISCLAIMER =
  "This diagnosis is based on general rules and is not a substitute for professional plant care advice. Observe your plant's specific conditions for the best results.";

/**
 * Maps a severity string to a confidence label.
 */
function severityToConfidence(severity: string): string {
  switch (severity) {
    case "severe":
      return "high";
    case "moderate":
      return "medium";
    default:
      return "low";
  }
}

/**
 * First tries species identification via photo, then matches against the
 * rules-based diagnosis entries. If a species is identified, fetches
 * species-specific diagnosis (alongside universal entries).
 * Always includes universal diagnosis. Returns results with an AI disclaimer.
 */
export async function diagnoseFromPhotoAndSymptoms(
  supabase: Client,
  imageBase64: string,
  symptoms?: string,
): Promise<DiagnosisResult> {
  // Try photo identification
  const identifyResult = await identifyPlant(imageBase64);

  // Look up species ID from the best match's scientific name
  let speciesId: string | undefined;
  if (identifyResult.bestMatch) {
    const { data: speciesRows } = await supabase
      .from("plant_species")
      .select("id")
      .or(
        `scientific_name.eq.${identifyResult.bestMatch.scientificName},common_name.eq.${identifyResult.bestMatch.scientificName}`,
      )
      .limit(1);

    if (speciesRows && speciesRows.length > 0) {
      speciesId = speciesRows[0].id;
    }
  }

  // Get diagnosis entries — when speciesId is provided, returns species-specific + universal
  const entries = await getDiagnosisEntries(supabase, speciesId);

  const possibleIssues = entries.map((entry: DiagnosisEntryRow) => ({
    symptom: entry.symptom,
    cause: entry.cause,
    solution: entry.solution,
    confidence: severityToConfidence(entry.severity),
  }));

  // If symptoms are provided, rank entries by keyword match
  if (symptoms) {
    const lowered = symptoms.toLowerCase();
    possibleIssues.sort((a, b) => {
      const aMatch = a.symptom.toLowerCase().includes(lowered) ? 1 : 0;
      const bMatch = b.symptom.toLowerCase().includes(lowered) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  return {
    possibleIssues,
    disclaimer: DIAGNOSIS_DISCLAIMER,
  };
}

/**
 * Uses only the rules-based diagnosis from getDiagnosisEntries.
 * This is the fallback when the photo-based path fails.
 */
export async function getFallbackDiagnosis(
  supabase: Client,
  symptoms?: string,
  speciesId?: string,
): Promise<DiagnosisResult> {
  const entries = await getDiagnosisEntries(supabase, speciesId);

  const possibleIssues = entries.map((entry: DiagnosisEntryRow) => ({
    symptom: entry.symptom,
    cause: entry.cause,
    solution: entry.solution,
    confidence: severityToConfidence(entry.severity),
  }));

  // If symptoms are provided, rank entries by keyword match
  if (symptoms) {
    const lowered = symptoms.toLowerCase();
    possibleIssues.sort((a, b) => {
      const aMatch = a.symptom.toLowerCase().includes(lowered) ? 1 : 0;
      const bMatch = b.symptom.toLowerCase().includes(lowered) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  return {
    possibleIssues,
    disclaimer: DIAGNOSIS_DISCLAIMER,
  };
}
