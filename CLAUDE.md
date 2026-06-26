# OpenSprout v0.9.15

**Stack:** Next.js 15 (App Router) · Supabase · Capacitor v8 Android · Tailwind CSS v4 · Sora font  
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
```

## Project Layout

```
apps/web/              # Next.js + Capacitor Android
  ├── src/app/
  │   ├── page.tsx           # Public homepage
  │   ├── login/             # Google OAuth sign-in (no email/password)
  │   ├── auth/callback/     # OAuth PKCE callback handler
  │   ├── api/mcp/           # MCP HTTP endpoint + token CRUD
  │   ├── (authenticated)/   # App pages (today, plants, identify, etc.)
  │   ├── about/             # About page
  │   ├── privacy/           # Privacy policy
  │   ├── terms/             # Terms of service
  │   ├── mcp/               # AI Access guide
  │   └── globals.css        # Design tokens
  ├── android/               # Capacitor Android project
  └── public/                # Static assets, PWA manifest, icons

apps/mcp/              # MCP server (28 tools, 112 tests)
  ├── src/
  │   ├── index.ts           # Stdio entry point
  │   ├── vercel-handler.ts  # Streamable HTTP transport
  │   ├── register-tools.ts  # Centralized tool registration
  │   ├── supabase.ts        # Auth (SHA-256 token) + client factory
  │   ├── tools/             # 7 tool modules (plants, care, journal, etc.)
  │   └── __tests__/         # auth.test.ts + tools.test.ts

docs/                  # 35+ docs (see docs/ directory)
scripts/               # bump-version.mjs, package-windows.ps1
supabase/migrations/   # Database migrations (shared project)
```

## Key Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Dev server at localhost:9999 |
| `npm run build` | Web production build |
| `npm run typecheck` | TypeScript check (builds MCP first) |
| `npm run lint` | ESLint |
| `npm run android:debug` | Debug APK |
| `npm run android:release:bundle` | Signed release AAB |
| `npm run android:release:apk` | Signed release APK |
| `npm run android:release` | Both AAB + APK |
| `npm run version:bump` | Interactive version bump |
| `npm run -w @opensprout/mcp test` | MCP tests (112) |

## Design Conventions

- **Premium editorial** — no card grids, no metric dashboards, no SaaS feel
- **Warm paper light mode**, deep botanical dark mode
- **Sora variable font** — weights 300-800, utility classes: `text-hero`, `text-display`, `text-label`
- **Primary green:** hsl(155, 68%, 28%) / dark: hsl(155, 52%, 44%)
- **Buttons:** pills (`rounded-full`), `px-7 py-3.5 text-sm font-semibold`
- **Borders:** ultra-subtle (`border-border/40`), hierarchy via spacing not boxes
- **Icons:** lucide-react (consistent stroke set)
- **Theme:** CSS variables in globals.css, `.dark` class via ThemeProvider

## Auth

- **Provider:** Google OAuth only (email/password disabled)
- **Supabase Auth** with PKCE flow
- **Callback:** `/auth/callback` exchanges code server-side via `createServerClient` + `exchangeCodeForSession()` (critical — without this the redirect drops the `code` param causing a sign-in loop)
- **Session:** Auto-refreshed via `@supabase/ssr`
- **CSP:** Security headers disabled in dev mode (Next.js HMR needs `'unsafe-eval'`); production Vercel builds get strict headers
- **Platform awareness:** `AuthGate` detects Capacitor native via `window.Capacitor.isNativePlatform()` — web shows public homepage, native redirects to login

## MCP Server

Located at `apps/mcp/`. 28 tools across 7 domains.
Two transport modes:
- **Local stdio:** `OPENSPROUT_ACCESS_TOKEN` env var
- **Remote HTTP:** `https://sprout.kovina.org/api/mcp` + Bearer token

Architecture follows the MCP Build Guide: SHA-256 token auth, centralized registration, Streamable HTTP, user-scoped service-role client, token CRUD API routes.

## Release History

- **v0.9.15** (current, Jun 26) — Auth loop fix, CSP dev-mode fix, platform-aware AuthGate, navbar labels, dev server port.
- **v0.9.14** (Jun 25) — Production signing, PWA hardening, reliability fixes, MCP transport, Google OAuth, domain migration to sprout.kovina.org.
- **v0.9.13** (Jun 23) — Platform RC Packaging & Test Prep.
- **v0.9.12** (Jun 22) — Public homepage, nav/footer, auth-aware routing.
- **v0.9.11** (Jun 22) — Knowledge & diagnosis foundation.
- **v0.9.10** (Jun 22) — MCP reliability: user data isolation, 28 tools.
- **v0.9.0–v0.9.9** — Brand identity, UI overhaul, MCP server foundation.

## App Identity

OpenSprout is a privacy-first, open-source plant care companion. Track, identify, and care for your plants. No subscriptions. User-owned data. AI-agent ready via MCP.
