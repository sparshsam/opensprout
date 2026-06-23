-- OpenSprout v0.9.11: Knowledge & Diagnosis Foundation
-- Seeds knowledge_articles and adds missing diagnosis_entries
-- so search_knowledge() and diagnose_plant() return useful results.

-- ── Knowledge Articles ──
-- Species-specific care guides, propagation guides, and general articles
-- for the 10 most common houseplant species.

-- Monstera deliciosa
insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'Monstera deliciosa Care Guide', 
'Monstera deliciosa, also known as the Swiss Cheese Plant, is a tropical climbing plant native to the rainforests of Central America. Its iconic split and fenestrated leaves make it one of the most popular houseplants worldwide.'||E'\n\n'||
'Light: Bright indirect light is ideal. Can tolerate medium light but growth slows and leaves may grow smaller without fenestrations. Avoid prolonged direct sun which burns leaves.'||E'\n\n'||
'Water: Water when the top 2-3 inches of soil feel dry — roughly every 7-10 days. In winter, reduce frequency. Overwatering causes yellow leaves and root rot.'||E'\n\n'||
'Soil: Chunky, well-draining aroid mix with bark, perlite, and coco coir. Good aeration is essential for healthy root development.'||E'\n\n'||
'Humidity: Moderate to high (60%+). Brown leaf edges signal the air is too dry. Group plants or use a humidifier.'||E'\n\n'||
'Temperature: 65-85°F (18-29°C). Avoid cold drafts and sudden temperature shifts.'||E'\n\n'||
'Fertilizer: Balanced liquid fertilizer monthly during spring and summer. Dilute to half strength. Reduce in winter.'||E'\n\n'||
'Support: Provide a moss pole, trellis, or stake as the plant matures. The aerial roots will grip the support, allowing larger leaves to develop.',
'care', array['monstera', 'swiss cheese plant', 'care guide', 'aroid'], 10
from public.plant_species where common_name = 'Monstera deliciosa'
on conflict do nothing;

insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'Propagating Monstera deliciosa',
'Monstera deliciosa is easy to propagate from stem cuttings.'||E'\n\n'||
'Method 1 — Water Propagation:'||E'\n'||
'1. Take a cutting below a node (the bump where the aerial root meets the stem)'||E'\n'||
'2. Ensure the cutting has at least one leaf and one node'||E'\n'||
'3. Place in a jar of water with the node submerged'||E'\n'||
'4. Change water weekly'||E'\n'||
'5. Roots appear in 2-4 weeks; pot when roots are 2-3 inches long'||E'\n\n'||
'Method 2 — Soil Propagation:'||E'\n'||
'1. Take the same type of cutting'||E'\n'||
'2. Dip the cut end in rooting hormone (optional)'||E'\n'||
'3. Plant directly in moist aroid mix'||E'\n'||
'4. Keep consistently moist and in bright indirect light'||E'\n'||
'5. New growth signals successful rooting in 4-6 weeks',
'propagation', array['monstera', 'propagation', 'cuttings', 'stem cuttings'], 10
from public.plant_species where common_name = 'Monstera deliciosa'
on conflict do nothing;

insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'Common Monstera Problems',
'Yellow leaves — usually from overwatering. Let soil dry more between waterings and ensure drainage.'||E'\n\n'||
'Leaves without splits/fenestrations — not enough light. Move to a brighter spot with indirect light.'||E'\n\n'||
'Brown edges on leaves — low humidity or inconsistent watering. Increase humidity and water consistently.'||E'\n\n'||
'Drooping stems — thirsty. Water thoroughly; most monsteras perk up within hours.'||E'\n\n'||
'Leggy growth with long gaps — insufficient light. Move closer to a window or add a grow light.',
'diagnosis', array['monstera', 'diagnosis', 'problems', 'yellow leaves'], 10
from public.plant_species where common_name = 'Monstera deliciosa'
on conflict do nothing;

-- Pothos
insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'Pothos Care Guide',
'Pothos (Epipremnum aureum), also known as Devil''s Ivy, is one of the most forgiving houseplants. Its trailing vines make it perfect for hanging baskets and shelves.'||E'\n\n'||
'Light: Low to bright indirect light. One of the few plants that truly tolerates low light, though variegated varieties need more light to hold their pattern.'||E'\n\n'||
'Water: Water when the top 1-2 inches of soil feel dry — roughly every 7-10 days. Pothos is more forgiving of missed waterings than overwatering.'||E'\n\n'||
'Soil: Standard well-draining potting mix. Any general-purpose houseplant soil works well.'||E'\n\n'||
'Humidity: Average household humidity is fine. Appreciates occasional misting.'||E'\n\n'||
'Temperature: 65-85°F (18-29°C). Tolerates normal indoor ranges well.'||E'\n\n'||
'Fertilizer: Balanced liquid fertilizer monthly in spring and summer. Every 2-3 months in winter.'||E'\n\n'||
'Pruning: Trim trailing vines to control length. Pruning encourages bushier growth.',
'care', array['pothos', 'devils ivy', 'golden pothos', 'care guide'], 10
from public.plant_species where common_name = 'Pothos'
on conflict do nothing;

insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'Propagating Pothos',
'Pothos is among the easiest plants to propagate.'||E'\n\n'||
'Method — Water Propagation:'||E'\n'||
'1. Cut a vine segment with 3-4 leaves and at least 1 node (the brown bump on the stem)'||E'\n'||
'2. Remove the bottom leaf so the node is exposed'||E'\n'||
'3. Place in water with the node submerged'||E'\n'||
'4. Change water every 5-7 days'||E'\n'||
'5. Roots appear in 1-2 weeks'||E'\n'||
'6. Transfer to soil when roots are 2-3 inches long, or keep growing in water indefinitely'||E'\n\n'||
'Tip: Cuttings root fastest in bright indirect light. Using rooting hormone is optional but speeds things up.',
'propagation', array['pothos', 'propagation', 'cuttings'], 10
from public.plant_species where common_name = 'Pothos'
on conflict do nothing;

-- Snake Plant
insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'Snake Plant Care Guide',
'Snake Plant (Dracaena trifasciata, formerly Sansevieria) is celebrated for its architectural, sword-like leaves and near-indestructible nature.'||E'\n\n'||
'Light: Low to bright indirect light. Extremely adaptable — one of the few plants that thrives in low-light corners.'||E'\n\n'||
'Water: Let the soil dry completely between waterings — every 2-4 weeks depending on light. In winter, water only once a month or less. Overwatering kills.'||E'\n\n'||
'Soil: Fast-draining cactus or succulent mix. Essential to prevent moisture from sitting around the roots.'||E'\n\n'||
'Humidity: Average household humidity is perfect. Does not need extra humidity.'||E'\n\n'||
'Temperature: 60-85°F (15-29°C). Protect from cold drafts. Below 50°F causes damage.'||E'\n\n'||
'Fertilizer: Cactus fertilizer or balanced liquid at half strength, once in spring and once in summer.'||E'\n\n'||
'Note: Snake plants are CAM plants — they absorb CO₂ at night, making them excellent bedroom plants.',
'care', array['snake plant', 'sansevieria', 'mother-in-laws tongue', 'care guide'], 10
from public.plant_species where common_name = 'Snake Plant'
on conflict do nothing;

insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'Propagating Snake Plant',
'Snake plants propagate through three reliable methods.'||E'\n\n'||
'Method 1 — Division:'||E'\n'||
'1. Remove the plant from its pot'||E'\n'||
'2. Gently separate the rhizome clumps'||E'\n'||
'3. Each division should have roots and at least 1-2 leaves'||E'\n'||
'4. Pot in succulent mix'||E'\n'||
'5. Wait a week before first watering'||E'\n\n'||
'Method 2 — Leaf Cuttings in Water:'||E'\n'||
'1. Cut a healthy leaf into 3-4 inch sections, keeping track of which end is bottom'||E'\n'||
'2. Place the bottom end in water'||E'\n'||
'3. Roots appear in 4-8 weeks'||E'\n'||
'4. Transfer to soil when roots form'||E'\n'||
'Note: Variegated varieties may lose variegation when propagated this way.',
'propagation', array['snake plant', 'sansevieria', 'propagation'], 10
from public.plant_species where common_name = 'Snake Plant'
on conflict do nothing;

-- ZZ Plant
insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'ZZ Plant Care Guide',
'The ZZ Plant (Zamioculcas zamiifolia) is known for its waxy, dark green leaves and remarkable resilience. Its ability to survive neglect makes it a favorite for offices and low-light homes.'||E'\n\n'||
'Light: Low to bright indirect light. Tolerates very low light better than almost any other houseplant.'||E'\n\n'||
'Water: Let the soil dry completely between waterings — every 2-4 weeks. The rhizomes store water. Overwatering is the #1 cause of death.'||E'\n\n'||
'Soil: Well-draining potting mix with sand or perlite. Avoid heavy, moisture-retaining soils.'||E'\n\n'||
'Humidity: Average household humidity is fine. Does not require misting.'||E'\n\n'||
'Temperature: 60-85°F (15-29°C). Standard indoor temperatures work well.'||E'\n\n'||
'Fertilizer: Once in spring and once in summer with balanced houseplant fertilizer. Very light feeder.'||E'\n\n'||
'Growth: Slow-growing. New stems unroll from the base. Be patient — mature plants in good light can reach 3 feet.',
'care', array['zz plant', 'zamioculcas', 'zanzibar gem', 'care guide'], 10
from public.plant_species where common_name = 'ZZ Plant'
on conflict do nothing;

-- Peace Lily
insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'Peace Lily Care Guide',
'Peace Lily (Spathiphyllum) is a graceful flowering plant known for its elegant white spathes and ability to grow in low light. It is also a dramatic communicator — it droops visibly when thirsty.'||E'\n\n'||
'Light: Medium to bright indirect light. Low light is tolerated but reduces or stops flowering.'||E'\n\n'||
'Water: Keep soil evenly moist but not soggy — water when the top inch dries. Drooping leaves are a reliable thirst signal.'||E'\n\n'||
'Soil: Moisture-retentive but well-draining potting mix with organic matter.'||E'\n\n'||
'Humidity: Moderate to high. Brown leaf tips signal low humidity. Mist regularly or use a pebble tray.'||E'\n\n'||
'Temperature: 65-80°F (18-27°C). Sensitive to cold drafts.'||E'\n\n'||
'Fertilizer: Balanced liquid fertilizer monthly during spring and summer for best flowering.'||E'\n\n'||
'Flowering: White spathes last for weeks. Cut spent blooms at the base to encourage new ones.'||E'\n\n'||
'Note: Peace lilies are excellent air purifiers, removing benzene, formaldehyde, and other VOCs.',
'care', array['peace lily', 'spathiphyllum', 'care guide', 'blooming'], 10
from public.plant_species where common_name = 'Peace Lily'
on conflict do nothing;

-- Rubber Plant
insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'Rubber Plant Care Guide',
'The Rubber Plant (Ficus elastica) has large, glossy leaves that make a bold architectural statement. It grows into a small tree over time.'||E'\n\n'||
'Light: Bright indirect light. Variegated varieties need more light. Growth slows significantly in low light.'||E'\n\n'||
'Water: Water when the top 2-3 inches of soil dry out — typically every 7-10 days. Let excess drain fully.'||E'\n\n'||
'Soil: Rich, well-draining potting mix with peat and perlite.'||E'\n\n'||
'Humidity: Average to moderate humidity. Wipe leaves monthly to keep them clean and photosynthesizing efficiently.'||E'\n\n'||
'Temperature: 60-80°F (15-27°C). Avoid cold drafts and sudden temperature changes — causes leaf drop.'||E'\n\n'||
'Fertilizer: Balanced liquid fertilizer monthly during growing season.'||E'\n\n'||
'Pruning: Cut above a node to encourage branching. Wear gloves — the sap is sticky and can irritate skin.',
'care', array['rubber plant', 'ficus elastica', 'rubber tree', 'care guide'], 10
from public.plant_species where common_name = 'Rubber Plant'
on conflict do nothing;

-- Fiddle Leaf Fig
insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'Fiddle Leaf Fig Care Guide',
'The Fiddle Leaf Fig (Ficus lyrata) is the iconic statement plant with large, violin-shaped leaves. It has a reputation for being finicky, but succeeds with consistent care.'||E'\n\n'||
'Light: Bright indirect light is essential. A few hours of gentle morning sun are beneficial. Low light causes leaf drop.'||E'\n\n'||
'Water: Water when the top 2-3 inches dry — typically every 7-10 days. Consistency is critical. Both overwatering and underwatering cause leaf problems.'||E'\n\n'||
'Soil: Well-draining potting mix with perlite and organic matter. Good drainage is essential.'||E'\n\n'||
'Humidity: Average to moderate humidity. Brown edges indicate dry air.'||E'\n\n'||
'Temperature: 60-80°F (15-27°C). Hates cold drafts and sudden temperature shifts.'||E'\n\n'||
'Fertilizer: Ficus-specific or balanced fertilizer every 2 weeks during spring and summer.'||E'\n\n'||
'Key tip: Never move a FLF to a different spot unless necessary. They stress easily from relocation and drop leaves as a protest. Rotate the pot instead.',
'care', array['fiddle leaf fig', 'ficus lyrata', 'care guide', 'statement plant'], 10
from public.plant_species where common_name = 'Fiddle Leaf Fig'
on conflict do nothing;

-- Philodendron
insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'Philodendron Care Guide',
'Philodendrons are a large genus of easy-care tropical plants. Heartleaf Philodendron (Philodendron hederaceum) is the most common — a vining plant with heart-shaped leaves.'||E'\n\n'||
'Light: Medium to bright indirect light. Lower light is tolerated but growth slows and leaves may grow smaller.'||E'\n\n'||
'Water: Let the top 1-2 inches of soil dry between waterings — every 7-10 days.'||E'\n\n'||
'Soil: Well-draining aroid mix with peat, perlite, and orchid bark.'||E'\n\n'||
'Humidity: Average to moderate. Appreciates occasional misting.'||E'\n\n'||
'Temperature: 65-80°F (18-27°C). Standard indoor temperatures work well.'||E'\n\n'||
'Fertilizer: Balanced liquid fertilizer monthly during spring and summer.'||E'\n\n'||
'Trailing or climbing: Heartleaf philodendron can trail from a hanging basket or climb a moss pole with larger leaves.',
'care', array['philodendron', 'heartleaf philodendron', 'care guide', 'aroid'], 10
from public.plant_species where common_name = 'Philodendron'
on conflict do nothing;

-- Aloe Vera
insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'Aloe Vera Care Guide',
'Aloe Vera is a succulent plant native to the Arabian Peninsula. Its thick, fleshy leaves store water and contain the gel famous for soothing burns.'||E'\n\n'||
'Light: Bright light with some direct sun. A south or west-facing window is ideal. Stretching leaves signal insufficient light.'||E'\n\n'||
'Water: Water deeply then let the soil dry completely — every 2-3 weeks. Reduce to monthly in winter. Mushy leaves mean overwatering.'||E'\n\n'||
'Soil: Very well-draining cactus or succulent mix. Terracotta pots help wick moisture.'||E'\n\n'||
'Humidity: Low to average. Aloe thrives in dry air.'||E'\n\n'||
'Temperature: 55-80°F (13-27°C). Protect from frost — below 50°F causes damage.'||E'\n\n'||
'Fertilizer: Cactus fertilizer or balanced liquid at half strength, once in spring and once in summer.'||E'\n\n'||
'Harvesting gel: Cut a mature outer leaf at the base. Slice open and scoop the clear inner gel. The plant will heal and grow new leaves from the center.',
'care', array['aloe vera', 'succulent', 'care guide'], 10
from public.plant_species where common_name = 'Aloe Vera'
on conflict do nothing;

-- Spider Plant
insert into public.knowledge_articles (species_id, title, body, category, tags, sort_order)
select id, 'Spider Plant Care Guide',
'The Spider Plant (Chlorophytum comosum) is a classic houseplant with arching, grass-like leaves and hanging plantlets (spiderettes). It is one of the easiest plants to grow and propagate.'||E'\n\n'||
'Light: Bright indirect light. Tolerates medium light. Variegated varieties need more light to keep their stripes.'||E'\n\n'||
'Water: Water when the top inch of soil dries — every 7-10 days. Brown tips are common and usually from fluoride or minerals in tap water.'||E'\n\n'||
'Soil: General well-draining potting mix. Not fussy about soil.'||E'\n\n'||
'Humidity: Average household humidity. Brown tips improve with higher humidity or using distilled water.'||E'\n\n'||
'Temperature: 55-80°F (13-27°C). Tolerates wide temperature ranges.'||E'\n\n'||
'Fertilizer: Balanced liquid fertilizer monthly in spring and summer.'||E'\n\n'||
'Propagation: Pinch off the plantlets and root them in water or directly in soil. Roots appear in 1-2 weeks.'||E'\n\n'||
'Note: One of the few pet-safe houseplants. Also excellent at removing indoor air pollutants.',
'care', array['spider plant', 'chlorophytum', 'airplane plant', 'care guide'], 10
from public.plant_species where common_name = 'Spider Plant'
on conflict do nothing;

-- General knowledge articles (no species_id = applies to all)
insert into public.knowledge_articles (title, body, category, tags, sort_order) values
(
  'Beginner Houseplant Care Checklist',
  'A quick-start guide for new plant parents:'||E'\n\n'||
  '1. Know your light — learn the difference between low, medium, bright indirect, and direct sun'||E'\n'||
  '2. Water on schedule — most houseplants prefer drying out partly between waterings'||E'\n'||
  '3. Drainage is non-negotiable — every pot needs drainage holes'||E'\n'||
  '4. Acclimate new plants — give them 1-2 weeks in their spot before changing routines'||E'\n'||
  '5. Inspect for pests weekly — catch problems early'||E'\n'||
  '6. Fertilize during growing season — spring through summer only'||E'\n'||
  '7. Use the right soil — succulents need draining mix, aroids need chunky mix'||E'\n'||
  '8. Group plants together — they create their own humidity microclimate'||E'\n'||
  '9. Clean leaves monthly — dust blocks light absorption'||E'\n'||
  '10. Repot when root-bound — usually every 1-2 years in spring',
  'general', array['beginner', 'checklist', 'care basics'], 0
),
(
  'Understanding Light Levels for Houseplants',
  'Getting light right is the single most important factor for plant health.'||E'\n\n'||
  'Low light — A few feet from a north-facing window, or the center of a room. Only low-light tolerant plants survive here (Snake Plant, ZZ Plant, Pothos).'||E'\n\n'||
  'Medium indirect — Near an east-facing window or a few feet from a south/west window. Suitable for most foliage plants.'||E'\n\n'||
  'Bright indirect — Directly in front of an east or west window, or near a south window with sheer curtain. Ideal for flowering plants, figs, and succulents.'||E'\n\n'||
  'Direct sun — On a south or west windowsill with no barrier. Only for cacti, succulents, and certain herbs.'||E'\n\n'||
  'How to test: Hold your hand 12 inches from the light source. If it casts a sharp shadow, that is bright direct light. A soft shadow is indirect. No shadow is low light.',
  'general', array['light', 'lighting guide', 'basics'], 1
),
(
  'Watering 101: How to Water Houseplants Correctly',
  'More houseplants die from overwatering than any other cause.'||E'\n\n'||
  'The finger test — stick your finger 1-2 inches into the soil. If it feels dry, water. If damp, wait.'||E'\n\n'||
  'How to water — pour slowly and evenly across the soil surface. Water until it drains from the bottom (for pots with drainage). Empty the saucer after 15 minutes.'||E'\n\n'||
  'Bottom watering — for plants sensitive to crown rot (African violets) or compacted soil, set the pot in a tray of water for 20-30 minutes.'||E'\n\n'||
  'Water quality — most tap water is fine. Sensitive plants (calatheas, spider plants) may develop brown tips from fluoride or chlorine. Use filtered or distilled water or let tap water sit out overnight.'||E'\n\n'||
  'Seasonal adjustments — plants use less water in winter when growth slows. Reduce frequency from November to February.',
  'general', array['watering', 'care basics', 'watering guide'], 2
),
(
  'Common Houseplant Pests: Identification and Treatment',
  'Early detection is key to managing houseplant pests. Inspect your plants weekly.'||E'\n\n'||
  'Spider Mites — Fine webbing on leaves, stippled yellow spots. Increase humidity, wipe with neem oil or insecticidal soap. Repeat weekly.'||E'\n\n'||
  'Mealybugs — White cottony masses in leaf axils. Dab with rubbing alcohol on a cotton swab. Apply neem oil spray.'||E'\n\n'||
  'Fungus Gnats — Small flies on soil surface. Let soil dry more between waterings. Use yellow sticky traps. Apply BTI (mosquito bits).'||E'\n\n'||
  'Scale — Brown or tan bumps on stems and leaf undersides. Scrape off with fingernail or alcohol swab. Treat with horticultural oil.'||E'\n\n'||
  'Aphids — Small green/black insects on new growth. Wash off with water spray. Use insecticidal soap.'||E'\n\n'||
  'Thrips — Tiny slender insects, silver streaks on leaves. Systemic insecticide or spinosad spray. Quarantine affected plants.',
  'diagnosis', array['pests', 'spider mites', 'mealybugs', 'fungus gnats', 'scale', 'aphids', 'thrips'], 3
);

-- ── Additional Diagnosis Entries ──
-- Filling gaps in the diagnosis library for common user queries.

insert into public.diagnosis_entries (symptom, cause, solution, severity, category, sort_order) values
('Sunburn', 'Leaves receive too much direct sunlight, especially intense afternoon rays. White or pale brown patches appear on the side facing the window.', 'Move the plant away from direct sun or filter light with a sheer curtain. Remove badly damaged leaves. The plant will recover with new growth in appropriate light.', 'moderate', 'light', 20),
('Sunburn', 'Sudden exposure to direct sun without acclimation. Plants moved outdoors or to a brighter spot without a transition period often burn.', 'Acclimate plants gradually over 1-2 weeks. Start with 1 hour of morning sun, increasing daily. New growth will be sun-hardened.', 'moderate', 'environment', 21),
('Low humidity', 'Dry air causes leaves to develop crispy brown edges and tips. Common in heated indoor spaces during winter or air-conditioned rooms in summer.', 'Increase humidity: use a humidifier, pebble tray, or group plants together. Mist plants daily. Bathroom and kitchen windows offer naturally higher humidity.', 'minor', 'environment', 22),
('Low humidity', 'Leaf curling and browning at the edges, especially in tropical plants like calatheas, ferns, and marantas. New leaves may emerge deformed or stuck.', 'Move to a naturally humid room (bathroom, kitchen). Use a humidifier set to 50-60%. Trim damaged edges with clean scissors — they will not heal but new growth will be healthy.', 'moderate', 'environment', 23),
('Nutrient deficiency', 'Pale or yellowing leaves with green veins (iron deficiency — chlorosis). Most common in older leaves first, or new leaves depending on the nutrient.', 'Apply a balanced liquid fertilizer with micronutrients. Check soil pH — nutrients lock outside the 6.0-7.0 range. Use an iron supplement for stubborn chlorosis.', 'moderate', 'nutrient', 24),
('Nutrient deficiency', 'Slow growth, small pale leaves, and weak stems. The plant has exhausted its potting mix nutrients, especially if not fertilized in 6+ months.', 'Begin monthly fertilizing with balanced houseplant fertilizer during the growing season. Repot if the plant has been in the same pot for 2+ years to refresh the soil.', 'minor', 'nutrient', 25),
('Nutrient deficiency', 'Lower leaves turning yellow and dropping, while new growth looks healthy. Classic nitrogen deficiency — the plant is moving nitrogen from old leaves to new growth.', 'Apply a nitrogen-rich fertilizer (higher first number on N-P-K). Fish emulsion or balanced liquid fertilizer works well. New growth should green up within 2 weeks.', 'moderate', 'nutrient', 26),
('Overwatering', 'Persistently wet soil, yellowing lower leaves, and a musty smell from the pot. Roots may be starting to rot.', 'Stop watering immediately. Let the soil dry thoroughly before the next watering. Check that your pot has drainage holes. Consider repotting if the soil stays wet for more than 10 days.', 'moderate', 'watering', 27),
('Overwatering', 'Soft, mushy stems near the soil line. Leaves may appear bloated or translucent. Common in succulents and plants in non-draining pots.', 'Remove the plant from its pot. Cut away any mushy stems or roots. Let the plant callous for 1-2 days. Repot in dry, well-draining soil. Do not water for at least a week.', 'severe', 'watering', 28),
('Underwatering', 'Wilting, drooping leaves that feel thin or crispy. Soil has pulled away from the sides of the pot. The plant perks up quickly after watering.', 'Water thoroughly until it drains from the bottom. Consider bottom-watering for soil that has become hydrophobic (repels water). Increase watering frequency slightly.', 'minor', 'watering', 29),
('Underwatering', 'Leaves turning brown and crispy from the tips downward. The plant has been consistently too dry for weeks, causing permanent leaf damage.', 'Trim the brown tips with clean scissors. Establish a consistent watering schedule using reminders. Check soil moisture weekly with the finger test.', 'moderate', 'watering', 30),
('Pest damage', 'General pest damage: stippled yellow spots, sticky honeydew residue, sooty mold on leaves, and visible insects on the plant.', 'Isolate the affected plant immediately. Identify the pest before treating. For most pests: neem oil spray, insecticidal soap, or rubbing alcohol (dab on scale/mealybugs). Repeat treatment weekly for 3-4 weeks to break the life cycle.', 'moderate', 'pests', 31),
('Pest damage', 'Scale insects — brown or tan bumps on stems and leaf undersides that can be scraped off. Leaves may yellow and drop as infestation grows.', 'Scrape off visible scale with a fingernail or toothbrush. Apply horticultural oil or neem oil to smother remaining insects. Check weekly and repeat as needed. Severe cases may require systemic insecticide.', 'moderate', 'pests', 32),
('Pest damage', 'Aphids — clusters of small green, black, or white insects on new growth and flower buds. Leaves may curl and become sticky with honeydew.', 'Blast off with a strong stream of water. Apply insecticidal soap or neem oil. Introduce beneficial insects like ladybugs if on outdoor plants. Ants farming aphids must also be controlled.', 'moderate', 'pests', 33),
('Pest damage', 'Thrips — tiny slender insects that leave silvery streaks on leaves and deformed new growth. Hard to spot — shake a leaf over white paper to see them fall.', 'Quarantine immediately. Apply spinosad spray or systemic insecticide. Remove and dispose of severely affected leaves. Thrips have a fast life cycle — treat every 5-7 days for 3-4 weeks.', 'severe', 'pests', 34)
on conflict do nothing;
