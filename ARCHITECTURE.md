# OpenSprout Architecture

See [docs/architecture.md](docs/architecture.md) for the full architecture document, including system overview, data flow, component hierarchy, and database schema.

## Quick Summary

OpenSprout is a Next.js 15 PWA backed by Supabase (PostgreSQL + Auth). All user data is isolated via Row-Level Security. There is no separate API server — the Next.js app communicates with Supabase directly from the browser using the publishable key and RLS as the security boundary.

### Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Deployment | Vercel |
