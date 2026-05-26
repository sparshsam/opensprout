create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.plant_species (
  id uuid primary key default gen_random_uuid(),
  common_name text not null,
  scientific_name text,
  aliases text[] not null default '{}',
  category text,
  light_preference text,
  watering_min_days int check (watering_min_days is null or watering_min_days > 0),
  watering_max_days int check (watering_max_days is null or watering_max_days > 0),
  fertilizing_frequency_days int check (fertilizing_frequency_days is null or fertilizing_frequency_days > 0),
  humidity_preference text,
  soil_notes text,
  toxicity text,
  difficulty text check (difficulty is null or difficulty in ('beginner', 'easy', 'moderate', 'advanced')),
  care_summary text,
  common_problems text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (common_name, scientific_name),
  constraint plant_species_watering_range_check
    check (
      watering_min_days is null
      or watering_max_days is null
      or watering_min_days <= watering_max_days
    )
);

alter table public.plants
  add column species_id uuid references public.plant_species(id) on delete set null;

create index plant_species_common_name_idx on public.plant_species(common_name);
create index plant_species_aliases_idx on public.plant_species using gin(aliases);
create index plants_species_id_idx on public.plants(species_id);

create trigger touch_plant_species
before update on public.plant_species
for each row execute function public.touch_updated_at();

alter table public.plant_species enable row level security;

create policy "Anyone can read plant species"
on public.plant_species
for select
to anon, authenticated
using (true);

grant select on public.plant_species to anon, authenticated;

insert into public.plant_species (
  common_name,
  scientific_name,
  aliases,
  category,
  light_preference,
  watering_min_days,
  watering_max_days,
  fertilizing_frequency_days,
  humidity_preference,
  soil_notes,
  toxicity,
  difficulty,
  care_summary,
  common_problems
) values
('Monstera deliciosa', 'Monstera deliciosa', array['monstera', 'swiss cheese plant'], 'tropical foliage', 'Bright indirect light; tolerates medium light.', 7, 10, 30, 'Moderate to high humidity preferred.', 'Chunky, well-draining aroid mix with bark or perlite.', 'Toxic to pets if ingested.', 'easy', 'Let the top few inches of soil dry before watering. Give support as it matures.', array['yellow leaves from overwatering', 'brown edges from dry air', 'leggy growth from low light']),
('Snake Plant', 'Dracaena trifasciata', array['sansevieria', 'mother-in-law''s tongue'], 'succulent foliage', 'Low to bright indirect light.', 14, 28, 60, 'Average household humidity.', 'Fast-draining cactus or succulent mix.', 'Toxic to pets if ingested.', 'beginner', 'A drought-tolerant plant that prefers drying out fully between waterings.', array['root rot from overwatering', 'soft leaves from cold or wet soil']),
('Pothos', 'Epipremnum aureum', array['devil''s ivy', 'golden pothos'], 'trailing foliage', 'Low to bright indirect light.', 7, 10, 30, 'Average humidity; appreciates higher humidity.', 'Well-draining potting mix.', 'Toxic to pets if ingested.', 'beginner', 'A forgiving trailing vine. Water when the top soil begins to dry.', array['yellow leaves from overwatering', 'leggy vines from low light']),
('ZZ Plant', 'Zamioculcas zamiifolia', array['zanzibar gem', 'zz'], 'rhizomatous foliage', 'Low to bright indirect light.', 14, 28, 60, 'Average household humidity.', 'Well-draining potting mix; avoid heavy wet soil.', 'Toxic to pets if ingested.', 'beginner', 'Stores water in rhizomes and does best with infrequent watering.', array['yellowing from overwatering', 'wrinkled stems from underwatering']),
('Peace Lily', 'Spathiphyllum wallisii', array['spathiphyllum'], 'flowering foliage', 'Medium to bright indirect light.', 5, 7, 30, 'Moderate to high humidity preferred.', 'Moist but well-draining potting mix.', 'Toxic to pets if ingested.', 'easy', 'Keep evenly moist but not soggy. Leaves droop when thirsty.', array['brown tips from salts or dry air', 'wilting from underwatering']),
('Spider Plant', 'Chlorophytum comosum', array['airplane plant'], 'arching foliage', 'Bright indirect light; tolerates medium light.', 7, 10, 30, 'Average household humidity.', 'General well-draining potting mix.', 'Generally considered non-toxic to pets.', 'beginner', 'A resilient plant that produces offsets when mature and slightly root-bound.', array['brown tips from minerals', 'pale growth from low light']),
('Aloe Vera', 'Aloe barbadensis miller', array['aloe'], 'succulent', 'Bright light with some direct sun.', 14, 21, 60, 'Dry to average humidity.', 'Cactus or succulent mix with excellent drainage.', 'Toxic to pets if ingested.', 'beginner', 'Water deeply, then let soil dry fully. Needs strong light indoors.', array['mushy leaves from overwatering', 'stretching from low light']),
('Rubber Plant', 'Ficus elastica', array['rubber tree'], 'tree foliage', 'Bright indirect light.', 7, 10, 30, 'Average to moderate humidity.', 'Well-draining potting mix.', 'Toxic sap; toxic to pets if ingested.', 'easy', 'Water when the top few inches dry. Wipe leaves to keep them photosynthesizing.', array['leaf drop from sudden change', 'brown edges from dry soil or air']),
('Fiddle Leaf Fig', 'Ficus lyrata', array['fiddle fig'], 'tree foliage', 'Bright indirect light; some gentle direct sun.', 7, 10, 30, 'Average to moderate humidity.', 'Well-draining potting mix.', 'Toxic to pets if ingested.', 'moderate', 'Prefers stable light, careful watering, and minimal relocation.', array['leaf drop from stress', 'brown spots from watering issues']),
('Philodendron', 'Philodendron hederaceum', array['heartleaf philodendron'], 'trailing foliage', 'Medium to bright indirect light.', 7, 10, 30, 'Average to moderate humidity.', 'Well-draining aroid mix.', 'Toxic to pets if ingested.', 'beginner', 'An adaptable vining plant. Let the top inch or two dry between waterings.', array['yellow leaves from overwatering', 'small leaves from low light']),
('Jade Plant', 'Crassula ovata', array['jade', 'money plant'], 'succulent', 'Bright light with direct sun.', 14, 21, 60, 'Dry to average humidity.', 'Cactus or succulent mix.', 'Toxic to pets if ingested.', 'easy', 'A sun-loving succulent that prefers drying out completely.', array['leaf drop from overwatering', 'stretching from low light']),
('Basil', 'Ocimum basilicum', array['sweet basil'], 'culinary herb', 'Bright light; several hours of sun preferred.', 2, 4, 21, 'Average humidity.', 'Rich, well-draining soil kept lightly moist.', 'Generally considered non-toxic to pets.', 'easy', 'Keep evenly moist and harvest often to encourage bushy growth.', array['wilting from dry soil', 'flowering reduces leaf flavor']),
('Mint', 'Mentha spp.', array['spearmint', 'peppermint'], 'culinary herb', 'Bright indirect light to partial sun.', 2, 4, 30, 'Average humidity.', 'Moist, rich potting mix.', 'Generally considered non-toxic to pets.', 'easy', 'A vigorous herb that likes consistent moisture and regular trimming.', array['wilting from dry soil', 'leggy growth from low light']),
('Rosemary', 'Salvia rosmarinus', array['rosmarinus officinalis'], 'culinary herb', 'Very bright light with direct sun.', 7, 14, 45, 'Dry to average humidity with airflow.', 'Gritty, sharply draining mix.', 'Generally considered non-toxic to pets.', 'moderate', 'Needs strong sun and hates staying wet. Let soil dry well between waterings.', array['root rot from wet soil', 'crispy tips from inconsistent watering']),
('Orchid', 'Phalaenopsis spp.', array['moth orchid', 'phalaenopsis'], 'flowering epiphyte', 'Bright indirect light.', 7, 10, 30, 'Moderate humidity preferred.', 'Orchid bark mix; never dense potting soil.', 'Generally considered non-toxic to pets.', 'moderate', 'Water bark when nearly dry and keep the crown from sitting wet.', array['crown rot from trapped water', 'bud blast from stress']),
('Calathea', 'Goeppertia orbifolia', array['calathea orbifolia', 'prayer plant'], 'tropical foliage', 'Medium to bright indirect light.', 5, 7, 30, 'High humidity preferred.', 'Moist, airy, well-draining mix.', 'Generally considered non-toxic to pets.', 'moderate', 'Keep soil lightly moist and avoid harsh direct sun or very dry air.', array['crispy edges from dry air', 'curling leaves from thirst or cold']),
('Prayer Plant', 'Maranta leuconeura', array['maranta'], 'tropical foliage', 'Medium to bright indirect light.', 5, 7, 30, 'High humidity preferred.', 'Moist, well-draining potting mix.', 'Generally considered non-toxic to pets.', 'moderate', 'Likes steady moisture, warmth, and humidity.', array['brown tips from dry air', 'fading pattern from too much sun']),
('Chinese Money Plant', 'Pilea peperomioides', array['pilea', 'ufo plant', 'pancake plant'], 'foliage', 'Bright indirect light.', 7, 10, 30, 'Average household humidity.', 'Well-draining potting mix.', 'Generally considered non-toxic to pets.', 'easy', 'Rotate regularly for even growth and water when the top soil dries.', array['cupped leaves from watering stress', 'leggy growth from low light']),
('Boston Fern', 'Nephrolepis exaltata', array['sword fern'], 'fern', 'Medium to bright indirect light.', 3, 5, 30, 'High humidity preferred.', 'Moist, rich, well-draining mix.', 'Generally considered non-toxic to pets.', 'moderate', 'Keep consistently moist with high humidity and avoid hot dry air.', array['crispy fronds from dryness', 'yellowing from inconsistent moisture']),
('English Ivy', 'Hedera helix', array['ivy'], 'trailing foliage', 'Medium to bright indirect light.', 5, 7, 30, 'Average to moderate humidity.', 'Well-draining potting mix.', 'Toxic to pets if ingested.', 'easy', 'Prefers cooler rooms, even moisture, and good light.', array['spider mites in dry air', 'leaf drop from heat or dryness']),
('Dracaena', 'Dracaena fragrans', array['corn plant', 'dragon tree'], 'cane foliage', 'Low to bright indirect light.', 10, 14, 45, 'Average household humidity.', 'Well-draining potting mix.', 'Toxic to pets if ingested.', 'easy', 'Allow soil to dry partly and avoid fluoride-heavy water if tips brown.', array['brown tips from minerals', 'yellow leaves from overwatering']),
('Areca Palm', 'Dypsis lutescens', array['butterfly palm'], 'palm', 'Bright indirect light.', 5, 7, 30, 'Moderate to high humidity preferred.', 'Rich, well-draining potting mix.', 'Generally considered non-toxic to pets.', 'moderate', 'Keep lightly moist, warm, and humid for best frond quality.', array['brown tips from dry air', 'spider mites']),
('Parlor Palm', 'Chamaedorea elegans', array['neanthe bella palm'], 'palm', 'Low to medium indirect light.', 7, 10, 45, 'Average to moderate humidity.', 'Well-draining potting mix.', 'Generally considered non-toxic to pets.', 'beginner', 'A low-light tolerant palm. Water after the top inch dries.', array['brown tips from dry air', 'yellowing from overwatering']),
('Dieffenbachia', 'Dieffenbachia seguine', array['dumb cane'], 'tropical foliage', 'Medium to bright indirect light.', 7, 10, 30, 'Moderate humidity preferred.', 'Well-draining potting mix.', 'Toxic to pets and humans if ingested.', 'easy', 'Grows quickly in warm indirect light with evenly managed moisture.', array['yellow lower leaves from age or overwatering', 'leaf burn from direct sun']),
('Croton', 'Codiaeum variegatum', array['garden croton'], 'colorful foliage', 'Bright light; some direct sun helps color.', 5, 7, 30, 'Moderate to high humidity preferred.', 'Rich, well-draining potting mix.', 'Toxic to pets if ingested.', 'moderate', 'Needs bright light and consistent moisture to hold colorful leaves.', array['leaf drop from change', 'faded color from low light']),
('Anthurium', 'Anthurium andraeanum', array['flamingo flower'], 'flowering aroid', 'Bright indirect light.', 7, 10, 30, 'High humidity preferred.', 'Chunky, airy aroid mix.', 'Toxic to pets if ingested.', 'moderate', 'Let the top layer dry slightly and keep humidity up for blooms.', array['yellow leaves from overwatering', 'few blooms from low light']),
('String of Pearls', 'Curio rowleyanus', array['senecio rowleyanus', 'string of beads'], 'trailing succulent', 'Bright light with gentle direct sun.', 14, 21, 60, 'Dry to average humidity.', 'Very fast-draining cactus mix.', 'Toxic to pets if ingested.', 'moderate', 'Needs strong light and careful watering. Let soil dry out well.', array['shriveling from thirst or root loss', 'rot from wet soil']),
('Hoya', 'Hoya carnosa', array['wax plant'], 'trailing succulent vine', 'Bright indirect light.', 10, 14, 45, 'Average to moderate humidity.', 'Chunky, well-draining mix.', 'Toxicity varies; commonly grown as pet-safe but avoid ingestion.', 'easy', 'Likes drying partly between waterings and blooms when mature in bright light.', array['no blooms from low light', 'wrinkled leaves from watering stress']),
('African Violet', 'Saintpaulia ionantha', array['saintpaulia'], 'flowering tabletop', 'Bright indirect light.', 5, 7, 21, 'Moderate humidity preferred.', 'Light, porous African violet mix.', 'Generally considered non-toxic to pets.', 'moderate', 'Keep soil lightly moist and avoid cold water on leaves.', array['leaf spots from wet leaves', 'few flowers from low light']),
('Lavender', 'Lavandula angustifolia', array['english lavender'], 'flowering herb', 'Very bright light with direct sun.', 7, 14, 45, 'Dry to average humidity with airflow.', 'Gritty, alkaline-leaning, sharply draining mix.', 'Toxic to pets if ingested in quantity.', 'moderate', 'Needs strong sun, airflow, and soil that dries between waterings.', array['root rot from wet soil', 'leggy growth from low light'])
on conflict do nothing;
