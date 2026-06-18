# OpenSprout Android Build Guide

> **Status:** Standalone APK/AAB ready. Play Store submission prep not started.

## Architecture

OpenSprout uses [Capacitor](https://capacitorjs.com) (v8.x) to wrap the Next.js web app in a native Android WebView. The Next.js app is fully **statically exported** — no Node.js server needed on device. All data flows through Supabase Auth + RLS directly from the browser client. The same Supabase project serves both web and Android.

```
opensprout/apps/web/
├── capacitor.config.ts     ← Capacitor configuration (webDir: "out")
├── next.config.ts          ← output: "export" when CAPACITOR_BUILD=true
├── out/                    ← Static export output (gitignored)
├── android/                ← Native Android project (generated)
└── src/                    ← Next.js app (shared with web)
```

## Prerequisites

- Node.js >= 20.11.0
- Android Studio (for emulator/device builds and SDK)
- A Supabase project with the OpenSprout schema applied
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `apps/web/.env.local` (for local development only — these are inlined at build time for mobile)

## Quick Start (Development)

Run the Next.js dev server with Capacitor live reload for instant HMR on device:

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2 (after dev server is ready): Launch Android with live reload
npm run cap:dev:android
```

This uses Capacitor's `-l` flag to serve from the dev server automatically.

## Standalone APK (No Server Needed)

These commands produce a fully self-contained APK with no dependency on `localhost:3000`. The Next.js app is statically exported at build time, and Capacitor serves the static files directly from the APK.

### Debug APK

```bash
npm run android:debug
```

This runs: `CAPACITOR_BUILD=true next build && npx cap copy android && cd android && ./gradlew assembleDebug`

Output: `apps/web/android/app/build/outputs/apk/debug/app-debug.apk`

### Release AAB (unsigned)

```bash
npm run android:release:bundle
```

This runs: `CAPACITOR_BUILD=true next build && npx cap copy android && cd android && ./gradlew bundleRelease`

Output: `apps/web/android/app/build/outputs/bundle/release/app-release.aab`

### Manual Android Studio flow

```bash
# 1. Build static export + sync to Android
npm run build:mobile

# 2. Open Android Studio
npm run cap:open:android

# 3. In Android Studio: Build → Build Bundle(s) / APK(s)
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run build:mobile` | Static export → `out/` → `npx cap sync` |
| `npm run cap:sync` | Sync web assets to Android project |
| `npm run cap:open:android` | Open Android Studio |
| `npm run cap:dev:android` | Dev mode with live reload (needs `npm run dev`) |
| `npm run android:debug` | Full debug APK build |
| `npm run android:release:bundle` | Full release AAB build (unsigned) |

## Android Permissions

OpenSprout v0.4+ uses the Capacitor Camera plugin for photo capture and gallery selection. The following permissions are declared in `android/app/src/main/AndroidManifest.xml`:

| Permission | Purpose | Required |
|---|---|---|
| `CAMERA` | Take photos of plants | Yes, for camera capture |
| `READ_MEDIA_IMAGES` | Select photos from gallery (Android 13+) | Yes, for gallery picker |
| `READ_EXTERNAL_STORAGE` | Select photos from gallery (Android 12 and below) | Yes, for gallery picker |

Capacitor's Camera plugin handles permission requests at runtime. Users will see a system prompt the first time they tap the Camera button.

If the camera feature is not needed, the permission request is never triggered — the Gallery button falls back gracefully to the file picker on web.

## Dependencies

| Package | Purpose |
|---|---|
| `@capacitor/camera` ^8.x | Camera capture + gallery picker |

## How Static Export Works

The `CAPACITOR_BUILD=true` environment variable causes Next.js to:

1. Set `output: 'export'` — generates static HTML in `out/`
2. Set `images: { unoptimized: true }` — SVG images work natively
3. Set `trailingSlash: true` — routes become `/today/index.html`
4. Skip security headers (CSP, etc. — `vercel.json` handles those for web)

Capacitor's `webDir: "out"` points to the static export output. The Android WebView loads from `file:///android_asset/public/` — no network required.

## App Identity

| Property | Value |
|---|---|
| App ID | `com.sparshsam.opensprout` |
| App name | OpenSprout |
| Min SDK | 23 (Android 6.0) |
| Target SDK | 34 (Android 14) |

Defined in:
- `apps/web/capacitor.config.ts` — appId, appName
- `apps/web/android/app/src/main/res/values/strings.xml` — app_name, package_name

## Placeholder Assets

Current placeholder assets under `apps/web/android/app/src/main/res/`:

| Asset | Status | Notes |
|---|---|---|
| App icon (adaptive) | ✅ Placeholder | Green background with white sprout vector |
| Splash screen | ✅ Placeholder | Uses `splashBackground` color (#f8fbf9) |
| Theme colors | ✅ Placeholder | OpenSprout green (#16784f) |

Replace with proper assets before Play Store submission:

```bash
npx @capacitor/assets generate --icon source-icon.png --splash source-splash.png --android
```

## Supabase Sync

Web and Android share the same Supabase project. The Auth session is stored in the Capacitor WebView's local storage — users log in once and the session persists across app restarts.

```typescript
// apps/web/src/lib/supabase/browser.ts — used by both web and Android
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
return createBrowserClient<Database>(url, key);
```

`NEXT_PUBLIC_*` variables are inlined at build time by Next.js. Set them in `.env.local` before building the mobile APK — the values will be baked into the output.

## Build Configuration

### Environment Variables at Build Time

Set these before running any `android:*` build:

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
npm run android:debug
```

Or create `apps/web/.env.local` with the values (`.env.local` is gitignored):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### Gradle Configuration

Key Android build settings live in `apps/web/android/variables.gradle`:
- `minSdkVersion` — 23
- `targetSdkVersion` — 34
- `compileSdkVersion` — 34

## Troubleshooting

### WebView shows blank screen
Ensure `.env.local` has valid Supabase credentials. Check Logcat in Android Studio: `adb logcat | grep -i webview`.

### `out/` directory missing
Run `npm run build:mobile` first. The `out/` directory is gitignored.

### Gradle build fails on SDK version
Install the required SDK versions in Android Studio: SDK Manager → SDK Platforms → check Android 14 (API 34).

## Play Store Preparation (not yet started)

When ready to submit:

1. Generate a release keystore:
   ```bash
   keytool -genkey -v -keystore opensprout-release.keystore \
     -alias opensprout -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Configure `android.signingConfigs` in `apps/web/android/app/build.gradle`
3. Create `apps/web/android/keystore.properties` (gitignored)
4. Run `npm run android:release:bundle`
5. Upload `app-release.aab` to Play Console
6. Enable Google Play App Signing

See [Capacitor Publishing to Google Play](https://capacitorjs.com/docs/guides/deploying-to-google-play) for the full guide.
