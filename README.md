# OpenSprout

![License: AGPL v3](https://img.shields.io/badge/License-AGPLv3-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue)
![Open Source](https://img.shields.io/badge/open--source-yes-brightgreen)

OpenSprout is a privacy-first, open-source plant care dashboard for tracking watering, fertilizing, journals, reminders, and plant health without ads, subscriptions, or data lock-in.

Live demo: [opensprout.vercel.app](https://opensprout.vercel.app)

## Why OpenSprout?

Plant care apps should feel like useful household tools, not another subscription trying to own your data.

OpenSprout is built around three principles:

- Plant care tools should not require subscriptions.
- Gardening data should remain portable and private.
- Improvements should remain open to the community.

OpenSprout is designed to be self-hostable, PWA-first, mobile-friendly, local-first where practical, beginner-friendly, and open-source forever.

## Screenshots

### Desktop Dashboard

![OpenSprout desktop dashboard](docs/assets/opensprout-desktop.png)

### Mobile Dashboard

![OpenSprout mobile dashboard](docs/assets/opensprout-mobile.png)

## Current Status

OpenSprout is publicly deployed on Vercel at [opensprout.vercel.app](https://opensprout.vercel.app).

OpenSprout now has a real Supabase-backed MVP flow:

- Supabase Auth sign up, login, logout, and session persistence.
- Protected dashboard for authenticated users.
- Persisted plant create, edit, and delete.
- Built-in Care Templates for 30 common houseplants and herbs.
- Add-plant species selection that pre-fills watering and fertilizing intervals.
- Care schedules created when a plant is created.
- Due and overdue care tasks calculated from `care_schedules`.
- Mark watered and mark fertilized actions.
- Persisted `care_logs` entries.
- JSON export from live rows loaded in the dashboard.

Planned but not complete yet:

- Photo journal uploads.
- Import/restore.
- Offline sync queue.
- Push notifications.
- Full task instance generation.
- Community-contributed plant species database.

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Vercel-ready frontend

## Quick Start

```bash
git clone https://github.com/sparshsam/opensprout.git
cd opensprout
npm install
npm run dev
```

Then open `http://localhost:3000`.

The web app lives in `apps/web`.

## Package Scripts

```bash
npm run dev        # Start the Next.js app
npm run build      # Build for production
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript checks
```

## Environment Variables

For local app development, copy `.env.example` to `apps/web/.env.local` and configure your Supabase project.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used by the web app. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key for browser/server client access. |

Do not expose Supabase service role keys in the frontend.

## Supabase Setup

The initial schema is in `supabase/migrations/20260525111000_initial_schema.sql`.

It includes:

- User profiles
- Read-only plant species Care Templates
- Plants
- Care schedules
- Task instances
- Care logs
- Journal entries
- Journal photos
- Export/import metadata
- Sync devices
- Private `plant-photos` Storage bucket
- RLS policies for all user-owned data

Care Templates are stored in the public `plant_species` table. Anyone can read these templates, while app users still own their private plant records through RLS. User plants may reference a template with `species_id`, but custom free-text species names remain supported for unknown plants.

Recommended local setup:

```bash
supabase start
supabase db reset
```

Then copy your local Supabase URL and publishable key into `apps/web/.env.local`.

For the hosted OpenSprout Supabase project, the schema was applied through Supabase MCP raw SQL execution. The migration file in this repository remains the source of truth for schema review and future environment setup.

## Deployment

OpenSprout is deployed as a Vercel project backed by Supabase.

Production demo:

- [https://opensprout.vercel.app](https://opensprout.vercel.app)

Required Vercel environment variables:

| Variable | Environment | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development | Browser-safe Supabase publishable key. |

Production and local development deployments need these values before build time. Preview deployments may need the same Supabase variables configured separately in Vercel, especially when Vercel asks whether preview variables apply to all branches or a specific branch.

Do not add `SUPABASE_SERVICE_ROLE_KEY` or any secret service role key to `NEXT_PUBLIC_` variables.

## Architecture

```text
opensprout/
|-- apps/web              # Next.js 15 PWA
|-- packages/ui           # Future shared UI package
|-- packages/database     # Future generated database types
|-- packages/shared       # Future shared domain types
|-- packages/config       # Future shared tooling config
|-- docs                  # Architecture, roadmap, screenshots
|-- supabase/migrations   # Database schema and RLS
`-- .github               # Issue templates and project organization
```

More detail is available in [docs/architecture.md](docs/architecture.md).

## Roadmap

### MVP

- Public starter repo with AGPLv3 license.
- Responsive dashboard and PWA foundation.
- Supabase Auth and protected app state.
- Built-in Care Templates for common plants.
- Persisted plant CRUD with RLS.
- Care schedule creation on plant creation.
- Care logs for watering and fertilizing.
- Initial Supabase schema with RLS.

### v0.2

- Archive plants and soft-delete sync tombstones.
- Watering, fertilizing, pruning, and repotting log details.
- Plant detail timeline.
- Reminder scheduling and task completion.
- Photo journal upload foundation.

### v1.0

- Stable self-hosting path.
- Full export/import backup flow.
- Private photo uploads.
- Offline sync queue.
- Accessibility and security review.
- Complete contributor and deployment docs.

See [docs/roadmap.md](docs/roadmap.md) for the longer release path.

## Good First Issues

- Add richer empty states for users with no plants.
- Add plant archive support.
- Add detailed care log forms.
- Add unit tests for export JSON shaping.
- Add a Supabase local development guide.
- Improve mobile navigation.
- Add screenshot refresh instructions.
- Add more Care Templates for common regional plants.
- Improve species search and alias matching.

## Why AGPLv3?

OpenSprout is licensed under AGPLv3 to make sure improvements to hosted versions remain open to the community. Anyone can use, study, modify, and self-host the project, but public network use must preserve the same openness.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, branch, PR, and design guidance.

## Documentation

- [Architecture](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [GitHub setup](docs/github.md)
- [License notes](docs/license-notes.md)
- [Contributing](CONTRIBUTING.md)

## License

OpenSprout is licensed under the GNU Affero General Public License v3.0 or later. See [LICENSE](LICENSE).
