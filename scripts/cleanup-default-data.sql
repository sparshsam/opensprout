-- Cleanup: remove default data created by old defaults
--
-- Before v0.9.15, new plants were created with:
--   health_status = 'stable' (default in emptyForm and createPlant)
--   water_every_days = 7 (default in emptyForm)
--   fertilize_every_days = 30 (default in emptyForm)
--   auto-generated care_schedules for water (every 7 days) and fertilize (every 30 days)
--
-- This migration removes records that were created from those defaults.
-- It ONLY touches records where there is no evidence of user intent.
--
-- WARNING:
--   - If you manually set a plant to "stable" health, this will reset it.
--   - If you created a schedule with exactly 7-day water or 30-day fertilize,
--     this may delete it. Review before running.
--
-- Run via: psql or Supabase SQL editor
-- Review counts first, then uncomment the DELETE to apply.

-- === STEP 1: Review old default health values ===
-- Shows plants where health_status was never explicitly assessed
-- (was set to 'stable' by the old default)
SELECT id, name, health_status, created_at
FROM plants
WHERE health_status = 'stable'
  AND species_id IS NULL
  AND species IS NULL
  AND cover_photo_path IS NULL
ORDER BY created_at;

-- === STEP 2: Review old default schedules ===
-- Shows schedules that were likely created from old defaults
-- (7-day water, 30-day fertilize, no species preset)
SELECT cs.id, cs.plant_id, p.name as plant_name, cs.care_type, cs.cadence_value, cs.cadence_unit
FROM care_schedules cs
JOIN plants p ON p.id = cs.plant_id
WHERE p.species_id IS NULL
  AND p.species IS NULL
  AND (
    (cs.care_type = 'water' AND cs.cadence_value = 7 AND cs.cadence_unit = 'day')
    OR (cs.care_type = 'fertilize' AND cs.cadence_value = 30 AND cs.cadence_unit = 'day')
  )
ORDER BY p.name;

-- === STEP 3: Apply cleanup (uncomment to run) ===

-- Reset health_status to null for plants that likely received the default
-- UPDATE plants
-- SET health_status = NULL
-- WHERE health_status = 'stable'
--   AND species_id IS NULL
--   AND species IS NULL
--   AND cover_photo_path IS NULL;

-- Delete default schedules that were auto-created
-- DELETE FROM care_schedules cs
-- USING plants p
-- WHERE p.id = cs.plant_id
--   AND p.species_id IS NULL
--   AND p.species IS NULL
--   AND (
--     (cs.care_type = 'water' AND cs.cadence_value = 7 AND cs.cadence_unit = 'day')
--     OR (cs.care_type = 'fertilize' AND cs.cadence_value = 30 AND cs.cadence_unit = 'day')
--   );
