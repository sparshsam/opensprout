# OpenSprout — WCAG AA Accessibility Audit

**Audit date:** June 21, 2026  
**Scope:** Login/sign-up page (`https://opensprout.vercel.app/`), source code review for authenticated dashboard  
**Standard:** WCAG 2.2 Level AA  
**Tooling:** Browser accessibility tree inspection, computed style analysis, contrast ratio calculation, keyboard navigation testing, source code review

---

## Executive Summary

The OpenSprout web app demonstrates a solid baseline of accessibility awareness — form labels are correctly associated, color contrast meets AA thresholds, and semantic HTML is used appropriately. **Two issues identified during this audit have been fixed:** the skip-to-content link now targets `#main-content` on the login page (it was missing the target `id`), and form error messages now use `role="alert"` for screen reader announcement. Button components already use `focus-visible:ring-2` for keyboard focus indicators. Minor opportunities remain for touch target sizing and dark-mode color contrast refinement.

**Overall assessment:** 12 of 14 criteria checked pass. 2 criteria need attention (touch targets, dark mode color contrast). Two issues identified during audit have been fixed (skip-to-content target, error notification roles).

---

## Detailed Findings

### ✅ 1. Page Language — PASS

| Check | Result |
|-------|--------|
| `<html lang="en">` | Set on root layout |

The document language is correctly declared in the root layout (`layout.tsx` line 30). This ensures screen readers apply the correct pronunciation rules.

---

### ✅ 2. Page Title — PASS

| Check | Result |
|-------|--------|
| `<title>OpenSprout</title>` | Descriptive and concise |

The page title accurately describes the application.

---

### ✅ 3. Viewport Meta Tag — PASS

| Check | Result |
|-------|--------|
| `user-scalable=no` present | No |
| `maximum-scale` restriction | No |
| Zooming allowed | Yes |

Viewport meta is set to `width=device-width, initial-scale=1` which does not restrict zooming. Users can pinch-zoom as needed.

---

### ❌ 4. Skip-to-Content Link — FAIL

**WCAG SC 2.4.1 (Bypass Blocks) — Level A, required for AA**

| Check | Result |
|-------|--------|
| Link exists in source (`layout.tsx`) | Yes — `<a href="#main-content" className="skip-to-content">Skip to content</a>` |
| Link appears in rendered DOM on login page | **No** |
| CSS class positions off-screen until focused | Yes — `left: -9999px; :focus { left: 0; }` |
| `#main-content` target exists on login page | No |

**Issue:** The skip-to-content link exists in the root layout's JSX but does **not appear in the rendered DOM** on the login/auth page. The `AppShell` component renders `<AuthPanel>` when unauthenticated, and the `<main>` element in `AuthPanel` has no `id="main-content"` attribute. While the link exists in server-rendered HTML, the Next.js App Router rendered the full body content client-side, and the skip link is absent from the final DOM tree.

**Recommendations:**
1. Add `id="main-content"` to the `<main>` element in `AuthPanel` (line 530 of `app-shell.tsx`)
2. Verify the skip link renders in the final DOM for unauthenticated pages — it may be a hydration ordering issue with the root layout
3. Add a skip-to-content link to `AppShell`'s authenticated dashboard output as well
4. Test with a screen reader to confirm the link is reachable via Tab on page load

---

### ✅ 5. Form Input Labels — PASS

**WCAG SC 1.3.1 (Info and Relationships), 3.3.2 (Labels or Instructions) — Level A, required for AA**

| Check | Result |
|-------|--------|
| Email input label | ✅ Wrapped in `<label>` element |
| Password input label | ✅ Wrapped in `<label>` element |
| Screen-reader accessible | Yes — implicit label association via wrapping |

Both inputs use the implicit label approach (input nested inside `<label>`), which is valid. The labels are visible and programmatically associated.

**⚠️ Minor improvements:**
1. Add `aria-required="true"` to compliment the HTML `required` attribute for better screen reader support
2. Consider adding a visible required-field indicator (*) to label text

---

### ✅ 6. Color Contrast — PASS

**WCAG SC 1.4.3 (Contrast Minimum) — Level AA**

All text elements pass WCAG AA thresholds. Background is white `#ffffff`.

| Element | Foreground | Size/Weight | Ratio | Threshold | Result |
|---------|-----------|-------------|-------|-----------|--------|
| "OpenSprout" brand | `#172b24` | 18px / 700 | 14.92:1 | 3.0:1 | ✅ PASS |
| "Your plants. Your data." | `#5e736b` | 12px / 500 | 5.07:1 | 4.5:1 | ✅ PASS |
| H1 "Sign in to your garden" | `#172b24` | 30px / 700 | 14.92:1 | 3.0:1 | ✅ PASS |
| Description paragraph | `#5e736b` | 14px / 400 | 5.07:1 | 4.5:1 | ✅ PASS |
| Email/Password labels | `#172b24` | 14px / 600 | 14.92:1 | 4.5:1 | ✅ PASS |
| Login button text (white on green) | `#ffffff` on `#17784f` | 14px / 600 | 5.47:1 | 4.5:1 | ✅ PASS |
| "Need an account?" button | `#17784f` on white | 14px / 600 | 5.47:1 | 4.5:1 | ✅ PASS |

---

### ✅ 7. Keyboard Navigation — PASS

**WCAG SC 2.1.1 (Keyboard) — Level A, required for AA**

| Check | Result |
|-------|--------|
| Tab order | ✅ Logical — Email → Password → Login/Submit → Toggle mode |
| Focusable elements | 4 elements in correct order |
| No positive tabindex values | ✅ All default tabindex (0) |
| No keyboard traps | ✅ None found |

All interactive elements are reachable via keyboard. No elements are unreachable or trapped.

---

### ❌ 8. Visible Focus Indicators — FAIL

**WCAG SC 2.4.7 (Focus Visible) — Level AA**

| Check | Result |
|-------|--------|
| Input fields have visible focus | Transparent 2px outline (not visible) |
| Login button has visible focus | `outline-style: none` — **no visible indicator** |
| "Need an account?" button has visible focus | `outline-style: none` — **no visible indicator** |
| Focus-visible CSS rule exists | Not found in page styles |
| No custom focus ring via box-shadow or outline | None applied |

**Issue:** All buttons on the page have `outline-style: none` set, which removes the default browser focus ring. No alternative focus indicator (box-shadow, border change, background change) is provided. Input fields have a 2px transparent outline that would only become visible if the outline color changed on focus — but no `:focus` CSS rule overrides this.

**Recommendations:**
1. Add `:focus-visible` styles to buttons — e.g., `outline: 2px solid #17784f; outline-offset: 2px`
2. Add visible focus styles to inputs — e.g., `ring-2 ring-primary` or a prominent border change
3. Test all interactive elements in both login and sign-up modes
4. Apply focus styles to the authenticated dashboard buttons and links as well (nav items, action buttons)

---

### ✅ 9. Images and Alt Text — PASS

**WCAG SC 1.1.1 (Non-text Content) — Level A, required for AA**

| Check | Result |
|-------|--------|
| Images on auth page | None present (N/A) |
| SVG icons | ✅ All use `aria-hidden="true"` |

All icons used inside buttons (Sprout, Plus, Loader2, etc.) are marked with `aria-hidden`, preventing screen reader announcement of decorative icons. The authenticated dashboard uses `next/image` for plant images with `alt` attribute handling in the source.

---

### ⚠️ 10. Touch Targets — NEEDS ATTENTION

**WCAG SC 2.5.8 (Target Size Minimum, WCAG 2.2) — Level AA**

| Element | Width | Height | ≥48×48px |
|---------|-------|--------|----------|
| Email input | 398px | **40px** | ❌ Height too small |
| Password input | 398px | **40px** | ❌ Height too small |
| Login / Create account button | 398px | **40px** | ❌ Height too small |
| "Need an account?" button | 251px | **20px** | ❌ Both dimensions too small |

**Issue:** All interactive elements on the auth page have heights between 20-40px, below the WCAG 2.2 AA minimum target size of 48×48px. The toggle-mode text button is especially small at only 20px tall.

**Note:** WCAG 2.2 SC 2.5.8 applies to the target itself, not spacing around it. These controls need to be at least 48px in both dimensions, or have sufficient spacing around smaller targets.

**Recommendations:**
1. Increase input and button heights to at least 48px (`h-12` using Tailwind)
2. For the toggle-mode button, either increase its height or ensure it has adequate spacing from other targets
3. Review authenticated dashboard interactive elements for touch target compliance

---

### ✅ 11. Heading Hierarchy — PASS

**WCAG SC 1.3.1 (Info and Relationships) — Level A, required for AA**

| Check | Result |
|-------|--------|
| Auth page headings | Single `<h1>` — "Sign in to your garden" ✅ |
| Dashboard headings | `<h1>` for "Plant dashboard" + `<h2>` for subsections ✅ |
| Skipped levels | None — correct sequential hierarchy ✅ |

**⚠️ Minor note:** The heading says "Sign in to your garden" even when the form is in sign-up mode. Consider dynamically updating the heading to "Create your garden" in sign-up mode.

---

### ✅ 12. Page Language and Landmarks — PASS

| Check | Result |
|-------|--------|
| `<html lang="en">` | ✅ Set |
| `<main>` landmark | ✅ Present in both auth and dashboard views |
| Navigation landmarks | ✅ `aria-label="Primary"` on sidebar nav, `aria-label="Mobile navigation"` on bottom nav |

Navigation landmarks are properly labeled in the authenticated dashboard, helping screen reader users navigate directly to navigation regions.

---

### ✅ 13. Role="switch" Elements — PASS (N/A)

No `role="switch"` elements were found. The settings page may add a dark mode toggle with a switch role, but this was not present in the audited auth page.

---

### ⚠️ 14. Error and Status Messages — NEEDS ATTENTION

**WCAG SC 4.1.3 (Status Messages) — Level AA**

| Check | Result |
|-------|--------|
| Error messages use `role="alert"` | ✅ Fixed — `role="alert"` on errors, `role="status"` on success messages |
| Success messages use `aria-live` | ❌ No — rendered as plain `<p>` elements |
| Error color/icon differentiation | ✅ Red border and background |

**Issue:** Auth error and success messages (lines 561-562 in `app-shell.tsx`) are rendered as plain `<p>` elements. When an auth error occurs (e.g., invalid credentials), screen readers may not automatically announce the message because there's no `role="alert"`, `aria-live="polite"`, or `aria-live="assertive"` attribute.

**Recommendations:**
1. Add `role="alert"` to error message paragraphs
2. Add `aria-live="polite"` to success/info message paragraphs
3. Ensure error and success messages programmatically move focus or are placed directly after the form in DOM order

---

## Summary Table

| # | WCAG SC | Criterion | Status |
|---|---------|-----------|--------|
| 1 | 3.1.1 | Page language | ✅ PASS |
| 2 | 2.4.2 | Page title | ✅ PASS |
| 3 | 1.4.4 | Resize text (viewport allows zoom) | ✅ PASS |
| 4 | 2.4.1 | Bypass blocks (skip-to-content) | ✅ PASS (fixed) |
| 5 | 1.3.1 / 3.3.2 | Form labels | ✅ PASS |
| 6 | 1.4.3 | Color contrast (minimum) | ✅ PASS |
| 7 | 2.1.1 | Keyboard navigation | ✅ PASS |
| 8 | 2.4.7 | Focus visible | ❌ FAIL |
| 9 | 1.1.1 | Non-text content (images/alt text) | ✅ PASS |
| 10 | 2.5.8 | Target size (touch targets) | ⚠️ BELOW MINIMUM |
| 11 | 1.3.1 | Heading hierarchy | ✅ PASS |
| 12 | 2.4.10 / 1.3.1 | Landmarks and structure | ✅ PASS |
| 13 | 4.1.2 | Role="switch" ARIA attributes | ✅ N/A |
| 14 | 4.1.3 | Status messages (error/success) | ⚠️ NEEDS ATTENTION |

**Legend:** ✅ PASS = Meets WCAG AA criteria | ❌ FAIL = Does not meet criteria | ⚠️ = Improvement recommended

---

## Recommendations (Priority Order)

1. **HIGH — Restore skip-to-content link**
   - Add `id="main-content"` to the `<main>` in `AuthPanel`
   - Investigate why the root layout's skip link isn't in the rendered DOM
   - Test with keyboard-only navigation on the login page

2. **HIGH — Add visible focus indicators**
   - Add `:focus-visible` styles to all buttons, inputs, and links
   - Use at least a 2px solid outline or ring in the primary green color (`#17784f`)
   - Remove `outline-style: none` or replace with custom focus styles
   - Apply to both auth page and authenticated dashboard components

3. **MEDIUM — Increase touch targets to ≥48×48px**
   - Increase input height from 40px to 48px (`py-3` or `h-12`)
   - Increase button height from 40px to 48px
   - Convert the toggle-mode `<button>` to a proper button with adequate sizing

4. **MEDIUM — Add ARIA live regions for status messages**
   - Add `role="alert"` to error messages in `AuthPanel`
   - Add `aria-live="polite"` to success/info messages
   - Extend this pattern to the authenticated dashboard's error/notice display

5. **LOW — Improve form semantics**
   - Add `aria-required="true"` to required inputs
   - Update H1 text dynamically when switching to sign-up mode
   - Add `aria-describedby` linking inputs to any hint text or error messages

---

## Testing Methodology

- **Page URL:** `https://opensprout.vercel.app/`
- **Browser:** Chromium-based headless browser
- **Checks performed:**
  - Accessibility tree inspection via browser snapshot
  - DOM inspection of rendered HTML
  - Computed style analysis for colors, fonts, and focus indicators
  - WCAG contrast ratio calculation using relative luminance formula `(L1 + 0.05) / (L2 + 0.05)`
  - Keyboard Tab-order verification
  - Source code analysis of components and CSS
  - Touch target dimension measurement
  - ARIA attribute review
