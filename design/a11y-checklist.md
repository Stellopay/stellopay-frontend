# Accessibility Checklist — WCAG 2.1 AA Baseline

## Overview
This checklist defines the mandatory accessibility requirements (targeting WCAG 2.1 AA compliance) for all components and views in the Stellopay frontend.

## Components

### Requirement
Every component that uses framer-motion (or any JS-driven animation) **must** check the user's `prefers-reduced-motion: reduce` OS-level preference and disable or simplify the animation accordingly.

### Implementation

| Component | Hook used | Animation type | Reduced-motion behavior |
|---|---|---|---|
| `components/landing/hero.tsx` | `useReducedMotion()` | Decorative gradient orbs, rotated floating cards | Orbs hidden entirely; card rotation disabled |
| `components/common/nav-link.tsx` | `useReducedMotion()` | Spring-animated active-link background (`motion.div` with `layoutId`) | Static `<div>` replaces `<motion.div>` — same visual, no animation |
| `components/landing/faq-section.tsx` | `useReducedMotion()` | Accordion expand/collapse (`AnimatePresence` + `motion.div`) | Content rendered directly without animation wrapper |

### Shared test helper
Use `mockMatchMediaReducedMotion()` from `utils/test-utils.tsx` to assert a component renders its reduced-motion variant:

```tsx
import { mockMatchMediaReducedMotion } from "@/utils/test-utils";

it("renders without animation when reduced motion is preferred", () => {
  mockMatchMediaReducedMotion(true);
  render(<MyComponent />);
  // assert static variant is rendered
});
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
| P1-01 | Color contrast: `text-[#9CA3AF]` on dark backgrounds may fall below 4.5:1 for small text     | 1.4.3 | Requires design token audit across all components; tracked separately     |
| P1-02 | Color contrast: `text-[#52525B]` on white in hero section                                    | 1.4.3 | Same as above                                                             |
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

## Transactions Content — Live Region for Filter Result Count

**Branch:** `a11y/transactions-content-filter-count-live`  
**Scope:** `components/transactions/transactions-content.tsx`  
**Standard:** WCAG 2.1 Level AA — 4.1.3 Status Messages  
**Date:** 2026-07-29

---

### Overview

When a user changes transaction filters (search, type filter, sort, date range),
the result set updates. Screen reader users previously had no indication of how
many results matched their filters until they navigated to the table or
pagination controls. This change adds a visually hidden `aria-live="polite"`
region that announces the updated transaction count after filter changes,
keeping assistive technology users informed without interrupting their current
task.

---

### WCAG Criteria addressed

#### WCAG 4.1.3 — Status Messages

The live region uses `role="status"` with `aria-live="polite"` so screen readers
announce the updated result count without moving focus. Announcements are
debounced (500 ms) to prevent excessive notifications during rapid filter
changes such as fast typing in the search bar.

**axe rule satisfied:** `aria-live-region-content`

---

### Implementation details

```tsx
{/* Visually-hidden live region that announces filter result counts */}
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {liveMessage}
</div>
```

- **`role="status"`**: Communicates to assistive technology that this is a
  status message region (not an alert that demands immediate attention).
- **`aria-live="polite"`**: Screen readers wait for the current utterance to
  finish before announcing the update.
- **`aria-atomic="true"`**: The entire content of the region is announced as a
  single unit, not just the changed portion.
- **`className="sr-only"`**: The region is visually hidden but accessible to
  screen readers via the project's existing `.sr-only` utility.

#### Announcement logic

- **Suppressed on initial render**: No announcement fires when the component
  mounts, preventing "42 transactions found" from being read on page load
  before the user interacts with filters.
- **Debounced at 500 ms**: Rapid filter changes (e.g., typing in search) reset
  the timer so only the final result count is announced.
- **Count-aware messages**:
  - `0` → "No transactions found."
  - `1` → "1 transaction found."
  - `n` (n > 1) → "n transactions found."
- **No announcement during loading or error states**: The effect guards on
  `isLoading`, `error`, and the presence of `data`.
- **Same-count suppression**: If the total does not change between renders
  (e.g., a re-render from a sort toggle that returns the same data), no
  announcement fires.

---

### Accessibility Considerations

- **WCAG 2.2.1 (Timing Adjustable)**: The 500 ms debounce does not prevent
  access to content — it only reduces noise for screen reader users. The
  underlying data is always visible in the table and pagination controls.
- **WCAG 1.3.1 (Info and Relationships)**: The live region is a separate
  element from the table and pagination, maintaining a clear separation of
  concerns.
- **WCAG 4.1.2 (Name, Role, Value)**: `role="status"` provides the correct
  implicit ARIA role; `aria-atomic="true"` ensures complete announcements.
- **Dark mode / RTL / responsive**: The `.sr-only` class works across all
  themes, directions, and breakpoints without modification.

---

### Screen reader — spot-check results

| Action | Announced |
|--------|-----------|
| Initial page load | (nothing — suppressed) |
| Filter to "Payment Sent" with 5 results | "5 transactions found." |
| Search yields 1 result | "1 transaction found." |
| Search yields no results | "No transactions found." |
| Clear filters, back to 42 results | "42 transactions found." |
| Rapid typing in search bar | Only final count announced (debounced) |

---

### Files changed

| File | Changes |
|------|---------|
| `components/transactions/transactions-content.tsx` | Added `aria-live="polite"` region with debounced count announcements |
| `components/transactions/transactions-content.test.tsx` | Added tests for live region, announcements, debounce, initial-load suppression, loading/error states, singular/plural messages |
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

## Quick Actions Roving Tabindex — Arrow-Key Navigation

**Branch:** `a11y/quick-actions-arrow-nav`
**Scope:** `components/dashboard/quick-actions.tsx`
**Standard:** WCAG 2.1 Level AA
**Date:** 2026-07-29

### Overview

The quick-actions grid previously required Tab-by-Tab traversal across every card. With only two enabled cards and four disabled (coming-soon) cards, keyboard users had to Tab through six elements to reach the end of the group — and four of those were non-interactive placeholders.

**WCAG:** 1.4.3 Contrast (Minimum)
**axe rule:** `color-contrast`

---

## Dashboard Header Icon Actions

**File:** `components/dashboard/dashboard-header.tsx`
**Standard:** WCAG 2.1 Level AA


| File | Changes |
|------|---------|
| `components/dashboard/quick-actions.tsx` | Added `activeIndex` state, `gridRef`, `handleGridKeyDown`, `data-quick-action` and `tabIndex` on cards, `onFocus` handlers, grid `role="group"` and `aria-label` |
| `components/dashboard/quick-actions.test.tsx` | Added roving tabindex tests: single tabIndex 0, arrow key movement, Home/End, disabled card exclusion, focus tracking |
| `design/a11y-checklist.md` | Updated — this section |

---

## Landing Page Heading Hierarchy & Outline Audit — SEO and Assistive Tech

**Branch:** `a11y/landing-heading-hierarchy`
**Scope:** `components/landing/` (including `landing-page.tsx`, `hero.tsx`, `enterprise-section.tsx`, `faq-section.tsx`, `get-started-cta.tsx`, and `footer.tsx`)
**Standard:** WCAG 2.1 Level AA (SEO & Assistive Tech)
**Date:** 2026-07-29

### Overview

The landing page previously featured several sections with misaligned heading levels (such as dynamic sections starting with `h4` or skipping directly from `h1` to `h4`), styled-bold elements behaving as visual headings without proper accessibility tree semantic nodes (such as the FAQ accordion questions), and adjacent duplicate headings in the CTA section. These have been consolidated, refactored, and verified under a single semantic heading tree.

### Logical Heading Tree (Outline)

- **H1**: Main page heading ("The Future of Payroll on Blockchain") in `hero.tsx`.
- **H2**: Top-level section headings:
  - Key Features section heading ("Everything you need to scale your business") in `features-intro.tsx`.
  - How it Works section heading ("From crypto to cash — in just three steps") in `how-it-works.tsx`.
  - Value Propositions section heading ("Why businesses choose StelloPay") in `value-propositions.tsx`.
  - Enterprise Solution section heading ("Enterprise-ready blockchain solution") in `enterprise-section.tsx` (previously `h4`, now `h2`).
  - Benefits section heading ("Benefits") in `benefits.tsx`.
  - FAQ section heading ("Have any Questions? We've Got Your Answers") in `faq-section.tsx`.
  - Get Started CTA section heading ("Ready to revolutionize your payments?") in `get-started-cta.tsx` (previously two separate adjacent `h2` elements, now consolidated into a single unified `h2` element with nested `span` styling).
- **H3**: Subsection and card-level headings:
  - Feature card title ("Secure Transactions" etc.) in `feature-card.tsx`.
  - Step title ("Connect Your Wallet" etc.) in `how-it-works.tsx`.
  - Value Proposition card title ("Built for Crypto in Nigeria" etc.) in `value-propositions.tsx`.
  - Benefits card title ("Low Fees" etc.) in `benefits.tsx`.
  - FAQ item title/question ("Do I need a crypto wallet?" etc.) wrapped inside `<h3>` (W3C standard Accordion pattern).

### WCAG Criteria & Assistive Tech Addressed

- **WCAG 1.3.1 (Info and Relationships)**: Real semantic heading elements (`<h1>` to `<h3>`) define structure so screen-reader users can logically navigate headings using `H` or list headings via screen-reader shortcuts.
- **WCAG 2.4.6 (Headings and Labels)**: Consolidating CTA headers and wrapping FAQ question buttons in `<h3>` ensures clear labels that accurately describe the topic or purpose.
- **SEO Optimization**: Eliminates skipped heading levels, enhancing search-engine crawl path accuracy and keyword priority.

### Files modified/created

| File | Changes |
|------|---------|
| `components/landing/landing-page.tsx` | Document header structure validation |
| `components/landing/hero.tsx` | Added display utility typography tokens (`text-display-2xl` and `text-body-lg`) and removed skipped `h4` mock tag |
| `components/landing/enterprise-section.tsx` | Changed title from `h4` to `h2` and wired `id` labels for `aria-labelledby`/`aria-describedby` |
| `components/landing/faq-section.tsx` | Wrapped accordion question buttons in `<h3>` tags (W3C standard) |
| `components/landing/get-started-cta.tsx` | Consolidated adjacent headings into a single unified `h2` |
| `components/common/footer.tsx` | Refactored footer links/columns to use bold paragraphs, ensuring the document content outline remains completely uncluttered and precise |
| `components/landing/landing-page.test.tsx` | New test file auditing the single-H1, sequential level progression, and presence of all major H2 landmarks |
=======
The search, notification, and settings controls are icon-only, so each has a
unique accessible name: `Search dashboard`, `View notifications`, and `Open
dashboard settings`. Their Lucide SVGs are `aria-hidden` because the button
name is supplied by the control itself.

- **Keyboard navigation (WCAG 2.1.1, 2.4.7):** Native buttons support Tab,
  Enter, and Space. `focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`
  provides a visible focus indicator.
- **Contrast (WCAG 1.4.3):** The controls retain the header's existing
  gray-on-white design tokens; hover and focus styles add a non-colour-only
  interaction cue.
- **Responsive reflow (WCAG 1.4.10):** `size-11` provides a 44 px target at
  every breakpoint (sm 640 px, md 768 px, lg 1024 px, xl 1280 px), while
  `shrink-0` keeps the action group usable beside long dashboard titles.
- **Regression coverage:** `components/dashboard/dashboard-header.test.tsx`
  asserts that every icon-only action has its accessible name.


---

## Landing Page Mobile Navigation — Slide-in Panel with Focus Trap

**Branch:** `feature/landing-nav-mobile-menu`
**Scope:** `components/landing/landing-page-nav-bar.tsx`
**Standard:** WCAG 2.1 Level AA
**Closes:** #876
**Date:** 2026-08-03

---

### Overview

`components/landing/landing-page-nav-bar.tsx` previously rendered all nav links
inline with no mobile-specific affordance, causing layout overflow below the
`md` (768 px) breakpoint. This change adds a hamburger trigger that opens a
slide-in panel from the right edge of the viewport on small screens, together
with a full focus-trap, keyboard-close, backdrop-click-close, and
route-change-close.

---

### WCAG Criteria addressed

#### 1. Keyboard operability — hamburger trigger (WCAG 2.1.1)

The hamburger is a native `<button>` element with:

- `aria-expanded` reflecting open/closed state
- `aria-controls="mobile-nav-panel"` — programmatically links the trigger to its controlled region
- `aria-haspopup="dialog"` — advertises that activation opens a dialog
- `aria-label` that switches between `"Open menu"` and `"Close menu"` to always convey current action

```tsx
<button
  ref={hamburgerRef}
  aria-label={menuOpen ? "Close menu" : "Open menu"}
  aria-expanded={menuOpen}
  aria-controls="mobile-nav-panel"
  aria-haspopup="dialog"
  onClick={toggleMenu}
>
```

**WCAG:** 2.1.1 Keyboard, 4.1.2 Name/Role/Value
**axe rules satisfied:** `button-name`, `aria-required-attr`

---

#### 2. Dialog semantics — panel (WCAG 4.1.2)

The slide-in panel carries:

- `role="dialog"` — identifies it as a modal dialog
- `aria-modal="true"` — tells AT that content behind it is inert
- `aria-label="Mobile navigation menu"` — provides an accessible name without requiring a visible heading element
- `id="mobile-nav-panel"` — the target of `aria-controls` on the hamburger

```tsx
<div
  id="mobile-nav-panel"
  role="dialog"
  aria-modal="true"
  aria-label="Mobile navigation menu"
>
```

**axe rules satisfied:** `dialog-name`, `aria-required-attr`

---

#### 3. Focus management (WCAG 2.4.3)

- **On open**: focus moves to the first focusable element inside the panel
- **On close** (any method): focus is returned to the hamburger trigger
- **Scroll lock**: `document.body.style.overflow = "hidden"` prevents the
  page from scrolling while the panel is open

```tsx
useEffect(() => {
  if (menuOpen) {
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    first?.focus();
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}, [menuOpen]);
```

**WCAG:** 2.4.3 Focus Order

---

#### 4. Focus trap — Tab and Shift+Tab cycling (WCAG 2.1.1)

A `keydown` listener on `document` intercepts Tab and Shift+Tab while the panel
is open, cycling focus within the panel's focusable elements so keyboard users
cannot accidentally leave the dialog.

```tsx
if (e.key === "Tab") {
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
```

**WCAG:** 2.1.1 Keyboard (Focus Trap)

---

#### 5. Escape key dismissal (WCAG 2.1.2)

`Escape` closes the panel and returns focus to the hamburger. This is the
standard interaction pattern for dialogs (WAI-ARIA Authoring Practices 3.8).

```tsx
if (e.key === "Escape") {
  e.preventDefault();
  setMenuOpen(false);
  hamburgerRef.current?.focus();
}
```

**WCAG:** 2.1.2 No Keyboard Trap

---

#### 6. Outside-click (backdrop) dismissal (WCAG 2.1.1)

A full-screen backdrop overlay sits behind the panel. It is `aria-hidden="true"`
(decorative) but has an `onClick` handler that closes the panel and returns
focus to the hamburger, so pointer users can dismiss the menu naturally.

**WCAG:** 2.1.1 Keyboard (pointer parity)

---

#### 7. Route-change dismissal

A `useEffect` on `pathname` (from `usePathname`) automatically closes the panel
on any client-side navigation. This prevents the menu from occluding page content
after a link is activated.

---

#### 8. Active link indication (WCAG 1.4.1, 2.4.8)

Every nav link carries `aria-current="page"` when `pathname === link.href`.
Active links are also styled `text-[#598EFF]` (brand blue), providing a
non-colour-only active cue through the text colour and the AT announcement.

**WCAG:** 2.4.8 Location, 1.4.1 Use of Color

---

#### 9. Visibility — `invisible` when closed (WCAG 2.4.3)

The panel is kept in the DOM at all times for CSS transition support, but
receives `invisible` (equivalent to `visibility: hidden`) when closed. This
hides it from the accessibility tree and prevents Tab focus from reaching links
inside the closed panel.

---

#### 10. Colour contrast (WCAG 1.4.3)

| Element | Foreground | Background | Contrast |
|---------|-----------|-----------|---------|
| Nav link text | `#FFFFFF` | `#0a0a0a` | ~21:1 ✅ |
| Active link text | `#598EFF` | `#0a0a0a` | ~4.7:1 ✅ |
| Log in button | `#EEF4FF` | `#0a0a0a` (transparent border) | ≥4.5:1 ✅ |
| Sign Up button | `#FFFFFF` | `#598EFF` | ~4.7:1 ✅ |

---

#### 11. Focus indicators (WCAG 2.4.7)

All interactive elements inside the panel use
`focus-visible:ring-2 focus-visible:ring-[#598EFF]` — a 2 px solid ring in
the brand blue — providing a visible focus indicator that meets 3:1 contrast
against both the dark panel background and adjacent text.

---

#### 12. Reduced motion

The slide animation is driven by Tailwind's `transition-transform duration-300`
CSS property. Tailwind's `prefers-reduced-motion: reduce` variant automatically
suppresses transitions when the user has that OS preference set, so no JS-side
`useReducedMotion` hook is required for this CSS-only animation.

---

#### 13. Responsive breakpoints

| Breakpoint | Behaviour |
|-----------|-----------|
| `< md` (< 768 px) | Hamburger visible; panel available; desktop nav hidden (`hidden md:flex`) |
| `md` (≥ 768 px) | Desktop nav and auth buttons shown; hamburger hidden (`md:hidden`); panel CSS-hidden (`md:hidden`) |
| `lg` (≥ 1024 px) | Same as md |
| `xl` (≥ 1280 px) | Same as md |

The panel width is `min(80vw, 320px)` so it never exceeds 80% of the viewport
at any screen size. Content does not require horizontal scrolling (WCAG 1.4.10
Reflow) and the panel is independently scrollable on very small/short screens.

---

### Keyboard navigation — manual test results

| Action | Expected behaviour | Status |
|--------|--------------------|--------|
| Tab to hamburger, Enter | Panel opens | ✅ |
| `Escape` while panel open | Panel closes, focus returns to hamburger | ✅ |
| `Tab` on last focusable in panel | Focus wraps to first | ✅ |
| `Shift+Tab` on first focusable | Focus wraps to last | ✅ |
| Click nav link | Panel closes | ✅ |
| Click backdrop overlay | Panel closes, focus returns to hamburger | ✅ |
| Navigate to new route | Panel closes | ✅ |

---

### Resolved P1 issue

This section resolves **P1-03** from the P1 Issues table:

| # | Issue | WCAG | Resolution |
|---|-------|------|------------|
| P1-03 | Focus order in mobile nav drawer — links should be trapped while open | 2.4.3 | Implemented native focus trap in `landing-page-nav-bar.tsx` without external dependency |

---

### Files changed

| File | Changes |
|------|---------|
| `components/landing/landing-page-nav-bar.tsx` | Added slide-in panel, focus trap, ARIA attributes, route-change close, body scroll lock |
| `components/landing/landing-page-nav-bar.test.tsx` | New — unit tests for all behaviours (initial render, open/close, ARIA, Escape, focus trap, route change, nav links, scroll lock, backdrop) |
| `design/a11y-checklist.md` | Added this section |
