# Development

## Prerequisites

- Node.js 20+
- npm
- A Supabase account (free tier works)
- Supabase project with OpenSprout schema applied

## Setup

```bash
git clone https://github.com/sparshsam/opensprout.git
cd opensprout
npm install
cp .env.example apps/web/.env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Configure these in `apps/web/.env.local` for local development and in Vercel for deployments.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser-safe Supabase publishable key |

Do not expose Supabase service role keys in `NEXT_PUBLIC_` variables or client-side code.

## Supabase Setup

The schema source of truth lives in [`supabase/migrations`](../supabase/migrations).

For local Supabase development:

```bash
supabase start
supabase db reset
```

Then copy the local Supabase URL and publishable key into `apps/web/.env.local`.

The hosted demo database was updated through Supabase SQL execution while the repo migrations remain the reviewable source of truth.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js app |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run build` | Build for production |

CI runs `npm ci`, `npm audit --audit-level=high`, lint, typecheck, and build on pushes and pull requests.

## Project Structure

```
opensprout/
├── apps/web              # Next.js 15 app
├── apps/mcp              # MCP server for AI agent integration
├── packages/             # Future shared packages
├── docs/                 # Architecture, MCP, roadmap, screenshots
├── supabase/migrations   # PostgreSQL schema, RLS, seeds
├── .github/              # Workflows, issue templates
├── SECURITY.md           # Vulnerability disclosure policy
├── CONTRIBUTING.md       # Contributor guide
└── LICENSE               # AGPLv3
```
