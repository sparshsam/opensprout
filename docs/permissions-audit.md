# OpenSprout Permissions Audit

**Last updated:** June 21, 2026  
**Version:** 0.9.2

---

## 1. Summary

OpenSprout requests the minimum permissions necessary for core app functionality. No unnecessary permissions are requested. This document catalogs every permission, its purpose, user-facing rationale, and security boundary.

## 2. Web App Permissions

| Permission | Requested | Purpose | User Rationale | When Triggered |
|------------|-----------|---------|----------------|----------------|
| Camera | Yes (optional) | Take plant photos within the app | "OpenSprout needs camera access to take plant photos. Photos are only uploaded when you explicitly save them." | User taps camera button in photo picker |
| Notifications | Yes (optional) | Care task reminders | "OpenSprout would like to send you care reminders for your plants. You can adjust these anytime in Settings." | User enables Reminders in Settings |
| Microphone | No | N/A | N/A | N/A |
| Location | No | N/A | N/A | N/A |
| Contacts | No | N/A | N/A | N/A |
| Storage/Photos (web) | Yes (implicit) | Upload photos from device gallery | Used via the standard file picker — the browser handles the permission prompt | User taps gallery button in photo picker |

### Rationale for No Location Permission

OpenSprout does not use location services. Plant care schedules use user-configured timezones (set manually in the profile), not device GPS. This is an intentional privacy decision.

## 3. Android App Permissions

| Permission | Requested | Purpose | User Rationale | When Triggered |
|------------|-----------|---------|----------------|----------------|
| `CAMERA` | Yes (optional) | Take plant photos | Permission dialog: "Allow OpenSprout to take pictures?" | User taps camera button |
| `POST_NOTIFICATIONS` (Android 13+) | Yes (optional) | Care task reminders | System permission dialog | User enables Reminders |
| `READ_MEDIA_IMAGES` (Android 13+) | Yes (optional) | Pick plant photos from gallery | System permission dialog via Capacitor | User taps gallery button |
| `READ_EXTERNAL_STORAGE` (Android 12 and below) | Yes (optional) | Pick plant photos from gallery | System permission dialog via Capacitor | User taps gallery button |
| `INTERNET` | Yes (required) | Sync data with Supabase backend | Required for app functionality | Always (online mode) |
| `ACCESS_NETWORK_STATE` | Yes (required) | Detect online/offline status | Required for sync status display | App startup |
| `VIBRATE` | Yes (optional) | Haptic feedback on interactions | Subtle haptic feedback for UI interactions | Various interactions |
| `SCHEDULE_EXACT_ALARM` (Android 13+) | Yes (optional) | Trigger care reminders at exact times | Permission dialog: "Allow OpenSprout to schedule exact alarms?" | User enables Reminders |
| `USE_EXACT_ALARM` (Android 12) | Yes (optional) | Trigger care reminders at exact times | System permission dialog | User enables Reminders |
| `RECEIVE_BOOT_COMPLETED` | Yes (optional) | Reschedule reminders after device restart | Handled by Capacitor Local Notifications plugin | Automatic |
| `FOREGROUND_SERVICE` | No | N/A — no foreground service needed | N/A | N/A |
| `ACCESS_FINE_LOCATION` | No | N/A | N/A | N/A |
| `ACCESS_COARSE_LOCATION` | No | N/A | N/A | N/A |
| `READ_CONTACTS` | No | N/A | N/A | N/A |
| `RECORD_AUDIO` | No | N/A | N/A | N/A |
| `READ_PHONE_STATE` | No | N/A | N/A | N/A |

### Capacitor Plugin Audit

| Capacitor Plugin | Permissions Used | Data Access |
|-----------------|------------------|-------------|
| `@capacitor/camera` | Camera, photo gallery | Temporary photo data — only saved to storage when user explicitly saves |
| `@capacitor/local-notifications` | Notifications, exact alarm | None (no network data sent) |
| `@capacitor/app` | None | None |

## 4. Network Access Audit

| Destination | Purpose | Data Sent | TLS |
|-------------|---------|-----------|-----|
| `*.supabase.co` | Authentication, database, storage, edge functions | Auth tokens, plant data, photos | Yes |
| `identify.plantnet.org` | Plant identification API (if enabled) | Plant photo in request | Yes |
| `opensprout.vercel.app` | Web app hosting (static assets) | None (static site) | Yes |

## 5. iOS Permissions (Future)

| Permission | Status | Notes |
|------------|--------|-------|
| NSCameraUsageDescription | Planned | "OpenSprout needs camera access to take plant photos." |
| NSPhotoLibraryUsageDescription | Planned | "OpenSprout needs photo library access to attach photos to your plant journal." |
| UNUserNotificationCenter | Planned | Care reminder notifications |

## 6. Permissions Policy (HTTP Headers)

The web app enforces additional permissions restrictions via CSP headers:

```
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

This means the web version **cannot** access the microphone or geolocation at all, and camera access is restricted to explicit user action via the browser's media picker (not raw camera stream).

## 7. Recommendations

- **No changes needed** — current permissions are minimal and well-scoped.
- Android notification permission requests include rationale text before the system dialog.
- Camera permission is requested lazily (only when user taps the camera button), not at app startup.
