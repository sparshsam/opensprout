import type { HealthStatus } from "@/lib/data/types";

const healthStatuses = new Set<HealthStatus>(["unknown", "thriving", "stable", "watch", "struggling"]);

export type ValidatedPlantValues = {
  name: string;
  species_id?: string;
  species?: string;
  location?: string;
  notes?: string;
  health_status?: HealthStatus;
};

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validatePlantValues(input: unknown): ValidatedPlantValues {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Plant details are required.");
  }

  const source = input as Record<string, unknown>;
  const name = cleanString(source.name, "Name", 1, 80, true);
  if (!name) throw new ValidationError("Name is required.");

  const speciesId = cleanString(source.species_id, "Species template", 1, 64);
  const species = cleanString(source.species, "Species", 1, 120);
  const location = cleanString(source.location, "Location", 1, 80);
  const notes = cleanString(source.notes, "Notes", 1, 1000);
  const healthStatus = cleanHealthStatus(source.health_status);

  return {
    name,
    species_id: speciesId,
    species,
    location,
    notes,
    health_status: healthStatus,
  };
}

function cleanString(
  value: unknown,
  label: string,
  minLength: number,
  maxLength: number,
  required = false,
) {
  if (value === undefined || value === null) {
    if (required) throw new ValidationError(`${label} is required.`);
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ValidationError(`${label} must be text.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    if (required) throw new ValidationError(`${label} is required.`);
    return undefined;
  }

  if (trimmed.length < minLength || trimmed.length > maxLength) {
    throw new ValidationError(`${label} must be ${minLength}-${maxLength} characters.`);
  }

  return trimmed;
}

function cleanPositiveInteger(value: unknown, label: string, min: number, max: number) {
  if (value === undefined || value === null || value === "") return undefined;
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numberValue) || numberValue < min || numberValue > max) {
    throw new ValidationError(`${label} must be between ${min} and ${max} days.`);
  }

  return numberValue;
}

function cleanHealthStatus(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !healthStatuses.has(value as HealthStatus)) {
    throw new ValidationError("Health status is invalid.");
  }

  return value as HealthStatus;
}
