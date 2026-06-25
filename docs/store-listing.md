# OpenSprout Store Listing

**Prepared:** June 25, 2026  
**Version:** 0.9.14  
**Platform:** Google Play, Microsoft Store (future)

---

## Short Description (80 chars max)

Free, open-source plant care tracking — schedules, logs, photos & journal.

## Full Description (4000 chars max)

**OpenSprout is a privacy-first, open-source plant care app. No subscriptions. No ads. No data lock-in.**

Track watering, fertilizing, and care schedules for all your plants in one place. Log care activities, take photo notes, maintain a plant health journal, and export your data whenever you want.

### Features

- **Plant Dashboard** — See all your plants at a glance with health status, care schedule, and photo cover
- **Care Schedules** — Set up watering, fertilizing, misting, pruning, and other care routines with custom cadences
- **Care Logs** — Log when you water, fertilize, or perform other care tasks. Track amounts and notes
- **Plant Journal** — Write journal entries about each plant with health scores, tags, and optional photos
- **Photo Timeline** — Visual timeline combining care logs, journal entries, and photos chronologically
- **Plant Identification** — Take or upload a photo to identify your plant via AI (powered by PlantNet)
- **Care Templates** — 30 built-in plant species with suggested care guidelines (Monstera, Snake Plant, Pothos, and more)
- **Calendar View** — See upcoming and past care tasks on a calendar
- **Dark Mode** — System-aware dark/light theme with manual toggle
- **Data Export** — Export all your data as JSON anytime
- **MCP Integration** — Connect AI agents (Claude Code, Hermes, Cursor) to your plant data via secure API tokens
- **Android App** — Standalone Android app via Capacitor, installable from Play Store
- **Open Source** — Licensed under AGPLv3. Full source on GitHub

### Privacy First

- No analytics or tracking of any kind
- No third-party data sharing
- No ads — ever
- All data is user-owned and portable
- Row-Level Security ensures each user only sees their own data
- Camera access is only used for taking plant photos on demand

### Data You Control

OpenSprout believes you should own your data. Every feature is designed with data portability in mind:

- **Export** your complete data as JSON in one click
- **Import** data from previous exports
- **Delete** your account and all associated data at any time
- **Revoke** MCP API tokens when no longer needed

### Who Is OpenSprout For?

- Houseplant enthusiasts managing 5–50 plants
- Gardeners who want a simple, reliable care tracker
- Privacy-conscious users who want control over their data
- Anyone tired of subscription-based plant care apps

### Permissions

- **Camera** — Used only when you explicitly take a plant photo
- **Notifications** — Optional, opt-in care reminders
- **Storage** — For attaching photos from your gallery

### Open Source

OpenSprout is free and open-source software under the AGPLv3 license. You can inspect, modify, and self-host every line of code.

[github.com/sparshsam/opensprout](https://github.com/sparshsam/opensprout)

## Keywords / Tags

plant care, plant tracker, watering reminder, plant journal, garden tracker, houseplant care, plant identification, plant schedule, gardening app, plant log, plant watering, plant diary, houseplant, succulent care, open source plant app, free plant tracker

## Feature Bullets

- Track watering, fertilizing, and care schedules for all your plants
- Log care activities with amounts, notes, and photo attachments
- Maintain a plant health journal with health scores and tags
- Identify plants via AI photo recognition (powered by PlantNet)
- 30 built-in care templates for common houseplant species
- Calendar view of upcoming and past care tasks
- Dark mode with system-aware theme switching
- Export all data as JSON — no vendor lock-in
- MCP API for AI agent integration (Claude Code, Hermes, Cursor)
- Fully open source under AGPLv3 — inspect, modify, self-host

## Promotional Text (170 chars max)

Track plants, schedules, and care logs in a privacy-first, open-source app. No ads, no subscriptions, no data lock-in.

## Category

**Primary:** Lifestyle  
**Secondary:** Productivity  

## Content Rating

- Google Play: Everyone (with guidance for user-generated content)
- Apple App Store: 4+ (with no restricted content)
- Microsoft Store: Everyone

See `docs/age-rating.md` for full questionnaire responses.

## Screenshots Required

| Type | Size | Status | Source |
|------|------|--------|--------|
| Phone screenshot (dashboard) | 390×844 portrait | ⬜ Need higher-res | Run app, screenshot in device emulator |
| Phone screenshot (plant list) | 390×844 portrait | ⬜ Need higher-res | Run app, screenshot in device emulator |
| Phone screenshot (plant detail) | 390×844 portrait | ⬜ Need higher-res | Run app, screenshot in device emulator |
| Phone screenshot (care schedule) | 390×844 portrait | ⬜ Need higher-res | Run app, screenshot in device emulator |
| Phone screenshot (calendar) | 390×844 portrait | ⬜ Need higher-res | Run app, screenshot in device emulator |
| Phone screenshot (identify) | 390×844 portrait | ⬜ Need higher-res | Run app, screenshot in device emulator |
| 7" tablet screenshot | 2048×1536 landscape | ⬜ Not yet | Android emulator with tablet skin |
| 10" tablet screenshot | 2560×1600 landscape | ⬜ Not yet | Android emulator with tablet skin |

See `docs/assets/store-screenshots/` for current (low-res) screenshots — regenerate from running app.

## Store Assets Checklist

- [ ] **High-res icon (512×512)** — `public/icon-512.png` ✅
- [ ] **Feature graphic (1024×500)** — Needs design tool (Canva/Figma)
- [ ] **Phone screenshots (2 minimum)** — Need high-res captures from emulator
- [ ] **Tablet screenshots (7" + 10")** — Need emulator captures
- [ ] **Feature graphic** — Branded banner, sprout icon + tagline
- [ ] **Privacy policy URL** — Host at `/privacy` on production domain ✅
- [ ] **Data safety answers** — Documented in `docs/data-safety.md` ✅
- [ ] **Content rating** — Documented in `docs/age-rating.md` ✅
- [ ] **Release notes** — Draft from CHANGELOG.md ✅

## Release Notes (What's New)

```
OpenSprout v0.9.14

• Production release signing configured
• Android App Bundle (AAB) and APK signed with release key
• Release version automation via scripts/bump-version.mjs
• Data safety documentation for Play Store
• Performance and packaging improvements
```
