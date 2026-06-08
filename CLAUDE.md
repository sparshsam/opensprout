# OpenSprout — Claude Code Instructions

## Project Overview

OpenSprout is a privacy-first plant care application. Built with Next.js + TypeScript.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Data:** Local-first with optional sync

## Commands

\`\`\`bash
npm run dev       # Development server
npm run build     # Production build
npm run lint      # ESLint
npm run typecheck # TypeScript type check
\`\`\`

## Architecture Constraints

1. **Privacy-first.** No unnecessary data collection.
2. **Calm UX.** Avoid urgency patterns and notification spam.
3. **Local-first.** Design for offline resilience.

## Branch Naming

- \`feat/*\`, \`fix/*\`, \`docs/*\`, \`refactor/*\`, \`chore/*\`

## Workflow

1. Branch from \`main\`.
2. Run validation before every PR.
3. Open a PR for every merge. No direct pushes to \`main\`.
