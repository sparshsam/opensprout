# Changelog

All notable changes to OpenSprout will be documented here. The format follows [Keep a Changelog](https://keepachangelog.com/). OpenSprout uses [Semantic Versioning](https://semver.org/).

## Unreleased

- No unreleased changes.

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
- Public Vercel deployment at `https://opensprout.vercel.app`.
- Supabase Auth-backed dashboard.
- Persisted plant create, edit, and delete flows.
- Care Templates with 30 built-in plant species.
- Watering and fertilizing schedules from user inputs/templates.
- Care logs for marking plants watered or fertilized.
- JSON export foundation.
- AGPLv3 license, security policy, CI workflow, and basic security headers.
- Monorepo Vercel deployment configuration.
