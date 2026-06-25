# OpenSprout — Offline Behavior Guide

**Version:** 0.9.14  
**Last updated:** 2026-06-25

---

## Overview

OpenSprout uses a **network-first with cache fallback** strategy. When you have connectivity, the app fetches fresh data from Supabase. When offline, it serves cached data from IndexedDB (web) and the service worker cache (PWA shell).

## What Works Offline

| Feature | Offline Support | Details |
|---------|----------------|---------|
| **App shell** (navigation, UI) | ✅ Full | Cached by service worker on first visit |
| **Plant list** | ✅ Read-only | Last-synced data from IndexedDB |
| **Care schedules** | ✅ Read-only | Last-synced data from IndexedDB |
| **Care logs** | ✅ Read-only | Last-synced data from IndexedDB |
| **Journal entries** | ✅ Read-only | Last-synced data from IndexedDB |
| **Plant photos** | ⚠️ Thumbnails only | Full images require network |
| **Adding a plant** | ✅ Queued | Action saved to pending queue, synced when online |
| **Logging care** | ✅ Queued | Saved to pending queue, synced when online |
| **Journal entries** | ✅ Queued | Saved to pending queue, synced when online |
| **Plant identification** | ❌ Not available | Requires PlantNet API |
| **Authentication** | ⚠️ Session cached | Login requires network; cached session may work for a limited time |
| **Data export** | ❌ Requires network | Reads from Supabase directly |

## How Sync Works

1. **Online mode:** Changes go directly to Supabase
2. **Offline mode:** Actions are queued in IndexedDB (`pendingActions` store)
3. **Reconnection:** `syncAll()` is called → pushes queued actions → pulls fresh data
4. **Retry:** Failed actions retry with exponential backoff (30s → 60s → 2m → 4m → 8m, max 5 attempts)

## Sync Queue Details

- Queued actions persist across app restarts
- Each action stores: `table`, `action` (create/update/delete), `recordId`, `data`, `createdAt`, `retryCount`
- Actions are applied in FIFO order on reconnection
- After 5 failed attempts, an action is discarded with a warning

## Offline Indicators

- A **cloud-off icon** appears in the top bar when offline
- Sync status is visible on the Profile page
- The app checks connectivity every time `syncAll()` is called

## Storage Cleanup

- The app caches up to 100 records per table in IndexedDB
- Old service worker caches are deleted on activation
- Manual cache clearing is available on the Profile page
