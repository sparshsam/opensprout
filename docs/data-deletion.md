# OpenSprout Account and Data Deletion

**Last updated:** June 21, 2026  
**Contact:** sparshsam@gmail.com

---

## 1. Overview

OpenSprout provides users with full control over their data. This document describes the complete data deletion workflow, including account deletion, data export deletion, and MCP token revocation.

## 2. Account Deletion

### 2.1 Delete from the App

1. Navigate to **Settings** (bottom nav or sidebar).
2. Scroll to the **Account** section.
3. Click **Delete Account**.
4. Confirm the deletion in the dialog.
5. Your session will end and you will be redirected to the login page.

### 2.2 Delete by Email

Send a deletion request to **sparshsam@gmail.com** from the email address associated with your account. We will process the request within 48 hours.

### 2.3 What Gets Deleted

| Data | Status |
|------|--------|
| Plant records | Deleted immediately |
| Care schedules | Deleted immediately |
| Care logs | Deleted immediately |
| Journal entries | Deleted immediately |
| Journal photos | Deleted from storage |
| Plant cover photos | Deleted from storage |
| Identification history | Deleted immediately |
| MCP tokens | Deleted immediately |
| Sync device records | Deleted immediately |
| Data transfer records | Deleted immediately |
| User profile preferences | Deleted immediately |
| Authentication account | Deleted from Supabase Auth |
| Export archives | Deleted immediately |

### 2.4 What Remains

- **Anonymized aggregate data** that cannot identify you may persist.
- **Server access logs** may retain timestamps (no personal data) for up to 30 days.
- **Backup snapshots** may retain your data for up to 30 days before rotation.

## 3. Data Export (Before Deletion)

Before deleting your account, we recommend exporting your data:

1. Go to **Settings → Data**.
2. Click **Export JSON**.
3. A file named `opensprout-backup.json` will be downloaded.

This file contains all your plant records, schedules, logs, journal entries, and metadata. Photos are not included in the JSON export (only references to photo file paths).

## 4. Data Transfer Records

OpenSprout tracks import/export operations in the `data_transfers` table. These records are deleted as part of account deletion.

## 5. Revoke MCP Tokens

### 5.1 Via the App

1. Go to **Settings → AI Agent Access → Manage Tokens**.
2. Find the token you want to revoke.
3. Click the red trash icon next to the token.
4. The token is immediately invalidated.

### 5.2 Effect

- The token's `revoked_at` field is set to the current timestamp.
- Future API requests using this token will be rejected with a 401 error.
- The action is irreversible — a revoked token cannot be re-enabled.

### 5.3 Via API

If you have Supabase admin access, you can also revoke tokens directly:

```sql
UPDATE public.mcp_tokens
SET revoked_at = now()
WHERE id = '<token-id>' AND user_id = '<user-id>';
```

## 6. Retention Policy

| Data Type | Active Retention | After Deletion |
|-----------|-----------------|----------------|
| User data | Until account deletion | 30 days (backup rotation) |
| Photos | Until account deletion | 24 hours (storage purge) |
| Server logs | 30 days | N/A (no personal data) |
| Backup snapshots | 30 days | 30 days from deletion |
| Aggregated analytics | Indefinite (anonymized) | Indefinite (unidentifiable) |

## 7. How to Request Data Deletion

**Option 1:** Use the in-app deletion flow (Settings → Account → Delete Account).  
**Option 2:** Email sparshsam@gmail.com with subject "Account Deletion Request".  
**Option 3:** Open a GitHub issue at github.com/sparshsam/opensprout/issues (public).

## 8. GDPR Compliance

For users in the European Union:

- **Right to access:** Export your data from Settings → Export JSON.
- **Right to rectification:** Edit your plant data directly in the app.
- **Right to erasure:** Delete your account via Settings or email request.
- **Right to data portability:** Export your data as JSON.
- **Right to object:** OpenSprout does not use your data for any purpose beyond app functionality.

For GDPR requests, contact: sparshsam@gmail.com. We will respond within 30 days.
