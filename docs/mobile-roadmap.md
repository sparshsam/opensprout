# OpenSprout Mobile Product Roadmap

> **Phase:** v0.2 — Mobile Platform Foundation

This document describes the product direction for OpenSprout's evolution from a web-only MVP toward a mobile-first web + Android plant care app with cross-device sync.

---

## v0.2 — Mobile Foundation (current)

**Goal:** Ship a working Android app with the full v0.1 feature set, wrapped in a mobile-first UI with proper navigation.

| Area | Status | Notes |
|---|---|---|
| Android platform (Capacitor) | ✅ Done | `com.sparshsam.opensprout`, local APK builds |
| Responsive shell layout | ✅ Done | Bottom nav on mobile, sidebar on desktop |
| Route-based navigation | ✅ Done | /today, /plants, /calendar, /journal, /settings |
| Shared app context | ✅ Done | Auth + data context works across web and Android |
| Placeholder icon/splash | ✅ Done | Green sprout icon, brand color splash |
| Supabase account sync | ✅ Inherited | Same auth flow, same Supabase project |
| Android build docs | ✅ Done | `docs/android.md` |

### Mobile-First UI Polish

- [ ] Touch-optimized interactions (tap targets >= 44px, swipe gestures)
- [ ] Pull-to-refresh for Today and Plants views
- [ ] Smooth page transitions / shared element animations
- [ ] Safe area insets for notched devices
- [ ] Haptic feedback on care actions
- [ ] Dark mode support

### Care Task Workflow

- [ ] Dedicated care task list with swipe-to-complete
- [ ] Snooze / skip / reschedule actions
- [ ] Notification reminders (local push via Capacitor Local Notifications)
- [ ] Task completion with customizable notes (amount_ml, fertilizer details)

### Plant Timeline

- [ ] Plant detail timeline showing care log entries chronologically
- [ ] Health status trend indicators (thriving → struggling)
- [ ] Photo carousel in timeline (when photo upload exists)
- [ ] Journal entry preview in timeline

### Photo Upload Groundwork

- [ ] Camera/gallery capture via Capacitor Camera plugin
- [ ] Image resize/compress before upload
- [ ] Supabase Storage upload flow
- [ ] Photo thumbnail in plant cards and timeline
- [ ] Photo management (delete, reorder)

### Offline-First Preparation

- [ ] Service Worker caching strategy for static assets (already has PWA foundation)
- [ ] Supabase Realtime subscriptions for live sync
- [ ] Offline queue for care log operations
- [ ] Conflict resolution for offline-then-sync edits
- [ ] Connection status indicator

### Import/Restore Planning

- [ ] JSON import endpoint and UI (schema exists in `data_transfers` table)
- [ ] Validation and conflict resolution on import
- [ ] Full backup and restore flow
- [ ] Import progress UI

---

## v0.3 — Care Workflow & Timeline (current)

**Goal:** Professional daily plant-care workflow with task management (complete, skip, snooze, reschedule) and rich plant timeline.

| Area | Status | Notes |
|---|---|---|
| Task workflow data layer | ✅ Done | `lib/data/tasks.ts` — create/complete/skip/snooze/reschedule task_instances |
| Task instance generation | ✅ Done | `ensureTaskInstances()` creates tasks from schedules |
| Task grouping (overdue/today/upcoming) | ✅ Done | `listTasks()` returns 3 groups |
| Calendar date grouping | ✅ Done | `listUpcomingByDate()` groups by calendar date |
| Journal feed | ✅ Done | `listJournalFeed()` returns all care events chronologically |
| Plant timeline | ✅ Done | `listPlantTimeline()` returns per-plant care event history |

### Screens / UI

| Area | Status | Notes |
|---|---|---|
| Today page — grouped task cards | ✅ Done | Overdue (red), Due today (amber), Upcoming sections |
| Task action bottom sheet | ✅ Done | Complete (with amount/fertilizer/notes form), Skip, Snooze, Reschedule |
| Plant detail — timeline | ✅ Done | Chronological care event feed per plant |
| Calendar page — tasks by date | ✅ Done | Grouped upcoming tasks with action sheet |
| Journal page — care feed | ✅ Done | Chronological feed of all care events |
| Stats cards | ✅ Done | Due count, Overdue count, Today count, Healthy count |
| Empty / loading / error states | ✅ Done | All pages handle all three |

### Data Flow

1. `ensureTaskInstances()` runs on every dashboard refresh — creates `task_instances` from `care_schedules` where missing
2. `listTasks()` queries pending/snoozed task_instances, resolves plant names, groups by date
3. Completing a task creates a `care_log` entry, marks task as `done`, updates schedule's `next_due_at`
4. Plant timeline queries `care_logs` for a specific plant
5. Journal feed queries all `care_logs` chronologically

### Theme & Polish

- [ ] Pull-to-refresh (plants and today views)
- [ ] Haptic feedback on task actions
- [ ] Dark mode support
- [ ] Smooth page transitions

---

---

---

## v0.4 — Photos & Journal (current)

**Goal:** Add private plant photo support, plant health journal entries, and visual progress timelines for web + standalone Android.

| Area | Status | Notes |
|---|---|---|
| Capacitor Camera plugin | ✅ Done | `@capacitor/camera` installed, configured in capacitor.config.ts |
| Photo upload flow | ✅ Done | Web file picker + Android camera/gallery → Supabase Storage (private bucket) |
| Signed URLs for photos | ✅ Done | `getPhotoSignedUrl()` — no public bucket URLs exposed |
| Photo metadata table | ✅ Done | `journal_photos` with object_path, content_type, size_bytes, sort_order |
| Journal entry CRUD | ✅ Done | `lib/data/journal.ts` — create, edit, delete with soft-delete |
| Journal form with photos | ✅ Done | `JournalForm` component with title, body, date, health score, tags, photo picker |
| Combined plant timeline | ✅ Done | care_logs + journal_entries + journal_photos sorted chronologically |
| Photo thumbnails in timeline | ✅ Done | Signed URL resolution per-photo with loading states |
| Upgraded Journal feed | ✅ Done | Cross-plant feed with filters (plant, type), "New entry" action, edit/delete |
| Plant cover photos | ✅ Done | `CoverPhoto` component, cover_photo_path on plants table, shown in cards + detail |
| Android permissions | ✅ Done | Camera + photo/gallery permissions documented |
| CSP updated for Storage images | ✅ Done | `img-src` includes `https://*.supabase.co` |

### Data Flow

1. **Photo upload:** Camera/gallery (Capacitor) or file picker (web) → Blob → `supabase.storage.from('plant-photos').upload()` → metadata saved to `journal_photos`
2. **Photo access:** Always via signed URLs (`createSignedUrl`) — never public URLs
3. **Journal entry CRUD:** Client-side Supabase queries with soft-delete (`deleted_at`)
4. **Timeline:** Three parallel queries (care_logs, journal_entries, journal_photos) → merge + sort by `occurred_at`/`observed_at`

### Remaining for v0.5

- Local push notification reminders
- Pull-to-refresh on mobile
- Dark mode
- Offline queue for journal/log operations

---

## v1.0 — Self-Hostable Stable

- Full import/restore flow
- Offline sync queue hardened
- Accessibility audit (WCAG 2.1 AA)
- Security review
- Expanded community plant template process
- Play Store submission
- Release signing, code signing, production metadata

---

## Mobile-Native vs. Capacitor

OpenSprout uses Capacitor (not React Native or Kotlin) for Android because:

| Factor | Decision |
|---|---|
| **Shared code** | 100% of UI logic is shared between web and Android |
| **Supabase auth** | Same `@supabase/ssr` browser client works identically |
| **Dev velocity** | Web HMR during development, no native rebuild cycle |
| **App Store** | Can still publish to Play Store via Capacitor |
| **Trade-off** | No native UI chrome; limited access to platform sensors |

If performance-sensitive native features are needed (background sync, real-time camera processing), individual Capacitor plugins or a native bridge can be added per feature rather than rewriting the whole app.
