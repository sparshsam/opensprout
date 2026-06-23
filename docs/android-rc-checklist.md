# OpenSprout Android Release-Candidate Checklist — v0.9.13

**Version:** 0.9.13 (Version Code: 2)  
**Target:** Android RC validation for internal testing  
**Status:** ⬜ Not Started  

---

## 1. Local Build Commands

All commands run from `/home/spars/repos/opensprout/` (root package).

| Command | What It Does |
|---------|-------------|
| `npm run android:debug` | Debug APK — `CAPACITOR_BUILD=true next build && npx cap copy android && cd android && ./gradlew assembleDebug` |
| `npm run android:release` | Release AAB (unsigned) — `CAPACITOR_BUILD=true next build && npx cap copy android && cd android && ./gradlew bundleRelease` |
| `npm run rc:android` | Shortcut — runs `npm run android:debug` |
| `npm run android:sync` | Syncs Capacitor plugins — runs `npx cap sync` (via `apps/web`) |
| `npm run android:open` | Opens project in Android Studio |
| `npm run build:mobile` | Static Next.js export + `npx cap sync` (no Gradle build) |

**Prerequisite:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must be set in `apps/web/.env.local` before any build.

- [ ] Debug APK builds successfully (`npm run android:debug`)
- [ ] Release AAB builds successfully (`npm run android:release`)

---

## 2. Build Artifacts

| Artifact | Path | Type |
|----------|------|------|
| Debug APK | `apps/web/android/app/build/outputs/apk/debug/app-debug.apk` | Direct install (unsigned debug key) |
| Release AAB | `apps/web/android/app/build/outputs/bundle/release/app-release.aab` | Play Store upload (currently unsigned) |

- [ ] Debug APK installs on device
- [ ] Release AAB produces no build errors

---

## 3. Signing Status

**Current State: Unsigned**

No keystore exists at `apps/web/android/` or `apps/web/android/app/`. All builds use the default Android debug keystore. The release AAB cannot be submitted to Play Store without a release key.

**To set up signing:**

```bash
# 1. Generate a release keystore (one-time)
keytool -genkey -v -keystore apps/web/android/opensprout-release.keystore \
  -alias opensprout -keyalg RSA -keysize 2048 -validity 10000

# 2. Create apps/web/android/keystore.properties (gitignored — never commit)
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=opensprout
storeFile=opensprout-release.keystore

# 3. Add signing config to apps/web/android/app/build.gradle
#    See https://capacitorjs.com/docs/guides/deploying-to-google-play
```

- [ ] Release keystore generated
- [ ] `keystore.properties` created and gitignored
- [ ] `build.gradle` signing config added
- [ ] Signed release AAB builds successfully

---

## 4. Version Info

| Property | File | Value |
|----------|------|-------|
| App ID (applicationId) | `apps/web/android/app/build.gradle` | `com.sparshsam.opensprout` |
| App name | `apps/web/capacitor.config.ts` | `OpenSprout` |
| Version name | `apps/web/android/app/build.gradle` | `0.9.13` |
| Version code | `apps/web/android/app/build.gradle` | `2` |
| Min SDK | `apps/web/android/variables.gradle` | `24` (Android 7.0) |
| Target SDK | `apps/web/android/variables.gradle` | `36` (Android 16) |
| Compile SDK | `apps/web/android/variables.gradle` | `36` (Android 16) |
| Capacitor version | `apps/web/package.json` | `^8.4.0` |
| Deep link scheme | `apps/web/android/app/src/main/AndroidManifest.xml` | `opensprout://` |

- [ ] Version name is `0.9.13` and version code is `2`
- [ ] Version code is incremented from previous release

---

## 5. Permissions to Verify

### Declared in AndroidManifest.xml

| Permission | Source | Status |
|-----------|--------|--------|
| `android.permission.INTERNET` | `AndroidManifest.xml` line 47 | ✅ Declared statically |

**Note:** `CAMERA`, `POST_NOTIFICATIONS`, `READ_MEDIA_IMAGES`, and `READ_EXTERNAL_STORAGE` are **NOT** declared in the manifest. Capacitor's Camera and LocalNotifications plugins request these at runtime via the plugin framework — the system prompts appear on first-use.

### Runtime Permissions (requested by Capacitor plugins)

| Permission | Purpose | Triggered When |
|-----------|---------|---------------|
| `CAMERA` | Taking plant photos | User taps "Camera" in photo picker |
| `READ_MEDIA_IMAGES` (Android 13+) | Selecting from gallery | User taps "Gallery" in photo picker |
| `READ_EXTERNAL_STORAGE` (Android ≤12) | Selecting from gallery | User taps "Gallery" in photo picker |
| `POST_NOTIFICATIONS` (Android 13+) | Care reminder notifications | First time a notification is scheduled |

- [ ] Camera permission prompt appears when taking a photo (Android 13+)
- [ ] Gallery permission prompt appears when picking from gallery (Android 13+)
- [ ] Notification permission prompt appears when scheduling first reminder (Android 13+)
- [ ] All permissions can be denied gracefully (app doesn't crash, features degrade gracefully)
- [ ] Camera/gallery features work on Android 7.0 (API 24 — minSdk)
- [ ] Camera/gallery features work on Android 16 (API 36 — targetSdk)
- [ ] Permissions are re-requested correctly if initially denied

---

## 6. Notification Tests

Local Notifications configured with:
- `smallIcon`: `ic_stat_sprout`
- `iconColor`: `#16784f` (OpenSprout green)

No custom notification icon image found in the project — the Android system fallback may display a generic icon. If `ic_stat_sprout` is not an actual drawable resource, notifications may render with a missing/white icon.

- [ ] Notifications plugin is installed (`@capacitor/local-notifications@^8.2.0`)
- [ ] Notification permission is requested on first use
- [ ] Notification is delivered at scheduled time
- [ ] Notification tap opens the app
- [ ] Notification icon renders correctly (white sprout on green)
- [ ] Notification content/actions work as expected
- [ ] Multiple notifications stack correctly
- [ ] Notification cancellation works
- [ ] App works with notifications denied

---

## 7. Camera/Gallery Tests

Camera plugin: `@capacitor/camera@^8.2.0`

- [ ] Camera plugin is installed and synced
- [ ] "Take Photo" opens the device camera
- [ ] Captured photo is displayed in the app
- [ ] "Choose from Gallery" opens the photo picker
- [ ] Selected photo is displayed in the app
- [ ] Camera works in both portrait and landscape orientations
- [ ] App handles camera denial gracefully (shows explanation, no crash)
- [ ] App handles gallery denial gracefully
- [ ] Photos are uploaded to Supabase correctly (if applicable)

---

## 8. Auth Redirect Tests

Deep link scheme configured: `opensprout://`

Defined in `AndroidManifest.xml`:
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="opensprout" />
</intent-filter>
```

Capacitor config also sets:
- `androidScheme: "https"`
- `cleartext: true`
- `allowNavigation: ["opensprout://*"]`

- [ ] Auth flow completes using `opensprout://` redirect
- [ ] Deep links open the app correctly when triggered from browser/email
- [ ] Supabase auth callback uses the custom scheme
- [ ] OAuth providers (if any) redirect back to the app
- [ ] Session persists across app restarts
- [ ] App handles invalid deep links gracefully
- [ ] `android:launchMode="singleTask"` prevents duplicate activity instances (verified)

---

## 9. Offline Tests

- [ ] App installs and launches without network
- [ ] Previously loaded data is visible (if cached via `idb`)
- [ ] App shows appropriate offline state/indicator
- [ ] No crash loops when offline
- [ ] App recovers correctly when network is restored
- [ ] Login page renders without network (if user is already authenticated with cached session)
- [ ] Action buttons are disabled or show appropriate messaging when offline

---

## 10. Real-Device Test Plan

Test on a minimum of:
- **One device running Android 7.0 (API 24)** — minSdk
- **One device running Android 16 (API 36)** — targetSdk
- **One mid-range device** (e.g., Pixel 6 / Galaxy A series)
- **One device with notch/punch-hole display**

### Test Scenarios

| # | Scenario | Expected Result | Pass/Fail |
|---|----------|----------------|-----------|
| 1 | Clean install from debug APK | App launches to login/onboarding | ⬜ |
| 2 | Create account / Log in | Auth flow completes, lands on dashboard | ⬜ |
| 3 | Navigate all tabs (Today, Plants, Calendar, Settings, etc.) | No crashes, proper rendering | ⬜ |
| 4 | Add a plant | Form works, plant appears in list | ⬜ |
| 5 | Take photo of plant | Camera opens, photo attaches | ⬜ |
| 6 | Schedule care reminder | Notification appears at scheduled time | ⬜ |
| 7 | Mark care task as complete | Task is marked done, logged in history | ⬜ |
| 8 | Deep link from browser/email | Opens app to correct screen | ⬜ |
| 9 | Rotate device | Layout adapts, no content loss | ⬜ |
| 10 | Background → foreground | App resumes without reloading | ⬜ |
| 11 | Kill app → relaunch | App starts fresh, session restored | ⬜ |
| 12 | Low battery / low storage | No performance degradation or crash | ⬜ |
| 13 | Splash screen | Displays on launch (background #f8fbf9) | ⬜ |
| 14 | Splash screen auto-hides | Transitions to app content | ⬜ (note: `launchAutoHide=false` — verify manual hide) |
| 15 | App icon (adaptive) | White sprout on green (#16784f) background | ⬜ |

### Splash Screen Details
- Background color: `#f8fbf9` (configured in `capacitor.config.ts`)
- `launchAutoHide: false` — app must manually hide splash via `SplashScreen.hide()`
- All densities covered: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
- Both orientations: portrait and landscape

### Adaptive Icon Details
- Foreground: `drawable-v24/ic_launcher_foreground.xml` — white sprout in a pot
- Background: `drawable/ic_launcher_background.xml` — solid `#16784f` green
- Format: Vector XML (adaptive icon, API 26+)

- [ ] All test scenarios pass on at least one device per API level

---

## 11. Play Console Prep Items

Not yet started. Items needed for store submission:

| Item | Status | Notes |
|------|--------|-------|
| Developer account | ⬜ | Register at play.google.com/console (one-time $25 fee) |
| App signing key | ⬜ | Generate keystore (see Section 3) |
| Signed release AAB | ⬜ | Build with signing config |
| App icon (512x512) | ⬜ | High-res icon for store listing |
| Feature graphic (1024x500) | ⬜ | Required for store listing |
| Screenshots (2+ phones, 7" tablet, 10" tablet) | ⬜ | See `docs/store-listing.md` for existing assets |
| App description (short + full) | ⬜ | Draft in `docs/store-listing.md` |
| Privacy policy URL | ⬜ | Must be publicly hosted — `docs/privacy-policy.md` exists |
| Categorization | ⬜ | Lifestyle / Gardening |
| Content rating questionnaire | ⬜ | See `docs/age-rating.md` |
| Data Safety section | ⬜ | **Not prepared** (see Section 12) |
| Release notes (What's New) | ⬜ | Draft from CHANGELOG.md |
| Google Play App Signing | ⬜ | Enable after first upload |

---

## 12. Data Safety Notes

**No data safety section has been prepared.** This is required for Play Store listing.

The app uses Supabase for auth and data storage. Key considerations:

| Data Type | Collected? | Purpose | Shared? |
|-----------|-----------|---------|---------|
| Email (auth) | Yes (Supabase Auth) | Account creation and login | No |
| Plant photos | Yes (user-uploaded) | Plant journal and identification | No |
| Plant data (names, species, notes) | Yes | Core app functionality | No |
| Care schedules & logs | Yes | Core app functionality | No |
| Device identifiers | No | — | — |
| Precise location | No | — | — |
| Analytics / crash data | No | Privacy-first: no analytics SDKs | — |
| Advertising data | No | — | — |

- [ ] Data safety section drafted for Play Console
- [ ] Data safety section accurately reflects no analytics, no third-party data sharing
- [ ] Privacy policy covers all collected data types

---

## 13. Known Blockers

| # | Blocker | Severity | Status |
|---|---------|----------|--------|
| 1 | **No release keystore** — cannot produce a signed AAB for Play Store | 🔴 Critical | Open |
| 2 | **No google-services.json** — Push Notifications (FCM) not available; `build.gradle` skips plugin gracefully | 🟡 Medium | By design — not needed yet |
| 3 | **No data safety section prepared** — required for Play Store listing | 🟡 Medium | Open |
| 4 | **`ic_stat_sprout` small icon** — not found as a drawable resource; verify it exists or notification icon may be missing | 🟡 Medium | Needs verification |
| 5 | **Splash screen `launchAutoHide=false`** — app code must call `SplashScreen.hide()` manually; if missing, splash hangs | 🟡 Medium | Needs verification |
| 6 | **Minified/ProGuard** — `minifyEnabled false` in release build type; APK will be larger and less protected | 🟢 Low | Acceptable for v0.9.13 |
| 7 | **No CAMERA permission in manifest** — Capacitor requests at runtime (correct), but some third-party launchers may pre-deny | 🟢 Low | Monitor during testing |
| 8 | **`cleartext: true`** — allows HTTP traffic; acceptable during development but should be reviewed before production | 🟢 Low | Note for future |

---

## Summary

**Date:** June 23, 2026  
**RC Version:** 0.9.13 (v2)  
**Build Status:** Debug APK: ⬜ | Release AAB: ⬜ | Signed: ❌  
**Device Testing:** ⬜  
**Play Store Ready:** ❌  

### Pre-Submission Checklist

- [ ] All 13 checklist sections reviewed
- [ ] Blockers resolved or acknowledged
- [ ] RC build fully tested on real devices
- [ ] Signed release AAB produced
- [ ] Play Console submission ready
