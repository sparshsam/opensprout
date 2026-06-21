# OpenSprout Database Namespace Audit

**Audit date:** June 21, 2026  
**Project ref:** `rbdyrymtgfqqkdemicdo`  
**Branch:** `feat/v0.9.1-branding-db-namespace`  
**Method:** Migration file review (source of truth) + Supabase REST API verification

---

## Inventory

### Custom Types (`public` schema)

| Type | Values | Owned by OpenSprout? |
|------|--------|----------------------|
| `care_type` | `water`, `fertilize`, `mist`, `rotate`, `prune`, `repot`, `inspect`, `custom` | ✅ Yes |
| `task_status` | `pending`, `done`, `skipped`, `snoozed`, `cancelled` | ✅ Yes |
| `transfer_kind` | `export`, `import` | ✅ Yes |
| `transfer_status` | `queued`, `running`, `succeeded`, `failed`, `cancelled` | ✅ Yes |

### Tables (`public` schema)

| Table | Purpose | Owned by OpenSprout? |
|-------|---------|----------------------|
| `profiles` | User profile display settings, timezone, units | ✅ Yes |
| `plants` | Core plant records with health, location, photos | ✅ Yes |
| `care_schedules` | Recurring care cadences (watering, fertilizing, etc.) | ✅ Yes |
| `task_instances` | Concrete due-at task items derived from schedules | ✅ Yes |
| `care_logs` | Completed care actions with amounts and notes | ✅ Yes |
| `journal_entries` | Plant health journal with title, body, tags, score | ✅ Yes |
| `journal_photos` | Photo metadata linked to journal entries | ✅ Yes |
| `data_transfers` | Export/import job tracking | ✅ Yes |
| `sync_devices` | Client-device metadata for local-first sync | ✅ Yes |
| `plant_species` | 30 built-in care template species (read-mirror) | ✅ Yes |
| `knowledge_articles` | Extended care, diagnosis, propagation articles | ✅ Yes |
| `diagnosis_entries` | Symptom → cause → solution diagnostic data | ✅ Yes |
| `identifications` | AI plant identification history (PlantNet) | ✅ Yes |
| `mcp_tokens` | API tokens for MCP server authentication | ✅ Yes |

### Functions

| Function | Purpose |
|----------|---------|
| `public.touch_sync_columns()` | Trigger fn: sets `updated_at`, `last_modified_at`, increments `sync_version` |
| `public.touch_updated_at()` | Trigger fn: sets `updated_at` only |

### Triggers

| Trigger | Table | Purpose |
|---------|-------|---------|
| `touch_plants` | `plants` | Sync version management |
| `touch_care_schedules` | `care_schedules` | Sync version management |
| `touch_task_instances` | `task_instances` | Sync version management |
| `touch_care_logs` | `care_logs` | Sync version management |
| `touch_journal_entries` | `journal_entries` | Sync version management |
| `touch_journal_photos` | `journal_photos` | Sync version management |
| `touch_plant_species` | `plant_species` | Updated_at only |

### RLS Policies

All user-owned tables have `for all to authenticated using (auth.uid() = user_id)` policies.

Public-read-only tables (`plant_species`, `knowledge_articles`, `diagnosis_entries`) have `for select to anon, authenticated using (true)`.

Storage bucket `plant-photos` has separate read/insert/update/delete policies scoped to `auth.uid()` folder prefix.

### Storage Buckets

| Bucket | Public | Owned by OpenSprout? |
|--------|--------|----------------------|
| `plant-photos` | No (private) | ✅ Yes |

### Edge Functions

| Function | Status | Versions | verify_jwt |
|----------|--------|----------|------------|
| `identify-plant` | ACTIVE | 4 | No |

---

## Non-OpenSprout Resource Check

**No foreign or orphaned resources detected.** All tables, types, functions, triggers, buckets, and edge functions in this Supabase project belong to OpenSprout.

No resources from other apps (e.g., hiss-tastic, openjournal, or any other project) are present in this project's database.

---

## Namespace Recommendation

**Current naming:** All OpenSprout tables use bare, descriptive names in the `public` schema (e.g., `plants`, `care_schedules`, `journal_entries`).

### Option A: SQL comments only (recommended for v0.9.x)

Add a SQL comment to each table marking it as OpenSprout-owned. This is the safest approach — zero risk of breaking existing queries, RLS policies, migrations, or application code.

```sql
comment on table public.plants is 'OpenSprout: core plant records';
comment on table public.care_schedules is 'OpenSprout: recurring care cadences';
-- ... etc for all 14 tables
comment on type public.care_type is 'OpenSprout: known care action types';
comment on type public.task_status is 'OpenSprout: task completion states';
comment on type public.transfer_kind is 'OpenSprout: data transfer direction';
comment on type public.transfer_status is 'OpenSprout: data transfer lifecycle';
```

**Add to next migration** (`20260621000000_namespace_comments.sql`).

### Option B: Table renaming (for a future breaking release)

Prefix existing tables with `opensprout_`:

- `plants` → `opensprout_plants`
- `care_schedules` → `opensprout_care_schedules`
- `task_instances` → `opensprout_task_instances`
- `care_logs` → `opensprout_care_logs`
- `journal_entries` → `opensprout_journal_entries`
- `journal_photos` → `opensprout_journal_photos`
- `profiles` → `opensprout_profiles`
- `data_transfers` → `opensprout_data_transfers`
- `sync_devices` → `opensprout_sync_devices`
- `plant_species` → `opensprout_plant_species`
- `knowledge_articles` → `opensprout_knowledge_articles`
- `diagnosis_entries` → `opensprout_diagnosis_entries`
- `identifications` → `opensprout_identifications`
- `mcp_tokens` → `opensprout_mcp_tokens`

**Do NOT apply Option B** in v0.9.1. Renaming requires coordinated changes across:
- All SQL queries in the Next.js app (Supabase client queries, server actions, RPC calls)
- Edge function SQL queries
- MCP server tool definitions
- RLS policies (table names in `using` / `with check`)
- Trigger references
- Foreign key constraints
- Any existing user data on the hosted demo

### Recommendation

**Apply Option A (comments only) for v0.9.1.**  
Re-evaluate Option B (rename) at the next breaking version (v0.10 or v1.0) with a dedicated migration branch and full app-side refactoring.

**Recommended prefix for future OpenSprout-only tables:** `opensprout_*`

---

## Migration Plan (Option A — Safe)

File: `supabase/migrations/20260621000000_namespace_comments.sql`

```sql
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
```

Apply with:

```sql
supabase db push
```

Or via Supabase SQL editor if using hosted.
