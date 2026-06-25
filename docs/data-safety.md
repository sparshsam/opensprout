# OpenSprout — Data Safety Section (Google Play)

**Version:** 0.9.14  
**Last updated:** 2026-06-25  
**Purpose:** Answers for Google Play's Data Safety section form.

---

## 1. Data Collection Overview

| Data Type | Collected? | Purpose | Shared? | Ephemeral? |
|-----------|-----------|---------|---------|------------|
| **Email / Account** | Yes (Supabase Auth) | Account creation, authentication, password resets | No | No |
| **Plant photos** | Yes (user uploaded) | Plant journal, AI identification | No | No |
| **Plant data** (names, species, notes, schedules) | Yes | Core app functionality | No | No |
| **Care logs** | Yes | Core app functionality | No | No |
| **Journal entries** | Yes | User-generated content | No | No |
| **Device identifiers** | No | — | — | — |
| **Precise location** | No | — | — | — |
| **Approximate location** | No | — | — | — |
| **Contacts** | No | — | — | — |
| **Financial info** | No | — | — | — |
| **Health / medical** | No | — | — | — |
| **Messages / SMS** | No | — | — | — |
| **Phone / call logs** | No | — | — | — |
| **Photos / media** | Yes (user-selected only) | Plant journal, identification | No | On-device: no |
| **Audio recordings** | No | — | — | — |
| **Video** | No | — | — | — |
| **App activity / analytics** | No | — | — | — |
| **Web browsing history** | No | — | — | — |
| **Crash logs / diagnostics** | No | — | — | — |

## 2. Data Handling Details

### Shared Data
OpenSprout does **not** share any user data with third parties. All data remains in the user's Supabase instance.

### Data Security
- **In transit:** All API traffic is HTTPS-encrypted
- **At rest:** Supabase PostgreSQL with Row-Level Security (RLS) — each user can only access their own data
- **Authentication:** Supabase Auth (email/password) with session management
- **API access:** Token-based MCP authentication with user-scoped tokens
- **No analytics SDKs** — zero third-party tracking libraries

### Data Deletion
- Users can delete their account and all associated data through the Profile → Delete Account flow
- Supabase cascade delete removes all owned records (plants, logs, photos, settings)
- Data export is available before deletion via Profile → Export Data

### Data Portability
- Full JSON export available in-app (Profile → Export Data)

## 3. Form Answers for Google Play Console

### Is your app's primary purpose something other than sharing data with third parties for ads or analytics?
**Yes.** OpenSprout is a plant care tracking tool. No ads. No analytics. No third-party data sharing.

### Which data types does your app collect?
- **Personal info** → Email address (for authentication only)
- **Photos** → Plant photos (user-initiated, optional)
- **App info and performance** → None collected

### Is all data collection optional or required?
- **Email:** Required for account creation (authentication)
- **Photos:** Optional — only collected when user explicitly takes or uploads a photo
- **All other data:** Optional — user decides what to track

### How is data processed?
All data collection is user-initiated:
- User creates account → email stored for auth
- User adds plants, takes photos, writes journal entries → stored in user's Supabase instance
- No automatic/background data collection

### Data retention policy
- Data is retained until the user deletes their account
- Supabase stores data indefinitely unless deleted
- No automatic data expiry (user controls their data)

### Are there measures to prevent re-identification?
- No analytics, no tracking IDs, no fingerprinting
- RLS prevents any user from accessing another user's data
- Account deletion removes all associated records
