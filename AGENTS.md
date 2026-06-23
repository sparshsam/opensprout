# OpenSprout — AI Agent Instructions

## Current Release

**v0.9.13** — Platform RC Packaging & Test Prep (2026-06-23)

## Product Identity

OpenSprout is a privacy-first, open-source plant care companion. Track watering, log care, identify plants via AI, journal growth, and diagnose problems — all with user-owned data. No subscriptions, no ads, no tracking.

**Tagline:** Track, identify, and care for your plants.

## Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS v4 + TypeScript
- **Backend:** Supabase (auth, PostgreSQL DB, file storage, edge functions)
- **Mobile:** Capacitor v8 Android (PWA for Windows/desktop)
- **AI:** MCP server at `apps/mcp/` — 28 tools, 112 tests
- **Design:** Sora variable font, warm paper light mode, deep botanical dark mode
- **Hosting:** Vercel (web), Supabase (backend)

## Repo Structure

```
opensprout/
├── apps/
│   ├── web/          # Next.js app + Capacitor Android
│   └── mcp/          # MCP server (AI agent bridge)
├── docs/             # RC checklists, test matrix, integration docs
├── supabase/
│   └── migrations/   # Database migrations
└── package.json      # Root workspace
```

## Public Routes

| Route | Description |
|-------|-------------|
| `/` | Public homepage (editorial hero + features) |
| `/login` | Sign in / sign up |
| `/about` | About page |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/mcp` | AI Access guide |
| `/today` | Authenticated home |
| `/plants` | Plant collection |
| `/identify` | Plant identification |
| `/profile` | Profile & settings |
| `/settings/mcp` | MCP token management |

## Rules

1. **Privacy-first.** Minimize data collection. No analytics or tracking.
2. **Calm UX.** Plant care should reduce stress, not add urgency.
3. **User-owned data.** Exportable, deletable, never sold.
4. **Open source.** AGPLv3. Source on GitHub.

## Build Commands

```bash
npm run dev              # Dev server
npm run build            # Web production build
npm run typecheck        # TypeScript check
npm run lint             # ESLint
npm run android:debug    # Debug APK
npm run android:release  # Release AAB
npm run rc:web           # RC web validation (build)
npm run rc:android       # RC Android validation (debug APK)
```

## MCP Server

Located at `apps/mcp/`. Exposes 28 tools for AI agents. Test suite: 112 tests.
```bash
cd apps/mcp && npm run test
```

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
