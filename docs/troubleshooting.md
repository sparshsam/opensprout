# OpenSprout — Troubleshooting Guide

**Version:** 0.9.14

---

## Web App

### App won't load / white screen

1. Check your internet connection
2. Clear browser cache and reload (`Ctrl+F5` or DevTools → Application → Clear storage)
3. Try a private/incognito window
4. Check if sprout.kovina.org is accessible

### Login fails

1. Verify email and password
2. Use "Forgot password" if needed
3. Check spam folder for confirmation email (new accounts)
4. Ensure Supabase project is active

### Data not syncing

1. Check the sync status indicator (top bar cloud icon)
2. Go to Profile → check "Sync Status"
3. Ensure you're online
4. Try refreshing the page

### Slow performance

1. Close unused browser tabs
2. Check if you have many plants (100+ may affect load times)
3. Clear IndexedDB cache: Profile → Clear Cache
4. Reinstall the app

---

## Android App

### Build fails

| Error | Solution |
|-------|----------|
| `Keystore file not found` | Generate keystore: `keytool -genkey -v -keystore opensprout-release.keystore -alias opensprout -keyalg RSA -keysize 2048 -validity 10000` |
| `SDK location not found` | Create `android/local.properties` with `sdk.dir=/path/to/Android/Sdk` |
| `java not found` | Install JDK 17+: `brew install openjdk@17` |
| Gradle build fails | Run `./gradlew --stop` then retry. Check `gradle.properties` for memory settings. |

### App crashes on launch

1. Ensure minSdk 24 (Android 7.0+) is met
2. Clear app data: Settings → Apps → OpenSprout → Storage → Clear data
3. Reinstall the APK
4. Check logcat: `adb logcat | grep -i opensprout`

### Camera not working

1. Grant camera permission in Settings → Apps → OpenSprout → Permissions
2. On Android 13+, camera permission is requested when you first take a photo
3. If denied, reinstall and grant permission when prompted

### Notifications not appearing

1. Android 13+: Grant `POST_NOTIFICATIONS` permission when prompted
2. Check notification settings: Settings → Apps → OpenSprout → Notifications
3. Verify reminders are enabled in Profile → Reminders

---

## Windows PWA

### Can't install PWA

1. Use Microsoft Edge or Google Chrome (Firefox doesn't support PWA on desktop)
2. Look for the install icon in the address bar
3. Or: ⋮ → Apps → Install this site as an app

### App doesn't launch in standalone mode

1. Uninstall and reinstall the PWA
2. Clear Edge/Chrome browser data
3. Ensure the PWA manifest loads correctly: DevTools → Application → Manifest

### Offline mode not working

1. Visit the app while online first (caches the app shell)
2. Service worker must be registered: DevTools → Application → Service Workers
3. Clear service worker cache: DevTools → Application → Storage → Clear site data

---

## Common Issues

### "App configuration is missing" error

Supabase environment variables are not set. Ensure `.env.local` contains:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

### Plant identification fails

1. Ensure the photo is clear and well-lit
2. PlantNet API requires an internet connection
3. Some plants may not be in the PlantNet database
4. Try cropping the photo to focus on leaves/flowers

### Export fails

1. Ensure you're online (export reads from Supabase)
2. Check that your account has data to export
3. Try again after refreshing the page

---

## Getting Help

- **Support page:** sprout.kovina.org/support
- **GitHub issues:** github.com/sparshsam/opensprout/issues
- **Documentation:** docs/ directory in the repository
