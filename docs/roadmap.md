# OpenSprout — Roadmap

OpenSprout is a privacy-minded plant care dashboard for people who want to care for living things without subscriptions, closed data silos, or noisy wellness-app pressure.

The project should stay practical first: plant profiles, care schedules, care logs, photos, exports, and self-hosting. Any advanced features should serve care, memory, portability, and ownership.

---

## v0.1 — Seedling ✅

- Project scaffold and AGPLv3 license.
- Responsive PWA app shell.
- Plant dashboard, plant list, and plant detail panel.
- Add plant demo interaction.
- JSON export starter.
- Initial Supabase schema with RLS and Storage policies.
- Supabase Auth, protected dashboard, plant CRUD, care templates, schedules, care logs, and public demo foundation.

---

## Near-Term — Care Tracking Polish

### v0.2 — Daily Care

- Edit care schedules after creation.
- Richer care log forms for watering, fertilizing, pruning, misting, repotting, pest checks, and custom actions.
- Plant detail timeline with care events, notes, and schedule changes.
- Archive plants instead of hard delete.
- Better onboarding, empty states, and care-template explanations.
- Filter plants by room, care status, species, health, and overdue tasks.
- Improve date handling for timezones and missed care windows.

### v0.3 — Photos, Journals, and Reminders

- Private plant photo uploads through Supabase Storage.
- Plant health journal UI with notes, photos, condition tags, and care observations.
- Photo timeline and captions.
- Growth comparison view.
- Calendar view for upcoming watering/fertilizing/repotting tasks.
- Reminder task workflow with complete, skip, snooze, and reschedule actions.
- Push notification research and permission-safe reminder design.

---

## Mid-Term — Ownership and Offline Care

### v0.4 — Data Portability

- Full export/import flow for plants, schedules, logs, journal entries, photo metadata, and care templates.
- Backup manifest validation with schema versioning.
- Import preview with conflict detection and safe restore options.
- Delete account/data flow.
- Privacy policy template for self-hosters.
- Human-readable Markdown/CSV export for long-term personal archives.

### v0.5 — Offline-First PWA

- Offline care queue for marking tasks complete without network access.
- Conflict-safe sync when the app reconnects.
- Cached plant dashboard, upcoming tasks, and recent care history.
- Offline warning and sync status indicators.
- Local-first draft journal entries.
- Reliable PWA install flow across desktop and mobile browsers.

### v0.6 — Self-Hosting

- Dockerfile and Docker Compose.
- Backup and restore guide.
- Reverse proxy notes.
- Supabase local development guide.
- Environment variable reference.
- Seed data and migration verification scripts.
- Clear docs for running a personal or household instance.

---

## Long-Term — Community Garden

### v0.7 — Plant Knowledge Layer

- Expanded plant species database with community-reviewed care templates.
- Template versioning so changes are transparent.
- Local overrides for personal plant behaviour.
- Region/climate notes without overpromising scientific precision.
- Contributor moderation workflows for plant template submissions.
- Source notes for care recommendations where available.

### v0.8 — Household and Shared Gardens

- Optional household/shared gardens.
- Invite-based collaboration with role boundaries.
- Shared care logs and assignment notes.
- Activity history for care actions.
- Privacy-preserving sharing defaults.
- Export shared gardens without locking data into one hosted instance.

### v0.9 — Personal Plant Archive

- Long-term plant memory timeline.
- Seasonal review view: growth, dormancy, repotting, flowering, pest events, and recovery notes.
- Printable plant care sheets.
- Exportable plant journals for moving homes, gifting plants, or transferring care to someone else.
- Local-first photo archive strategy for users who do not want hosted media storage.

### v1.0 — Stable Self-Hostable Release

- Stable schema and migration path.
- Accessibility and security pass.
- Complete self-hosting docs.
- Reliable PWA offline flow.
- Import/restore confidence tests.
- Public demo and screenshots.
- Clear maintenance policy and release process.

---

## Optional Base / OpenProof Direction

OpenSprout does not need Web3 to be useful. Any blockchain-related feature should be optional, quiet, and focused on verification rather than speculation.

Possible proof-oriented features:

- **Care-history receipts** — export a plant timeline and generate a local hash receipt proving the record has not been altered.
- **Template integrity snapshots** — anchor hashes of public plant template releases so self-hosters can verify that template packs were not silently changed.
- **Plant transfer packets** — portable care-history bundles for gifting, selling, or rehoming plants, with optional OpenProof-compatible verification.
- **Community database release proofs** — publish hashes for community plant database versions so contributors can audit changes.
- **Photo archive verification** — hash photo metadata manifests without putting private plant photos onchain.

What should never happen:

- no token
- no NFT plant marketplace
- no wallet required for normal plant tracking
- no public onchain storage of private care logs or photos
- no speculative financial layer attached to plant care
- no claims that blockchain proves plant health, ownership, or value

Base, if used, should act as a low-cost notary for hashes. The living record stays private, portable, and user-controlled.

---

## Future Philosophy

OpenSprout belongs to a broader family of calm, ownership-first tools.

The direction is:

- **Care without subscriptions** — plant tracking should not become another monthly fee.
- **Memory without lock-in** — care logs, photos, and plant histories should be exportable.
- **Self-hosting without ceremony** — ordinary people should be able to run their own garden dashboard.
- **Offline care before cloud cleverness** — the app should still help when Wi-Fi, servers, or phones are being moody little weather goblins.
- **Proof without exposure** — hashes can verify archives and template releases without revealing private home data.
- **Community knowledge with transparency** — care templates should evolve visibly, not through hidden platform changes.

OpenSprout should feel less like a productivity app and more like a quiet windowsill ledger for living things. 🌿
