# OpenSprout Update Mechanisms

**Last updated:** June 21, 2026

---

## 1. Web Deployment (Vercel)

### Primary Flow

The web app at [opensprout.vercel.app](https://opensprout.vercel.app) is automatically deployed via Vercel on every push to `main`:

1. Push to `main` on GitHub
2. Vercel detects the push (linked to the GitHub repository)
3. Vercel runs `npm run build` (which outputs to `.next/`)
4. Static assets are deployed to Vercel's global CDN
5. Deployment is complete within 1-2 minutes

### Rollback

To roll back a web deployment:
1. Go to Vercel Dashboard → OpenSprout → Deployments
2. Find the last known-good deployment
3. Click the three-dot menu → Promote to Production

### Zero-Downtime

Vercel provides instant switching between deployments — no downtime during updates.

## 2. Android Update Path (Capacitor)

### Current Method: Manual Distribution

Android builds are created via the Capacitor build pipeline and distributed manually.

### Build Process

```bash
# Full build pipeline
npm run build:mobile   # Static export via Next.js
npx cap sync           # Sync web assets to Android
# Open in Android Studio for APK/AAB generation
npx cap open android
```

### Android Versioning

Android version tracking is separate from the web release:

- **versionName:** Matches semver (e.g., `0.9.2`)
- **versionCode:** Incrementing integer for Play Store

These are configured in `apps/web/android/app/build.gradle.kts`.

### Update Distribution

#### Option A: Google Play Store (Recommended)
1. Build signed AAB: `cd android/ && ./gradlew bundleRelease`
2. Upload to Google Play Console
3. Roll out to Internal Testing → Closed Testing → Production
4. Users receive automatic updates via Play Store

#### Option B: Direct APK Distribution
1. Build signed APK: `cd android/ && ./gradlew assembleRelease`
2. Share the APK directly (GitHub Releases, email, etc.)
3. Users must manually install the APK

### In-App Update Check

Currently, OpenSprout does not include an in-app update checker for the Android build. Users must update via Play Store or manual APK installation.

## 3. MCP Package Release Path (apps/mcp)

The MCP server lives at `apps/mcp/` and is distributed as a standalone package.

### Build and Release

```bash
cd apps/mcp
npm run build        # Compile TypeScript
npm pack             # Create .tgz package
```

### Distribution Channels

1. **GitHub Releases:** Published alongside main app releases
2. **npm (future):** Could be published as `@sparshsam/opensprout-mcp`
3. **Direct clone:** Users can clone the repo and run directly

### Version Sync

MCP package versions are independent from the web/Android versions. They follow their own semver based on the MCP tool API surface.

## 4. Database Schema Updates

Schema changes are applied via Supabase migrations:

```bash
npx supabase db push
```

Migrations are reviewed and tested before merging to `main`. Schema changes are:
- Applied before deploying updated app code
- Always backward-compatible for at least one minor version
- Documented in `supabase/migrations/` with timestamp prefix

## 5. Version Compatibility Matrix

| App Version | Min DB Schema | Min MCP Version | Notes |
|-------------|---------------|-----------------|-------|
| 0.9.x | Any | Any | Pre-release, APIs may change |
| 1.0.0 (future) | 1 | 1.0.0 | First stable API surface |

During v0.x development, forward compatibility is not guaranteed but we strive to document breaking changes.

## 6. Update Notification

Currently no in-app update notification exists. Users are informed of new versions via:
- GitHub Releases notifications (if watching the repo)
- This changelog (`CHANGELOG.md`)
- Release tags on GitHub (`v0.9.0`, `v0.9.1`, etc.)

A future version may add:
- In-app update banner for web
- Android in-app update API integration
- Release notes display in Settings
