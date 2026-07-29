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
