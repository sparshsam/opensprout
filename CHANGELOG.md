# Changelog

All notable changes to OpenSprout will be documented here. The format follows [Keep a Changelog](https://keepachangelog.com/). OpenSprout uses [Semantic Versioning](https://semver.org/).

## Unreleased

- No unreleased changes.

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
