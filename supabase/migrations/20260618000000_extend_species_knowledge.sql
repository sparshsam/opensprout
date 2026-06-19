-- OpenSprout v0.7: Extended plant species knowledge database
-- Adds richer care fields, references, and diagnostic data

-- ── New columns on plant_species ──

alter table public.plant_species
  add column if not exists propagation_methods text[] not null default '{}',
  add column if not exists pruning_notes text,
  add column if not exists repotting_notes text,
  add column if not exists dormancy_period text,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists native_region text,
  add column if not exists growth_rate text check (growth_rate in ('slow', 'moderate', 'fast')),
  add column if not exists mature_height text,
  add column if not exists bloom_time text,
  add column if not exists pet_safe boolean default false;

-- ── Knowledge categories table ──
-- For future expandable knowledge base

create table if not exists public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  species_id uuid references public.plant_species(id) on delete cascade,
  title text not null,
  body text not null,
  category text not null check (category in ('care', 'diagnosis', 'propagation', 'general')),
  tags text[] not null default '{}',
  source_name text,
  source_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.knowledge_articles enable row level security;

create policy "Anyone can read knowledge articles"
  on public.knowledge_articles
  for select
  to anon, authenticated
  using (true);

grant select on public.knowledge_articles to anon, authenticated;

create index knowledge_articles_species_idx on public.knowledge_articles(species_id);
create index knowledge_articles_category_idx on public.knowledge_articles(category);

-- ── Update existing species with enriched data ──

update public.plant_species set
  propagation_methods = array['Stem cuttings in water or soil', 'Division of offsets'],
  pruning_notes = 'Remove yellow or damaged leaves at the base. Prune leggy growth to encourage bushiness.',
  repotting_notes = 'Repot every 12-18 months in early spring. Increase pot size by 1-2 inches.',
  dormancy_period = 'None. Active year-round indoors.',
  source_name = 'Missouri Botanical Garden',
  source_url = 'https://www.missouribotanicalgarden.org/PlantFinder/',
  native_region = 'Tropical regions of the Americas',
  growth_rate = 'moderate',
  mature_height = '6-10 ft indoors with support',
  bloom_time = 'Rarely blooms indoors',
  pet_safe = false
where common_name = 'Monstera deliciosa';

update public.plant_species set
  propagation_methods = array['Division', 'Leaf cuttings in soil or water'],
  pruning_notes = 'Remove dead or damaged leaves at the base. Trim brown tips if present.',
  repotting_notes = 'Repot every 2-3 years or when roots emerge from drainage holes.',
  dormancy_period = 'Winter rest period. Reduce watering significantly.',
  source_name = 'University of Florida IFAS',
  source_url = 'https://gardeningsolutions.ifas.ufl.edu/plants/',
  native_region = 'West Africa',
  growth_rate = 'slow',
  mature_height = '2-4 ft indoors',
  bloom_time = 'Infrequent; tubular white flowers with age',
  pet_safe = false
where common_name = 'Snake Plant';

update public.plant_species set
  propagation_methods = array['Stem cuttings in water', 'Stem cuttings in soil', 'Layering'],
  pruning_notes = 'Trim trailing vines to control length. Remove yellow leaves at base.',
  repotting_notes = 'Repot every 1-2 years. Thrives in slightly root-bound conditions.',
  dormancy_period = 'None. Active year-round.',
  source_name = 'University of Vermont Extension',
  source_url = 'https://www.uvm.edu/extension/',
  native_region = 'French Polynesia / Solomon Islands',
  growth_rate = 'fast',
  mature_height = '6-10 ft trailing',
  bloom_time = 'Rarely blooms indoors',
  pet_safe = false
where common_name = 'Pothos';

update public.plant_species set
  propagation_methods = array['Division of rhizomes', 'Leaf cuttings'],
  pruning_notes = 'Remove yellowed or damaged leaves at the base. Trim any dead tips.',
  repotting_notes = 'Repot every 2-3 years. Prefers being root-bound.',
  dormancy_period = 'Winter rest. Reduce watering in cooler months.',
  source_name = 'Royal Horticultural Society',
  source_url = 'https://www.rhs.org.uk/plants/',
  native_region = 'Eastern Africa',
  growth_rate = 'slow',
  mature_height = '2-3 ft indoors',
  bloom_time = 'Rare; small white spathe with maturity',
  pet_safe = false
where common_name = 'ZZ Plant';

update public.plant_species set
  propagation_methods = array['Division', 'Stem cuttings in water'],
  pruning_notes = 'Remove spent flower stalks at the base. Trim yellow or brown leaves.',
  repotting_notes = 'Repot annually in spring. Slightly root-bound encourages blooming.',
  dormancy_period = 'None. Active year-round.',
  source_name = 'University of Missouri Extension',
  source_url = 'https://extension.missouri.edu/',
  native_region = 'Tropical Americas',
  growth_rate = 'moderate',
  mature_height = '1-3 ft indoors',
  bloom_time = 'Spring to fall with adequate light',
  pet_safe = false
where common_name = 'Peace Lily';

update public.plant_species set
  propagation_methods = array['Plantlets (spiderettes) in water or soil', 'Division'],
  pruning_notes = 'Trim brown leaf tips. Remove dead leaves at the base. Cut off plantlets to propagate.',
  repotting_notes = 'Repot every 1-2 years. Prefers being slightly root-bound.',
  dormancy_period = 'None. Active year-round.',
  source_name = 'University of Florida IFAS',
  source_url = 'https://gardeningsolutions.ifas.ufl.edu/plants/',
  native_region = 'Southern Africa',
  growth_rate = 'fast',
  mature_height = '1-2 ft indoors',
  bloom_time = 'Summer; small white flowers on long stems',
  pet_safe = true
where common_name = 'Spider Plant';

update public.plant_species set
  propagation_methods = array['Offsets (pups) removed from parent', 'Stem cuttings'],
  pruning_notes = 'Remove dead or damaged outer leaves at the base.',
  repotting_notes = 'Repot every 2-3 years in spring. Use shallow, wide pots.',
  dormancy_period = 'Winter rest. Reduce watering to monthly.',
  source_name = 'University of Texas at Austin',
  source_url = 'https://www.wildflower.org/plants/',
  native_region = 'Arabian Peninsula',
  growth_rate = 'slow',
  mature_height = '1-2 ft indoors',
  bloom_time = 'Winter; tall flower spike with tubular yellow flowers',
  pet_safe = false
where common_name = 'Aloe Vera';

-- Top common problems for diagnosis
-- Run after species updates so rows exist

create table if not exists public.diagnosis_entries (
  id uuid primary key default gen_random_uuid(),
  species_id uuid references public.plant_species(id) on delete cascade,
  symptom text not null,
  cause text not null,
  solution text not null,
  severity text not null check (severity in ('minor', 'moderate', 'severe')),
  category text not null check (category in ('watering', 'light', 'pests', 'disease', 'nutrient', 'environment')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.diagnosis_entries enable row level security;

create policy "Anyone can read diagnosis entries"
  on public.diagnosis_entries
  for select
  to anon, authenticated
  using (true);

grant select on public.diagnosis_entries to anon, authenticated;

create index diagnosis_entries_species_idx on public.diagnosis_entries(species_id);
create index diagnosis_entries_category_idx on public.diagnosis_entries(category);

-- Universal diagnosis entries (no species_id = applies to all)
insert into public.diagnosis_entries (symptom, cause, solution, severity, category, sort_order) values
  ('Yellow leaves', 'Overwatering is the most common cause. The soil stays wet too long and roots cannot breathe.', 'Allow soil to dry out between waterings. Check that your pot has drainage holes. Reduce watering frequency.', 'moderate', 'watering', 1),
  ('Yellow leaves', 'Underwatering — leaves may turn yellow and crispy, especially at the tips.', 'Water more thoroughly. Consider bottom-watering to ensure even moisture. Check soil weekly.', 'minor', 'watering', 2),
  ('Brown leaf tips', 'Low humidity or inconsistent watering. Common in heated indoor spaces during winter.', 'Increase humidity with a pebble tray, humidifier, or regular misting. Water consistently.', 'minor', 'environment', 3),
  ('Drooping leaves', 'Usually thirst — the plant needs water. Leaves will often perk up within hours of watering.', 'Water thoroughly until it drains from the bottom. Check again in a few days.', 'moderate', 'watering', 4),
  ('Drooping leaves', 'Overwatering — if soil is wet and leaves are drooping, roots may be damaged.', 'Stop watering immediately. Let soil dry completely. Consider repotting in fresh dry soil.', 'severe', 'watering', 5),
  ('Leggy growth', 'Not enough light. The plant stretches toward the nearest light source, creating long gaps between leaves.', 'Move to a brighter location with indirect light. Rotate the plant regularly. Consider a grow light.', 'moderate', 'light', 6),
  ('Pale or faded leaves', 'Too much direct sunlight is bleaching the leaves. Some plants need filtered light.', 'Move away from direct sun. Use a sheer curtain to filter intense afternoon light.', 'moderate', 'light', 7),
  ('Spider mites', 'Fine webbing on leaves and stems. Tiny moving dots on leaf undersides. Leaves develop stippled appearance.', 'Isolate the plant. Wipe leaves with neem oil or insecticidal soap. Increase humidity. Repeat weekly.', 'severe', 'pests', 8),
  ('Mealybugs', 'White cottony masses on stems and leaf nodes. Sticky honeydew residue.', 'Remove with cotton swab dipped in rubbing alcohol. Apply neem oil. Check nearby plants.', 'severe', 'pests', 9),
  ('Fungus gnats', 'Small flying insects around soil surface. Larvae feed on organic matter and fine roots.', 'Allow soil to dry between waterings. Use yellow sticky traps. Apply BTI (mosquito bits) to soil.', 'minor', 'pests', 10),
  ('Root rot', 'Mushy, dark roots. Foul smell from soil. Leaves turn yellow and wilt despite wet soil.', 'Remove plant from pot. Trim all rotten roots. Repot in fresh, sterile soil with better drainage. Reduce watering.', 'severe', 'watering', 11),
  ('White fuzzy mold on soil', 'Harmless saprophytic fungus from consistently moist soil and low airflow.', 'Scrape off the mold. Let soil dry. Improve air circulation around the plant.', 'minor', 'environment', 12),
  ('Leaf spots (brown/black)', 'Bacterial or fungal leaf spot disease. Often from water sitting on leaves overnight.', 'Remove affected leaves. Water at soil level, not on leaves. Improve air circulation.', 'moderate', 'disease', 13),
  ('Edema (bumps on leaves)', 'Plant absorbs water faster than it can transpire. Cells swell and burst.', 'Reduce watering frequency. Increase air circulation. Allow soil to dry more between waterings.', 'minor', 'environment', 14),
  ('Slow or no growth', 'Dormant season, insufficient light, or nutrient deficiency.', 'Check light levels. Fertilize during growing season. Some plants naturally rest in winter.', 'minor', 'environment', 15)
on conflict do nothing;
