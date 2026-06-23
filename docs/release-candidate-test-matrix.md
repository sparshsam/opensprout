# OpenSprout v0.9.13 — Release Candidate Cross-Platform Test Matrix

> **Date:** 2026-06-23
> **Version:** v0.9.13
> **Test Lead:** (assign)
> **Status:** 🟡 In Progress — All rows default to "—" (Not Tested)

---

## Platforms Under Test

| # | Platform | Target | Notes |
|---|----------|--------|-------|
| P1 | **Web** | opensprout.vercel.app — Chrome 125+, Firefox 127+, Safari 17.5+, Edge 125+ | Latest browser versions. Responsive: 1440px desktop, 768px tablet, 375px mobile. |
| P2 | **Android** | Capacitor APK/AAB — API 24–36 (Android 6.0–15) | Physical devices + emulator. Navigation = bottom tab bar. |
| P3 | **Windows PWA** | Microsoft Edge 125+ / Google Chrome 125+ — Installed PWA | Installed via "Install OpenSprout" browser prompt. Windowed mode. |

---

## Test Results Legend

| Symbol | Meaning |
|--------|---------|
| ✅ PASS | Test passed — behavior matches expected result |
| ❌ FAIL | Test failed — behavior does not match expected result |
| ⛔ BLOCKED | Cannot test — dependency missing or environment issue |
| — | Not yet tested (default) |

---

## 1. Authentication

### 1.1 Login (Email/Password)

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| AUTH-01 | Web | Navigate to `/login`, enter valid email + password, click "Sign in" | Redirected to `/today` (or `/` for new public flow); session cookie set | — | — |
| AUTH-02 | Android | Open app, enter valid credentials on login screen, tap "Sign in" | Redirected to Today dashboard; session persisted in WebView local storage | — | Supabase session stored in Capacitor WebView |
| AUTH-03 | Windows PWA | Launch installed PWA, enter valid credentials, tap "Sign in" | Redirected to `/today`; PWA detached window shows authenticated state | — | PWA uses same web codebase — test PWA-specific session persistence |
| AUTH-04 | Web | Enter invalid email format ("notanemail") | Inline validation error shown; form not submitted | — | Test both client-side validation and server rejection |
| AUTH-05 | Web | Enter valid email + wrong password | Server error message: "Invalid login credentials" | — | Supabase standard error |
| AUTH-06 | Web | Submit form with empty fields | Required-field validation prevents submission | — | HTML5 form validation + custom error messages |
| AUTH-07 | Web | Verify "Forgot password?" link navigates to password reset | Link visible and functional on login page | — | Password reset flow uses Supabase built-in |
| AUTH-08 | Web | Rate limiting — 5+ rapid failed logins | Temporary block or throttle after repeated failures | — | Supabase Auth rate-limiting applies |

### 1.2 Sign-Up

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| AUTH-09 | Web | Navigate to `/login`, switch to "Sign up" tab, enter email + password | Account created; confirmation email sent or user auto-confirmed | — | Depends on Supabase project config (email confirmation enabled/disabled) |
| AUTH-10 | Android | Open app on fresh install, create account via sign-up form | Account created, session started, redirected to Today | — | Test with no prior session |
| AUTH-11 | Web | Sign up with existing email | Error: "User already registered" | — | — |
| AUTH-12 | Web | Sign up with weak password (fewer than 6 chars) | Client-side validation rejects weak password | — | Supabase minimum is 6 characters by default |

### 1.3 Session Persistence

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| AUTH-13 | Web | Log in, close tab, reopen browser, navigate to `/today` | Session restored — user is still authenticated | — | Supabase session cookie persists across tabs |
| AUTH-14 | Android | Log in, force-close app, reopen | Session restored — no re-login required | — | Capacitor WebView localStorage retains Supabase session |
| AUTH-15 | Windows PWA | Log in, close PWA window, relaunch | Session restored from IndexedDB/localStorage | — | PWA session persistence via Supabase client |
| AUTH-16 | Web | Log in, clear browser cookies/localStorage, refresh | Redirected to `/login` — session cleared | — | Expected: Supabase session cleared from storage |
| AUTH-17 | Web | Stay idle for extended period (>1 hour) | Session auto-refreshes via Supabase refresh token | — | Verify refresh token rotation works |

### 1.4 Logout

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| AUTH-18 | Web | Click "Sign out" in Profile page | Session destroyed; redirected to `/login` (or `/` public homepage) | — | — |
| AUTH-19 | Android | Tap "Sign out" in Profile | Session cleared; returned to login screen | — | — |
| AUTH-20 | Windows PWA | Click "Sign out" in Profile | Session cleared; PWA shows login/sign-up | — | — |
| AUTH-21 | Web | After logout, press browser Back button | Cannot access authenticated pages; redirected to login | — | Auth-gate middleware should protect all `/today`, `/plants`, etc. |

---

## 2. Plant Collection

### 2.1 Add Plant

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| PLANT-01 | Web | Navigate to Plants, tap "Add plant", fill name + optional fields, submit | New plant appears in collection list | — | Optional: species, location, notes, health, nickname, acquired date |
| PLANT-02 | Android | Tap Plants tab → Add plant, fill form, submit | New plant appears in mobile collection list | — | Verify form fits mobile viewport |
| PLANT-03 | Windows PWA | Add plant via installed PWA | New plant added; collection updated in PWA | — | — |
| PLANT-04 | Web | Add plant with all optional fields filled (species, location, notes, health, nickname, acquired date) | All fields saved correctly; full detail view shows all data | — | — |
| PLANT-05 | Web | Add plant with only required name field | Plant created with default values for optional fields | — | Health defaults to "unknown" |
| PLANT-06 | Web | Submit with empty name field | Validation prevents submission | — | Name is required |

### 2.2 List Plants

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| PLANT-07 | Web | Navigate to `/plants` with 5+ plants in collection | All plants displayed as cards; name, species, health badge, location shown | — | Verify sorting order (likely by name or recently added) |
| PLANT-08 | Android | Tap Plants tab | Plant cards display in mobile-friendly grid/list | — | Verify touch targets are ≥44px per WCAG |
| PLANT-09 | Web | Navigate to plants with empty collection | Empty state shown with "Add your first plant" CTA | — | Warm illustrated empty state with primary CTA |
| PLANT-10 | Web | Verify pagination or infinite scroll for 50+ plants | Scroll or pagination works without performance degradation | — | Test database RLS performance at scale |

### 2.3 Get Plant (Detail View)

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| PLANT-11 | Web | Tap plant card → navigate to detail view | Full plant detail: name, species, location, health, notes, care schedule, journal timeline | — | — |
| PLANT-12 | Android | Tap plant card → detail view | Detail renders correctly on mobile; back navigation works | — | — |
| PLANT-13 | Web | View plant with a cover photo | Photo displays as header/hero image | — | Photo lazy-loading should be smooth |

### 2.4 Update Plant

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| PLANT-14 | Web | Edit plant name, location, notes — save | Changes reflected immediately in list and detail views | — | — |
| PLANT-15 | Android | Edit plant fields, save | Changes persist after save and navigation | — | — |
| PLANT-16 | Web | Change health status from "stable" to "thriving" | Badge/indicator updates; care recommendations may adjust | — | Health levels: unknown, thriving, stable, watch, struggling |
| PLANT-17 | Web | Cancel edit without saving | Original values preserved; no side effects | — | Verify no partial save |

### 2.5 Delete Plant

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| PLANT-18 | Web | Delete a plant (soft-delete) | Plant removed from active list; confirmation dialog shown before deletion | — | Soft-delete — sets `deleted_at` timestamp |
| PLANT-19 | Android | Delete plant via detail view | Plant removed from collection; confirmation required | — | — |
| PLANT-20 | Web | Delete plant — verify it still exists in database | `deleted_at` set but row not permanently removed | — | No undelete UI yet — verify via Supabase |

### 2.6 Archive / Restore

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| PLANT-21 | Web | Archive a plant | Plant no longer appears in active collection | — | Archive ≠ delete; plant can be restored |
| PLANT-22 | Web | Restore an archived plant | Plant reappears in active collection | — | — |
| PLANT-23 | Web | View archived plants (if archive view exists) | Archived plants listed separately or filterable | — | UI for viewing archived plants may not be implemented yet |

### 2.7 Search Plants

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| PLANT-24 | Web | Search by plant name | Matching plants displayed; non-matching hidden | — | Search queries across name, location, species |
| PLANT-25 | Web | Search by location | Plants at matching location returned | — | — |
| PLANT-26 | Web | Search by partial match ("mon" for "Monstera") | Fuzzy/partial matches returned | — | Uses `search_plants` MCP tool — verify exact behavior |
| PLANT-27 | Web | Search with no results | Empty search state: "No plants found matching [query]" | — | — |

---

## 3. Care Schedules

### 3.1 Create Schedule

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| CARE-01 | Web | Create watering schedule: every 3 days for a plant | Schedule created; due date calculated; task instance generated | — | Care types: water, fertilize, mist, rotate, prune, repot, inspect, custom |
| CARE-02 | Android | Create schedule via plant detail view | Schedule persisted; appears in care overview | — | Mobile form layout must be usable |
| CARE-03 | Web | Create schedule with cadence in weeks (every 2 weeks) | Recurrence calculated correctly on weekly cadence | — | Units: day, week, month |
| CARE-04 | Web | Create schedule with cadence in months (monthly fertilize) | Recurrence correct on monthly cadence | — | — |
| CARE-05 | Web | Create schedule with start date in the past | Schedule starts from past date; overdue tasks generated | — | Verify behavior — may need to handle gracefully |
| CARE-06 | Web | Create custom care type with notes | Custom label and notes saved | — | Care type "custom" with free-text label |

### 3.2 List Schedules

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| CARE-07 | Web | View care schedules for a specific plant | All schedules shown with care type, cadence, next due date | — | — |
| CARE-08 | Web | List all schedules across all plants | Aggregated view with plant names; sorted by next due date | — | — |
| CARE-09 | Web | View Today dashboard with upcoming tasks | Dashboard shows tasks due today and upcoming (next 7 days default) | — | Uses `get_upcoming_tasks` — verify accuracy |

### 3.3 Log Care Activity

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| CARE-10 | Web | Log manual watering with amount (250ml) | Care log entry created; schedule's next due date recalculated | — | Watering supports amount in ml |
| CARE-11 | Android | Log care activity from plant detail | Care logged; activity appears in timeline | — | — |
| CARE-12 | Web | Log care with notes and no amount | Entry created with notes; amount field optional | — | — |
| CARE-13 | Web | Log care for a care type without an existing schedule | Entry created ad-hoc; no future schedule affected | — | Ad-hoc vs scheduled care distinction |

### 3.4 Complete Task

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| CARE-14 | Web | Mark pending task as complete from Today dashboard | Task status changes to "done"; schedule advances to next due date | — | — |
| CARE-15 | Android | Mark task as complete from Today or plant detail | Task completed; UI updates to show completed state | — | — |
| CARE-16 | Web | Complete task with notes | Notes saved to care log entry | — | — |

### 3.5 Skip Task

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| CARE-17 | Web | Skip a pending task | Task status = "skipped"; not counted as care done; schedule not advanced | — | — |
| CARE-18 | Web | Skip task with reason note | Skip reason recorded in task history | — | — |

### 3.6 Snooze Task

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| CARE-19 | Web | Snooze a task until tomorrow | Task status = "snoozed"; re-appears as pending after snooze expiry | — | — |
| CARE-20 | Web | Snooze a task until a specific date (3 days later) | Task hidden until specified date; then returns to pending | — | — |
| CARE-21 | Web | Complete a previously snoozed task | Task marked done; schedule advances normally | — | — |

---

## 4. Journal

### 4.1 Create Entry

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| JRNL-01 | Web | Create journal entry for a plant with body text | Entry created; appears in journal timeline | — | Body is required; title is optional |
| JRNL-02 | Android | Create journal entry on mobile | Entry created; mobile editor usable | — | — |
| JRNL-03 | Web | Create entry with title + body + health score (4/5) + tags | All fields saved correctly | — | Tags: e.g. "flowering", "new-leaf" |
| JRNL-04 | Web | Create entry with health score 1 (poor) | Health score saved and displayed | — | Score range: 1=poor, 5=excellent |
| JRNL-05 | Web | Create entry with multiple tags | All tags associated with entry | — | — |
| JRNL-06 | Web | Submit empty body | Validation error prevents submission | — | Body is required |

### 4.2 List Entries

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| JRNL-07 | Web | View journal for a plant with 5+ entries | Entries listed newest-first; title, date, health score, preview shown | — | — |
| JRNL-08 | Web | View journal for a plant with no entries | Empty state shown | — | — |
| JRNL-09 | Android | Scroll through journal entries | Entries scroll smoothly; pull-to-refresh if implemented | — | — |

### 4.3 Get Entry

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| JRNL-10 | Web | Tap journal entry → detailed view | Full entry: title, body, health score, tags, timestamps | — | — |

### 4.4 Update Entry

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| JRNL-11 | Web | Edit journal entry body | Changes saved; updated timestamp reflects edit | — | — |
| JRNL-12 | Web | Edit title and add tags to existing entry | Title updated; tags appended/replaced | — | Verify tag merge vs replace behavior |
| JRNL-13 | Web | Change health score on existing entry | Score updated | — | — |

### 4.5 Delete Entry

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| JRNL-14 | Web | Delete a journal entry | Entry soft-deleted; no longer appears in journal list | — | Soft-delete — `deleted_at` set, not permanently removed |
| JRNL-15 | Web | Confirm deletion dialog | User must confirm before deletion executes | — | Prevent accidental data loss |

---

## 5. Photos

### 5.1 Upload Cover Photo

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| PHOTO-01 | Web | Upload cover photo for a plant via file picker | Photo uploaded to Supabase Storage; displayed as plant cover image | — | — |
| PHOTO-02 | Android | Upload cover photo via gallery picker | Photo picked from device gallery; uploaded and displayed | — | Requires `READ_MEDIA_IMAGES` (Android 13+) / `READ_EXTERNAL_STORAGE` (Android 12-) permission |
| PHOTO-03 | Web | Upload a large image (>5MB) | Image compressed or accepted; loading handled gracefully | — | Verify Supabase Storage limits and client-side handling |
| PHOTO-04 | Web | Upload an unsupported file type (.pdf, .webp) | File picker filters to image types; unsupported types rejected | — | — |

### 5.2 Camera Capture

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| PHOTO-05 | Web | Use camera capture feature in browser | Browser prompts for camera permission; photo captured and uploaded | — | Works only on HTTPS/secure contexts; test on mobile Chrome/Safari |
| PHOTO-06 | Android | Use camera capture within app | Android Camera permission prompt shown; photo captured and uploaded | — | Requires `CAMERA` permission |
| PHOTO-07 | Web | Deny camera permission | Graceful fallback to file upload or error message | — | Permissions-Policy header: `camera=()` on web — camera may be blocked by default |

### 5.3 Gallery Pick

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| PHOTO-08 | Web | Pick photo from gallery via file input | Photo selected; preview shown; uploadable | — | HTML file input with `accept="image/*"` |
| PHOTO-09 | Android | Pick from gallery using Capacitor Camera plugin | Gallery opens; selected photo returned and uploaded | — | Uses `@capacitor/camera` with `source: Photos` |
| PHOTO-10 | Web | Cancel gallery pick without selecting | No photo selected; no upload attempted; no error | — | — |

---

## 6. Plant Identification (PlantNet)

### 6.1 Photo Identify

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| IDENT-01 | Web | Upload a clear plant photo to `/identify` | Photo sent to PlantNet API; identification results returned | — | Rate-limited to 10 calls/min |
| IDENT-02 | Android | Use identify feature from bottom nav | Camera/gallery opens; photo captured; results displayed | — | — |
| IDENT-03 | Web | Upload a non-plant photo (random object) | PlantNet returns low-confidence results or error | — | API behavior for non-plant images |
| IDENT-04 | Web | Submit identify request while rate-limited | Error message: rate limit exceeded; retry after delay | — | — |
| IDENT-05 | Web | Submit identify request without selecting an image | Validation prevents submission | — | — |

### 6.2 Results Display

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| IDENT-06 | Web | View identification results | Species name, common name, confidence score, and care summary shown | — | — |
| IDENT-07 | Web | Tap identified species to view full care guide | Navigate to species detail with care requirements | — | Links to knowledge base/species info |
| IDENT-08 | Web | Low-confidence result (<50%) | Warning shown about low confidence; user can retry | — | — |

---

## 7. Knowledge Base

### 7.1 Search Knowledge

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| KNOW-01 | Web | Search "monstera care" | Knowledge articles about Monstera returned | — | 18 knowledge articles for 10 popular species seeded in v0.9.11 |
| KNOW-02 | Web | Search "yellow leaves" | Diagnosis and care articles returned | — | 15 diagnosis entries seeded |
| KNOW-03 | Web | Search "watering schedule" | General watering articles returned | — | 4 general articles: Beginner Checklist, Light, Watering 101, Pests |
| KNOW-04 | Web | Search non-existent topic ("purple cactus") | Empty results with helpful "no results" message | — | — |
| KNOW-05 | Android | Search knowledge from Explore/Identify section | Search works on mobile with mobile-optimized results layout | — | Navigation to knowledge may be via Identify or dedicated Explore page |

### 7.2 Category Filter

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| KNOW-06 | Web | Filter knowledge by category "care" | Only care articles shown | — | Categories: care, diagnosis, propagation, general |
| KNOW-07 | Web | Filter by "diagnosis" | Only diagnosis articles shown | — | — |
| KNOW-08 | Web | Switch between categories | Results update without page reload | — | Client-side filtering or server query |

---

## 8. Diagnosis

### 8.1 Symptom Search

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| DIAG-01 | Web | Search symptom "yellow leaves" | Possible causes, solutions, and care tips returned | — | Data seeded in v0.9.11 |
| DIAG-02 | Web | Search symptom "wilting" | Overwatering, underwatering, or other causes returned | — | — |
| DIAG-03 | Web | Search symptom "brown spots" | Sunburn, pests, or nutrient deficiency results | — | — |
| DIAG-04 | Web | Search "drooping leaves" | Relevant diagnosis returned | — | — |
| DIAG-05 | Web | Search symptom with no matching diagnosis | "No diagnosis found" message with suggestions to search differently | — | — |

---

## 9. Offline Sync

### 9.1 Offline Reads

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| OFFLN-01 | Web | Load Today dashboard, go offline, refresh | Stale-while-revalidate: cached data shown; no crash | — | PWA service worker should serve cached pages |
| OFFLN-02 | Android | Open app with cached data, disable network | Previously loaded data visible; UI indicates offline state | — | Capacitor WebView + service worker behavior |
| OFFLN-03 | Windows PWA | Launch installed PWA while offline | Cached pages load; no blank screen | — | PWA must have sufficient cache from prior visit |
| OFFLN-04 | Web | Navigate to a plant detail page while offline | Cached plant data displayed | — | Depends on service worker cache strategy |
| OFFLN-05 | Web | Navigate to a page not in cache while offline | Custom offline page or graceful error shown; not app crash | — | — |

### 9.2 Queue Writes

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| OFFLN-06 | Web | Create a journal entry while offline | Entry queued locally; not lost when connection returns | — | Requires client-side offline queue implementation |
| OFFLN-07 | Android | Log care activity while offline | Care logged locally; synced when connection restored | — | — |
| OFFLN-08 | Web | Add a plant while offline | Plant data queued; user sees pending sync indicator | — | — |

### 9.3 Sync on Reconnect

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| OFFLN-09 | Web | Go offline, make changes, reconnect | Queued writes synced to Supabase; UI updates to synced state | — | — |
| OFFLN-10 | Web | Sync conflict: edit plant online, edit same plant offline | Conflict resolution strategy applied (last-write-wins or prompt) | — | Verify conflict handling behavior |
| OFFLN-11 | Web | Reconnect with large queue of pending changes | Changes sync in order; no data loss | — | — |

> **Note:** OpenSprout is described as "local-first preference" (per AGENTS.md). Full offline sync with queue management may not be fully implemented in v0.9.13. The PWA's service worker provides basic offline caching for reads. Dedicated write-queuing with conflict resolution should be verified against actual implementation.

---

## 10. Import / Export

### 10.1 JSON Export

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| EXP-01 | Web | Navigate to Profile → Data & Privacy → Export | JSON file downloaded containing all user data | — | Exports: plants, care schedules, care logs, task instances, journal entries |
| EXP-02 | Android | Export data from Profile | JSON file downloaded/saved to device | — | File save location depends on Capacitor File plugin or browser download |
| EXP-03 | Web | Export with empty collection | Valid JSON with empty arrays returned | — | Should not error on empty state |
| EXP-04 | Web | Verify exported JSON structure | All expected keys present; valid JSON parsable | — | Validate schema completeness |

### 10.2 Data Transfer

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| EXP-05 | Web | Import previously exported JSON | Data restored; plants, schedules, logs, entries recreated | — | Import functionality may be limited or not yet implemented |
| EXP-06 | Web | Import malformed JSON | Validation error; clear error message shown | — | — |
| EXP-07 | Web | Import JSON with missing fields | Graceful handling — missing fields set to defaults | — | — |

> **Note:** Import functionality availability should be verified. Export is confirmed working via `mcp_opensprout_export_data`. The UI import flow may be minimal in v0.9.13.

---

## 11. MCP / AI Access

### 11.1 Token Generation

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| MCP-01 | Web | Navigate to Settings → MCP Access Tokens → Create Token | Token generated; displayed once with copy option | — | Token prefix: `osp_` |
| MCP-02 | Web | Create multiple tokens | Multiple active tokens listed; each can be revoked individually | — | — |
| MCP-03 | Web | Copy token to clipboard using copy button | Token copied; confirmation toast shown | — | — |
| MCP-04 | Web | Leave token page and return | Token is masked (cannot view full token after page navigation) | — | Security: token only shown once |

### 11.2 Tool Execution

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| MCP-05 | Web | Verify MCP server responds to `list_tools` | 25 tools listed with descriptions | — | Covered by automated tests (112 MCP tests passing) |
| MCP-06 | Web | Execute `list_plants` via MCP with valid token | Plants returned — scoped to authenticated user only | — | User data isolation verified in v0.9.10 |
| MCP-07 | Web | Execute `get_upcoming_tasks` via MCP | Tasks due within next N days returned | — | — |
| MCP-08 | Web | Execute `search_knowledge` via MCP | Knowledge articles returned matching query | — | — |

### 11.3 Revoked Token Handling

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| MCP-09 | Web | Revoke an active token in Settings → MCP Access Tokens | Token immediately deactivated; no longer works | — | — |
| MCP-10 | Web | Execute MCP tool with revoked token | Error: "Token has been revoked" with clear resolution instructions | — | Differentiated from "invalid token" error |
| MCP-11 | Web | Execute MCP tool with non-existent token | Error: "Invalid token" — token does not exist | — | — |
| MCP-12 | Web | Execute MCP tool without token | Authentication error; tool returns specific message | — | — |

---

## 12. Accessibility

### 12.1 Keyboard Navigation

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| A11Y-01 | Web | Tab through all interactive elements on login page | All inputs, buttons, links reachable in logical order | — | Previous audit: 12/14 criteria pass |
| A11Y-02 | Web | Tab through plants list | Plant cards, edit buttons, and add-plant button reachable | — | — |
| A11Y-03 | Web | Use Enter/Space to activate buttons and links | All interactive elements responsive to keyboard activation | — | — |
| A11Y-04 | Web | Verify skip-to-content link on login page | First Tab press shows "Skip to content" link; activates `#main-content` | — | Fixed in v0.9.12 audit |
| A11Y-05 | Web | Close modals/dialogs with Escape key | All modals dismissible via Escape | — | — |

### 12.2 Screen Reader

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| A11Y-06 | Web | Navigate login page with screen reader | Form labels announced; error messages announced via `role="alert"` | — | Form error role="alert" fixed in v0.9.12 |
| A11Y-07 | Web | Navigate plants list with screen reader | Plant names, health status, and actions announced | — | — |
| A11Y-08 | Web | Navigate bottom nav (mobile viewport) with screen reader | Nav items announced; active state identified | — | — |
| A11Y-09 | Web | Navigate top bar (desktop viewport) with screen reader | Nav items announced; current page identified | — | — |

### 12.3 Focus Indicators

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| A11Y-10 | Web | Tab to all focusable elements | Visible `focus-visible:ring-2` indicator on every interactive element | — | Button components use ring-2 focus indicator |
| A11Y-11 | Web | Click vs keyboard focus | Focus indicator appears only on keyboard focus (not mouse click) | — | `focus-visible` pseudo-class behavior |
| A11Y-12 | Web | Focus indicator contrast | Ring color has sufficient contrast against all backgrounds (light + dark) | — | Verify dark mode ring contrast |

---

## 13. Performance

### 13.1 Page Load

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| PERF-01 | Web | Load `/login` on cold cache (Chrome DevTools throttled to Fast 3G) | First Contentful Paint (FCP) < 3s; page interactive < 5s | — | Test with network throttling |
| PERF-02 | Web | Load `/today` with 10+ plants | FCP < 3s; no layout shift | — | — |
| PERF-03 | Android | Launch fresh install of APK | App opens within 5s; login screen renders | — | WebView initialization overhead |
| PERF-04 | Windows PWA | Launch installed PWA | PWA opens within 3s; cached content displayed immediately | — | — |

### 13.2 Image Loading

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| PERF-05 | Web | Load plant detail page with a cover photo (1920px image) | Image lazy-loaded; no layout shift; progressive or blurred placeholder shown | — | Next.js Image optimization — verify export mode handling |
| PERF-06 | Web | Rapidly scroll through plants list with cover images | Images lazy-load on scroll; no jank | — | — |
| PERF-07 | Android | Scroll plant list with images on low-end device (API 24) | Smooth scrolling; no out-of-memory crashes | — | Test on Android 6.0 emulator with 1GB RAM |

### 13.3 Interaction Responsiveness

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| PERF-08 | Web | Add plant, then immediately navigate away | No stale data or flash of previous view | — | — |
| PERF-09 | Web | Rapidly toggle dark/light mode 10 times | Toggle responsive; no lag or visual artifacts | — | — |
| PERF-10 | Android | Tap through all bottom nav tabs quickly | Nav switches smoothly; no unresponsive periods | — | — |
| PERF-11 | Web | Submit identify with photo and wait for results | Loading state shown; no timeout without feedback | — | PlantNet API latency varies |

---

## 14. Dark / Light Mode

### 14.1 Theme Toggle

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| THEME-01 | Web | Toggle from light → dark mode via theme toggle | All pages switch to dark theme; text, backgrounds, cards, nav update | — | Dark mode: near-black bg, adjusted contrast |
| THEME-02 | Web | Toggle from dark → light mode | Light theme restored; same layout, different colors | — | Light: pure white bg, near-black text |
| THEME-03 | Android | Toggle theme on mobile | Dark/light applied consistently across mobile layout | — | — |
| THEME-04 | Windows PWA | Toggle theme in installed PWA | Theme changes apply to PWA window | — | — |

### 14.2 Persistence

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| THEME-05 | Web | Switch to dark mode, refresh the page | Theme persists — dark mode still active after reload | — | Saved to localStorage or cookie |
| THEME-06 | Web | Switch to dark mode, close tab, reopen | Theme preserved | — | — |
| THEME-07 | Android | Switch to dark mode, close and reopen app | Theme persists | — | — |
| THEME-08 | Web | Clear site data, reload | Theme returns to default (system preference or light) | — | Expected after storage clear |

### 14.3 System Preference

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| THEME-09 | Web | Set OS to dark mode, visit site with no saved preference | Site matches OS dark mode preference | — | `prefers-color-scheme: dark` media query |
| THEME-10 | Web | Switch OS from dark → light while site is open | Site live-updates to match new OS preference (if no manual toggle set) | — | — |
| THEME-11 | Web | Set manual toggle to light, then change OS to dark | Manual toggle preference respected over system preference | — | — |

---

## 15. Mobile / Tablet / Desktop Layouts

### 15.1 Responsive Navigation

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| LAYOUT-01 | Web | View at 375px width (mobile) | Bottom nav bar visible with 4 tabs: Home, Plants, Identify, Profile | — | Mobile-first layout constrained to `max-w-2xl` |
| LAYOUT-02 | Web | View at 768px width (tablet) | Bottom nav or top bar depending on breakpoint; content fills width | — | Verify tablet breakpoint behavior |
| LAYOUT-03 | Web | View at 1440px width (desktop) | Top bar nav with centered links; max-width container; no bottom nav | — | Desktop = top bar with centered nav |
| LAYOUT-04 | Web | Resize from 1440px → 375px | Navigation transitions smoothly from top bar to bottom nav | — | No overlap or broken state at intermediate widths |
| LAYOUT-05 | Android | Open app on phone (1080×2400 portrait) | Bottom nav present; content fits mobile viewport | — | — |
| LAYOUT-06 | Android | Open app on tablet (2560×1600 landscape) | Layout adapts; may show desktop-style top bar | — | Verify Capacitor WebView handles tablet breakpoints |

### 15.2 Touch Targets

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| LAYOUT-07 | Web | Tap all bottom nav icons on touchscreen | Each nav item activates on tap; active state shown | — | WCAG recommends ≥44×44px touch targets |
| LAYOUT-08 | Android | Tap plant card in collection | Card activates on tap; no accidental double-activation | — | Previous accessibility audit flagged touch target sizing |
| LAYOUT-09 | Android | Tap "Add plant" FAB/button | Button responds immediately; no missed taps | — | — |
| LAYOUT-10 | Web | Tap small UI elements (tag chips, health badges) | Elements respond; no dead zones | — | Verify minimum 44px effective tap area |

### 15.3 Touch Interactions

| # | Platform | Steps | Expected Result | Status | Notes |
|---|----------|-------|-----------------|--------|-------|
| LAYOUT-11 | Android | Swipe down on plant list (pull-to-refresh if implemented) | List refreshes; content updated | — | Verify if pull-to-refresh is implemented |
| LAYOUT-12 | Web | Long-press on a plant card | No unexpected context menu (unless intended) | — | Long-press should not conflict with navigation |
| LAYOUT-13 | Android | Rotate device from portrait → landscape | Layout reflows correctly; no cutoff content; nav adapts | — | — |
| LAYOUT-14 | Android | Open keyboard while filling in plant creation form | Layout adjusts; form fields not obscured by keyboard | — | `adjustResize` or `adjustPan` in Android manifest |

---

## Summary

### Pass Rate by Category

| Category | Total Tests | ✅ PASS | ❌ FAIL | ⛔ BLOCKED | — Not Tested | Pass Rate |
|----------|------------|--------|--------|-----------|-------------|-----------|
| 1. Authentication | 21 | — | — | — | 21 | —% |
| 2. Plant Collection | 27 | — | — | — | 27 | —% |
| 3. Care Schedules | 21 | — | — | — | 21 | —% |
| 4. Journal | 15 | — | — | — | 15 | —% |
| 5. Photos | 10 | — | — | — | 10 | —% |
| 6. Plant Identification | 8 | — | — | — | 8 | —% |
| 7. Knowledge Base | 8 | — | — | — | 8 | —% |
| 8. Diagnosis | 5 | — | — | — | 5 | —% |
| 9. Offline Sync | 11 | — | — | — | 11 | —% |
| 10. Import/Export | 7 | — | — | — | 7 | —% |
| 11. MCP / AI Access | 12 | — | — | — | 12 | —% |
| 12. Accessibility | 12 | — | — | — | 12 | —% |
| 13. Performance | 11 | — | — | — | 11 | —% |
| 14. Dark/Light Mode | 11 | — | — | — | 11 | —% |
| 15. Layouts | 14 | — | — | — | 14 | —% |
| **Total** | **193** | **0** | **0** | **0** | **193** | **0%** |

### Known Caveats

1. **Offline sync** — The app is designed "local-first preference" per AGENTS.md, but write-queuing with conflict resolution may not be fully implemented in v0.9.13. PWA service worker provides basic read caching. Dedicated offline write queue tests may need to be downgraded to NOT APPLICABLE depending on actual implementation.
2. **Import functionality** — Export is confirmed working (via MCP `export_data` tool). The UI import flow may be minimal or absent in v0.9.13. Tests EXP-05 through EXP-07 should be verified against actual UI.
3. **Camera on web** — The Permissions-Policy header (`camera=()`) blocks camera access on web by default. Camera capture on web (PHOTO-05) may be blocked — this is intentional for the web platform. Capacitor Android bypasses this via native plugin.
4. **Hidden routes** — Calendar (`/calendar`), Journal (`/journal`), and Explore (`/explore`) are built but hidden from navigation (marked "deferred" in project status). Journal tests (section 4) may reference routes not yet linked in nav — test via direct URL navigation.
5. **Security headers** — CSP and other security headers are handled by `vercel.json` for web builds but are absent in the static Android export (CAPACITOR_BUILD). This is expected — Android WebView loads from `file://` protocol.
6. **Focus indicators on Android** — Tap-based navigation on Android relies on pointer events, not keyboard focus. Focus ring tests (A11Y-10 through A11Y-12) apply primarily to web/desktop use with a keyboard.
7. **Performance baselines** — Performance tests (section 13) use qualitative assessment rather than strict Lighthouse budgets. Adjust PASS/FAIL thresholds based on project requirements.

---

*This test matrix is a living document. Update Status cells as testing progresses and add platform-specific Notes for any failures encountered.*
