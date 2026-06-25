# OpenSprout Privacy Policy

**Last updated:** June 21, 2026  
**Version:** 1.0  
**Contact:** sparshsam@gmail.com

---

## 1. Overview

OpenSprout ("we", "our", "the app") is a free and open-source plant care tracking application. This Privacy Policy explains how we collect, use, and safeguard your information when you use OpenSprout.

OpenSprout is designed with privacy as a core principle. We minimize data collection, do not use third-party analytics, do not serve ads, and do not sell your data.

## 2. Data We Collect

### 2.1 Information You Provide

| Data | Purpose | Storage |
|------|---------|---------|
| **Email address** | Account authentication via Supabase Auth | Supabase Auth (encrypted at rest) |
| **Plant records** | Core app functionality — names, species, care schedules, logs, health scores | Supabase PostgreSQL |
| **Photos** | Plant cover photos and journal entry attachments | Supabase Storage (private bucket) |
| **Journal entries** | Plant health notes, tags, observations | Supabase PostgreSQL |

### 2.2 Information We Collect Automatically

| Data | Purpose | Storage |
|------|---------|---------|
| **Session tokens** | Authentication persistence | Local storage (browser) |
| **Theme preference** | Dark/light mode persistence | Local storage (browser) |
| **Notification preferences** | Reminder lead time, quiet hours | Local storage (browser) |

**We do NOT collect:**
- IP addresses or location data
- Device identifiers or advertising IDs
- Browsing history or usage analytics
- Crash reports or error logs
- Any data for third-party services

## 3. How We Use Your Data

- **Authentication:** Your email is used only to authenticate your account.
- **App functionality:** Plant records, photos, and schedules are used exclusively to power the app's core features.
- **Sync:** Data synced between devices uses your Supabase account for isolation.

We never use your data for:
- Advertising or marketing
- Training machine learning models
- Selling or sharing with third parties
- Profiling or behavioral analysis

## 4. Data Storage and Security

### 4.1 Where Data Is Stored

- **Database:** Supabase PostgreSQL (hosted on AWS, US region)
- **Storage:** Supabase Storage (plant photos, private bucket)
- **Authentication:** Supabase Auth

### 4.2 Security Measures

- All connections are encrypted via HTTPS/TLS.
- Passwords are hashed and handled entirely by Supabase Auth.
- Row-Level Security (RLS) ensures users can only access their own data.
- Photo storage is private — each user can only see their own uploads.
- We enforce Content-Security-Policy (CSP), HSTS, and other security headers.

### 4.3 Retention

We retain your data as long as your account is active. See Section 6 for deletion procedures.

## 5. Third-Party Services

| Service | Purpose | Data Shared |
|---------|---------|-------------|
| **Supabase** | Authentication, database, file storage, edge functions | Email, plant records, photos |
| **PlantNet API** | AI plant identification (optional feature) | Submitted plant photo, no account data |
| Vercel | Web hosting (sprout.kovina.org) | None — static hosting |

**Supabase Privacy Policy:** [supabase.com/privacy](https://supabase.com/privacy)  
**PlantNet Privacy Policy:** [plantnet.org/privacy](https://plantnet.org/privacy/)  
**Vercel Privacy Policy:** [vercel.com/privacy](https://vercel.com/privacy)

### AI Plant Identification

When you use the Identify feature, the photo you select is sent to the PlantNet API for identification. No account information, email, or other personal data is included in this request. Identification results are stored in your account for history.

## 6. Your Rights and Choices

### 6.1 Access and Export

You can export all your plant data as JSON from the Settings page at any time. This includes plants, care schedules, care logs, and journal entries.

### 6.2 Account Deletion

You can delete your account and all associated data:

1. **From the app:** Request account deletion via Settings → Account
2. **By email:** Send a deletion request to sparshsam@gmail.com

Account deletion removes:
- All plant records, care schedules, care logs, and journal entries
- All uploaded photos from storage
- Authentication account
- All MCP access tokens

**What remains:** We may retain anonymized aggregate data that cannot identify you.

### 6.3 Data Deletion Timeline

- Account deletion is processed immediately upon confirmation.
- Storage objects (photos) are deleted within 24 hours.
- Backup residuals may persist for up to 30 days.

### 6.4 Notification Permissions

You can disable notifications at any time:
- **In-app:** Settings → Reminders → toggle off
- **Device:** Android Settings → Apps → OpenSprout → Notifications

### 6.5 Camera Permissions

Camera access is used only for taking plant photos within the app. Photos are never uploaded without your explicit action. You can revoke camera access at any time via device settings.

## 7. Children's Privacy

OpenSprout is not directed at children under 13. We do not knowingly collect personal information from children under 13. If we learn that a child under 13 has provided us with personal information, we will delete it promptly.

## 8. Changes to This Policy

We will update this Privacy Policy as needed. Material changes will be communicated via:
- A notice on the app's Settings page
- The `LAST UPDATED` date at the top of this document

## 9. Open Source

OpenSprout is open-source software licensed under AGPLv3. The full source code is available at:
[github.com/sparshsam/opensprout](https://github.com/sparshsam/opensprout)

You can verify our data practices by inspecting the code.

## 10. Contact

For privacy questions, data deletion requests, or any concerns:

**Email:** sparshsam@gmail.com  
**GitHub Issues:** [github.com/sparshsam/opensprout/issues](https://github.com/sparshsam/opensprout/issues)  
**App:** Settings → Support
