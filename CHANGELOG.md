# Changelog

All notable changes to OpenSprout will be documented here.

## Unreleased

- No unreleased changes. All v0.4 work is released.

## 0.4.0 - 2026-06-18

- Added private plant photo support with Supabase Storage (private bucket, signed URLs).
- Added Android camera/gallery capture via Capacitor Camera plugin.
- Added web file picker for photo upload.
- Added journal entry CRUD (create, edit, delete) with title, body, health score, tags, and optional photo attachments.
- Upgraded plant timeline to combine care logs, journal entries, and photos chronologically.
- Upgraded Journal screen with cross-plant feed and plant/type filters.
- Added plant cover photos with thumbnail display in cards, detail view, and timeline.
- Added Capacitor Android platform (standalone APK/AAB builds).
- Added mobile-first responsive navigation (bottom nav on mobile, sidebar on desktop).
- Added secure Content-Security-Policy (CSP) headers including Supabase Storage image sources.
- Improved app context/auth layer with shared session management.
- Removed server API routes (fully client-side Supabase pattern).
- Updated README, architecture docs, mobile roadmap, and Android build guide.

## 0.1.0 - 2026-05-29

- Added public Vercel deployment at `https://opensprout.vercel.app`.
- Added Supabase Auth-backed dashboard.
- Added persisted plant create, edit, and delete flows.
- Added Care Templates with 30 built-in plant species.
- Added watering and fertilizing schedules from user inputs/templates.
- Added care logs for marking plants watered or fertilized.
- Added JSON export foundation.
- Added AGPLv3 license, security policy, CI workflow, and basic security headers.
- Added monorepo Vercel deployment configuration.
