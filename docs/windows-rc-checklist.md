# OpenSprout Windows RC Checklist — v0.9.13

**Version:** 0.9.13  
**Platform:** Windows (PWA via Edge / Chrome)  
**Status:** ⬜ Not Started

> OpenSprout is delivered as a Progressive Web App (PWA) on Windows. There is no native Windows wrapper. This checklist covers PWA validation on Windows and Microsoft Store packaging options.

---

## 1. PWA Installation

### Prerequisites

- Windows 10 or 11
- Microsoft Edge (recommended) or Google Chrome
- Latest build deployed at https://opensprout.vercel.app

### Installation Steps — Edge

1. Open https://opensprout.vercel.app in Microsoft Edge
2. Click the **Install** icon in the address bar (or ⋮ → Apps → Install this site as an app)
3. Confirm the app name "OpenSprout" and click **Install**
4. The PWA opens in a standalone window
5. Pin to taskbar or Start menu as desired

### Installation Steps — Chrome

1. Open https://opensprout.vercel.app in Google Chrome
2. Click the **Install** icon in the address bar (or ⋮ → Cast, save, and share → Install page as app)
3. Confirm the app name "OpenSprout" and click **Install**
4. The PWA opens in a standalone window

---

## 2. PWA Manifest Validation

| Property | Current Value | Status | Notes |
|----------|---------------|--------|-------|
| `name` | OpenSprout | ✅ | |
| `short_name` | OpenSprout | ✅ | |
| `description` | Free and open-source plant care tracking. | ✅ | |
| `start_url` | / | ✅ | |
| `display` | standalone | ✅ | No browser chrome in PWA mode |
| `background_color` | #f8fbf9 | ✅ | Matches web background |
| `theme_color` | #16784f | ✅ | Primary brand green |
| Icon 192x192 | /icons/icon-192.png present | ✅ | |
| Icon 512x512 | /icons/icon-512.png present | ✅ | `purpose: any maskable` |
| Icon 1024x1024 | /icons/icon.png present | ✅ | |

### Verification Steps

- [ ] Open DevTools → Application → Manifest
- [ ] Confirm all manifest fields match the table above
- [ ] Confirm installability warning is absent ("no matching service worker" would be a blocker)

---

## 3. Service Worker Validation

| Property | Current Value | Status | Notes |
|----------|---------------|--------|-------|
| Cache name | opensprout-v0.2.0 | ✅ | Update version when deploying |
| Strategy | Network-first with cache fallback | ✅ | |
| App shell | /, /manifest.webmanifest, /icons/icon.svg | ✅ | |
| skipWaiting on install | ✅ | |
| clientsClaim on activate | ✅ | |

### Verification Steps

- [ ] Open DevTools → Application → Service Workers
- [ ] Confirm service worker is registered and active
- [ ] Confirm cache storage contains app shell resources
- [ ] Disconnect network, reload page — cached content should display
- [ ] Reconnect, refresh — live content should load (network-first strategy)

---

## 4. Offline Behavior

| Scenario | Expected | Status | Notes |
|----------|----------|--------|-------|
| Install, disconnect, open app | App shell loads from cache | ⬜ | |
| Navigate to cached page | Content displays from cache | ⬜ | |
| Form submission offline | Fails gracefully (auth required) | ⬜ | No background sync configured |
| Reconnect | Live content loads | ⬜ | |

---

## 5. Browser Support

| Browser | PWA Support | Status | Notes |
|---------|-------------|--------|-------|
| Microsoft Edge | ✅ Full PWA support | ✅ | Recommended for Windows |
| Google Chrome | ✅ Full PWA support | ✅ | |
| Mozilla Firefox | ❌ No PWA support on desktop | ⚠️ | Falls back to regular browser tab |
| Opera | ⚠️ Partial PWA support | ⬜ | Not tested |
| Brave | ✅ Chromium-based, PWA works | ⬜ | Not tested |

---

## 6. Notifications

| Capability | Status | Notes |
|------------|--------|-------|
| Push notifications | ❌ Not supported | No Firebase Cloud Messaging configured |
| Local notifications | ❌ Not available in PWA context | Capacitor LocalNotifications plugin requires native wrapper |
| Web notification API | ⚠️ Not implemented | Not currently used in the app |

**Gap:** Notifications are not available on Windows PWA. This is a known limitation.
Users rely on the web app's in-app task list for care reminders.

---

## 7. File & Photo Limitations

| Capability | Status | Notes |
|------------|--------|-------|
| File upload (gallery) | ✅ Works via `<input type="file">` | Standard HTML file picker |
| Drag and drop | ✅ Works | HTML5 drag-and-drop |
| Camera capture | ❌ Not available | `camera=()` restriction in CSP + PWA limitations |
| Clipboard paste | ⚠️ Not tested | May work for image paste |

**Note:** The CSP in `vercel.json` sets `camera=()` in `Permissions-Policy`, which blocks camera access even if the browser API would support it. This is intentional privacy choice.

---

## 8. Auth Behavior

| Scenario | Expected | Status | Notes |
|----------|----------|--------|-------|
| Open PWA, not logged in | Public homepage shown | ⬜ | |
| Click Sign In | Redirect to /login | ⬜ | |
| Enter credentials | Login, redirect to /today | ⬜ | |
| Close and reopen PWA | Session persists | ⬜ | Supabase session in localStorage |
| Log out | Public homepage shown | ⬜ | |

---

## 9. Theme Behavior

| Scenario | Expected | Status | Notes |
|----------|----------|--------|-------|
| Dark mode toggle | Toggle works in PWA | ⬜ | |
| Theme persistence | Preference saved across sessions | ⬜ | |
| System preference | Respects prefers-color-scheme | ⬜ | |

---

## 10. Microsoft Store Packaging

### Option A: PWABuilder

[PWABuilder](https://pwabuilder.com/) can package the PWA for Microsoft Store:

1. Go to https://pwabuilder.com
2. Enter URL: `https://opensprout.vercel.app`
3. Generate Windows package (.appx or .msix)
4. Sign with a code signing certificate
5. Submit to Microsoft Partner Center

**Requirements:**
- Microsoft Partner Center account ($19 one-time fee)
- Code signing certificate (or self-signed for sideloading)
- Store listing assets (screenshots, description, category)

### Option B: Manual packaging

1. Use `npx @pwabuilder/pwabuilder-windows` CLI
2. Generate `.msixbundle` for sideloading
3. Test installation on Windows 10/11

### Readiness

- [ ] PWA is fully installable (✅ confirmed via manifest)
- [ ] Service worker registered (✅ registered)
- [ ] HTTPS only (✅ enforced)
- [ ] Screenshots captured for store listing
- [ ] Store description written
- [ ] Privacy policy URL available (✅ /privacy)
- [ ] Terms of service URL available (✅ /terms)
- [ ] Support URL available (✅ /support)

---

## 11. Known Gaps

| Gap | Impact | Resolution Path |
|-----|--------|-----------------|
| No camera in PWA | Cannot identify plants via photo on Windows | Use file upload instead |
| No push notifications | No care reminders on Windows | Monitor in-app task list, or add web push API |
| CSP camera=() restriction | Blocks all camera access | Update CSP for PWA-specific routes, or accept limitation |
| No native window controls overlay | Default title bar shown | Not critical for RC |
| Firefox no PWA support | 3rd-largest browser has degraded experience | Informational only |
| Service worker cache not versioned with app version | Stale cache after updates | Update CACHE_NAME in sw.js on each deploy |

---

## 12. Windows RC Test Checklist

- [ ] OpenSprout installs as PWA on Edge
- [ ] OpenSprout installs as PWA on Chrome
- [ ] PWA opens in standalone window
- [ ] PWA manifest renders correct name, icons, colors
- [ ] Service worker is registered and active
- [ ] App loads offline (cached content)
- [ ] Login works in PWA mode
- [ ] Plant CRUD works in PWA mode
- [ ] Theme toggle works and persists
- [ ] Dark mode renders correctly
- [ ] Light mode renders correctly
- [ ] File upload works (garden photo, identification)
- [ ] Export works from settings
- [ ] All tabs/navigation work in standalone window
- [ ] Window resize works (responsive)
- [ ] PWA can be pinned to taskbar
- [ ] PWABuilder generates valid package (optional for Store submission)

---

## Summary

| Category | Status |
|----------|--------|
| PWA Installability | ✅ Ready |
| Manifest | ✅ Complete |
| Service Worker | ✅ Registered |
| Offline Support | ⚠️ Partial (cached shell only) |
| Notifications | ❌ Not available |
| Camera | ❌ Not available |
| Auth | ✅ Works |
| Microsoft Store | ⬜ Not submitted |
| Blockers | None critical for RC |
