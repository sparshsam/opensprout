# OpenSprout — AI Agent Instructions

## Current Release

**v0.9.15** — Product Truth Overhaul, Plant Detail Route, Dark Mode Sweep (2026-06-27)

## Product Identity

OpenSprout is a privacy-first, open-source plant care companion. Track watering, log care, identify plants via AI, journal growth, and diagnose problems — all with user-owned data. No subscriptions, no ads, no tracking.

**Tagline:** Track, identify, and care for your plants.

## Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS v4 + TypeScript
- **Backend:** Supabase (auth, PostgreSQL DB, file storage, edge functions)
- **Mobile:** Capacitor v8 Android (PWA for Windows/desktop)
- **AI:** MCP server at `apps/mcp/` — 28 tools, 112 tests
- **Auth:** Google OAuth (email/password disabled via Supabase)
- **Design:** Sora variable font, warm paper light mode, deep botanical dark mode
- **Hosting:** Vercel (web at sprout.kovina.org), Supabase (backend, shared project)

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
├── docs/                 # 35+ docs (see below)
├── scripts/              # bump-version.mjs, package-windows.ps1
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
| `/about` | About page |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/mcp` | MCP integration guide |
| `/api/mcp` | MCP Streamable HTTP endpoint |
| `/today` | Authenticated home dashboard |
| `/plants` | Plant collection |
| `/plants/[id]` | Plant detail (photo, health, care history, schedules, quick care) |
| `/identify` | Plant identification |
| `/profile` | Profile & settings |
| `/settings/mcp` | MCP token management |

## Key Changes in v0.9.15

### Product Truth Overhaul
- **No fake health:** `cleanHealthStatus()` returns `undefined` instead of `"stable"`. New plants start with no health assessment (shows "Not assessed").
- **No fake schedules:** `emptyForm` removed `water_every_days: 7` and `fertilize_every_days: 30`. Schedules only created when user explicitly sets cadence.
- **No fake stats:** Dashboard counts only real plants, real task instances, real care logs. Removed "Active schedules" and "Plant Health" sections.
- **Data cleanup migration:** `scripts/cleanup-default-data.sql` — review-first SQL to reset old default health_status and delete auto-created schedules for plants with no species_id.

### Auth Loop Fix (Critical)
- **Root cause:** `/auth/callback` used `NextResponse.redirect("/today")` without exchanging the PKCE auth code — the redirect stripped `?code=...` from the URL, so `detectSessionInUrl` never fired, causing an infinite sign-in loop.
- **Fix:** Server-side code exchange via `createServerClient` + `exchangeCodeForSession()`, writing session cookies onto the redirect response.

### CSP Dev-Mode Fix
- **Root cause:** `script-src 'self' 'unsafe-inline'` blocked `eval()` used by Next.js HMR — page hung on splash.
- **Fix:** Skip security headers in `NODE_ENV !== 'production'` (production Vercel builds get strict CSP).
- `.env.local` symlinked into `apps/web/` so npm workspaces resolves it.

### Platform-Aware AuthGate
- **Web browser:** Public homepage renders for everyone (signed in or out). Logo links to `/`. "Sign in" button checks session — if already authed, goes to `/today`.
- **Native app (Capacitor):** Detects `window.Capacitor.isNativePlatform()` — redirects to `/login` or `/today` (if session exists).
- All three nav components (TopBar, Sidebar, BottomNav) now label the home tab "Dashboard" instead of "Home".

### Plant Detail Route (`/plants/[id]`)
- New page created at `(authenticated)/plants/[id]/page.tsx`.
- Shows: photo (or "No photo yet"), name, species (or "Unknown species"), location, health (or "Not assessed"), care schedule (or "No care schedule yet"), care history (or "No care logged yet").
- "Basic tracker mode" badge when no species_id and no photo.
- Quick care buttons log real actions with toast confirmation.
- All plant cards in Dashboard and Plants grid link directly to `/plants/[id]`.

### Cover Photo Upload
- Optional cover photo upload in the Add Plant form.
- Uses existing `uploadPlantPhoto` + `setPlantCoverPhoto` pipeline.
- Photo preview with remove option before save.
- Plant creation succeeds even without photo.

### Plants Page Cleanup
- Removed inline detail panel (quick care, schedule, timeline) — plants page is now a grid only.
- Cards link directly to `/plants/[id]`.
- Removed unused `selectedId`, `onQuickCare`, `timeline` state.

### Dark Mode Sweep
- Comprehensive dark mode fix across all components:
  - `timeline-item.tsx`: careColors (8 types) and healthBar got `dark:bg-*-950 dark:border-*-800 dark:text-*-400` variants.
  - `bottom-sheet.tsx`, `task-card.tsx`, `journal-form.tsx`: added `dark:bg-muted`.
  - `button.tsx`: outline variant uses `dark:bg-background dark:hover:bg-muted` (visible hover).
  - `calendar/page.tsx`, `explore/page.tsx`, `settings/page.tsx`, `journal/page.tsx`: all bg-white → `dark:bg-muted`.
  - Red-tinted error/retry buttons: `dark:bg-muted dark:text-red-400 dark:hover:bg-red-900/30`.

### Theme Toggle Relocated
- Moved from floating fixed button (bottom-right) to TopBar header.
- Visible on all authenticated pages, both mobile and desktop.

### PWA Install Persistence
- Dismissal saved to `localStorage` (`opensprout-pwa-dismissed`).
- Once dismissed/installed, prompt never shows again on reloads.

### Profile Page Redesign
- Card-based layout with `SectionCard` component (icon header + content).
- Account section: full-width card with avatar, email, plant count, logout.
- Desktop: 2-column grid for settings cards.
- About section: 4-column inline grid on large screens.
- Consistent `rounded-2xl border bg-white dark:bg-muted` styling.

### Nav Labels
- "Home" → "Dashboard" in TopBar, Sidebar, BottomNav.
- OpenSprout logo links to `/` (public homepage) everywhere.

### Dev Server Port
- Dev server changed from port 3000 to 9999.

## Key Changes in v0.9.14

### Android Release Engineering
- Production keystore (RSA 2048, 10,000 days) at `apps/web/android/opensprout-release.keystore` (gitignored)
- Gradle signing config via `keystore.properties` (600 perms, gitignored)
- Signed AAB (4.3 MB) and signed APK (3.8 MB) via R8 minification
- `minifyEnabled true`, `shrinkResources true`, Capacitor-safe ProGuard rules
- Version automation via `scripts/bump-version.mjs`
- Notification icon fixed (`ic_stat_sprout.xml` was missing)
- Capacitor splash `launchAutoHide` set to `true` (was hanging)

### PWA Hardening
- `PwaInstall` component — captures `beforeinstallprompt`, shows install banner
- `AppUpdate` component — detects service worker updates, prompts reload
- Service worker: removed broken `icon.svg` ref, origin-based cache filter, proper versioning, `SKIP_WAITING` handler
- Manifest: added `scope`, `display_override`, `orientation`, `lang`

### MCP Architecture (Build Guide Compliant)
- Centralized `register-tools.ts` shared by stdio + HTTP transports
- `vercel-handler.ts` — Streamable HTTP via `StreamableHTTPServerTransport`
- `supabase.ts` — exported `sha256Hex()` and `generateToken()` for reuse
- Token CRUD API routes at `api/mcp/tokens/` (create/list/revoke)
- Web app handler at `src/lib/mcp-handler.ts`
- Admin Supabase client at `src/lib/supabase/admin.ts`
- Vercel build pipeline: builds MCP server before web app

### Reliability
- Exponential backoff retry (30s → 8m, max 5 retries) on sync push
- `user_id` guards on UPDATE/DELETE push operations
- Missing `user_id` filter on import client_id lookup (fixed)
- Connectivity check uses Supabase auth endpoint (fixes CORS 404)

### Auth
- Google OAuth replaces email/password
- PKCE flow via `@supabase/ssr`
- `/auth/callback` route handles code exchange

### Domain
- Migrated from `opensprout.vercel.app` to `sprout.kovina.org`
- Cloudflare DNS: CNAME to `cname.vercel-dns.com` (grey cloud)
- All code and docs references updated

### Documentation (8 new docs)
- `docs/data-safety.md` — Play Store data safety section
- `docs/faq.md` — Frequently asked questions
- `docs/offline-behavior.md` — Offline capabilities guide
- `docs/secret-rotation.md` — Credential rotation procedures
- `docs/troubleshooting.md` — Troubleshooting guide
- `docs/v1-migration.md` — v0.9 → v1.0 migration notes
- `docs/windows-packaging-guide.md` — MSIX packaging guide
- `docs/microsoft-store-submission.md` — Store submission checklist

## Known Issues

- No tests exist in the web app (only MCP tests)
- No crash reporting / analytics (intentional privacy choice)
- Calendar, Journal, Explore pages built but hidden from nav
- App version in `package.json` lags behind git tags
- Vercel Hobby plan rate-limited for deployments (24h cooldown)
- Supabase project shared with other apps (send.kovina.org)

## Build Commands

```bash
npm run dev                    # Dev server
npm run build                  # Web production build
npm run typecheck              # TypeScript check (builds MCP first)
npm run lint                   # ESLint
npm run android:debug          # Debug APK
npm run android:release        # Both signed AAB + APK
npm run android:release:bundle # Signed AAB only
npm run android:release:apk    # Signed APK only
npm run version:bump           # Interactive version bump
npm run rc:web                 # RC web validation (build)
npm run rc:android             # RC Android (release bundle + APK)
npm run -w @opensprout/mcp test # MCP tests
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
