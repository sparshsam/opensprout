# OpenSprout — Secret Rotation & Security Maintenance

**Last updated:** 2026-06-25  
**Version:** 0.9.14

---

## Secrets Inventory

| Secret | Location | Rotation Frequency | Last Rotated |
|--------|----------|-------------------|--------------|
| Supabase `service_role` key | Vercel env, Supabase dashboard | Every 90 days | First setup |
| Supabase `publishable` anon key | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` + Vercel | Every 90 days | First setup |
| Android signing keystore | `apps/web/android/opensprout-release.keystore` (gitignored) | Every 2 years or on compromise | 2026-06-25 |
| Keystore password | `apps/web/android/keystore.properties` (gitignored, 600 perms) | Every 90 days | 2026-06-25 |
| Supabase DB connection string | Supabase dashboard (not in code) | Every 90 days | First setup |
| GitHub PAT (if used for CI) | GitHub Secrets | Every 90 days | First setup |
| Vercel deploy token | Vercel dashboard | Every 90 days | First setup |

---

## Rotation Procedures

### Supabase Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Project → Settings → API
2. Click **Regenerate** next to `service_role` key
3. Update the key in Vercel environment variables
4. Update any CI/CD workflows that use the service role key
5. Verify MCP server still works after rotation

### Supabase Publishable Key

1. Go to Supabase Dashboard → Project → Settings → API
2. Click **Regenerate** next to the publishable anon key
3. Update `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in:
   - `apps/web/.env.local`
   - Vercel project environment variables
   - Any developer copies of `.env.local`
4. Verify web app auth still works

### Android Keystore Password

1. Generate new keystore passwords
2. Update `apps/web/android/keystore.properties`:
   ```
   storePassword=<new-password>
   keyPassword=<new-password>
   keyAlias=opensprout
   storeFile=opensprout-release.keystore
   ```
3. Do NOT commit `keystore.properties` (already gitignored)
4. Rebuild signed artifacts:
   ```bash
   npm run android:release
   ```
5. Verify APK signature:
   ```bash
   apksigner verify --print-certs app-release.apk
   ```

### Full Keystore Regeneration

If the keystore itself is compromised:

1. Generate a new keystore:
   ```bash
   keytool -genkey -v -keystore opensprout-release.keystore \
     -alias opensprout -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Update `keystore.properties` with new passwords
3. Rebuild all signed artifacts
4. **Important:** A new keystore = new signing key. Users who installed the old APK cannot upgrade to the new one unless you use key rotation in Google Play Console (requires Upload Key setup).

---

## Monitoring

- **Dependency vulnerabilities:** Run `npm audit --omit=dev` before each release
- **Supabase project health:** Check Supabase Dashboard for any security advisories
- **RLS verification:** Validate RLS on every schema migration

---

## Breach Response

1. **Immediate:** Rotate all secrets (see procedures above)
2. **Supabase:** Check audit logs for unauthorized access
3. **Users:** Notify users if personal data may have been exposed
4. **Review:** Inspect recent commits for any leaked credentials (use `git diff HEAD~10 --name-only` and check for `.env`, `keystore` references)
5. **Prevention:** Add pre-commit hook to prevent secret leaks
