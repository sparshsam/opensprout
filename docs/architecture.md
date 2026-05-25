# OpenSprout Architecture

## Folder Architecture

```text
opensprout/
├── apps/
│   └── web/                  # Next.js 15 PWA
│       ├── public/           # manifest, service worker, app icons
│       └── src/
│           ├── app/          # App Router pages and route handlers
│           ├── components/   # Product and UI components
│           ├── data/         # Demo and seed data
│           └── lib/          # Supabase clients and utilities
├── packages/
│   ├── ui/                   # Future shared shadcn/ui package
│   ├── database/             # Generated DB types and helpers
│   ├── shared/               # Shared domain types
│   └── config/               # Shared lint/ts/tailwind config
├── docs/                     # Architecture, API, roadmap, license notes
├── supabase/
│   └── migrations/           # PostgreSQL schema and RLS
├── scripts/                  # Maintenance and release scripts
└── .github/                  # Issue templates and project docs
```

## API Structure

Initial route handlers live in `apps/web/src/app/api`:

- `GET /api/plants`: list the signed-in user's plants.
- `POST /api/plants`: create a plant with local-first client metadata.
- `GET /api/export`: export user-owned tables as portable JSON.

Planned routes:

- `/api/care-schedules`
- `/api/care-logs`
- `/api/journal`
- `/api/photos/sign-upload`
- `/api/import`
- `/api/sync/pull`
- `/api/sync/push`

## Component Hierarchy

```text
RootLayout
└── Home
    ├── AppShell
    │   ├── SidebarNav
    │   ├── DashboardHeader
    │   ├── StatSummary
    │   ├── ReminderBoard
    │   ├── PlantList
    │   ├── PlantDetailPanel
    │   └── JournalPreview
    └── PwaRegister
```

## Initial UI Wireframe

```text
┌──────────────┬─────────────────────────────────────────────┬─────────────┐
│ OpenSprout   │ Plant dashboard                             │ Plant detail│
│ Dashboard    │ [Export JSON] [Import] [Add plant]          │ Photo       │
│ Plants       │                                             │ Room/Light  │
│ Calendar     │ Due today | Healthy plants | Backups        │ Notes       │
│ Journal      │                                             ├─────────────┤
│ Backups      │ Care reminders + week strip                 │ Journal     │
│ Offline      │                                             │ preview     │
│ ready        │ Plant search + plant list                   │             │
└──────────────┴─────────────────────────────────────────────┴─────────────┘
```

## Database Schema

The initial migration includes:

- `profiles`
- `plants`
- `care_schedules`
- `task_instances`
- `care_logs`
- `journal_entries`
- `journal_photos`
- `data_transfers`
- `sync_devices`
- private Supabase Storage bucket `plant-photos`

Every user-owned public table has RLS enabled. Policies use `auth.uid()` against `user_id` or `profiles.id`. Mutable tables include `client_id`, `sync_version`, `last_modified_at`, and `deleted_at` for local-first sync and tombstones.
