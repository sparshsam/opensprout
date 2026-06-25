# OpenSprout — v1.0 Migration Notes

**Version:** 0.9.14 → 1.0  
**Last updated:** 2026-06-25

---

## Overview

This document covers the migration from v0.9.x to v1.0. v1.0 is the first stable release with production signing, store submission, and platform support.

## What's New in v1.0

- **Production signed Android builds** — AAB and APK signed with release keystore
- **Play Store ready** — Data safety section, age rating, store listing assets
- **Windows PWA support** — MSIX packaging guide, Microsoft Store submission prep
- **PWA hardening** — Install prompt, update notification, offline recovery, improved caching
- **Release automation** — `scripts/bump-version.mjs` for version management
- **Performance** — Minified release builds (3.8MB APK, 52% smaller)
- **Reliability** — Exponential backoff retry, user-scoped sync guards, improved offline queue
- **Documentation** — FAQ, troubleshooting, offline behavior guide, secret rotation docs

## Breaking Changes

### Database Schema
- **No schema changes** from v0.9.14 to v1.0. All existing data is compatible.

### API / MCP
- **MCP API remains stable** — 28 tools, same endpoints, token auth unchanged.

### Android
- **New signing key** — the production keystore is different from debug key. You may need to uninstall the debug APK before installing the signed release APK.
- **Min SDK unchanged** — API 24 (Android 7.0)
- **Target SDK** — API 36 (Android 16)

## Upgrade Steps

### Web (sprout.kovina.org)
1. No user action required — auto-deployed via Vercel
2. The service worker will prompt "Update available" when a new version is detected
3. Click "Update" to reload with the latest version

### Android (from debug APK to signed release)
1. **Uninstall the debug APK** (different signing key prevents upgrade)
2. Download the signed release APK from GitHub Releases
3. Install and log in

### Android (signed release → future signed release)
1. Future signed builds will use the same keystore
2. Upgrade-in-place will work

### Windows PWA
1. Reinstall the PWA from the new deployment
2. Or install the MSIX package (see `docs/windows-packaging-guide.md`)

## Rollback

- **Web:** Vercel retains deployment history. Rollback from Vercel dashboard.
- **Android:** Reinstall the previous APK (uninstall current version first if signing key differs).
- **Windows:** Uninstall PWA, install previous version from browser.

## Data Safety

- Your data remains in Supabase across all versions
- No data migration needed
- Downgrade is safe — no schema changes
