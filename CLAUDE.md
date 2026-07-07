# OpenSprout v1.0.0

**Stack:** Next.js 15 (App Router) · Supabase · Tailwind CSS v4 · Sora font · PWA  
**Deploy:** https://sprout.kovina.org  
**Source:** github.com/sparshsam/opensprout  
**License:** AGPLv3

## Quick Start

```bash
npm install
npm run dev            # apps/web dev server at localhost:9999
npm run build          # Web production build
npm run typecheck      # TypeScript check
npm run test:mcp       # MCP server tests (112 tests)
npm run android:debug  # Debug APK
npm run android:release # Signed AAB + APK
```

## Project Layout

```
apps/web/              # Next.js app + PWA
  ├── src/app/
  │   ├── page.tsx           # Public homepage
  │   ├── login/             # Google OAuth sign-in (platform-aware: web/PWA/Android)
  │   ├── auth/callback/     # OAuth PKCE callback route handler (server-side)
  │   ├── auth/complete/     # PWA popup landing page ("return to app" message)
  │   ├── api/mcp/           # MCP HTTP endpoint + token CRUD
  │   ├── debug/             # Diagnostics page (Capacitor/platform debugging)
  │   ├── (authenticated)/   # App pages
  │   │   ├── today/         # Dashboard — Today's Care, insights, tasks
  │   │   ├── plants/        # Plant collection with filters/sort/groups
  │   │   ├── plants/[id]/   # Plant detail — gallery, schedules, doctor, timeline
  │   │   ├── identify/      # Photo identification via PlantNet
  │   │   ├── journal/       # Care log + journal entry feed
  │   │   ├── calendar/      # Monthly task calendar
  │   │   ├── explore/       # Species library browser
  │   │   ├── profile/       # User profile
  │   │   └── settings/      # Settings (notifications, data, integrations)
  │   ├── about/             # About page
  │   ├── privacy/           # Privacy policy
  │   ├── terms/             # Terms of service
  │   ├── mcp/               # AI Access guide
  │   └── globals.css        # Design tokens, animations, a11y
  ├── public/
  │   ├── sw.js              # Service worker (v0.9.27)
  │   ├── manifest.webmanifest  # PWA manifest
  │   └── pwabuilder.json    # PWABuilder manifest
  └── src/
      ├── components/
      │   ├── care/          # CadencePicker, ScheduleCard, ApplyCarePlanSheet, ScheduleEditSheet
      │   ├── doctor/        # PlantDoctorSheet
      │   ├── gallery/       # PhotoGallery
      │   ├── insights/      # InsightCards
      │   ├── onboarding/    # WelcomeWizard
      │   ├── cards/         # PhotoPicker, CoverPhoto
      │   ├── sheets/        # BottomSheet
      │   ├── shell/         # TopBar, BottomNav, sidebar
      │   ├── ui/            # Button, Input, Skeleton
      │   └── oauth-deeplink-handler.tsx  # Capacitor appUrlOpen listener (global)
      ├── lib/
      │   ├── context/       # AppProvider, ThemeProvider
      │   └── data/          # Data layer (plants, care, tasks, reminders, insights, platform, etc.)

apps/mcp/              # MCP server (28 tools, 112 tests)
  ├── src/
  │   ├── index.ts           # Stdio entry point
  │   ├── vercel-handler.ts  # Streamable HTTP transport
  │   ├── register-tools.ts  # Centralized tool registration
  │   ├── supabase.ts        # Auth (SHA-256 token) + client factory
  │   ├── tools/             # 7 tool modules (plants, care, journal, etc.)
  │   └── __tests__/         # auth.test.ts + tools.test.ts

scripts/               # bump-version.mjs, release.sh, package-windows.ps1, generate-store-screenshots.mjs
supabase/migrations/   # Database migrations (shared project)
```

## Key Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Dev server at localhost:9999 |
| `npm run build` | Web production build |
| `npm run typecheck` | TypeScript check (builds MCP first) |
| `npm run lint` | ESLint |
| `npm run -w @opensprout/mcp test` | MCP tests (112) |
| `bash scripts/release.sh` | Full release automation (check → build → sign) |
| `bash scripts/release.sh --check-only` | Run all checks without building |

## Design Conventions

- **Premium editorial** — no card grids, no metric dashboards, no SaaS feel
- **Warm paper light mode**, deep botanical dark mode
- **Sora variable font** — weights 300-800, utility classes: `text-hero`, `text-display`, `text-label`
- **Primary green:** hsl(155, 68%, 28%) / dark: hsl(155, 52%, 44%)
- **Buttons:** pills (`rounded-full`), `px-7 py-3.5 text-sm font-semibold`
- **Borders:** ultra-subtle (`border-border/40`), hierarchy via spacing not boxes
- **Icons:** Headers use generated PNG icons (opensprout-icon-header.png / -dark.png) with `dark:opacity-0/100` CSS transition; app icons from 1024×1024 Lanczos-generated masters; lucide-react for functional/UI icons
- **Theme:** CSS variables in globals.css, `.dark` class via ThemeProvider

## Brand Architecture

### Ecosystem Hierarchy

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
- Icons are generated from 1024×1024 light + dark masters via Lanczos resampling: 210 assets across Windows ICO, MSIX store assets, Android mipmaps, iOS, macOS, Web/PWA favicons, social OG, GitHub, and header icons. Dark mode variant (opensprout-icon-header-dark.png) available as a 114-asset dark subset.
- Dark/light themed headers use dual `<img>` elements with `dark:opacity-0`/`dark:opacity-100` CSS transitions — each theme shows its own icon and hides the other.
- The header lockup uses actual generated PNG icon (not lucide Sprout) in `public-nav.tsx` and `app-shell.tsx`.
- Lockup styling matches OpenPalette canonical spec: icon 28/32px, OPEN tracking 0.06em opacity-50, product font-medium -mt-0.5, leading-tight.
- OpenPalette is the canonical reference implementation for the Open Product Family branding.
- See `apps/web/docs/BRANDING.md` for complete product-specific branding documentation.

## Auth

- **Provider:** Google OAuth only (email/password disabled)
- **Supabase Auth** with PKCE flow
- **Callback:** `/auth/callback` exchanges code server-side via `createServerClient` + `exchangeCodeForSession()` (critical — without this the redirect drops the `code` param causing a sign-in loop)
- **Session:** Auto-refreshed via `@supabase/ssr`
- **CSP:** Security headers disabled in dev mode (Next.js HMR needs `'unsafe-eval'`); production Vercel builds get strict headers
- **Platform awareness:** Web + PWA only. Capacitor native (Android) archived at `archive/`.

## MCP Server

Located at `apps/mcp/`. 28 tools across 7 domains.
Two transport modes:
- **Local stdio:** `OPENSPROUT_ACCESS_TOKEN` env var
- **Remote HTTP:** `https://sprout.kovina.org/api/mcp` + Bearer token

Architecture follows the MCP Build Guide: SHA-256 token auth, centralized registration, Streamable HTTP, user-scoped service-role client, token CRUD API routes.

## Database

- **Shared Supabase project:** `rbdyrymtgfqqkdemicdo` — shared with OpenSend (file sharing app)
- **Name-spacing:** All OpenSprout tables use the `opensprout_` prefix (e.g., `opensprout_plants`, `opensprout_care_schedules`). OpenSend uses `opensend_`. All RLS policies, triggers, and FK references follow the same prefix convention.
- **Migrations:** `supabase/migrations/` contains all DDL history. The `20260628000000_prefix_opensprout_tables.sql` migration renamed all tables from un-prefixed to `opensprout_` prefixed.
- **All `supabase.from()` calls** in TypeScript code use the `opensprout_` table names. TypeScript types in `types.ts` and `mcp/src/types.ts` use `opensprout_` as the Database table keys.

## Release History

- **v1.0.0** (Jul 7) — **Stable release — Web + PWA.** Android/Capacitor archived, 8 Capacitor packages removed, 13 source files cleaned, footer redesigned, feature grid, KOVINA wordmark, GeneratedAssets committed.
- **v0.9.27** (Jul 3) — Open Product Family branding alignment + Vercel deployment. Header lockups standardized to `[icon] OPEN / Sprout` stacked layout in all three header components (public-nav, shell/top-bar, app-shell). Icons generated from 1024x1024 light + dark masters via Lanczos resampling: 210 assets across Windows ICO, MSIX, Android mipmaps, iOS, macOS, Web/PWA favicons, social OG, GitHub, and header icons. 114 dark mode variant assets generated (including opensprout-icon-header-dark.png). All three header locations use dual-image wrap with `dark:opacity-0`/`dark:opacity-100` CSS transitions for dark/light theming. Generated PNG icons replace the lucide Sprout icon in public-nav.tsx and app-shell.tsx. Lockup styling aligned to OpenPalette canonical spec. Brand hierarchy documented in `apps/web/docs/BRANDING.md`. Build fixes: added eslint-disable comments for `<img>` tags (blocking Vercel build), added missing `import Link from "next/link"` to app-shell.tsx, added root `public/` directory with hard copies for Vercel static file serving. Docs/BRANDING.md created. OpenPalette canonical spec alignment. Vercel deploy live at sprout.kovina.org.
- **v0.9.26** (Jun 28) — CI stabilization + database namespacing. Android CI now builds with Java 21 (fixes AGP 8.13 compile error) and uses normal `next build` (not static export) — all `force-static`/`generateStaticParams` route hacks reverted. All 14 OpenSprout tables renamed to `opensprout_` prefix for shared Supabase project namespacing. Code references, type definitions, MCP tools, and tests updated.
- **v0.9.26** (Jun 28) — Native Google Sign-In + Android Fixes. In-app Chrome Custom Tab for Android, browser-popup login for Windows/PWA, platform-aware sign-in dispatch, API routing for Capacitor static export, adaptive icon fix, white flash fix, debug diagnostics page.
- **v0.9.25** (Jun 28) — Release Candidate Stabilization. Lint/typecheck/test/build clean, schema verification, build validation, changelog backfill.
- **v0.9.24** (Jun 28) — Platform completion. Android versionCode 4, cleartext disabled in production, PWABuilder manifest, store screenshots generator, release automation script, CI with Android build job.
- **v0.9.23** (Jun 28) — UX polish. Welcome wizard onboarding, skeleton loading for calendar/explore, page fade-in animation, skip-to-content + focus-visible rings + aria-live accessibility, restructured settings with Danger Zone.
- **v0.9.22** (Jun 28) — Plant organization. Favorites (`is_favorite` column), archive/restore UI, group by room/location, health/location/favorites filter panel, sort by name/date/health/species, grid/list view toggle, collection stats.
- **v0.9.21** (Jun 28) — Notifications. Wired `rescheduleAllReminders` into dashboard refresh, web Notification API fallback, missed reminder summary, 15-min background refresh, quiet hours, Android notification reliability.
- **v0.9.20** (Jun 28) — Smart care insights. Missed care detection, care streaks, last-watered indicators, seasonal tips, health reminders with expandable "Why?" reasoning, dashboard insight cards.
- **v0.9.19** (Jun 28) — Diagnosis & health. Plant Doctor symptom-based diagnosis from the species care library, severity indicators, cause + solution display, never overwrites user health.
- **v0.9.18** (Jun 28) — Plant detail completion. Photo gallery (multiple photos, nav, thumbs, upload/delete), species info panel with knowledge articles, care/health history tabs, inline notes editing, two-column desktop layout.
- **v0.9.17** (Jun 28) — Dashboard intelligence. Rebuilt around "Today's Care" — overdue/today/upcoming sections, "Nothing due today" state, contextual next actions, per-plant care summaries, stats demoted.
- **v0.9.16** (Jun 28) — Care engine foundation. Species care presets, Apply Care Plan BottomSheet, guided schedule creation with CadencePicker, user-friendly cadence pills, schedule edit/pause/delete.
- **v0.9.15** (Jun 27) — Product truth overhaul, plant detail route, cover photo upload, dark mode sweep, profile redesign, PWA persistence.
- **v0.9.14** (Jun 25) — Production signing, PWA hardening, MCP architecture, Google OAuth, domain migration.
- **v0.9.0–v0.9.13** — Foundation layers: brand identity, UI, MCP server, knowledge base, RC packaging.

## Design System Components

- **CadencePicker** — Pill-based frequency selector (Daily → Yearly) with custom input
- **ApplyCarePlanSheet** — Post-creation care plan setup with species presets and toggles
- **ScheduleCard / ScheduleEditSheet** — Schedule management (edit cadence, pause, delete)
- **PhotoGallery** — Multi-photo gallery with nav arrows, thumbnail strip, inline upload/delete
- **PlantDoctorSheet** — Symptom-based diagnosis from species knowledge library
- **InsightCards** — Data-driven insight display with expandable reasoning
- **WelcomeWizard** — First-run onboarding tour (4-step, localStorage-gated)
- **PhotoPicker** — Camera + gallery capture with `capture="environment"` for mobile
- **OAuthDeepLinkHandler** — Global Capacitor deep-link listener for OAuth callback, mounted in root layout
- **DebugInfo** — Diagnostics widget for APK debugging (origin, session, platform detection)

## Privacy & Legal (Kovina Standard)

OpenSprout follows the Kovina Privacy & Terms Standard.
- **License:** AGPL-3.0-or-later — full text at `LICENSE` in repo root and at https://github.com/sparshsam/opensprout/blob/main/LICENSE
- **Advice disclaimer:** "No Medical or Gardening Advice" — OpenSprout is a tool for tracking plant care schedules and observations. It does not provide medical, veterinary, or professional gardening advice. Consult qualified professionals for specific guidance.
- **Cloud / Backup:** Supabase (auth, PostgreSQL database, file storage for plant photos). PlantNet API for optional plant identification (photo only).
- **Hosting:** Vercel (apps/web) — privacy: https://vercel.com/legal/privacy
- **Backup provider privacy:** https://supabase.com/privacy
- **Privacy policy:** `/privacy` — covers local-first data model, optional cloud features, data collection, third-party services, deletion, export
- **Terms of service:** `/terms` — covers acceptance, AGPL-3.0 license, advice disclaimer, warranty disclaimer, data responsibility, service availability, user conduct

## App Identity

OpenSprout is a privacy-first, open-source plant care companion. Track, identify, and care for your plants. No subscriptions. User-owned data. AI-agent ready via MCP.
