# OpenSprout Project Status

## Release History
- **v0.9.25** (current, Jun 28) — Release Candidate Stabilization: lint/typecheck/test/build pass, schema verification, build validation, changelog updated.
- **v0.9.24** (Jun 28) — Platform Completion: Android versionCode 4, PWABuilder manifest, store screenshots, release automation, CI Android build.
- **v0.9.23** (Jun 28) — UX Polish: onboarding wizard, skeleton loading, page fade-in, accessibility pass, settings restructure.
- **v0.9.22** (Jun 28) — Plant Organization: favorites, archive/restore, search/filters, grid/list view, collection stats.
- **v0.9.21** (Jun 28) — Notifications: push + web, quiet hours, background refresh, Android reliability.
- **v0.9.20** (Jun 28) — Smart Care Insights: missed care, streaks, seasonal tips, expandable reasoning.
- **v0.9.19** (Jun 28) — Diagnosis & Health: PlantDoctorSheet, symptom-based diagnosis, severity indicators.
- **v0.9.18** (Jun 28) — Plant Detail Completion: photo gallery, two-column desktop, species info, timeline, inline notes.
- **v0.9.17** (Jun 28) — Dashboard Intelligence: Today's Care, overdue/today/upcoming, contextual next actions.
- **v0.9.16** (Jun 28) — Care Engine: species presets, ApplyCarePlanSheet, CadencePicker, schedule management.
- **v0.9.15** (Jun 27) — Product truth overhaul, dark mode sweep, profile redesign, PWA persistence.
- **v0.9.14** (Jun 25) — Production Android signing, PWA hardening, MCP architecture, Google OAuth.
- **v0.9.13** (Jun 23) — Platform RC Packaging & Test Prep: Android RC checklist, Windows PWA checklist, cross-platform test matrix, version bump, packaging scripts.
- **v0.9.12** (Jun 22) — Public Homepage & Launch Surface: editorial hero, 7 feature sections, trust section, public nav/footer, auth-aware routing. All public pages unified.
- **v0.9.11** (Jun 22) — Knowledge & Diagnosis Foundation: 18 knowledge articles for 10 popular species, 15 new diagnosis entries, migration applied and validated.
- **v0.9.10** (Jun 22) — MCP reliability release: user data isolation fix, 9 new tools, comprehensive tests, agent-ready docs, improved error messages.
- **v0.9.5** (Jun 22) — Brand identity overhaul: Cash App-style design, 32px radius, near-black text, bold navigation, hero sections, premium feel
- **v0.9.4** (Jun 22) — Brand experience: sidebar→top bar, 1200px layout, larger typography, flat surfaces
- **v0.9.3** (Jun 21) — UI overhaul: mobile-first, 4-tab nav, Home/Plants/Identify/Profile, no tech language
- **v0.9.2** (Jun 21) — Store readiness: privacy/terms/support pages, permissions audit, WCAG AA, legal docs
- **v0.9.1** (Jun 21) — Branding refresh: deterministic icon pipeline, database namespace audit
- **v0.9.0** — MCP server, AI plant identification

## Architecture
- **Stack:** Next.js 15 (App Router) + Supabase + Capacitor v8 Android + Tailwind CSS v4
- **Monorepo:** npm workspaces — `apps/web` (Next.js), `apps/mcp` (MCP server), `packages/`
- **Hosting:** Vercel (web), Supabase (auth + DB + storage + edge functions)
- **Authentication:** Supabase Auth (email/password), RLS-scoped data
- **Design:** Pure CSS design tokens via Tailwind v4 `@theme`. No component library — custom UI.
- **Navigation:** Mobile = bottom nav (Home/Plants/Identify/Profile), Desktop = top bar with centered nav

## App Routes
- `/` → redirects to `/today`
- `/login` — sign in / sign up page
- `/today` — home dashboard with metrics and tasks
- `/plants` — plant collection with CRUD and timeline
- `/identify` — AI plant identification (PlantNet)
- `/profile` — account, reminders, data/privacy, AI access, about
- `/privacy`, `/terms`, `/support` — legal and support pages
- `/settings` (legacy), `/settings/mcp` — MCP token management
- `/explore`, `/calendar`, `/journal` — hidden from nav, deferred

## Navigation Items (shared across mobile bottom nav + desktop top bar)
1. Home (`/today`)
2. Plants (`/plants`)
3. Identify (`/identify`)
4. Profile (`/profile`)

## Design Tokens
- **Primary green:** hsl(155, 68%, 28%) / hsl(155, 52%, 44%) dark
- **Background:** pure white / near-black dark
- **Foreground:** near-black hsl(157, 35%, 6%)
- **Radius:** xl=32px, lg=28px, md=20px, sm=12px
- **Shadows:** sm=0 2px 8px, md=0 8px 24px, lg=0 20px 60px
- **Button default:** h-12, 14px radius, text-base

## Key Files Changed Recently
- `globals.css` — all design tokens
- `top-bar.tsx` — desktop navigation component
- `bottom-nav.tsx` — mobile navigation component
- `layout.tsx` — authenticated layout wrapper

## Known Issues
- No tests exist in the project
- No crash reporting / analytics (intentional privacy choice)
- Calendar, Journal, Explore pages built but hidden from nav (not fully functional)
- Old Settings page at `/settings` still exists but nav points to `/profile`
- App version in `package.json` is 0.1.0 (lags behind git tags)
