# Testing

## Running Tests

```bash
# Lint
npm run lint

# Type checking
npm run typecheck

# Build verification
npm run build
```

CI runs `npm ci`, `npm audit --audit-level=high`, lint, typecheck, and build on pushes and pull requests.

## Before Submitting a PR

1. Run all checks
2. Include screenshots for UI changes
3. Call out privacy/security implications when relevant
4. Keep pull requests small and focused
