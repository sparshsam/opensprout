# Deployment

## Vercel (Production Demo)

The public demo is deployed to Vercel:

[https://sprout.kovina.org](https://sprout.kovina.org)

```bash
npx vercel --prod
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe publishable key |

Production and Development variables are configured for the current demo project. Preview deployments may need Supabase variables configured separately in Vercel.

The root [`vercel.json`](../vercel.json) configures the monorepo build output and edge security headers.
