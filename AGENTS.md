# OpenSprout — AI Agent Instructions

## Current Release

**v0.9.27** — Open Product Family Branding Alignment (2026-07-02)

## Product Identity

OpenSprout is a privacy-first, open-source plant care companion. Track watering, log care, identify plants via AI, journal growth, and diagnose problems — all with user-owned data. No subscriptions, no ads, no tracking.

**Tagline:** Track, identify, and care for your plants.

## Brand Architecture

```
KOVINA          Parent ecosystem     → kovina.org/standards/KOVINA_MANIFESTO.md
  ↓
OPEN            Product family       → apps/web/docs/BRANDING.md
  ↓
Sprout          Individual product   → apps/web/docs/BRANDING.md
```

- **OPEN has no icon.** No symbol, no badge, no monogram. Typography only.
- The application icon belongs only to OpenSprout, never to OPEN.
- Do not merge the icon into the typography lockup.
- The header lockup is: `[icon] OPEN / Sprout` (stacked, icon on left).
- Three header components use the lockup: `public-nav.tsx`, `shell/top-bar.tsx`, `app-shell.tsx`.
- Icons are generated from 1024x1024 light + dark masters via Lanczos resampling: 210 assets across all platforms. 114 dark variant assets (including opensprout-icon-header-dark.png).
- Dark/light themed headers use dual `<img>` elements with `dark:opacity-0`/`dark:opacity-100` CSS transitions.
- The header lockup uses the generated PNG icon (not lucide Sprout) in `public-nav.tsx` and `app-shell.tsx`.
- Lockup styling matches OpenPalette canonical spec.
- OpenPalette is the canonical reference implementation for the Open Product Family branding.
- See `apps/web/docs/BRANDING.md` for complete product-specific branding documentation.

## Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS v4 + TypeScript
- **Backend:** Supabase (auth, PostgreSQL DB, file storage, edge functions)
- **Mobile:** Capacitor v8 Android (PWA for Windows/desktop)
- **AI:** MCP server at `apps/mcp/` — 28 tools, 112 tests
- **Auth:** Google OAuth (email/password disabled via Supabase)
- **Design:** Sora variable font, warm paper light mode, deep botanical dark mode
- **Hosting:** Vercel (web at sprout.kovina.org), Supabase (backend, shared project with OpenSend)
- **CI:** GitHub Actions — Java 21 for Android, Node 24 for web, caching via `setup-node`

## Repo Structure

```
opensprout/
├── apps/
│   ├── web/              # Next.js app + Capacitor Android
│   │   ├── src/app/      # App Router pages + API routes
│   │   ├── src/lib/      # Data layer, auth, supabase clients, context
│   │   └── src/components/# UI components
│   └── mcp/              # MCP server (28 tools, HTTP + stdio)
│       └── src/tools/    # 7 tool modules (plants, care, journal, etc.)
├── docs/                 # 35+ docs
├── scripts/              # build/release scripts
├── supabase/
│   └── migrations/       # Database migrations
└── package.json          # Root workspace
```

## Public Routes

| Route | Description |
|-------|-------------|
| `/` | Public homepage (editorial hero + features) |
| `/login` | Google OAuth sign-in (no email/password) |
| `/auth/callback` | OAuth PKCE callback handler |
| `/auth/complete` | PWA sign-in popup landing ("return to app") |
| `/debug` | Diagnostics page (APK debugging, unlinked) |
| `/about` | About page |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/mcp` | MCP integration guide |
| `/api/mcp` | MCP Streamable HTTP endpoint |
| `/today` | Dashboard — Today's Care, tasks, insights |
| `/plants` | Plant collection (filters, sort, group, archive, favorites) |
| `/plants/[id]` | Plant detail (photos, schedules, doctor, timeline, notes) |
| `/identify` | Plant identification (photo + AI) |
| `/journal` | Care log + journal entry feed |
| `/calendar` | Monthly task calendar |
| `/explore` | Species library browser |
| `/profile` | User profile |
| `/settings` | Settings (notifications, data, MCP) |
| `/settings/mcp` | MCP token management |

## Key Changes in v0.9.16 — Care Engine Foundation

### Species Care Presets
- `resolveSpeciesPresets()` in `lib/data/care.ts` merges species knowledge (watering min/max, fertilizing frequency) with sensible defaults for mist/rotate/prune/repot/inspect/custom
- `CarePreset` type with `source` field (`"species"` vs `"default"`) for transparency

### Apply Care Plan Flow
- `ApplyCarePlanSheet` — post-creation BottomSheet showing all 8 care types with toggles
- Water enabled by default (species-backed); other presets opt-in
- `CadencePicker` — 12 preset cadences (Daily → Yearly) + custom input
- Batch-creates `care_schedules` on apply; "Not now" defers

### User-Friendly Scheduling
- `formatCadence()` / `cadenceToDays()` / `daysToCadence()` helpers in `care.ts`
- `CadencePicker` component with pills for all common cadences
- Raw numeric interval inputs removed from plant form

### Schedule Management
- `ScheduleCard` — displays cadence + due date with Edit/Pause/Delete
- `ScheduleEditSheet` — BottomSheet for editing cadence and notes
- Pause sets `active: false` (stops task generation without deleting)
- `updateCareSchedule()` / `deleteCareSchedule()` in `plants.ts`

### Cleanup
- `createPlant()` no longer auto-creates water/fertilize schedules
- `PlantFormValues` and `validatePlantValues()` cleaned of `water_every_days` / `fertilize_every_days`

## Key Changes in v0.9.17 — Dashboard Intelligence

### Layout (top to bottom)
1. Hero — greeting + atmospheric headline
2. Contextual next action — smart prompt based on current state
3. Overdue section — red-tinted with count badge + dates
4. Today's tasks — each with "Mark done" button + water/fertilizer detail fields
5. "Nothing due today" — celebratory state with Browse Plants / Journal links
6. Upcoming — next 5 tasks with relative times
7. Stats row — compact, moved below tasks
8. Quick actions — improved with Calendar link
9. Plant care summaries — per-plant next care card
10. Recent care — activity log with proper care-type icons

### Fixes
- `handleMarkCare` handles all 8 care types with correct verb labels (watered, fertilized, misted, rotated, pruned, repotted, inspected)
- `markCareDone` uses proper notes per care type

## Key Changes in v0.9.18 — Plant Detail Completion

### Photo Gallery
- `PhotoGallery` component — multiple photos per plant from `journal_photos` table
- Gallery nav arrows + thumbnail strip for navigation
- Inline upload new photos, delete existing with confirmation
- Auto-fallback to "upload first photo" empty state
- `listPlantPhotos()` data function in `photos.ts`

### Two-Column Desktop Layout
- `lg:grid-cols-5` split: photos + actions (2 cols) / info + schedules + timeline (3 cols)

### Species Info Panel
- Collapsible section showing all species fields + knowledge articles
- Fetches via `getSpeciesById()` + `getKnowledgeArticles()` from `knowledge.ts`
- Articles displayed as expandable `<details>` elements

### Timeline
- Care/Health tab switcher
- Care log shows all types with proper icons, amounts, timestamps
- Health history shows current status with edit link

### Inline Notes
- Tap to edit notes directly on the page with Save/Cancel
- Empty state shows dashed "Add notes" prompt

## Key Changes in v0.9.19 — Diagnosis & Health

### Plant Doctor
- `PlantDoctorSheet` — 3-step flow: Welcome → Select symptoms → Result
- Entry point button on plant detail (species required)
- Symptoms grouped by category: Watering, Light, Pests, Disease, Nutrient, Environment
- Sourced from `diagnosis_entries` table (species-specific + universal entries)

### Diagnosis Results
- Severity indicator (severe/moderate/minor)
- Full cause explanation + recommended action
- Backed by curated species care library

### Safety
- **Never overwrites user health** — diagnosis is purely informational
- No automatic changes to `health_status` or any plant data

## Key Changes in v0.9.20 — Smart Care Insights

### Data Layer (`lib/data/insights.ts`)
- `detectMissedCare()` — schedules past due without completion
- `computeCareStreaks()` — consecutive-day streaks per plant per care type
- `getLastWatered()` — per-plant last watering time
- `getSeasonalTips()` — month-based growing/dormant cycle tips
- `buildDashboardInsights()` — aggregates all insights with `reason` + `dataSource` fields

### Dashboard Insight Cards
- `InsightCards` component renders on `/today`
- Shows: missed care alerts, streak celebrations, health reminders, seasonal tips
- Every insight has expandable "Why?" detail showing exact data source
- Never invents recommendations without supporting data

## Key Changes in v0.9.21 — Notifications

### End-to-End Notifications
- `rescheduleAllReminders()` called from `refreshDashboard()` in app-context
- Web Notification API fallback via `new Notification()` for PWA/desktop
- `scheduleWebNotification()` — setTimeout-based for session reminders
- `showMissedReminders()` — summary on app load (deduplicated via sessionStorage)

### Background Refresh
- 15-minute `setInterval` in app-context, re-checks tasks + reschedules notifications

### Quiet Hours
- Handles same-day (08:00-17:00) and midnight-spanning (22:00-07:00) ranges
- Shifted to end time if during quiet hours; skipped if adjusted time is past

### Android Reliability
- Every task gets Capacitor local notification with `allowWhileIdle: true`
- Proper channel ID, small icon `ic_stat_sprout`, icon color

### Settings Polish
- Lead time options expanded (5 min → 1 day)
- Platform behavior notes in info box
- `saveReminderPrefs()` dispatches event for immediate rescheduling

## Key Changes in v0.9.22 — Plant Organization

### Favorites
- `is_favorite` boolean column on `plants` (migration `20260627000000_add_favorites.sql`)
- Star button on each card, Favorites filter toggle, favorites sort first
- `toggleFavorite()` function + `handleToggleFavorite` context handler

### Archive/Restore UI
- Archive button on each card, Archived filter toggle
- Restore button on archived plants, visual de-emphasis (opacity + label)
- `archivePlant()` / `restorePlant()` data functions + context handlers
- Existing `archived_at` column now fully usable from UI

### Search & Filters
- Search covers name, species, location, health_status, cultivar, nickname
- Filter panel: health status chips, location chips, favorites toggle, archived toggle
- `sortAndFilterPlants()` — pure function, no DB calls
- Sort by: Name, Date added, Recently updated, Health, Species (asc/desc)

### View Modes
- Grid/list view toggle (pill UI)
- List view: compact rows with inline Edit/Archive/Delete
- Grid view: cards with photo, health badge, action buttons

### Collection Stats
- Total + favorites + archived counts in header
- Health distribution (colored dots) when no filter active

## Key Changes in v0.9.23 — User Experience Polish

### Onboarding
- `WelcomeWizard` — 4-step wizard (Welcome → Add → Plan → Track)
- localStorage-gated, shows on first visit only with 600ms delay
- Progress dots, icons, "Skip tour" option

### Loading States
- Calendar page: skeleton squares replacing spinner
- Explore page: skeleton cards replacing pulse icon

### Animations
- `@keyframes fadeIn` + `@utility animate-page-in` in globals.css
- Applied to `<main>` — pages fade up on route change

### Accessibility
- Skip-to-content link in layout (uses existing `.skip-to-content` CSS)
- `aria-live="polite"` region for dynamic announcements
- Global `*:focus-visible` ring in globals.css (2px+4px theme ring)

### Settings Restructure
- Groups: Profile, Notifications, Integrations, Data, Danger Zone, About
- Consistent `rounded-2xl border-border/50` cards matching design language
- Danger Zone visually separated with red tint

## Key Changes in v0.9.25 — RC Stabilization

### Code Cleanup
- Fixed 4 ESLint `react/no-unescaped-entities` errors in care sheets and plant doctor.
- Cleaned up 30+ unused import/variable declarations across 16 files.

### Verification
- All quality checks pass: lint (0 errors), TypeScript (clean), Next.js build (clean), MCP tests (112/112), release script `--check-only` mode.
- Supabase migration ordering, columns, and RLS policies verified.
- PWA manifest, service worker, and Android build validated.
- Release script no destructive side effects.

### Documentation
- CHANGELOG.md backfilled with v0.9.15–v0.9.24 entries.
- Version bumped to 0.9.25 (versionCode 5).

## Key Changes in v0.9.26 — Native Google Sign-In + Android Platform Fixes

### Platform-Aware Sign-In
- **Platform detection** — `detectPlatform()` in login page selects the correct flow: direct browser (web), `@capacitor/browser` Chrome Custom Tab (Android native), or `window.open()` popup (PWA/Windows).
- **Android native flow** — `skipBrowserRedirect: true` returns the OAuth URL without navigating, `Browser.open()` opens it in an in-app Chrome Custom Tab, `App.addListener("appUrlOpen")` catches the `opensprout://auth/callback` redirect, and `exchangeCodeForSession()` exchanges the PKCE code client-side.
- **PWA flow** — `window.open()` opens a popup window with the sign-in URL, `/auth/complete` page exchanges the code and shows "Signed in! You can return to the app", then `postMessage({ type: "opensprout-oauth-done" })` notifies the PWA to navigate to `/today`.

### New Files
- `apps/web/src/app/auth/complete/page.tsx` — PWA popup landing page with `exchangeCodeForSession` + success UI + auto-close.
- `apps/web/src/components/oauth-deeplink-handler.tsx` — Global Capacitor `appUrlOpen` listener mounted in root layout.
- `apps/web/src/lib/data/platform.ts` — `isCapacitorNative()`, `getApiOrigin()`, `resolveApiUrl()` for Capacitor-safe API routing.
- `apps/web/src/app/debug/` — Diagnostics page showing origin, Capacitor detection, API URLs, Supabase session.

### Android Platform Fixes
- **Adaptive icons** — `ic_launcher_background` changed from `#FFFFFF` to `#16784f` (fixed invisible icon on API 26+).
- **White screen flash** — `android:windowBackground` → `@color/splashBackground` in `AppTheme.NoActionBar`.
- **API routing** — `resolveApiUrl()` prepends production origin (`https://sprout.kovina.org`) when running in Capacitor's static-export WebView, fixing `/api/identify` and `/api/log` calls.

### Dependencies
- `@capacitor/browser@8.0.3` installed and synced to Android project.

## Key Changes in v0.9.26b — CI Stabilization + Route Cleanup

### CI Fixes (7 PRs)
- **Java 21** — Android Gradle Plugin 8.13 requires JDK 21. CI `actions/setup-java` upgraded from 17 to 21.
- **Android build** — Changed from `CAPACITOR_BUILD=true` (which triggers `output: export` and checks all routes for static export compatibility) to normal `npx next build`. Server-only API routes (`/api/mcp`, `auth/callback`) with `force-dynamic` no longer cause build failures.
- **Static output population** — After normal `next build`, copies generated pages and static assets from `.next/` to `out/` so `npx cap sync` can find the required `index.html`.
- **`chmod +x gradlew`** — Git doesn't preserve the executable bit on `gradlew` in CI runners.
- **Global `working-directory` removed** — The `defaults: run: working-directory: apps/web` caused `npm ci` to run from `apps/web` instead of the project root, breaking MCP devDependency installation.

### Route Cleanup
- Removed all `force-static`, `generateStaticParams`, and `dynamicParams` hacks that were added during the CI debugging process.
- **Critical revert:** `auth/callback` and `api/mcp/tokens` with `force-static` on GET handlers would cache build-time 401/redirect responses on Vercel, breaking Google OAuth and MCP token management in production.
- All 5 API route files now have zero export overrides (except `api/mcp` which keeps `force-dynamic` for its JSON-RPC handler).

## Key Changes in v0.9.26c — Database Table Prefix Migration

### Shared Project Namespacing
The Supabase project `rbdyrymtgfqqkdemicdo` is shared between OpenSprout (plant care) and OpenSend (file sharing). All OpenSprout tables were renamed with an `opensprout_` prefix to match the existing `opensend_` convention.

### Renamed Tables (14)
| Old name | New name |
|----------|----------|
| `profiles` | `opensprout_profiles` |
| `plants` | `opensprout_plants` |
| `care_schedules` | `opensprout_care_schedules` |
| `task_instances` | `opensprout_task_instances` |
| `care_logs` | `opensprout_care_logs` |
| `journal_entries` | `opensprout_journal_entries` |
| `journal_photos` | `opensprout_journal_photos` |
| `data_transfers` | `opensprout_data_transfers` |
| `sync_devices` | `opensprout_sync_devices` |
| `plant_species` | `opensprout_plant_species` |
| `knowledge_articles` | `opensprout_knowledge_articles` |
| `diagnosis_entries` | `opensprout_diagnosis_entries` |
| `identifications` | `opensprout_identifications` |
| `mcp_tokens` | `opensprout_mcp_tokens` |

### Code Changes (26 files)
- All `supabase.from()` calls updated to use `opensprout_` prefixed names.
- All `Database` type definitions in `types.ts` and `mcp/src/types.ts` use `opensprout_` as table keys.
- All MCP tool files, test mocks, sync cache mappings, and `db.ts` store names updated.
- `delete_account()` RPC function replaced (table `RENAME` doesn't update hardcoded names in function bodies).

## Key Changes in v0.9.27 — Open Product Family Branding Alignment (2026-07-02)

### Header Lockup Standardization
- Three header components updated to `[icon] OPEN / Sprout` stacked lockup:
  - `apps/web/src/components/public-nav.tsx` — public header
  - `apps/web/src/components/shell/top-bar.tsx` — authenticated header
  - `apps/web/src/components/app-shell.tsx` — Brand() component (legacy)
- Lockup styling matches OpenPalette canonical spec: icon 28/32px, OPEN tracking 0.06em opacity-50, product font-medium -mt-0.5, leading-tight
- Generated PNG icon (opensprout-icon-header.png) replaces the lucide Sprout icon in `public-nav.tsx` and `app-shell.tsx`

### Icon Generation
- 210 assets generated from 1024x1024 light + dark masters via Lanczos resampling
- Platform targets: Windows ICO, MSIX store assets, Android mipmaps, iOS, macOS, Web/PWA favicons, social OG, GitHub, header icons
- 114 dark mode variant assets generated, including opensprout-icon-header-dark.png for all three header components
- Script-based generation pipeline (not manually exported)

### Dark/Light Themed Headers
- All three header locations use dual `<img>` elements
- CSS transition: `dark:opacity-0` hides the light icon in dark mode, `dark:opacity-100` reveals the dark variant
- Smooth cross-fade on theme switch (no flicker)

### Documentation
- `apps/web/docs/BRANDING.md` created with ecosystem hierarchy, Open Product Family guidelines, and product-specific branding details

## Key Changes in v0.9.24 — Platform Completion

### Android
- `versionCode` 4, `versionName` "0.9.24"
- `cleartext` disabled in production (enabled via `CAPACITOR_CLEARTEXT=true`)

### PWABuilder
- `public/pwabuilder.json` — full metadata, screenshots, edge_side_panel, categories
- `manifest.webmanifest` updated with categories, launch_handler, screenshots

### Store Assets
- `scripts/generate-store-screenshots.mjs` — Puppeteer generator for Play + Microsoft
- `docs/store-listing.md` — complete listing with v0.9.24 features

### Release Automation
- `scripts/release.sh` — version bump → lint → typecheck → MCP → web → Android
- Supports `--check-only`, `--android-only`, explicit version args

### CI
- Android build job in CI — static export → Capacitor sync → `assembleDebug` → artifact upload
- Runs on `main` pushes and `v*` tags

## Known Issues

- No tests exist in the web app (only MCP tests)
- No crash reporting / analytics (intentional privacy choice)
- Vercel Hobby plan rate-limited for deployments (24h cooldown)
- Supabase project shared with OpenSend (send.kovina.org) — all tables use `opensprout_` prefix
- Android OAuth requires `opensprout://auth/callback` and `https://sprout.kovina.org/auth/complete` added to Supabase Redirect URLs
- Android APK built in CI has placeholder web assets (no static export) — functional for development only

## Build Commands

```bash
npm run dev                    # Dev server at localhost:9999
npm run build                  # Web production build
npm run typecheck              # TypeScript check (builds MCP first)
npm run lint                   # ESLint
npm run android:debug          # Debug APK
npm run android:release        # Both signed AAB + APK
npm run -w @opensprout/mcp test # MCP tests
bash scripts/release.sh        # Full release automation
bash scripts/release.sh --check-only  # Checks only, no build
```

## MCP Server

Located at `apps/mcp/`. Exposes 28 tools for AI agents. Test suite: 112 tests.

**Two transports:**
- **Local stdio:** `OPENSPROUT_ACCESS_TOKEN` env var, run `tsx src/index.ts`
- **Remote HTTP:** `https://sprout.kovina.org/api/mcp` + Bearer token

**Architecture:**
- SHA-256 token hash lookup (never stores raw tokens)
- Service-role Supabase client (bypasses RLS — all queries filter by `user_id`)
- Centralized `register-tools.ts` shared by both transports
- 7 tool modules: plants, species, care, journal, knowledge, identify, export
- Token CRUD at `api/mcp/tokens/` (POST create, GET list, DELETE revoke)

## Rules

1. **Privacy-first.** Minimize data collection. No analytics or tracking.
2. **Calm UX.** Plant care should reduce stress, not add urgency.
3. **User-owned data.** Exportable, deletable, never sold.
4. **Open source.** AGPLv3. Source on GitHub.
5. **RLS + app-level isolation.** Supabase RLS enabled on all tables; MCP server adds explicit `user_id` filters since it uses the service role.
6. **Soft deletes.** Deleted records set `deleted_at` — always filter with `.is("deleted_at", null)`.
7. **Explain recommendations.** Every insight/recommendation includes a `reason` and `dataSource`. Never invent without supporting data.
8. **Name-spaced table names.** All OpenSprout Supabase tables use the `opensprout_` prefix (e.g., `opensprout_plants`). Always use the full prefixed name in `.from()` calls, type definitions, and SQL queries.

## Ecosystem Standards

All ecosystem repos follow: https://github.com/sparshsam/ecosystem-standards

## Design Language

- Editorial, plant-first, premium indie product
- Primary green: hsl(155, 68%, 28%) / hsl(155, 52%, 44%) dark
- No SaaS dashboard feel — no metric cards, no card grids
- Hierarchy via typography and spacing, not borders
- Buttons are pills (rounded-full)
- Hero text: `text-hero` utility (clamp 2.5-4.5rem, font-black)
- Display text: `text-display` utility (clamp 1.75-2.25rem, font-bold)
- Page transitions: `animate-page-in` (fadeIn 0.35s ease-out)
- Focus indicator: global `*:focus-visible` ring (2px bg + 4px theme ring)
- Header icons: generated PNG (opensprout-icon-header.png / -dark.png) with dual-image `dark:opacity-0/100` CSS transition; lucide-react for functional/UI icons
