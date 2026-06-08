# OpenSprout

![License: AGPL v3](https://img.shields.io/badge/License-AGPLv3-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue)
![Supabase](https://img.shields.io/badge/Supabase-backed-3ecf8e)
![CI](https://github.com/sparshsam/opensprout/actions/workflows/ci.yml/badge.svg)

**OpenSprout is a privacy-minded, open-source plant care dashboard for tracking plants, care schedules, and watering or fertilizing logs without subscriptions or data lock-in.**

[Live demo](https://opensprout.vercel.app) · [Architecture](docs/architecture.md) · [Roadmap](docs/roadmap.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

OpenSprout is built for people who want a practical plant tracker they can inspect, self-host, and improve. It currently supports authenticated plant tracking, built-in care templates, schedule-based reminders, care logs, and JSON export. It does not yet include photo uploads, push notifications, offline sync, or import/restore.

## Screenshots

![OpenSprout desktop dashboard](docs/assets/opensprout-desktop.png)

| Mobile dashboard | Dashboard concept |
| --- | --- |
| ![OpenSprout mobile dashboard](docs/assets/opensprout-mobile.png) | ![OpenSprout dashboard concept](docs/assets/opensprout-dashboard-concept.png) |

## Why OpenSprout?

Most plant care apps eventually become a subscription, a closed data silo, or both. OpenSprout takes a different path:

- **No subscriptions**: the project is free and open-source.
- **Portable data**: users can export their rows as JSON.
- **Self-hostable direction**: the stack is ordinary Next.js, Supabase, and PostgreSQL.
- **Open improvements**: AGPLv3 keeps public hosted improvements open to the community.

## Current Status

OpenSprout is an early but usable MVP. The public demo is deployed on Vercel and backed by Supabase.

| Area | Status | Notes |
| --- | --- | --- |
| Authentication | Available | Supabase email/password auth with session persistence. |
| Plant dashboard | Available | Protected dashboard for signed-in users. |
| Plant CRUD | Available | Create, edit, delete, and inspect persisted plants. |
| Care Templates | Available | 30 built-in plant species templates with suggested care rhythms. |
| Schedules | Available | Watering and fertilizing schedules are created from user inputs/templates. |
| Care logs | Available | Mark plants watered or fertilized and persist logs. |
| JSON export | Available | Exports user-owned rows currently loaded by the app/backend. |
| PWA foundation | Partial | Manifest and service worker exist; offline sync is not complete. |
| Photos | Planned | Supabase Storage bucket exists, but UI upload flow is not implemented yet. |
| Import/restore | Planned | Schema includes transfer metadata; restore flow is not complete yet. |
| Push reminders | Planned | Not implemented yet. |

## Quick Start

```bash
git clone https://github.com/sparshsam/opensprout.git
cd opensprout
npm install
cp .env.example apps/web/.env.local
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

You need a Supabase project with the OpenSprout schema applied before authenticated plant data will work locally.

## Environment Variables

Configure these in `apps/web/.env.local` for local development and in Vercel for deployments.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used by the web app. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser-safe Supabase publishable key. |

Do not expose Supabase service role keys in `NEXT_PUBLIC_` variables or client-side code.

## Supabase Setup

The schema source of truth lives in [`supabase/migrations`](supabase/migrations).

It currently includes:

- user profiles
- read-only `plant_species` Care Templates
- user-owned plants
- care schedules
- care logs
- journal and photo metadata tables for future features
- export/import metadata
- sync device metadata
- private `plant-photos` Storage bucket
- RLS policies for user-owned data

For local Supabase development:

```bash
supabase start
supabase db reset
```

Then copy the local Supabase URL and publishable key into `apps/web/.env.local`.

The hosted demo database was updated through Supabase SQL execution while the repo migrations remain the reviewable source of truth.

## Development

The web app lives in [`apps/web`](apps/web).

```bash
npm run dev        # Start the Next.js app
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript checks
npm run build      # Build for production
```

CI runs `npm ci`, `npm audit --audit-level=high`, lint, typecheck, and build on pushes and pull requests.

## Project Structure

```text
opensprout/
|-- apps/web              # Next.js 15 app
|-- packages/             # Future shared packages
|-- docs/                 # Architecture, roadmap, license notes, screenshots
|-- supabase/migrations   # PostgreSQL schema, RLS, seeds
|-- .github/              # Workflows, issue templates, project docs
|-- SECURITY.md           # Vulnerability disclosure policy
|-- CONTRIBUTING.md       # Contributor guide
`-- LICENSE               # AGPLv3
```

## Deployment

The public demo is deployed on Vercel:

[https://opensprout.vercel.app](https://opensprout.vercel.app)

Vercel needs the same Supabase environment variables listed above. Production and Development variables are configured for the current demo project. Preview deployments may need Supabase variables configured separately in Vercel, depending on whether they apply to all branches or a specific branch.

The root [`vercel.json`](vercel.json) configures the monorepo build output and edge security headers.

## Security and Privacy Notes

OpenSprout is privacy-minded, not zero-knowledge.

- User-owned rows are isolated with Supabase Auth and PostgreSQL RLS.
- The frontend uses only the Supabase publishable key.
- Service role keys must never be exposed to the browser.
- Data in the hosted demo is stored in Supabase PostgreSQL, not client-side encrypted.
- The app now sets CSP and common browser security headers on the deployed site.
- Basic in-memory API rate limiting is included, but it is not a distributed production-grade limiter.
- Account deletion, import/restore, and full offline sync are still planned work.

Please report sensitive issues through [SECURITY.md](SECURITY.md), not public issues.

## Roadmap

### v0.1: Usable MVP

- Supabase Auth
- protected dashboard
- plant CRUD
- Care Templates
- watering/fertilizing schedules
- care logs
- JSON export
- public Vercel demo
- basic security hardening and CI

### v0.2: Care Tracking Polish

- edit care schedules after creation
- richer care log forms
- plant detail timeline
- archive plants instead of hard delete
- better empty states and onboarding

### v0.3: Photos and Reminders

- private plant photo uploads
- plant health journal UI
- calendar view
- reminder task workflow
- push notification research

### v1.0: Self-Hostable Stable Release

- documented self-host path
- import/restore flow
- offline sync queue
- accessibility and security review
- expanded community plant template process

See the full roadmap in [`docs/roadmap.md`](docs/roadmap.md).

## Contributing

Contributions are welcome, especially focused bug fixes, docs improvements, accessibility work, and careful plant template additions.

Start with:

- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/roadmap.md`](docs/roadmap.md)
- [good first issue ideas](.github/project.md)

Keep pull requests small, include screenshots for UI changes, and call out privacy/security implications when relevant.

## License

OpenSprout is licensed under the GNU Affero General Public License v3.0 or later.

AGPLv3 allows use, study, modification, and self-hosting, but modified versions made available over a network must preserve the same source-availability obligations. See [`LICENSE`](LICENSE) and [`docs/license-notes.md`](docs/license-notes.md).

---

*Last updated: June 2026*

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Data | Local-first with optional sync |
