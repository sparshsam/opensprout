# Changelog

All notable changes to OpenSprout will be documented here. The format follows [Keep a Changelog](https://keepachangelog.com/). OpenSprout uses [Semantic Versioning](https://semver.org/).

## 0.9.26 — 2026-06-28

### Added
- **Native Google Sign-In for Android** — in-app Chrome Custom Tab via @capacitor/browser with skipBrowserRedirect and opensprout://auth/callback custom scheme.
- **Browser-launch login for Windows/PWA** — system browser popup via window.open(), /auth/complete page shows "return to app" message, postMessage to opener.
- **Platform-aware sign-in dispatch** in login page — detects web / Capacitor native / PWA.
- **OAuth deep-link handler** — global Capacitor appUrlOpen listener for OAuth callback.
- **API routing utility** (lib/data/platform.ts) — resolveApiUrl() prepends production origin in Capacitor WebView.
- **Debug diagnostics** at /debug — origin, Capacitor, session status, API URLs.

### Fixed
- **Android adaptive icons** — ic_launcher_background changed from #FFFFFF to #16784f (brand green).
- **White screen flash** — added android:windowBackground to AppTheme.NoActionBar.

### Changed
- @capacitor/browser@8.0.3 installed and synced.
- Version bumped to 0.9.26 (versionCode 6).

## 0.9.25 — 2026-06-28

### Added
- **Release Candidate Stabilization** — full quality pass for v0.9.25 RC.

### Changed
- Fixed 4 ESLint `react/no-unescaped-entities` errors in care sheets and plant doctor.
- Cleaned up 30+ unused import/variable declarations across the web app.
- Version bumped to 0.9.25 (versionCode 5).

### Technical
- All quality checks pass: lint (0 errors), TypeScript (clean), Next.js build (clean), MCP tests (112/112), release script check-only mode.
- Supabase migration ordering verified (9 migrations, ordered by timestamp).
- `is_favorite` column verified in migration `20260627000000_add_favorites.sql`.
- `journal_photos` table verified with full schema (object_path, content_type, sort_order, client_id, sync fields).
- `diagnosis_entries` table verified with RLS (readable by anon + authenticated).
- `identifications` table verified with RLS (user-scoped).
- `knowledge_articles` table verified with RLS (readable by anon + authenticated).
- RLS policies verified on all tables — every user-scoped table has `auth.uid() = user_id`.
- MCP server builds and passes all 112 tests after app changes.
- Release script validated in `--check-only` mode — no destructive side effects.
- PWA manifest verified (icons, screenshots, edge_side_panel, launch_handler, categories).
- Service worker verified (CACHE_NAME v0.9.24, network-first strategy).

## 0.9.24 — 2026-06-28

### Added
- **Android versionCode 4**, versionName 0.9.24. Cleartext disabled in production (enabled via `CAPACITOR_CLEARTEXT=true`).
- **PWABuilder manifest** (`public/pwabuilder.json`) — full metadata, screenshots, edge_side_panel, categories.
- **Store screenshots generator** — `scripts/generate-store-screenshots.mjs` using Puppeteer for Play + Microsoft.
- **Release automation** — `scripts/release.sh` version bump → lint → typecheck → MCP → web → Android. Supports `--check-only`, `--android-only`, explicit version args.
- **CI Android build** — static export → Capacitor sync → `assembleDebug` → artifact upload. Runs on `main` pushes and `v*` tags.

### Changed
- `manifest.webmanifest` updated with categories, launch_handler, screenshots.

## 0.9.23 — 2026-06-28

### Added
- **Onboarding** — WelcomeWizard 4-step tour (Welcome → Add → Plan → Track), localStorage-gated.
- **Loading states** — skeleton squares for Calendar, skeleton cards for Explore.
- **Page fade-in animation** — `@keyframes fadeIn` + `@utility animate-page-in` in globals.css.
- **Skip-to-content link** in layout for keyboard users.
- **`aria-live="polite"`** region for dynamic announcements.
- **Global focus-visible ring** — 2px + 4px theme ring on all interactive elements.

### Changed
- Settings restructured: Profile, Notifications, Integrations, Data, Danger Zone, About. Danger Zone visually separated with red tint.
- Consistent `rounded-2xl border-border/50` cards across settings.

## 0.9.22 — 2026-06-28

### Added
- **Favorites** — `is_favorite` column, star button on cards, Favorites filter toggle, favorites sorted first.
- **Archive/Restore UI** — archive button on cards, Archived filter toggle, restore button, visual de-emphasis.
- **Search & Filters** — search by name/species/location/health/cultivar, filter panel with health/location chips, favorites/archived toggles.
- **View modes** — grid/list toggle with pill UI, compact list rows with inline actions.
- **Collection stats** — total + favorites + archived counts, health distribution dots.

### Changed
- `sortAndFilterPlants()` — pure function, no DB calls. Sort by Name/Date/Updated/Health/Species.

## 0.9.21 — 2026-06-28

### Added
- **End-to-end notifications** — `rescheduleAllReminders()` called from dashboard refresh.
- **Web Notification API fallback** — `scheduleWebNotification()` for PWA/desktop via setTimeout.
- **Missed reminder summary** — `showMissedReminders()` on app load, deduplicated via sessionStorage.
- **Background refresh** — 15-minute `setInterval` re-checking tasks + rescheduling.
- **Quiet hours** — handles same-day and midnight-spanning ranges, shifted/ skipped if during quiet hours.
- **Android reliability** — Capacitor local notifications with `allowWhileIdle: true`, proper channel ID, small icon.

### Changed
- Lead time options expanded (5 min → 1 day). Platform behavior notes in settings info box.

## 0.9.20 — 2026-06-28

### Added
- **Smart insights data layer** (`lib/data/insights.ts`) — `detectMissedCare()`, `computeCareStreaks()`, `getLastWatered()`, `getSeasonalTips()`, `buildDashboardInsights()`.
- **Dashboard InsightCards** — missed care alerts, streak celebrations, health reminders, seasonal tips.
- **Expandable "Why?" detail** on every insight showing exact data source.

### Changed
- Insights never invent recommendations without supporting data — every card has `reason` + `dataSource`.

## 0.9.19 — 2026-06-28

### Added
- **PlantDoctorSheet** — 3-step diagnosis flow: Welcome → Select symptoms → Result.
- **Symptom-based diagnosis** from species care library (`diagnosis_entries` table).
- **Severity indicators** (severe/moderate/minor), full cause + solution display.
- Entry point button on plant detail (species required).

### Fixed
- Diagnosis is purely informational — never overwrites user health status.

## 0.9.18 — 2026-06-28

### Added
- **PhotoGallery** component — multiple photos per plant, nav arrows + thumbnail strip.
- **Inline photo upload/delete** with confirmation dialog.
- **Two-column desktop layout** — `lg:grid-cols-5` split for photos + info.
- **Species Info panel** — collapsible with knowledge articles as `<details>`.
- **Timeline** — care/health tab switcher with proper icons, amounts, timestamps.
- **Inline notes editing** — tap to edit with Save/Cancel, dashed "Add notes" empty state.

## 0.9.17 — 2026-06-28

### Changed
- **Dashboard rebuilt** around "Today's Care" — overdue/today/upcoming sections.
- "Nothing due today" celebratory state with Browse Plants / Journal links.
- Contextual next action based on current state.
- Stats demoted below tasks. Plant care summaries per plant.
- `handleMarkCare()` handles all 8 care types with correct verb labels.

## 0.9.16 — 2026-06-28

### Added
- **Species care presets** — `resolveSpeciesPresets()` merges species knowledge with defaults.
- **ApplyCarePlanSheet** — post-creation BottomSheet with 8 care types and toggles.
- **CadencePicker** — 12 preset cadences (Daily → Yearly) + custom input.
- **ScheduleCard/ScheduleEditSheet** — schedule management (edit cadence, pause, delete).

### Changed
- `createPlant()` no longer auto-creates water/fertilize schedules.
- Raw numeric interval inputs removed from plant form.
- Pause sets `active: false` (stops task generation without deleting).

## 0.9.15 — 2026-06-27

### Added
- **Product truth overhaul** — honest defaults, cover photo upload, basic tracker mode.
- **Plant detail route** — full detail with photos, schedules, timeline.
- **Cover photo upload** — `CoverPhoto` component.
- **Dark mode sweep** — journal, calendar, explore, settings, buttons, health bar.
- **Profile redesign** — redesigned layout with auth info.
- **PWA persistence** — dismiss button persisted.

### Fixed
- Auth loop fix, CSP dev-mode fix, platform-aware AuthGate.
- Google sign-in dark mode, CORS HEAD check, CSP vercel.live.
- Supabase connectivity check CORS.

## 0.9.14 — 2026-06-25

### Added
- **Production Android signing** — release keystore generated (RSA 2048, 10,000 days), Gradle signing config wired via gitignored `keystore.properties`.
- **Signed release builds** — `android:release:bundle` (signed AAB, 4.3 MB) and `android:release:apk` (signed APK, 3.8 MB via R8 minification).
- **Bundle optimization** — `minifyEnabled true`, `shrinkResources true`, Capacitor-safe ProGuard rules. APK reduced 52% (7.9 → 3.8 MB).
- **Release version automation** — `scripts/bump-version.mjs` bumps versionCode + versionName across `build.gradle`, `apps/web/package.json`, and root `package.json`.
- **PWA install prompt** — new `PwaInstall` component with `beforeinstallprompt` handler for cross-browser install UX.
- **App update detection** — new `AppUpdate` component with service worker `updatefound` + `controllerchange` listener.
- **Notification icon** — `ic_stat_sprout.xml` vector drawable for Android notification bar icon (was missing).
- **Service worker improvements** — removed broken icon.svg ref, origin-based cache filter, proper cache versioning, `SKIP_WAITING` message handler.
- **Manifest enhancements** — added `scope`, `display_override`, `orientation`, `lang` fields.
- **Sync reliability** — exponential backoff retry (30s→8m), max 5 retry limit, `user_id` guard on UPDATE/DELETE push operations, user-scoped guard on import `client_id` lookup.
- **Play Store readiness** — `docs/data-safety.md` with full data collection disclosure, `docs/store-listing.md` updated with assets checklist.
- **Windows packaging guide** — `docs/windows-packaging-guide.md` covering PWABuilder and manual MSIX generation.
- **Microsoft Store prep** — `docs/microsoft-store-submission.md` with full submission checklist.
- **Secret rotation documentation** — `docs/secret-rotation.md` with rotation procedures for all credentials.
- **Documentation** — `docs/faq.md`, `docs/troubleshooting.md`, `docs/offline-behavior.md`, `docs/v1-migration.md`.
- **Accessibility fixes** — `aria-required="true"` on login form inputs, `focus-visible:ring-2` verified on all interactive elements.

### Changed
- `capacitor.config.ts` — `launchAutoHide` set to `true` (was `false`, causing splash screen to hang).
- `apps/web/android/app/build.gradle` — added signing config, minification, resource shrinking.
- `apps/web/package.json` — added `android:release:apk` and composite `android:release` scripts.
- `CLAUDE.md` — updated to v0.9.14.
- `versionName` to `0.9.14`, `versionCode` to `3`.

### Security
- Added `user_id` filter to sync UPDATE/DELETE push operations (defense-in-depth).
- Added `user_id` filter to import client_id lookup.
- Created comprehensive secret rotation documentation.
- All Supabase RLS policies verified — every table has `auth.uid() = user_id` guard.

## 0.9.13 — 2026-06-23

### Added
- `docs/release-candidate-test-matrix.md` — comprehensive cross-platform test matrix covering web, Android, and Windows PWA across all features.
- `docs/android-rc-checklist.md` — Android release-candidate checklist with build commands, signing status, permissions, device test plan, and Play Store readiness.
- `docs/windows-rc-checklist.md` — Windows PWA install/test checklist with browser support, offline behavior, and Microsoft Store packaging notes.

### Changed
- `versionName` updated to `0.9.13` in Android `app/build.gradle`; `versionCode` incremented to `2`.
- Root `package.json` — added `android:sync`, `android:open`, `build:mobile`, `rc:android`, `rc:web` scripts.
- `docs/project-status.md` — updated to v0.9.13 as current release.
- `mempalace.yaml` — updated version references to v0.9.13.

### Technical
- Verified Capacitor v8.4.0 Android project at `apps/web/android/` — configured for API 24-36.
- Verified adaptive icons (vector XML), splash screens (all densities), and deep link scheme (`opensprout://`).
- Validated PWA manifest, service worker, and installability.
- 112 MCP tests passing; web lint, typecheck, and build clean.

## 0.9.12 — 2026-06-22

### Added
- **Public homepage at `/`** — editorial launch surface with hero, 7 feature sections, trust section, and CTA.
- **Public navigation** — sticky header with Home, About, Privacy, Terms, GitHub, and Sign in links. Theme toggle included. Mobile-responsive with bottom nav strip.
- **Public footer** — brand tagline, links, and AGPLv3 license notice across all public pages.
- **Auth-aware routing** — signed-in users are redirected to `/today`; signed-out users see the public homepage.
- `components/public-nav.tsx` — shared public navigation component.
- `components/public-footer.tsx` — shared public footer component.
- `components/auth-gate.tsx` — client-side auth detection for public/authenticated routing.

### Changed
- `/about`, `/privacy`, `/terms` — updated with public navigation and footer for visual consistency.
- Updated `<Link>` targets from `← OpenSprout` to `← Home` for clarity.
- `/` no longer redirects to `/today` — public homepage is served for unauthenticated visitors.

### Removed
- Removed bare redirect from `page.tsx` component (replaced by auth-aware routing).

## 0.9.11 — 2026-06-22

### Added
- **18 knowledge articles** for 10 popular houseplants: Monstera deliciosa, Pothos, Snake Plant, ZZ Plant, Peace Lily, Rubber Plant, Fiddle Leaf Fig, Philodendron, Aloe Vera, Spider Plant.
- **4 general articles**: Beginner Houseplant Care Checklist, Understanding Light Levels, Watering 101, Common Houseplant Pests.
- **15 new diagnosis entries** covering: sunburn (2), low humidity (2), nutrient deficiency — chlorosis, slow growth, nitrogen deficiency (3), overwatering — moderate + severe (2), underwatering — minor + moderate (2), pest damage — general, scale, aphids, thrips (4).
- `supabase/migrations/20260622000000_seed_knowledge_diagnosis.sql` — comprehensive seed data migration.

### Changed
- `search_knowledge()` now returns useful content for common queries (monstera, yellow leaves, watering, pests).
- `diagnose_plant()` now returns useful diagnoses for all 10 requested symptoms.
- `docs/v0.9.11-plan.md` updated with completed checklist.
- `docs/project-status.md` updated to reflect v0.9.11 as current release.

## 0.9.10 — 2026-06-22

### Added
- 9 new MCP tools: `add_plant`, `delete_plant`, `archive_plant`, `restore_plant`, `create_care_schedule`, `skip_task`, `snooze_task`, `update_journal_entry`, `delete_journal_entry`.
- `docs/mcp-reliability-audit.md` — step-by-step reliability audit guide for AI agents.
- `docs/mcp-agent-prompts.md` — ready-to-use natural-language prompt pack for common plant care workflows.
- MCP architecture diagram to `docs/architecture.md` — shows AI agent ↔ MCP integration.

### Changed
- **User data isolation**: All MCP read tools now filter by `user_id` — critical fix that prevents cross-user data access via the service-role client.
- **Ownership enforcement**: All MCP write tools now verify the user owns the target resource before acting.
- **Error messages**: All MCP tools now return descriptive, actionable error messages instead of generic `throw error`.
- **Auth errors**: Differentiated "invalid token" from "revoked token" with clear resolution instructions.
- **Tool descriptions**: All 25 tool descriptions rewritten for natural-language agent understanding with realistic parameter descriptions.
- MCP server name/version: `opensprout` v0.1.0 (app version: 0.9.10).

### Fixed
- `list_plants` was missing `user_id` filter — any valid PAT could read every user's plants. Fixed.
- Auth token validation now properly differentiates between tokens that never existed and tokens that were revoked.
- Generic `throw error` replaced with contextual error messages across all tool files.

### Security
- MCP server now enforces user data isolation on every read and write query.
- Token validation rejects revoked tokens with a specific error message.

## 0.9.3 — 2026-06-21

### Changed
- Complete UI overhaul from admin dashboard to mobile-first plant care companion.
- Simplified navigation to 4 items: Home, Plants, Identify, Profile.
- Calendar, Journal, and Explore hidden from navigation (deferred until functional).
- Home page (formerly Today) with greeting header and simplified metrics.
- New Profile page consolidating account, reminders, data/privacy, AI agent access, about.
- Export/import moved into Profile → Data & privacy section.
- Large rounded cards (24px radius), elevation over borders.
- Green brand icon as primary visual accent throughout.
- Sentence case for all labels.
- Mobile-first layout constrained to max-w-2xl on desktop.
- Warm illustrated empty states with primary CTAs.

### Removed
- All technical language from primary UI (Supabase, JSON, sync, backup, RLS).
- "Your plants. Your data." replaced with "Plant care companion".
- Export/import from page headers.
- Backup metrics and sync status from dashboard.
- Old AppShell component (dead code, never imported).

## 0.9.2 — 2026-06-21

### Added
- Privacy Policy at `/privacy` and `docs/privacy-policy.md`.
- Terms of Service at `/terms` and `docs/terms-of-service.md`.
- Support page at `/support` with contact info and FAQ.
- Account deletion button in Settings (calls `delete_account` RPC).
- `supabase/migrations/20260621000001_delete_account.sql` — RPC function to delete all user data.
- `docs/store-listing.md` — Google Play store metadata (short description, full description, keywords, feature bullets, category).
- `docs/versioning-strategy.md` — Semantic versioning policy, release process, branch strategy, changelog workflow.
- `docs/data-deletion.md` — Complete account and data deletion workflow documentation.
- `docs/permissions-audit.md` — Full permissions inventory (web, Android, iOS future), rationale, and security boundaries.
- `docs/age-rating.md` — Age rating questionnaire responses for Google Play, Apple App Store, and Microsoft Store.
- `docs/release-checklist.md` — Comprehensive pre/post release verification checklist.
- Support links in Settings (Privacy Policy, Terms of Service, Support).
- Permissions rationale documentation for camera, notifications, and storage.
- Data retention policy documentation.

### Changed
- Settings "About" section now displays correct version (0.9.2) with links to legal docs and support.

### Security
- Account deletion flow implemented end-to-end with data wipe RPC function.

## 0.9.1 — 2026-06-21

### Added
- Branded OpenSprout icon pipeline: `scripts/generate-icons.mjs` generates all icon sizes deterministically from a single source.
- Web favicons (16, 32), app icons (48, 64, 128, 192, 512), Android launcher icons (all mipmap densities), adaptive icon foregrounds, and splash screens (all orientations/densities).
- Database namespace audit: `docs/database-namespace-audit.md` with full inventory of all 14 tables, 4 custom enums, 7 triggers, 2 functions, 1 storage bucket, 1 Edge Function.
- SQL ownership comments on all tables, types, and functions (migration `20260621000000_namespace_comments.sql`).

### Changed
- PWA manifest updated with all icon sizes and proper purpose attributes.
- `layout.tsx` updated with favicon and apple touch icon references.
- Old SVG icon removed in favor of PNG pipeline.

## 0.4.0 — 2026-06-18

### Added
- Private plant photo support with Supabase Storage (private bucket, signed URLs).
- Android camera/gallery capture via Capacitor Camera plugin.
- Web file picker for photo upload.
- Journal entry CRUD (create, edit, delete) with title, body, health score, tags, and optional photo attachments.
- Plant timeline combining care logs, journal entries, and photos chronologically.
- Cross-plant Journal screen with plant/type filters.
- Plant cover photos with thumbnail display in cards, detail view, and timeline.
- Capacitor Android platform (standalone APK/AAB builds).
- Mobile-first responsive navigation (bottom nav on mobile, sidebar on desktop).
- Secure Content-Security-Policy (CSP) headers including Supabase Storage image sources.

### Changed
- Improved app context/auth layer with shared session management.
- Removed server API routes (fully client-side Supabase pattern).
- Updated README, architecture docs, mobile roadmap, and Android build guide.

## 0.1.0 — 2026-05-29

### Added
- Public Vercel deployment at `https://sprout.kovina.org`.
- Supabase Auth-backed dashboard.
- Persisted plant create, edit, and delete flows.
- Care Templates with 30 built-in plant species.
- Watering and fertilizing schedules from user inputs/templates.
- Care logs for marking plants watered or fertilized.
- JSON export foundation.
- AGPLv3 license, security policy, CI workflow, and basic security headers.
- Monorepo Vercel deployment configuration.
