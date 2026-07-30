 ui/notifications-section-channel-matrix
# Settings Information Architecture

## Overview

`app/settings/preferences` is a single-page tabbed shell (`SettingsPageShell`)
that organises all user-facing settings into sections. The active section is
driven by the `?section=<value>` query-string parameter so deep links and
browser history work correctly.

Five tabs are live as of this writing:

| Tab value     | Label        | Purpose                                                    |
| ------------- | ------------ | ---------------------------------------------------------- |
| `account`     | Account      | Profile fields, identity verification, and locale defaults |
| `notifications` | Notifications | Transaction alerts and delivery-channel toggles          |
| `security`    | Security     | Password change, 2-FA setup, active sessions, API keys     |
| `wallets`     | Wallets      | Connected Stellar wallets and transfer-limit safeguards    |
| `documents`   | Statements   | Periodic statements and downloadable tax summaries         |

> **Updating tab count?** If you add or remove a tab, update this table, the
> `buildSections()` function in `settings-page-shell.tsx`, and the summary
> below.

---

## Tab-by-tab breakdown

### Account (`account`)

Core identity and locale controls.

- Display name, avatar upload, and contact email
- Regional defaults: currency, timezone, language
- Profile-completion indicator (drives the **Profile readiness** summary card)
- Danger zone: account closure (gated behind the `DestructiveActionDialog`)

Accessibility notes:
- Avatar upload uses a visually hidden `<input type="file">` with an explicit
  `<label>` — no `aria-label` gymnastics required.
- Inline validation errors are associated via `aria-describedby`.

### Notifications (`notifications`)

Notification-type × delivery-channel matrix. Each of the four notification
types can be independently enabled for email, push, and SMS delivery.

- **Transaction alerts** — sends, receives, failed payments
- **Security notifications** — login from new device, password change
- **Product updates** — new features and policy changes (opt-in)
- **Marketing and announcements** — campaigns and educational content (opt-in)
- Channels: **Email**, **Push**, **SMS**

The **Alerts enabled** summary card reflects the total count of enabled
channel–type pairs (max 12). The count is derived from live state, not a
hardcoded string.

Accessibility notes:
- **Desktop (≥768 px):** Rendered as a semantic `role="table"` grid with
  `role="columnheader"` cells for channel headings and `role="row"` /
  `role="cell"` for each type row. Every checkbox carries an explicit
  `aria-label` of the form `"Transaction alerts, email channel"` so the
  notification type and channel are announced together, independent of grid
  position.
- **Mobile (<768 px):** The matrix collapses to a stacked layout. Each
  notification type is wrapped in a bordered card with labelled checkboxes
  (`<label htmlFor="…">`) so the channel name appears adjacent to each
  checkbox.
- **Keyboard navigation:** All checkboxes are Radix `Checkbox` primitives
  and are natively focusable via Tab. Focus indicators use the project's
  `focus-visible:ring-ring/50` ring token.
- **Status messages** use `aria-live="polite"` and `aria-atomic="true"` to
  announce save outcomes without moving focus.

### Security (`security`)

Credential and session management.

- Password change form with live policy checklist (8+ chars, uppercase,
  special char, matching confirm)
- Two-factor authentication (TOTP): toggle with guided setup panel,
  6-digit code verification
- Active sessions list with selective revocation
- Recovery methods (collapsible disclosure)
- API key management: create, rotate, revoke with destructive confirmation

Accessibility notes:
- Password inputs carry `aria-invalid` and `aria-describedby` linked to the
  inline error paragraphs.
- The 2-FA setup panel is a `role="form"` region with a labelled `aria-label`;
  inline errors use `role="alert"`.
- The sign-out-all-sessions and API key rotate/revoke actions both pass through
  `DestructiveActionDialog`, which traps focus and requires a typed keyword
  confirmation before enabling the destructive button.

### Wallets (`wallets`)

Stellar wallet management.

- List of connected wallets (sourced from `DEMO_WALLETS` in `lib/demo-data.ts`,
  eventually from the `WalletProvider` context)
- Add / remove wallet flows
- Transfer-limit safeguards per wallet

The **Wallet coverage** summary card mirrors `DEMO_WALLETS.length` so the
displayed count stays in sync with the data.

### Statements / Tax Documents (`documents`)

Downloadable financial records.

- Quarterly transaction statements
- Annual tax summaries
- Each row shows: period label, type badge, file size, and a download link
  (`<a download>` with a `data:` URI)
- Empty state (`role="status"`) is shown when `statements` prop is `[]`

The **Statements** summary card mirrors the count passed as the `statements`
prop to `SettingsPageShell`.

---

## Adding a new settings section

> **Where to document new sections:** This file (`design/settings-ia.md`) is
> the single source of truth for the settings information architecture. Any
> time a new tab is introduced — or an existing tab is renamed, reordered, or
> removed — the change **must** be reflected here first (update the table at
> the top and add/edit the corresponding subsection), then propagated to
> `buildSections()` in `settings-page-shell.tsx` and to the test suite. The
> README's _Settings section structure_ paragraph mirrors the high-level tab
> list; keep it in sync too.

1. **Create the section component** under
   `app/settings/preferences/components/<name>-section.tsx`.
2. **Register it in `buildSections()`** inside `settings-page-shell.tsx`.  
   Pick a unique `value` key (lowercase, hyphen-separated), a short `label`,
   a one-line `description`, and an optional dynamic `badge`.
3. **Add a `<TabsContent>`** block in the shell's JSX, using the same `value`
   as the key above.
4. **Add a summary card** to the summary-card grid if the section has a metric
   worth surfacing at a glance. Derive the displayed value from live state, not
   a hardcoded string. Update the `xl:grid-cols-*` class on the grid container
   to match the new column count.
5. **Write tests**: add `<name>-section.test.tsx` alongside the component, and
   extend `settings-page-shell.test.tsx` and `page.test.tsx` for any
   shell-level or routing interactions the new tab introduces.
6. **Update this document**: add a row to the tab table at the top of this
   file and a subsection below the existing ones, following the same format
   (purpose, field/control inventory, accessibility notes). Then update the
   README's _Settings section structure_ paragraph so the inline tab list stays
   accurate.

> **Example — proposed tax-documents tab (now live as "Statements"):**  
> The `tax-documents-section.tsx` component was added following exactly these
> steps. The `documents` tab value, the `TaxDocumentsSection` import, and the
> `statementCount` badge expression in `buildSections()` were all introduced
> together so the shell, the tests, and this spec stayed consistent.

---

## Routing and deep links

The shell reads `?section=<value>` from the URL on mount. Unknown values
silently fall back to `account`. Switching tabs calls `router.replace()` to
keep the address bar in sync without adding a history entry per click.

```
/settings/preferences                  → account tab
/settings/preferences?section=security → security tab
/settings/preferences?section=unknown  → account tab (fallback)
```

---

## Unsaved-changes guard

The shell tracks a "dirty" flag (currently scoped to the Account section's
profile form). If the user attempts to switch tabs with unsaved edits, a
`<Dialog>` intercepts the navigation:

- **Stay** — dismisses the dialog, leaving the user on the current tab with
  their edits intact.
- **Discard changes** — resets the dirty state, then switches to the
  requested tab.

Extend this guard to other sections by adding corresponding dirty flags to the
shell state and including them in the `isDirty` expression.

---

## Accessibility checklist (WCAG 2.1 AA)

| Criterion | Implementation |
| --------- | -------------- |
| Tab list keyboard navigation | Arrow keys (left/right), Home, End — driven by Radix `<Tabs>` |
| Active tab in tab order only | `tabIndex={0}` only on the selected tab; others at `-1` |
| Section heading hierarchy | Each section starts with an `<h2>` |
| Focus trap in dialogs | `<Dialog>` from Radix traps focus automatically |
| Destructive actions gated | `DestructiveActionDialog` requires typed keyword before enabling |
| Live regions | Summary cards use `aria-live` where values change dynamically |
| Form error association | `aria-describedby` links inputs to their inline error elements |
| Colour contrast | All text meets 4.5:1 against its background in both light and dark themes |

---

## Responsive behaviour

The settings page uses a full-viewport-height shell with responsive layout:

| Breakpoint | Layout notes |
| ---------- | ------------ |
| `sm` (640 px) | Tabs wrap; summary cards stack in a single column |
| `md` (768 px) | Summary cards shift to a two-column grid |
| `xl` (1280 px) | Summary cards expand to the full five-column grid |

The tab header (`SettingsHeader`) scrolls horizontally on narrow viewports so
all tab labels remain reachable without wrapping to multiple rows.

---

## Related files

| File | Role |
| ---- | ---- |
| `app/settings/preferences/page.tsx` | Server component; reads `?section` from `searchParams` |
| `app/settings/preferences/layout.tsx` | Route layout wrapping the shell |
| `app/settings/preferences/loading.tsx` | Suspense fallback skeleton |
| `app/settings/preferences/components/settings-page-shell.tsx` | The tabbed shell and summary cards |
| `app/settings/preferences/components/account-section.tsx` | Account tab content |
| `app/settings/preferences/components/notifications-section.tsx` | Notifications tab content |
| `app/settings/preferences/components/security-tab.tsx` | Security tab content |
| `app/settings/preferences/components/wallets-section.tsx` | Wallets tab content |
| `app/settings/preferences/components/tax-documents-section.tsx` | Statements tab content |
| `app/settings/preferences/components/destructive-action-dialog.tsx` | Shared confirmation dialog |
| `components/settings-header.tsx` | Reusable tab-list header |
| `lib/demo-data.ts` | Mock wallet and statement data |
| `design/screenshots/settings-desktop.png` | Reference screenshot — desktop |
| `design/screenshots/settings-mobile.png` | Reference screenshot — mobile |
| `design/screenshots/settings-add-wallet.png` | Reference screenshot — add wallet flow |
 main
# Settings Information Architecture & Accessibility (IA)

## Tab Structure

The Settings Preferences page is organized into five tabs, each managing a distinct area of the user's account:

| Tab          | Value          | Controls                                                         |
|--------------|----------------|------------------------------------------------------------------|
| Account      | `account`      | Profile fields, avatar, cookie preferences, deactivation         |
| Notifications| `notifications`| Event toggles, delivery channels, digest frequencies             |
| Security     | `security`     | Password change, 2FA, session management, API keys               |
| Wallets      | `wallets`      | Connected wallet list, remove wallet                             |
| Statements   | `documents`    | Tax document download table                                      |

Tab state is persisted in the URL via `?section=<value>` query parameter. The default tab is `account`.

## Cross-Tab Search

### Overview
The settings page includes a lightweight search box (`components/settings-search.tsx`) that allows users to find controls across all tabs without needing to guess which tab a control lives in.

### Architecture
- **Search Catalog**: A static `SEARCHABLE_CONTROLS` array in `components/settings-search.tsx` maps each control's label, section, and searchable keywords.
- **Ranking**: Results are ranked by relevance score — exact label match (100), starts-with (80), contains (60), keyword prefix (50), keyword contains (30).
- **Navigation**: Selecting a result calls `onResultSelect(section, label)` which:
  1. Switches to the target tab via `router.replace`
  2. Sets `highlightedSearchLabel` state in `SettingsPageShell`
  3. Passes the label to the target section component
- **Highlighting**: The `useSearchHighlight` hook (`hooks/useSearchHighlight.ts`) queries the DOM for `[data-search-label="<label>"]`, scrolls the element into view, and applies a temporary `animate-search-highlight` CSS animation (2.5s fade-out).

### Searchable Controls

**Account section:**
- First name, Last name, Display name, Email address
- Timezone, Settlement currency
- Deactivate account

**Notifications section:**
- Transaction alerts, Security notifications, Product updates
- Marketing and announcements
- Email, Push notifications, SMS fallback

**Security section:**
- Password and recovery, Authenticator app verification
- New device approval, Large transfer approval
- Active sessions, Sign out all sessions

**Wallets section:**
- Connected wallets, Add wallet
- Approval required for new recipients, Lock approved address book
- Travel rule checks, Remove primary wallet

### Adding New Searchable Controls
1. Add the control to `SEARCHABLE_CONTROLS` in `components/settings-search.tsx`
2. Add `data-search-label="<exact label>"` to the control's root DOM element
3. If using `ToggleCard`, pass `searchLabel` prop instead

## `useSearchHighlight` Hook

**File:** `hooks/useSearchHighlight.ts`

```typescript
function useSearchHighlight(highlightedLabel: string | null): void
```

- Accepts a search label string (or null to skip)
- When the label changes, queries `[data-search-label="<label>"]` in the DOM
- Calls `element.scrollIntoView({ behavior: "smooth", block: "center" })`
- Adds `animate-search-highlight` class for 3 seconds, then removes it
- Cleans up on unmount or re-render

## `SettingsSearch` Component

**File:** `components/settings-search.tsx`

### Props
```typescript
interface SettingsSearchProps {
  onResultSelect?: (section: string, label: string) => void;
}
```

### Accessibility Annotations (WCAG 2.1 AA)

- **Combobox Pattern**: Input uses `role="combobox"` with `aria-expanded`, `aria-controls`, and `aria-activedescendant` linking to the highlighted result.
- **Listbox**: Results container uses `role="listbox"` with child `role="option"` items.
- **Live Region**: A visually hidden `role="status"` with `aria-live="polite"` and `aria-atomic="true"` announces result count to screen readers.
- **Keyboard Navigation**:
  - `ArrowDown`/`ArrowUp`: Navigate through results
  - `Enter`: Select the highlighted result
  - `Escape`: Clear search and close dropdown
  - Focus remains on the input throughout navigation
- **ARIA Labels**:
  - Input: `aria-label="Search settings controls"`
  - Clear button: `aria-label="Clear search"`
  - Each option: `aria-selected` to indicate current highlight

### Responsive Behavior
- **Mobile (< md/768px)**: Search input spans full width, dropdown overlays content
- **Desktop (md+)**: Search input constrained to `w-96`, dropdown positioned absolutely
- Results list is scrollable with `max-h-96` on all viewports

## Wallets Section Remove Confirmation Flow

### Overview
Destructive actions in `app/settings/preferences/components/wallets-section.tsx` require explicit confirmation to prevent accidental disconnection.

### Accessibility Annotations (WCAG 2.1 AA)
- **Contrast**: Confirm and Cancel actions utilize semantic high-contrast design tokens (`bg-destructive`, `text-destructive-foreground`, `border-input`).
- **Keyboard Navigation**: Dialog uses `components/ui/dialog.tsx` (Radix UI Primitive) which enforces a focus trap on open and restores focus to the triggering element upon closure or cancellation.
- **ARIA Labeling**:
  - Dialog contains `DialogTitle` (`aria-labelledby`) and `DialogDescription` (`aria-describedby`).
  - Action trigger includes specific explicit context: `aria-label="Remove {nickname} ({address})"`.

### Responsive Breakpoints
- **Mobile (`< sm 640px`)**: Full-width stacked buttons on action dialog.
- **Desktop (`>= sm 640px`)**: Inline action buttons (`DialogFooter`).

## Design Tokens

| Token               | Value                              | Usage                          |
|---------------------|------------------------------------|--------------------------------|
| Search border       | `border-zinc-200` (light) / `border-white/10` (dark) | Input, dropdown, results |
| Search bg           | `bg-white` (light) / `bg-[#09090B]` (dark) | Dropdown background  |
| Highlight selected  | `bg-blue-50` (light) / `bg-blue-500/10` (dark) | Current result highlight |
| Hover state         | `bg-zinc-50` (light) / `bg-white/5` (dark) | Result hover |
| Highlight animation | `animate-search-highlight` (2.5s ease-out) | Control highlight on select |
| Text primary        | `text-zinc-900` (light) / `text-white` (dark) | Result label |
| Text secondary      | `text-zinc-500` (light) / `text-zinc-400` (dark) | Section name, hints |
