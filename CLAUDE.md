# OpenSprout v0.9.14

**Stack:** Next.js 15 (App Router) · Supabase · Capacitor v8 Android · Tailwind CSS v4 · Sora font  
**Deploy:** https://sprout.kovina.org  
**Source:** github.com/sparshsam/opensprout  
**License:** AGPLv3

## Quick Start

```bash
npm install
npm run dev            # apps/web dev server at localhost:3000
npm run build          # Web production build
npm run typecheck      # TypeScript check
npm run test:mcp       # MCP server tests (112 tests)
```

## Project Layout

```
apps/web/              # Next.js + Capacitor Android
  ├── src/app/         # App Router pages
  │   ├── page.tsx     # Public homepage
  │   ├── login/       # Auth page
  │   ├── (authenticated)/  # App pages (today, plants, identify, etc.)
  │   ├── about/       # About page
  │   ├── privacy/     # Privacy policy
  │   ├── terms/       # Terms of service
  │   ├── mcp/         # AI Access guide
  │   └── globals.css  # Design tokens
  ├── android/         # Capacitor Android project
  └── public/          # Static assets, PWA manifest, icons

apps/mcp/              # MCP server (28 tools, 112 tests)

supabase/migrations/   # Database migrations

docs/                  # RC checklists, test matrix, integration docs
```

## Design Conventions

- **Premium editorial** — no card grids, no metric dashboards, no SaaS feel
- **Warm paper light mode**, deep botanical dark mode
- **Sora variable font** — weights 300-800, utility classes: `text-hero`, `text-display`, `text-label`
- **Primary green:** hsl(155, 68%, 28%) / dark: hsl(155, 52%, 44%)
- **Buttons:** pills (`rounded-full`), `px-7 py-3.5 text-sm font-semibold`
- **Borders:** ultra-subtle (`border-border/40`), hierarchy via spacing not boxes
- **Icons:** lucide-react (consistent stroke set)
- **Theme:** CSS variables in globals.css, `.dark` class via ThemeProvider

## Key Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Web production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run android:debug` | Build debug APK |
| `npm run android:release` | Build release AAB |
| `npm run rc:web` | RC web validation |
| `npm run rc:android` | RC Android validation |
| `cd apps/mcp && npm run test` | Run MCP tests |

## Release History

- **v0.9.13** (current) — Platform RC Packaging & Test Prep. Android RC checklist, Windows PWA checklist, 193-test matrix, packaging scripts, version bump.
- **v0.9.12** — Public homepage, nav/footer, auth-aware routing, /mcp guide.
- **v0.9.11** — Knowledge & diagnosis foundation, 18 articles, 15 diagnosis entries.
- **v0.9.10** — MCP reliability: user data isolation, 28 tools, 112 tests.
- **v0.9.0–v0.9.9** — Brand identity, UI overhaul, MCP server foundation.

## App Identity

OpenSprout is a privacy-first, open-source plant care companion. Track, identify, and care for your plants. No subscriptions. User-owned data. AI-agent ready via MCP.
