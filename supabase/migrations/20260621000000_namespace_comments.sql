-- OpenSprout v0.9.1 — Database namespace ownership comments
-- Adds SQL comments to all OpenSprout-owned resources.
-- No structural changes — safe to apply at any time.

-- Tables
comment on table public.profiles is 'OpenSprout: user profile preferences (timezone, units)';
comment on table public.plants is 'OpenSprout: core plant records with health/location metadata';
comment on table public.care_schedules is 'OpenSprout: recurring care cadences (watering, fertilizing, etc.)';
comment on table public.task_instances is 'OpenSprout: scheduled care task items with due dates';
comment on table public.care_logs is 'OpenSprout: completed care actions with amounts and notes';
comment on table public.journal_entries is 'OpenSprout: plant health journal entries';
comment on table public.journal_photos is 'OpenSprout: photo metadata linked to journal entries';
comment on table public.data_transfers is 'OpenSprout: export/import job tracking';
comment on table public.sync_devices is 'OpenSprout: client device metadata for local-first sync';
comment on table public.plant_species is 'OpenSprout: care template species reference data';
comment on table public.knowledge_articles is 'OpenSprout: extended plant care knowledge base';
comment on table public.diagnosis_entries is 'OpenSprout: symptom/cause/solution diagnostic reference';
comment on table public.identifications is 'OpenSprout: AI plant identification history';
comment on table public.mcp_tokens is 'OpenSprout: MCP server API tokens';

-- Custom types
comment on type public.care_type is 'OpenSprout: known care action types (water, fertilize, mist, etc.)';
comment on type public.task_status is 'OpenSprout: task completion states (pending, done, skipped, etc.)';
comment on type public.transfer_kind is 'OpenSprout: data transfer direction (export/import)';
comment on type public.transfer_status is 'OpenSprout: data transfer lifecycle status';

-- Functions
comment on function public.touch_sync_columns() is 'OpenSprout: trigger fn for sync version tracking';
comment on function public.touch_updated_at() is 'OpenSprout: trigger fn for updated_at only';
