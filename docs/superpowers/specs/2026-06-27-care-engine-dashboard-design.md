# OpenSprout Care Engine & Dashboard Intelligence

**Versions:** v0.9.16 (Care Engine Foundation) + v0.9.17 (Dashboard Intelligence)
**Date:** 2026-06-27
**Status:** Approved

## Overview

Two-part feature release rebuilding OpenSprout's core care experience. v0.9.16 adds
species-driven care presets, a guided "Apply Care Plan" flow, user-friendly scheduling,
and full schedule CRUD. v0.9.17 reorients the dashboard around "Today's Care",
prioritizing due tasks over statistics, with overdue/upcoming sections, contextual
actions, and per-plant care summaries.

## Architecture

### Data Layer — Species Preset Resolution

A `resolveSpeciesPresets(speciesId)` helper in `lib/data/plants.ts` returns a `CarePreset[]`
array. Each preset combines species knowledge fields with fallback defaults:

| Care Type | Priority Source | Fallback |
|-----------|---------------|----------|
| water | AVG(watering_min_days, watering_max_days) | 7 days |
| fertilize | fertilizing_frequency_days | 30 days |
| mist | — | 3 days |
| rotate | — | 14 days |
| prune | — | 60 days |
| repot | — | 180 days |
| inspect | — | 7 days |

The helper is a pure function — no DB call for species data (already in context).
It maps species row fields to `{ careType, label, cadenceDays, source }` where
`source` is `"species"` or `"default"`.

### Data Layer — Cadence Formatter

A `formatCadence(days: number): string` helper converts numeric days to labels:

- 1 → "Daily"
- 2–6 → "Every {n} days"
- 7 → "Weekly"
- 14 → "Every 2 weeks"
- 21 → "Every 3 weeks"
- 28–31 → "Monthly"
- >31 → "Every {n} days"

A `CadencePicker` component provides a dropdown/pill selector for these values,
with a "Custom..." option that reveals a number input.

### User-Friendly Scheduling

Replace raw number inputs with a cadence pill selector. The `CadencePicker` component
shows preset options first (Daily, Every 2 days, Weekly, Every 2 weeks, Monthly)
plus "Custom..." for arbitrary values. Maps between display labels and the
`(cadence_value, cadence_unit)` storage format.

### Component — ApplyCarePlanSheet

A BottomSheet triggered after plant creation (or on first visit to a plant with no
schedules). Shows species-matched care presets with toggles, cadence editing,
and "Apply Plan" / "Not now" actions.

- Appears automatically after plant creation if species is known
- Accessible from plant detail's "Set up care plan" link in empty state
- Toggled-on presets create `care_schedules` rows on submit
- Schedules are created as `active: true` with the chosen cadence

### Component — ScheduleCard (Edit/Pause/Delete)

Replace the flat schedule list on plant detail with `ScheduleCard` components:

- Shows care type icon, label, cadence ("Every 7 days"), next due date
- Status indicator (active / paused)
- Three-dot menu: Edit, Pause/Resume, Delete
- Edit opens a BottomSheet with CadencePicker
- Pause sets `active: false` (schedules stop generating tasks)
- Delete confirms, then soft-deletes (sets `deleted_at`)
- Empty state: contextual message + "Set up care plan" button

### Dashboard — Care Plan Filter

The dashboard task queries already join on `care_schedules.active`. The `ensureTaskInstances`
function only generates tasks for active schedules. No changes needed — this already works.
The plant creation flow no longer auto-creates schedules; they come from ApplyCarePlanSheet.

### Empty States — Improvements

| Page | Current | Improved |
|------|---------|----------|
| Dashboard (no plants) | "Welcome to OpenSprout" + buttons | Same, keeps existing good pattern |
| Dashboard (no tasks) | Shows stats + collection | "Nothing due today" hero state |
| Plants (no plants) | "No plants yet" | Keep, enhance icon |
| Plant detail (no schedules) | "No care schedule yet." + link | "Set up care plan" button + species-aware prompt |
| Plant detail (no history) | "No care logged yet." | Keep, minor polish |
| Journal (empty) | "No journal entries yet" | Keep |
| Calendar (empty day) | "No care tasks for this day" | Keep |

### Dashboard — Rebuild for "Today's Care"

The dashboard (`/today/page.tsx`) is restructured as follows:

1. **Hero:** Greeting + atmospheric headline (keep current)
2. **Stats row:** Compact, below hero (moved down from current priority position)
3. **Overdue tasks section** — red-tinted, with "N overdue" count badge
4. **Today's tasks section** — primary section, all due-today tasks with mark-done
5. **Upcoming section** — next 5 upcoming tasks
6. **Nothing due today** — replaces tasks sections when no overdue/today/upcoming tasks
7. **Plant care summaries** — compact per-plant cards showing each plant's next care
8. **Contextual next actions** — based on what's happening (e.g., "Check on your Ficus — it's due for misting today")
9. **Quick actions** — improved: larger, more prominent, contextual to state
10. **Recent activity** — keep as bottom section

### Plant Care Summary

Each plant card in the dashboard shows:
- Plant name + photo thumbnail
- Next care action + due time (e.g., "Water — Today")
- Health status indicator
- Tap to go to plant detail

### Contextual Next Actions

A smart suggestion area below the task sections:
- "Water your Monstera" when it's due
- "Check on your Ficus" for inspect tasks
- "Great work — all plants are cared for!" when nothing is due
- Suggestions link directly to the task action sheet or plant detail

## Implementation Order

### v0.9.16 — Care Engine
1. Helper: `resolveSpeciesPresets()`, `formatCadence()`, `CadencePicker` component
2. ApplyCarePlanSheet component
3. Show sheet after plant creation in `plants/page.tsx`
4. Schedule management (ScheduleCard with edit/pause/delete) on plant detail
5. Remove auto-schedule creation from `createPlant()`
6. Dashboard: ensure only active schedules drive tasks (verify existing filter)
7. Empty state improvements throughout
8. Version bump to v0.9.16

### v0.9.17 — Dashboard Intelligence
1. Restructure Dashboard layout (prioritize tasks over stats)
2. Overdue section with count badge
3. Today's tasks section with multi-task support
4. Upcoming section
5. "Nothing due today" state
6. Plant care summaries in dashboard
7. Contextual next actions
8. Improved quick actions
9. Remove placeholder content
10. Version bump to v0.9.17

## File Change Summary

| File | Changes |
|------|---------|
| `lib/data/plants.ts` | Add `resolveSpeciesPresets()`, `getCarePreset()`, remove auto-schedule from `createPlant()` |
| `lib/data/care.ts` | Add `formatCadence()`, `cadenceOptions`, `parseUserCadence()` |
| `lib/data/types.ts` | Add `CarePreset`, `CadenceOption` types |
| `components/care/CadencePicker.tsx` | New — user-friendly cadence selector |
| `components/care/ApplyCarePlanSheet.tsx` | New — post-creation care plan BottomSheet |
| `components/care/ScheduleCard.tsx` | New — editable schedule card with menu |
| `components/care/ScheduleEditSheet.tsx` | New — BottomSheet for editing a schedule |
| `app/(authenticated)/plants/page.tsx` | Trigger ApplyCarePlanSheet after create, remove water_every_days/fertilize_every_days |
| `app/(authenticated)/plants/[id]/page.tsx` | Replace schedule list with ScheduleCards, add care plan link |
| `app/(authenticated)/today/page.tsx` | Major restructure — rebuild layout |
| `components/dashboard/TaskSection.tsx` | New — overdue/today/upcoming section |
| `components/dashboard/PlantCareSummary.tsx` | New — per-plant care card |
| `components/dashboard/ContextualActions.tsx` | New — smart suggestions |
| `components/dashboard/NothingDueToday.tsx` | New — empty task state |
