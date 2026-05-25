# Contributing to OpenSprout

Thanks for helping grow OpenSprout. Beginners, docs fixes, design feedback, bug reports, and careful plant-care nerd notes are all welcome.

## Ways to Contribute

- Report bugs.
- Suggest features.
- Improve documentation.
- Pick up `good first issue` tasks.
- Add tests and accessibility improvements.
- Improve self-hosting and privacy docs.

## Development Setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and add your Supabase project URL and publishable key when working on authenticated or database-backed flows.

## Branches and Commits

Use descriptive branches such as:

- `feature/plant-profiles`
- `fix/reminder-timezone`
- `docs/self-hosting-guide`

Suggested commit prefixes:

- `feat:`
- `fix:`
- `docs:`
- `test:`
- `refactor:`
- `chore:`

## Pull Requests

- Keep PRs focused.
- Explain what changed and why.
- Link related issues.
- Include screenshots for UI changes.
- Add or update tests when behavior changes.
- Mention privacy, accessibility, or self-hosting impact when relevant.

## Design Principles

- Privacy-first.
- Self-hostable by default.
- Accessible and mobile-friendly.
- Beginner-friendly without hiding useful detail.
- No subscriptions, trackers, or lock-in.

## Security

Please do not open public issues for sensitive vulnerabilities. A dedicated `SECURITY.md` contact path should be added before public production use.
