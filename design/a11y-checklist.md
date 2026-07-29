# Accessibility Checklist — WCAG 2.1 AA Baseline

## Overview
This checklist defines the mandatory accessibility requirements (targeting WCAG 2.1 AA compliance) for all components and views in the Stellopay frontend.

## Reduced Motion (WCAG 2.1 Success Criterion 2.3.3 — Animation from Interactions)

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

feat/global-error-report-action
**WCAG:** 1.4.3 Contrast (Minimum)
**axe rule:** `color-contrast`

---

## Global Error Boundary — Report Issue Action (Issue #feat/global-error-report-action)

**Branch:** `feat/global-error-report-action`  
**Scope:** `app/global-error.tsx`, `app/global-error.test.tsx`  
**Standard:** WCAG 2.1 Level AA  
**Date:** 2026-07-29

### Overview

`global-error.tsx` is the last-resort error boundary rendered when the root layout itself crashes. Previously it displayed only a generic message and a "Try again" button, giving users no way to report the failure. A "Report this issue" link was added that opens a `mailto:` link pre-filled with the error digest as a reference identifier.

### WCAG Criteria addressed

#### 1. Link semantics — `<a>` with `href` (WCAG 4.1.2 — Name, Role, Value)

The report action is rendered as a native `<a>` element with a valid `mailto:` `href`. Native links are implicitly recognised by assistive technology as links with a "go" action. No custom ARIA roles are required.

**axe rules satisfied:** `link-name`, `aria-allowed-attr`

#### 2. Accessible name via `aria-label` (WCAG 4.1.2)

The link includes `aria-label="Report this issue to support with reference {digest}"` so screen readers announce the purpose and the reference identifier together, even though the visible text is "Report this issue".

#### 3. Keyboard activation (WCAG 2.1.1 — Keyboard)

Native `<a href="mailto:...">` elements are keyboard-focusable and activated by Enter by default. An `onKeyDown` handler additionally handles the Space key for the `mailto:` protocol (which some browsers may not activate with Space on `mailto:` links). The link receives visible focus via the browser's default focus ring.

**axe rules satisfied:** `interactive-supports-focus`

#### 4. Visual hierarchy — secondary action (WCAG 1.4.1 — Use of Color)

The report link is styled at `0.8rem` in `#6b7280` (muted gray) with underline, visually subordinate to the primary "Try again" button (`0.95rem`, `#ffffff` on `#111827`). The link is distinguishable by both colour and underlining, not by colour alone.

#### 5. Contrast — report link text (WCAG 1.4.3 — Contrast Minimum)

| Element | Foreground | Background | Ratio | Threshold | Pass |
|---------|------------|------------|-------|-----------|------|
| Report link text | `#6b7280` | `#f9fafb` | **4.7:1** | 4.5:1 | ✅ |

The link text passes WCAG 2.1 AA at 4.7:1 against the page background.

#### 6. No error content in user-facing payload (Security + WCAG 1.1.1)

The `mailto:` body contains only the digest reference and a prompt to describe what the user was doing. The raw `error.message` and `error.stack` are deliberately excluded from the mailto URI to prevent leaking internal paths or sensitive information.

### Keyboard navigation — manual test results

| Action | Expected behaviour | Status |
|--------|--------------------|--------|
| Tab from "Try again" to "Report this issue" | Focus moves to the link | ✅ |
| Enter on the link | Opens default mail client with pre-filled subject/body | ✅ |
| Space on the link | Opens default mail client (custom handler) | ✅ |
| Focus ring visible on the link | Browser default focus ring | ✅ |

### Responsive behaviour

| Breakpoint | Behaviour |
|------------|-----------|
| All (inline styles, no CSS dependencies) | Actions stack vertically inside a flex column; link wraps naturally. No horizontal scrolling. |

A roving-tabindex pattern now lets ArrowLeft/ArrowRight (and ArrowUp/ArrowDown in multi-column layouts) move focus between enabled cards with a single Tab to enter the group and a single Shift+Tab to leave it.

### Implementation

- **`activeIndex` state** tracks which card should hold `tabIndex={0}`; all other enabled cards receive `tabIndex={-1}`
- **`handleGridKeyDown`** on the grid container intercepts ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Home/End, computes the next focus target respecting the CSS grid column count, and calls `.focus()` on the target element
- **`data-quick-action` attribute** marks only enabled (non-disabled) cards so arrow navigation skips the disabled placeholders
- **`onFocus` on each card** keeps `activeIndex` in sync when focus arrives via Tab or click
- **Grid columns** are read from `getComputedStyle` at keydown time so arrow-down behaviour adapts to the current breakpoint (1 col on mobile, 2 on sm, 3 on lg, 6 on xl)

### WCAG Criteria addressed

| Criterion | Description |
|-----------|-------------|
| 2.1.1 Keyboard | Arrow keys move focus between cards; Tab/Shift+Tab enters/exits the group in one step |
| 2.4.3 Focus Order | Roving tabindex maintains logical focus order |
| 4.1.2 Name, Role, Value | Each card retains its `aria-label` and semantic role (`link` or `button`) |
 main

### Files changed

| File | Changes |
|------|---------|
 feat/global-error-report-action
| `app/global-error.tsx` | Added `error` prop destructuring; added "Report this issue" `<a>` mailto link with digest; wrapped actions in flex column |
| `app/global-error.test.tsx` | Added 6 test cases: link renders, mailto contains digest, no error message in href, aria-label present, empty digest fallback, both actions present |
| `design/a11y-checklist.md` | Added this section |

| `components/dashboard/quick-actions.tsx` | Added `activeIndex` state, `gridRef`, `handleGridKeyDown`, `data-quick-action` and `tabIndex` on cards, `onFocus` handlers, grid `role="group"` and `aria-label` |
| `components/dashboard/quick-actions.test.tsx` | Added roving tabindex tests: single tabIndex 0, arrow key movement, Home/End, disabled card exclusion, focus tracking |
| `design/a11y-checklist.md` | Updated — this section |
main
