# OpenSprout Release Checklist

**Version:** 0.9.2  
**Date:** June 21, 2026

---

## Pre-Release

### Code Health

- [x] `npm run lint` — 0 errors
- [x] `npm run typecheck` — clean
- [x] `npm run build` — 14 static pages, no errors
- [x] `npm run build:mobile` — clean export
- [x] `npx cap sync` — Android plugins synced
- [ ] `npm test` — all tests pass (if tests exist)

### Versioning

- [x] CHANGELOG.md updated with release section
- [ ] `package.json` version bumped (if applicable)
- [x] Git tag created (`v0.9.2`)
- [x] Release notes drafted

### Icons and Branding

- [x] Icon pipeline verified: `node scripts/generate-icons.mjs`
- [x] Favicon (16, 32) generated
- [x] Web app icons (48, 64, 128, 192, 512) generated
- [x] Android launcher icons (all densities) generated
- [x] Android adaptive icon foregrounds generated
- [x] Splash screens (all orientations/densities) generated
- [x] PWA manifest updated
- [x] `layout.tsx` references correct icons

### Legal and Compliance

- [x] Privacy Policy published (`docs/privacy-policy.md`)
- [x] Terms of Service published (`docs/terms-of-service.md`)
- [x] `/privacy` route serves privacy policy
- [x] `/terms` route serves terms of service
- [x] `/support` route with contact info
- [x] Support email displayed in Settings
- [x] Permissions audit completed (`docs/permissions-audit.md`)
- [x] Data deletion workflow documented (`docs/data-deletion.md`)
- [x] Age-rating questionnaire completed (`docs/age-rating.md`)
- [x] Retention policy documented
- [x] Store listing metadata prepared (`docs/store-listing.md`)

### App Permissions and Privacy

- [x] Camera permission rationale documented
- [x] Notification permission rationale documented
- [x] Storage/photos permission rationale documented
- [x] Permissions-Policy HTTP header verified (camera=(), microphone=(), geolocation=())
- [x] Privacy disclosures match actual data usage
- [x] No unnecessary permissions requested

### Analytics and Crash Reporting

- [x] No analytics SDKs present in codebase (verified)
- [x] No crash reporting SDKs present in codebase (verified — Sentry, Datadog, etc. not included)
- [x] Privacy disclosures accurately state no analytics/tracking

### Update Mechanisms

- [x] Web deployment: Vercel auto-deploys on `main` branch push
- [x] Android update: Manual APK/AAB distribution (Play Store or direct)
- [x] MCP package: GitHub-based release distribution

## Documentation

- [x] `docs/release-checklist.md` (this document)
- [x] `docs/privacy-policy.md`
- [x] `docs/terms-of-service.md`
- [x] `docs/store-listing.md`
- [x] `docs/versioning-strategy.md`
- [x] `docs/data-deletion.md`
- [x] `docs/permissions-audit.md`
- [x] `docs/age-rating.md`
- [x] CHANGELOG.md updated

## Post-Release

- [ ] Merge PR into `main`
- [ ] Push tag to `origin`
- [ ] Create GitHub Release with changelog
- [ ] Verify production deployment on Vercel
- [ ] Open Play Store submission (if applicable)
- [ ] Notify users of new version (Settings → About)

## Emergency Rollback

If the release introduces critical issues:

```bash
git revert HEAD
git push origin main
```

For Android, unpublish the release APK/AAB from Play Store and distribute the previous version.
