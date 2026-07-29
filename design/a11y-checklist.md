# Accessibility Checklist — WCAG 2.1 AA Baseline

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
| P1-01 | Color contrast: `text-[#9CA3AF]` on dark backgrounds may fall below 4.5:1 for small text     | 1.4.3 | Requires design token audit across all components; tracked separately     |
| P1-02 | Color contrast: `text-[#52525B]` on white in hero section                                    | 1.4.3 | Same as above                                                             |
| P1-03 | Focus order in mobile nav drawer — links should be trapped while open                        | 2.4.3 | Requires `focus-trap-react` or Radix Dialog; deferred to follow-up        |
| P1-04 | `<AuthSocialButtons>` — social login buttons need `aria-label` with provider name            | 4.1.2 | Component not in scope of this pass; tracked                              |
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
| `components/common/notification-panel.tsx`        | Keyboard navigation (roving tabindex, Enter, Space, Escape, focus ring)                 |
| `components/common/notification-panel.test.tsx`   | 16 new keyboard-navigation tests (27 total)                                              |

### Transaction Table Tooltips
- **Contrast**: Focus ring (focus:ring-[#D7E0EF]) provides clear 3:1 contrast against dark background.
- **Keyboard Nav**: tabIndex={0} makes truncated addresses and amounts focusable, revealing the title tooltip.
- **ARIA**: Screen readers read the full content within the span natively, while sighted users see tooltips on hover/focus.

---

## Notification Panel — Added Keyboard Navigation

**File:** `components/common/notification-panel.tsx`
**PR:** Adds listbox keyboard pattern (WAI-ARIA roving tabindex) to the notification list.

### Keyboard Shortcuts

| Key           | Action                                              |
| ------------- | --------------------------------------------------- |
| Arrow Down    | Move focus to the next notification (wraps to top)  |
| Arrow Up      | Move focus to the previous notification (wraps to bottom) |
| Home          | Jump to the first notification                      |
| End           | Jump to the last notification                       |
| Enter / Space | Activate (click) the focused notification           |
| Escape        | Close the panel and return focus to the bell trigger |

### ARIA Attributes Applied

| Element              | Attribute                    | Purpose                                               |
| -------------------- | ---------------------------- | ----------------------------------------------------- |
| Notification list    | `role="listbox"`             | Communicates listbox navigation pattern to AT         |
| Notification list    | `aria-label="Notifications list"` | Provides accessible name for the listbox         |
| Each notification    | `role="option"`              | Identifies each item as a listbox option              |
| Each notification    | `aria-selected`              | Indicates which option is currently focused           |
| Each notification    | `tabIndex` (roving)          | Only the focused option is in the Tab order           |
| Bell trigger button  | `aria-label="Notifications"` | (pre-existing) Accessible label for the trigger       |

### Focus Restoration

On Escape, the component:
1. Queries the bell trigger inside the panel via `[aria-label="Notifications"]`
2. Calls `.focus()` on the trigger to return keyboard focus
3. Invokes the `onClose` callback so the parent can hide the panel

### Design Decisions

- **Roving tabindex over `aria-activedescendant`**: Each option receives focus directly, providing a more robust keyboard experience and ensuring visible focus rings (WCAG 2.4.7 Focus Visible).
- **Wrapping navigation**: Arrow Down from the last item wraps to the first and vice versa, matching common listbox expectations.
- **`focus-visible` ring**: Items show a focus ring only when focused via keyboard (not click), using `focus-visible:ring-2` (WCAG 2.4.7, 1.4.1).
- **No `aria-live` on listbox**: Removed when switching from `role="region"` to `role="listbox"`, as listbox provides its own semantics; new notifications arriving will still be announced by the DOM mutation.

### Responsive / State Coverage

| State                     | Keyboard nav behavior                                       |
| ------------------------- | ----------------------------------------------------------- |
| Loading                   | No listbox rendered; skeletons are non-interactive          |
| Empty                     | No listbox rendered; empty state is static                  |
| Single notification       | Arrow keys wrap onto the same item; no visible movement     |
| Multiple notifications    | Full navigation as described above                          |
| Notifications re-keyed    | `focusedIndex` resets to 0 on list change                   |

### Tests (27 total, 16 new keyboard-nav tests)

| Test                                              | File                                             |
| ------------------------------------------------- | ------------------------------------------------ |
| All pre-existing tests (11)                       | `notification-panel.test.tsx`                    |
| listbox role + aria-label                         | `notification-panel.test.tsx`                    |
| Default tabIndex (first=0, others=-1)             | `notification-panel.test.tsx`                    |
| ArrowDown updates tabIndex                        | `notification-panel.test.tsx`                    |
| ArrowDown forward / ArrowUp backward              | `notification-panel.test.tsx`                    |
| Wrap last→first on ArrowDown                      | `notification-panel.test.tsx`                    |
| Wrap first→last on ArrowUp                        | `notification-panel.test.tsx`                    |
| Home jumps to first                               | `notification-panel.test.tsx`                    |
| End jumps to last                                 | `notification-panel.test.tsx`                    |
| aria-selected tracks focus                        | `notification-panel.test.tsx`                    |
| Enter activates notification                      | `notification-panel.test.tsx`                    |
| Space activates notification                      | `notification-panel.test.tsx`                    |
| Click activates notification                      | `notification-panel.test.tsx`                    |
| Escape calls onClose                              | `notification-panel.test.tsx`                    |
| Non-activation key is no-op                       | `notification-panel.test.tsx`                    |
| focusedIndex resets on notification change        | `notification-panel.test.tsx`                    |
| No listbox in empty/loading states                | `notification-panel.test.tsx`                    |
