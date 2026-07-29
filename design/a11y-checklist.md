# Accessibility (A11y) Checklist - Stellopay Frontend

**Branch:** `design/a11y-baseline`  
**Scope:** Sign-in, Sign-up, Landing page, Transactions view, Modal dialogs  
**Standard:** WCAG 2.1 Level AA  
**Date:** 2026-05-31

---

## Audit methodology

- Static code review of all primary-journey components
- Manual keyboard-only walkthrough (Tab, Shift+Tab, Enter, Space, Arrow keys, Escape)
- Screen-reader spot-check (NVDA + Chrome, VoiceOver + Safari)
- Automated scan reference: axe-core rules mapped to each finding below

---

## P0 Issues — Fixed in this PR

### 1. Missing skip navigation link (WCAG 2.4.1 — Bypass Blocks)

**File:** `app/layout.tsx`  
**Fix:** Added `<a href="#main-content">Skip to main content</a>` as the first focusable element in the root layout. Visually hidden via `sr-only`; revealed on focus with high-contrast styling.  
**axe rule:** `bypass`

---

### 2. Missing `id="main-content"` landmark targets (WCAG 2.4.1)

**Files:** `app/page.tsx`, `app/auth/login/page.tsx`, `app/auth/sign-up/page.tsx`, `app/transactions/page.tsx`  
**Fix:** Replaced wrapper `<div>` with `<main id="main-content">` on every primary page so the skip link has a valid target and the page has a proper main landmark.  
**axe rule:** `landmark-one-main`, `bypass`

---

### 3. Incorrect heading hierarchy — `<h6>` used as section title (WCAG 1.3.1 — Info and Relationships)

**File:** `app/transactions/page.tsx`  
**Fix:** Changed `<h6>` "All Transactions" to `<h1>`. This is the only heading on the page; using `<h6>` skips five heading levels and breaks screen-reader document outline.  
**axe rule:** `heading-order`

---

### 4. Heading hierarchy — `<h2>` before `<h1>` in auth forms (WCAG 1.3.1)

**Files:** `components/auth/login/login-form.tsx`, `components/auth/sign-up/sign-up-form.tsx`  
**Context:** The brand name "Stellopay" was rendered as `<h2>` above the page title `<h1>` ("Welcome Back" / "Get Started Now"). The `<h1>` is already correct; the `<h2>` brand label is a visual element, not a structural heading — left as-is since it is not a heading in the document outline sense. No change needed here; the `<h1>` on each auth page is the page title.

---

### 5. Password show/hide toggle — non-interactive element used as button (WCAG 4.1.2 — Name, Role, Value)

**Files:** `components/auth/login/login-form.tsx`, `components/auth/sign-up/sign-up-form.tsx`  
**Fix:** Replaced bare `<EyeOff>` / `<Eye>` SVG icons (which had `onClick` but no role, no keyboard access) with `<button type="button">` elements. Added:

- `aria-label="Show password"` / `"Hide password"` / `"Show confirm password"` / `"Hide confirm password"`
- `aria-pressed={showPassword}` to communicate toggle state
- `aria-hidden="true"` on the inner SVG icon
- Visible focus ring via `focus:ring-2 focus:ring-ring`  
  **axe rule:** `button-name`, `interactive-supports-focus`

---

### 6. Password input missing `aria-describedby` for requirements region (WCAG 1.3.1)

**File:** `components/auth/sign-up/sign-up-form.tsx`  
**Fix:** Added `id="password-requirements"` to the requirements `<div>` and `aria-describedby="password-requirements"` on the password `<Input>` (only when the requirements panel is visible). Also added `aria-live="polite"` to the requirements region so changes are announced as the user types.  
**axe rule:** `aria-required-attr`

---

### 7. Modal dialog missing `DialogDescription` (WCAG 4.1.2)

**File:** `components/auth/sign-up/sign-up-email-modal.tsx`  
**Fix:** Added `<DialogDescription>` inside `<DialogHeader>`. Radix Dialog requires both `DialogTitle` and `DialogDescription` to satisfy the accessible name + description contract. Without `DialogDescription`, screen readers announce the dialog with no description, leaving users without context.  
**axe rule:** `dialog-name`

---

### 8. Resend button outcome not announced (WCAG 4.1.3 — Status Messages)

**File:** `components/auth/sign-up/sign-up-email-modal.tsx`  
**Fix:** Added `aria-live="polite" aria-atomic="true"` to the paragraph containing the resend button. When the resend succeeds, the status message "Verification email resent successfully." replaces the button text and is announced by screen readers without moving focus.  
**axe rule:** `aria-live-region-content`

---

### 9. Mobile nav toggle missing `aria-expanded` and `aria-controls` (WCAG 4.1.2)

**File:** `components/landing/navbar.tsx`  
**Fix:**

- Added `aria-expanded={mobileOpen}` to the hamburger button so screen readers announce open/closed state
- Added `aria-controls="mobile-nav"` pointing to the drawer
- Added `id="mobile-nav"` on the drawer element
- Changed `aria-label` to be dynamic: `"Open menu"` / `"Close menu"` based on state
- Added `role="dialog"` and `aria-label="Mobile navigation menu"` on the drawer  
  **axe rule:** `aria-required-attr`, `button-name`

---

### 10. Active nav link not marked (WCAG 2.4.4 — Link Purpose)

**File:** `components/landing/navbar.tsx`  
**Fix:** Added `aria-current={active ? "page" : undefined}` to each nav link. Screen readers announce "current page" for the active link.  
**axe rule:** `aria-allowed-attr`

---

### 11. Decorative images missing or incorrect `alt` text (WCAG 1.1.1 — Non-text Content)

**File:** `components/landing/hero.tsx`  
**Fix:**

- `<img src={stellar.src} alt="">` → `alt="Stellar network"` (informative image inside a link)
- `<img src={skartnet.src} alt="">` → `alt="Starknet network"` (informative image inside a link)
- Added `aria-hidden="true"` on decorative Lucide icons inside buttons  
  **axe rule:** `image-alt`

---

### 12. Inline SVG in transactions page missing `aria-hidden` (WCAG 1.1.1)

**File:** `app/transactions/page.tsx`  
**Fix:** Added `aria-hidden="true"` and `focusable="false"` to the decorative SVG icon next to the "All Transactions" heading.  
**axe rule:** `svg-img-alt`

---

### 13. Table headers missing `scope` attribute (WCAG 1.3.1)

**File:** `components/transactions/transactions-table.tsx`  
**Fix:** Added `scope="col"` to all `<TableHead>` elements. Without `scope`, screen readers cannot associate header cells with data cells in complex tables.  
**axe rule:** `scope-attr-valid`

---

### 14. Table missing `<caption>` (WCAG 1.3.1)

**File:** `components/transactions/transactions-table.tsx`  
**Fix:** Added `<caption className="sr-only">Transaction history</caption>`. Visually hidden but announced by screen readers when the table receives focus.  
**axe rule:** `table-duplicate-name`

---

### 15. Status badge has no accessible label (WCAG 1.3.1)

**File:** `components/transactions/transactions-table.tsx`  
**Fix:** Added `aria-label={`Status: ${transaction.status}`}` to each `<Badge>`. Without this, screen readers read only the badge text without the "Status:" prefix, losing context.  
**axe rule:** `aria-required-attr`

---

### 16. "No Transactions Found" message not announced (WCAG 4.1.3)

**File:** `app/transactions/page.tsx`
**Fix:** Added `role="status"` and `aria-live="polite"` to the empty-state message so it is announced when filters produce no results.
**axe rule:** `aria-live-region-content`

---

### 17. Transaction history load completion not announced (WCAG 4.1.3 — Status Messages)

**File:** `components/dashboard/transaction-history.tsx`
**Fix:** Added a visually hidden `aria-live="polite"` region with `role="status"` and `aria-atomic="true"` that announces the transaction count when the loading-to-loaded transition occurs. The announcement only fires once — on the transition from `isLoading=true` to `isLoading=false` — using a `useRef` to track the previous loading state, preventing repeated announcements on re-renders.
**axe rule:** `aria-live-region-content`

---

### 18. Sidebar toggle buttons missing accessible names and focus styles (WCAG 4.1.2, 2.4.7)

**File:** `components/common/side-bar.tsx`  
**Fix:**

- Added `aria-label="Collapse sidebar"` / `"Expand sidebar"` (dynamic) to the toggle button
- Added `aria-expanded={isSidebarOpen}` to communicate state
- Added `aria-label="Close sidebar"` to the mobile close button
- Added `aria-hidden="true"` on icon children
- Added `focus:outline-none focus:ring-2 focus:ring-zinc-400 rounded` for visible focus indicators  
  **axe rule:** `button-name`, `focus-trap`

---

### 18. `<aside>` missing accessible name (WCAG 1.3.6 — Identify Purpose)

**File:** `components/common/side-bar.tsx`  
**Fix:** Added `aria-label="Application sidebar"` to the `<motion.aside>` element.  
**axe rule:** `landmark-complementary-is-top-level`

---

### 19. `<meta description>` was placeholder text (WCAG 2.4.2 — Page Titled)

**File:** `app/layout.tsx`  
**Fix:** Updated `description` from `"Generated by create next app"` to a meaningful description of the application.

---

## Login Form — Per-field Validation Error Announcements

**File:** `components/auth/login/login-form.tsx`  
**Fix:** Added per-field zod validation error announcements and focus management for the login form.

### aria-live Implementation

Each `FormMessage` component (used by `FormFieldInput` and `FormFieldPassword`) renders with `role="alert"` and `aria-live="polite"` when a zod validation error is present. This is handled by the shared `FormMessage` component in `components/ui/form.tsx`. When the user submits the form with invalid data, each field's error message appears as a live region and is automatically announced by screen readers.

### aria-describedby Linkage

`FormControl` (via Radix Slot) automatically wires `aria-describedby` on each `<input>` to both the field's description (`formDescriptionId`) and its error message (`formMessageId`). This ensures screen readers announce the associated error message when the input receives focus.

```tsx
// In FormControl (components/ui/form.tsx):
aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
```

### Keyboard Focus Behavior

After a failed form submission, the `onValidationError` callback iterates over `FieldErrors` to find the first field that failed validation and programmatically focuses it via `document.querySelector`. This prevents screen-reader and keyboard-only users from having to manually navigate back to the top of the form to correct errors.

```tsx
function onValidationError(errors: FieldErrors<LoginFormValues>) {
  const firstErrorField = Object.keys(errors)[0] as keyof LoginFormValues;
  if (firstErrorField) {
    const element = document.querySelector<HTMLElement>(`[name="${firstErrorField}"]`);
    element?.focus();
  }
}

// Wired via handleSubmit's second argument:
form.handleSubmit(onSubmit, onValidationError)
```

### Accessibility Considerations

- **WCAG 2.4.3 (Focus Order)**: The first invalid field receives focus, preserving a logical focus order.
- **WCAG 4.1.3 (Status Messages)**: Each field error is rendered with `role="alert"` and `aria-live="polite"`, ensuring screen readers announce validation failures without moving focus away from the corrected field.
- **WCAG 1.3.1 (Info and Relationships)**: `aria-describedby` links each input to its error message, establishing a programmatic relationship.
- **No duplicate announcements**: Each field has its own `FormMessage` live region; multiple simultaneous errors produce individual announcements.

**axe rules:** `aria-live-region-content`, `aria-required-attr`, `label`

---

## P1 Issues — Ticketed (not in this PR)

| #     | Issue                                                                                        | WCAG  | Rationale for deferral                                                    |
| ----- | -------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------- |
| P1-01 | Color contrast: `text-[#9CA3AF]` on dark backgrounds may fall below 4.5:1 for small text     | 1.4.3 | ✅ Partially resolved: ErrorState & EmptyState verified (see Dark-Mode Contrast Pass below); broader audit tracked separately |
| P1-02 | Color contrast: `text-[#52525B]` on white in hero section                                    | 1.4.3 | Tracked; design token audit pending                                       |
| P1-03 | Focus order in mobile nav drawer — links should be trapped while open                        | 2.4.3 | Requires `focus-trap-react` or Radix Dialog; deferred to follow-up        |
| P1-04 | `<AuthSocialButtons>` — social login buttons need `aria-label` with provider name            | 4.1.2 | Component not in scope of this pass; tracked                              |

---

## Auth Social Divider — Accessible Separator

**File:** `components/auth/auth-social-buttons.tsx`
**Fix:** The "Or" divider between social provider buttons and the email form was previously a plain `<div>` with decorative `<Separator>` lines and an `<span>Or</span>`. Screen readers heard the word "or" out of context with no indication it separates sign-in methods. Now:
- The divider wrapper has `role="separator"` with `aria-label="or continue with email"`, so screen readers understand it separates social login from email login
- The visual "Or" text has `aria-hidden="true"` to prevent double-reading (the accessible name is in `aria-label`)
- The `<Separator>` lines remain decorative (default `decorative={true}`, which adds `aria-hidden="true"`)
- The divider was also extracted from the duplicate instances in `login-form.tsx` and `sign-up/sign-up-form.tsx` into `AuthSocialButtons` as a single source of truth

**WCAG:** 1.3.1 Info and Relationships, 4.1.2 Name/Role/Value
**axe rule:** `aria-allowed-attr`, `aria-required-attr`

**Files changed:**

| File                                         | Changes                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| `components/auth/auth-social-buttons.tsx`    | Added accessible divider with `role="separator"` and `aria-label`       |
| `components/auth/auth-social-buttons.test.tsx` | Added tests for separator role, aria-label, aria-hidden on visual text  |
| `components/auth/login/login-form.tsx`       | Removed duplicate divider (now handled by `AuthSocialButtons`)          |
| `components/auth/sign-up/sign-up-form.tsx`   | Removed duplicate divider (now handled by `AuthSocialButtons`)          |
| P1-05 | `react-day-picker` calendar in date filter — keyboard navigation needs audit                 | 2.1.1 | Third-party component; needs dedicated testing session                    |
| P1-06 | `<Filter>` and `<Sort>` dropdown triggers — need `aria-haspopup` and `aria-expanded`         | 4.1.2 | Radix DropdownMenu handles this automatically; verify in integration test |
| P1-07 | `<TableSearchbar>` — input needs visible `<label>` (not just placeholder)                    | 1.3.1 | Placeholder is not a label substitute; tracked                            |
| P1-08 | Motion/animation — `framer-motion` sidebar animation should respect `prefers-reduced-motion` | 2.3.3 | Add `useReducedMotion()` hook from framer-motion                          |

---

## Settings Preferences Tabs — Verified

**File:** `app/settings/preferences/components/settings-page-shell.tsx`
**Fix:** Made the settings tab contract explicit with horizontal automatic activation and added regression coverage for Radix Tabs roving tabindex behavior. Only the active tab remains in the page Tab order, ArrowLeft/ArrowRight cycle focus and selection, and Home/End jump to the first/last tab.
**WCAG:** 2.1.1 Keyboard, 2.4.3 Focus Order, 4.1.2 Name/Role/Value

---

## Keyboard navigation — manual test results

| Journey                  | Tab order correct | Enter/Space activates | Escape closes modal | Focus visible |
| ------------------------ | :---------------: | :-------------------: | :-----------------: | :-----------: |
| Landing page nav         |        ✅         |          ✅           |         N/A         |      ✅       |
| Mobile nav open/close    |        ✅         |          ✅           |         ✅          |      ✅       |
| Sign-in form             |        ✅         |          ✅           |         N/A         |      ✅       |
| Password show/hide       |        ✅         |          ✅           |         N/A         |      ✅       |
| Sign-up form             |        ✅         |          ✅           |         N/A         |      ✅       |
| Email verification modal |        ✅         |          ✅           |     ✅ (Radix)      |      ✅       |
| Transactions table       |        ✅         |          N/A          |         N/A         |      ✅       |
| Transactions pagination  |        ✅         |          ✅           |         N/A         |      ✅       |
| Sidebar toggle           |        ✅         |          ✅           |         N/A         |      ✅       |

---

## Screen reader — spot-check results (NVDA + Chrome)

| Element                                |                  Announced correctly                   |
| -------------------------------------- | :----------------------------------------------------: |
| Skip link                              |            ✅ "Skip to main content, link"             |
| Page `<main>` landmark                 |               ✅ "main" region announced               |
| Login `<h1>` "Welcome Back"            |                           ✅                           |
| Sign-up `<h1>` "Get Started Now"       |                           ✅                           |
| Password toggle button                 |     ✅ "Show password, toggle button, not pressed"     |
| Password requirements live region      |           ✅ Changes announced on keystroke            |
| Email modal title + description        |               ✅ Both announced on open                |
| Resend status message                  | ✅ "Verification email resent successfully." announced |
| Transactions `<h1>` "All Transactions" |                           ✅                           |
| Table caption                          |           ✅ "Transaction history" announced           |
| Table column headers with scope        |            ✅ Headers associated with cells            |
| Status badge                           |                 ✅ "Status: Completed"                 |
| Empty state live region                |     ✅ "No Transactions Found" announced on filter     |
| Transaction history live region        |  ✅ "N transactions loaded" on loading-to-loaded transition |
| Sidebar `aria-label`                   |        ✅ "Application sidebar, complementary"         |
| Sidebar toggle `aria-expanded`         |        ✅ "Collapse sidebar, expanded, button"         |

---

## Landmark Audit — App Shell Layout (Issue #771)

**Branch:** `a11y/landmark-role-audit`  
**Scope:** `app/layout.tsx`, `components/common/app-layout.tsx`, `components/common/side-bar.tsx`  
**Standard:** WCAG 2.1 Level AA — 1.3.1, 1.3.6, 2.4.1, 4.1.2  
**Date:** 2026-07-29

---

### Overview

The app shell layout composes the header, sidebar, and main content areas. A landmark audit was performed to confirm each region uses the correct semantic element or ARIA role so screen reader users relying on landmark navigation can jump directly to each major area of the page.

---

### WCAG Criteria addressed

#### 1. Exactly one `<main>` landmark per page (WCAG 2.4.1, 1.3.1)

`components/common/app-layout.tsx` renders exactly one `<main id="main-content" tabIndex={-1}>` element wrapping `{children}`. This is the only main landmark on the page, and it is the target of the skip-to-content link.

**axe rules satisfied:** `landmark-one-main`, `bypass`

---

#### 2. `<header>` (banner) landmark wraps site-wide navigation chrome (WCAG 1.3.1, 4.1.2)

`app-layout.tsx` wraps the `<Navbar>` component in a `<header aria-label="Site header">` element. This creates an ARIA banner landmark so screen readers announce the top-of-page chrome as a distinct navigation region.

The `aria-label="Site header"` distinguishes this banner from any page-level `<header>` elements that child routes may render inside `<main>`, preventing a "landmark-unique" axe violation.

**axe rules satisfied:** `landmark-banner-is-top-level`, `landmark-unique`

---

#### 3. `<aside>` (complementary) landmark wraps the sidebar (WCAG 1.3.1, 1.3.6)

`components/common/side-bar.tsx` renders an `<aside aria-label="Application sidebar">` element. Screen readers announce this as "Application sidebar, complementary landmark" so users can jump directly to the sidebar via landmark navigation.

**axe rules satisfied:** `landmark-complementary-is-top-level`, `aria-required-attr`

---

#### 4. `<nav>` (navigation) landmark inside the sidebar (WCAG 1.3.1)

`components/common/nav-link.tsx` renders a `<nav>` element wrapping the link list. This creates a navigation landmark inside the `<aside>` sidebar. The sidebar's `aria-label="Application sidebar"` already distinguishes the complementary region; the nested `<nav>` provides the navigation role for the link list.

**axe rules satisfied:** `landmark-navigation-is-top-level` (satisfied by nesting inside the labelled `<aside>`)

---

#### 5. Skip-to-content link targets `#main-content` (WCAG 2.4.1)

`app-layout.tsx` renders a skip-to-content link with `href="#main-content"` that appears on keyboard focus. The `<main>` landmark has `id="main-content"` and `tabIndex={-1}` so the browser can move focus to it when the link is activated.

**axe rule satisfied:** `bypass`

---

#### 6. Landmark uniqueness — multiple instances have unique labels (WCAG 1.3.6)

The app shell layout renders exactly one of each landmark type (banner, main, nav, complementary) at any given time:

| Landmark type       | Element                                     | Accessible name         | Count |
| ------------------- | ------------------------------------------- | ----------------------- | ----- |
| Banner (`<header>`) | `<header aria-label="Site header">`         | "Site header"           | 1     |
| Main (`<main>`)     | `<main id="main-content">`                  | (none required)         | 1     |
| Navigation (`<nav>`)| `<nav>` inside SideBar                      | (none required)         | 1     |
| Complementary (`<aside>`) | `<aside aria-label="Application sidebar">` | "Application sidebar" | 1     |

The site header carries `aria-label="Site header"` so if a child route adds its own `<header>` inside `<main>`, both headers will have unique accessible names and screen readers can distinguish them.

**axe rules satisfied:** `landmark-unique`, `aria-required-attr`

---

### Automated landmark-uniqueness checks

A new test suite in `components/common/app-layout.test.tsx` verifies:

- Exactly one `<main>` landmark per page ✅
- Exactly one `<header>` (banner) landmark per page ✅
- Exactly one `<nav>` (navigation) landmark per page ✅
- Exactly one `<aside>` (complementary) landmark per page ✅
- Each labelled landmark has a unique accessible name ✅
- Skip-to-content link `href` matches the `<main>` landmark `id` ✅

---

### Screen reader — spot-check results

| Element | Announced |
|---------|-----------|
| Skip link (on focus) | "Skip to main content, link" |
| `<header aria-label="Site header">` | "Site header, banner" |
| `<main id="main-content">` | "main, main landmark" |
| `<aside aria-label="Application sidebar">` | "Application sidebar, complementary" |
| `<nav>` inside sidebar | "navigation" |

---

### Files changed

| File | Changes |
|------|---------|
| `components/common/app-layout.tsx` | Wrapped `<Navbar>` in `<header aria-label="Site header">` |
| `components/common/app-layout.test.tsx` | Added landmark-uniqueness test suite |
| `design/a11y-checklist.md` | Added this section |

---

## Files changed

| File                                              | Changes                                                                                  |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `app/layout.tsx`                                  | Skip link, improved meta description                                                     |
| `app/page.tsx`                                    | `<main id="main-content">` wrapper                                                       |
| `app/auth/login/page.tsx`                         | `<main id="main-content">` wrapper                                                       |
| `app/auth/sign-up/page.tsx`                       | `<main id="main-content">` wrapper                                                       |
| `app/transactions/page.tsx`                       | `<main id="main-content">`, `<h1>`, SVG aria-hidden, live region                         |
| `components/landing/hero.tsx`                     | Component name fix, button types, aria-hidden icons, img alt text, section aria-label    |
| `components/landing/navbar.tsx`                   | `aria-expanded`, `aria-controls`, `id="mobile-nav"`, `aria-current`                      |
| `components/auth/login/login-form.tsx`            | Password toggle → `<button>` with aria-label, aria-pressed                               |
| `components/auth/sign-up/sign-up-form.tsx`        | Password toggles → `<button>`, aria-describedby, aria-live on requirements               |
| `components/auth/sign-up/sign-up-email-modal.tsx` | `DialogDescription`, aria-live resend status, button types, focus rings                  |
| `components/transactions/transactions-table.tsx`  | `<caption>`, `scope="col"`, aria-label on badges, aria-hidden on icons, `<time>` element |
| `components/dashboard/transaction-history.tsx`    | `aria-live="polite"` live region on loading-to-loaded transition, loading/error/empty states |
| `components/dashboard/transaction-history.test.tsx` | Tests for aria-live announcement, transition-only firing, fake timers, edge cases |
| `components/common/side-bar.tsx`                  | aria-label, aria-expanded, aria-hidden icons, focus rings                                |
| `design/a11y-checklist.md`                        | This document                                                                            |

### Transaction Table Tooltips
- **Contrast**: Focus ring (ocus:ring-[#D7E0EF]) provides clear 3:1 contrast against dark background.
- **Keyboard Nav**: 	abIndex={0} makes truncated addresses and amounts focusable, revealing the 	itle tooltip.
- **ARIA**: Screen readers read the full content within the span natively, while sighted users see tooltips on hover/focus.

---

## Dark-Mode Contrast Pass — ErrorState & EmptyState (Issue #825)

**Branch:** `a11y/error-empty-state-dark-contrast`  
**Scope:** `components/ui/error-state.tsx`, `components/ui/empty-state.tsx`  
**Standard:** WCAG 2.1 Level AA — 1.4.3 Contrast (Minimum)  
**Date:** 2026-07-29

### Verified Contrast Ratios (Dark Mode)

Every text and icon element in both components was measured against its
parent background under dark mode to ensure compliance with WCAG 2.1 AA
contrast thresholds:

- **4.5:1** for body text (normal, < 18pt / < 24px)
- **3:1** for large text (≥ 18pt bold / ≥ 24px) and icons

---

### ErrorState (`components/ui/error-state.tsx`)

**Container background:** `bg-red-900/10` over typical dark surface `#09090B`
(computed ≈ `#150b0d`).

| Element | Class | Foreground | Background | Ratio | Threshold | Pass |
|---------|-------|------------|------------|-------|-----------|------|
| Icon (40 px, decorative) | `text-red-500` | `#ef4444` | `#150b0d` | **5.2:1** | 3:1 | ✅ |
| Title `<h3>` | `text-white` | `#ffffff` | `#150b0d` | **20.5:1** | 4.5:1 | ✅ |
| Description `<p>` | `text-zinc-400` | `#a1a1aa` | `#150b0d` | **7.7:1** | 4.5:1 | ✅ |
| Button text | `text-white` | `#ffffff` | `bg-[#2D2D2D]` `#2d2d2d` | **9.5:1** | 4.5:1 | ✅ |
| Button disabled | `disabled:opacity-50` | white 50% α ≈ `#bcbcbc` | `#2d2d2d` | **7.1:1** | 4.5:1 | ✅ |

**Notes:**
- The `bg-red-900/10` container tint is purely decorative and does not
  meaningfully lighten the underlying dark surface.
- The `text-zinc-400` body copy (`#a1a1aa`) has ~7.5:1 margin on the
  darkest expected background, providing ample headroom even on slightly
  lighter dark surfaces (e.g., `#1A1A1A` → 6.9:1).
- The icon uses `text-red-500` (`#ef4444`) which is explicitly a
  high-saturation error colour — well above both the icon threshold (3:1)
  and the body-text threshold (4.5:1).
- The `retrying` disabled state applies `opacity-50` to white text on
  `#2D2D2D`. Linear-space alpha compositing yields ~`#bcbcbc` on
  `#2D2D2D` → **7.1:1**.
- **No colour changes needed** for ErrorState — every pairing already
  exceeds WCAG 2.1 AA thresholds with comfortable margin. ✅

---

### EmptyState (`components/ui/empty-state.tsx`)

**Container background:** `bg-[#111111]` (`#111111`).

| Element | Class | Foreground | Background | Ratio | Threshold | Pass |
|---------|-------|------------|------------|-------|-----------|------|
| Icon (40 px, decorative) | `text-zinc-400` | `#a1a1aa` | `#111111` | **7.6:1** | 3:1 | ✅ |
| Title `<h3>` | `text-white` | `#ffffff` | `#111111` | **19.2:1** | 4.5:1 | ✅ |
| Description `<p>` | `text-zinc-400` | `#a1a1aa` | `#111111` | **7.6:1** | 4.5:1 | ✅ |
| Button text | `text-white` | `#ffffff` | `bg-[#2D2D2D]` `#2d2d2d` | **9.5:1** | 4.5:1 | ✅ |

**Change applied:**
- **Icon colour bumped** from `text-zinc-500` (`#71717a`, ~4.1:1) →
  `text-zinc-400` (`#a1a1aa`, **7.6:1**). The previous value technically
  passed the 3:1 icon threshold but had minimal headroom (~1.1:1 margin).
  The new value provides comfortable margin and is consistent with the
  body-copy colour used in both components.

**Outcome:** One colour adjustment applied (icon). All pairings now have
substantial headroom above WCAG 2.1 AA thresholds. ✅

---

## Keyboard Shortcut Help Modal — Accessibility Annotations

**Branch:** `feature/global-shortcut-help-modal`  
**Scope:** `ShortcutHelpModal`, `useShortcutModal`, `AppLayout`  
**Standard:** WCAG 2.1 Level AA  
**Date:** 2026-07-29

---

### Overview

The shortcut help modal (`components/common/shortcut-help-modal.tsx`) is a
Radix UI `<Dialog>` that lists every registered keyboard shortcut, grouped by
context area (Global, Navigation, Dashboard, Transactions). It is triggered
globally by pressing `?` (Shift + /) and can be dismissed with `Esc`, a click
outside, or the explicit close button.

---

### WCAG Criteria addressed

#### 1. Dialog semantics — `role="dialog"`, `aria-labelledby`, `aria-modal` (WCAG 4.1.2)

Radix `DialogContent` automatically renders with `role="dialog"` and wires
`aria-labelledby` to the `DialogTitle` and `aria-describedby` to the
`DialogDescription`. We additionally set `aria-modal="true"` to inform
AT that content behind the dialog is inert.

```tsx
<DialogContent aria-modal="true">
  <DialogTitle>Keyboard Shortcuts</DialogTitle>
  <DialogDescription>Press ? at any time …</DialogDescription>
```

**axe rules satisfied:** `dialog-name`, `aria-required-attr`

---

#### 2. Focus trap and Escape key (WCAG 2.1.1, 2.4.3)

Radix Dialog traps focus inside the modal while it is open and restores it to
the trigger element when it closes. `Esc` closes the dialog by default. No
additional code is required.

**axe rules satisfied:** `focus-trap`

---

#### 3. Keyboard-scrollable content region (WCAG 2.1.1 — Keyboard)

The shortcut list container has `tabIndex={0}` so keyboard-only users can
scroll through it with the arrow keys after tabbing to it. Without this,
content that overflows the scroll area is unreachable without a mouse.

```tsx
<div role="region" aria-label="Keyboard shortcut list" tabIndex={0}>
```

**axe rule satisfied:** `scrollable-region-focusable`

---

#### 4. Accessible name for the scroll region (WCAG 1.3.6)

`role="region"` requires an accessible name. We provide `aria-label="Keyboard
shortcut list"` so screen readers announce the landmark:
"Keyboard shortcut list, region".

---

#### 5. `<kbd>` semantics for key names (WCAG 1.3.1 — Info and Relationships)

Each shortcut key is rendered inside a `<kbd>` element. Screen readers
announce `<kbd>` content as "keyboard key X" in many AT, making it clear
to non-sighted users that a string refers to a keyboard key rather than
body text.

---

#### 6. `role="img"` + `aria-label` on key sequences (WCAG 1.1.1, 1.3.1)

A multi-key sequence such as `["g", "d"]` would be read as two unrelated
characters without an accessible group label. We wrap each key sequence
in a `<span role="img" aria-label="g then d">` so screen readers
announce the entire sequence as a single unit.

```tsx
<span role="img" aria-label="g then d">
  <kbd>g</kbd>
  <span aria-hidden="true">then</span>
  <kbd>d</kbd>
</span>
```

The visual "then" separator is `aria-hidden="true"` because the `aria-label`
on the parent already conveys the full meaning.

**axe rule satisfied:** `image-alt`

---

#### 7. Group headings and section landmarks (WCAG 1.3.1, 2.4.6)

Each shortcut context (Global, Navigation, etc.) is wrapped in a `<section>`
with `aria-labelledby` pointing to a corresponding `<h3>`. This:

- Creates a named section landmark so AT users can jump between groups.
- Maintains a logical heading hierarchy (`<h2>` dialog title → `<h3>` groups).

```tsx
<section aria-labelledby="shortcut-group-global">
  <h3 id="shortcut-group-global">Global</h3>
  …
</section>
```

**axe rules satisfied:** `heading-order`, `landmark-unique`

---

#### 8. Empty-state status message (WCAG 4.1.3 — Status Messages)

When no groups are registered, a `<p role="status">` is rendered so
assistive technologies announce the "No shortcuts registered." message
without requiring focus to move to it.

```tsx
<p role="status">No shortcuts registered.</p>
```

---

#### 9. Shortcut suppression in text inputs (WCAG 2.1.1)

The `useShortcutModal` hook checks `document.activeElement` before
responding to `?`. If the focused element is an `<input>`, `<textarea>`,
`<select>`, or a `contenteditable` element, the shortcut is ignored. This
ensures the keyboard shortcut does not conflict with normal text entry and
meets the WCAG success criterion that keyboard shortcuts using a single
printable character can be turned off or remapped (WCAG 2.1.4 — Character
Key Shortcuts, Level A).

```ts
function isFocusedOnTextInput(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}
```

---

#### 10. Colour contrast — design tokens (WCAG 1.4.3)

The modal uses semantic colour tokens from the project's Tailwind theme
(`bg-background`, `text-foreground`, `text-muted-foreground`) which have
been validated at 4.5:1 contrast for body text and 3:1 for large text in
both light and dark mode.

Key-badge colours:
- Light: `bg-zinc-100` / `text-zinc-700` — contrast ratio ≥ 4.5:1 ✅
- Dark: `bg-zinc-800` / `text-zinc-200` — contrast ratio ≥ 4.5:1 ✅
- Muted text (`text-zinc-500` / `text-zinc-400`) is used for decorative
  elements only (group headings, footer hint) — flagged for design token
  audit in P1-01.

---

#### 11. Responsive behaviour (WCAG 1.4.10 — Reflow)

| Breakpoint | Behaviour |
|------------|-----------|
| xs (< 640 px) | Full-width single-column list; `max-h-[90dvh]` prevents overflow |
| sm (≥ 640 px) | Max-width capped at `max-w-lg` (32 rem) |
| md (≥ 768 px) | Two-column grid for shortcut groups side-by-side |
| lg (≥ 1024 px) | Max-width expands to `max-w-2xl` (42 rem) |

Content does not require horizontal scrolling at any breakpoint and remains
usable at 320 px viewport width (WCAG 1.4.10 Reflow).

---

#### 12. Reduced motion

The Radix Dialog open/close animation uses `data-[state=open]:animate-in` /
`data-[state=closed]:animate-out` driven by CSS, which automatically respects
the user's `prefers-reduced-motion: reduce` preference because Tailwind's
animation utilities are disabled when that media query is active.

---

### Keyboard navigation — manual test results

| Action | Expected behaviour | Status |
|--------|--------------------|--------|
| Press `?` from anywhere | Modal opens | ✅ |
| Press `?` again | Modal closes | ✅ |
| Press `?` while focused in `<input>` | Modal stays closed | ✅ |
| `Tab` inside open modal | Cycles through close button + scroll region | ✅ |
| `Shift+Tab` inside open modal | Reverse cycle | ✅ |
| `Esc` | Modal closes | ✅ |
| Click outside overlay | Modal closes | ✅ (Radix default) |
| Focus returns after close | Focus returns to previously focused element | ✅ (Radix default) |
| Arrow keys on scroll region | Scroll list | ✅ (tabIndex=0) |

---

### Screen reader — spot-check results

| Element | Announced |
|---------|-----------|
| Dialog open | "Keyboard Shortcuts, dialog" |
| Dialog description | "Press ? at any time to open this reference…" |
| Group section (e.g. Global) | "Global, region" → "Global, heading level 3" |
| Shortcut row "Show keyboard shortcuts" | "Show keyboard shortcuts" |
| Single key "?" | key sequence img: "?" |
| Multi-key "g then d" | key sequence img: "g then d" |
| Close button | "Close, button" |
| Empty state | "No shortcuts registered., status" |

---

### Files changed

| File | Changes |
|------|---------|
| `lib/shortcuts.ts` | New — shortcut registry (data only, no UI) |
| `hooks/useShortcutModal.ts` | New — open state + global `?` key listener with input suppression |
| `components/common/shortcut-help-modal.tsx` | New — accessible Dialog component rendering grouped shortcuts |
| `components/common/app-layout.tsx` | Updated — mounts `ShortcutHelpModal` + `useShortcutModal` |
| `components/common/shortcut-help-modal.test.tsx` | New — rendering, accessibility, and behaviour unit tests |
| `components/common/app-layout.test.tsx` | Updated — shortcut modal integration tests |
| `design/a11y-checklist.md` | Updated — this section |

---

## Auth Showcase Panel Contrast Audit (Dark Mode)

**Branch:** `design-system/auth-showcase-dark-contrast`  
**Scope:** `components/auth/auth-showcase.tsx`  
**Standard:** WCAG 2.1 Level AA  
**Date:** 2026-07-29

### Issue
In dark mode, the overlay text elements (`title` and `description`) fall below the 4.5:1 contrast ratio against the underlying artwork/background.

### Fix
Added a scrim/gradient overlay token (`dark:bg-gradient-to-b dark:from-black/80 dark:to-transparent`) behind the text content region.
This ensures a contrast ratio of at least 4.5:1 for standard text and 3:1 for large text.

**WCAG:** 1.4.3 Contrast (Minimum)
**axe rule:** `color-contrast`
