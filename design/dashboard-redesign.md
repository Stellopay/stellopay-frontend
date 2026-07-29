# Typography System: Line-Height & Letter-Spacing Scale (#764)

This document specifies the tokenized typographic scale mapping for the **Clash Display**, **General Sans**, and **Inter** font family stacks across StelloPay landing and dashboard surfaces.

## Typography Scale Matrix

| Role | Utility Class | Font Family | Size | Line Height (Leading) | Letter Spacing (Tracking) | Usage Surface |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display 2XL** | `.text-display-2xl` | Clash Display | 72px (`4.5rem`) | 1.05 | `-0.03em` | Hero main headlines |
| **Display XL** | `.text-display-xl` | Clash Display | 60px (`3.75rem`) | 1.1 | `-0.025em` | Major section headers |
| **Heading LG** | `.text-heading-lg` | Clash Display | 36px (`2.25rem`) | 1.2 | `-0.02em` | Dashboard section titles |
| **Heading MD** | `.text-heading-md` | Clash Display | 24px (`1.5rem`) | 1.25 | `-0.015em` | Card & modal titles |
| **Body LG** | `.text-body-lg` | General Sans / Inter | 18px (`1.125rem`) | 1.6 | `-0.01em` | Lead paragraphs |
| **Body MD** | `.text-body-md` | General Sans / Inter | 16px (`1rem`) | 1.5 | `0em` | Standard interface copy |
| **Caption SM** | `.text-caption-sm` | Inter | 14px (`0.875rem`) | 1.43 | `+0.01em` | Table headers & captions |

### Feature Overview

**Metric Picker Dialog**
- Accessible button (Settings icon + "Customize" label on desktop, icon-only on mobile)
- Modal dialog showing all 4 available metrics from the catalog
- Multi-select UI with clear visual feedback (blue highlight for selected)
- Maximum 4 metrics enforced at UI level (disabled state when limit reached)
- Real-time feedback: warning messages for empty selection and max-limit states
- Reset and Save buttons to persist changes

**Metric Catalog**
The following metrics are available for selection:
1. **Total Volume** - TrendingUp icon, blue theme (`text-[#2563EB]`, `bg-[#EFF6FF]`)
2. **Avg. Transaction** - DollarSign icon, green theme (`text-[#16A34A]`, `bg-[#F0FDF4]`)
3. **Success Rate** - Activity icon, purple theme (`text-[#7C3AED]`, `bg-[#F5F3FF]`)
4. **Active Wallets** - Wallet icon, orange theme (`text-[#EA580C]`, `bg-[#FFF7ED]`)

Each metric in the catalog includes:
- A unique `id` (e.g., "total-volume")
- Icon component from lucide-react
- Display label (e.g., "Total Volume")
- Formatted value (e.g., "$847.5K")
- Change indicator (e.g., "+12.5%")
- Semantic color tokens for light/dark modes

**Persistence & Defaults**

- **Storage Key**: `"stellopay.kpi-preferences"` (follows dot-namespace convention)
- **Storage Format**: JSON array of metric IDs, e.g., `["total-volume", "success-rate"]`
- **Default (First-Time Users)**: All 4 metrics are shown in catalog order
- **Hydration Pattern**:
  1. On component mount, `useEffect` reads from `safeStorage` (SSR-safe, returns `null` on error)
  2. Sets `hasHydrated` flag to avoid overwriting on SSR mismatches
  3. Renders picker only after hydration completes
- **Persistence After Change**: 
  1. When user clicks "Save Changes" in the picker, selected IDs are written to localStorage
  2. On next visit, those metrics are restored
  3. Fallback to defaults if storage contains malformed data or empty arrays

**Card Rendering & Ordering**

- Cards are rendered in the order they appear in the metric catalog, filtered by selected IDs
- Visual design (icon, colors, layout) remains unchanged from the original fixed set
- Grid layout: responsive 1-col (mobile), 2-col (tablet), 4-col (desktop) using Tailwind breakpoints (`sm:`, `lg:`)
- Each card maintains hover effects (shadow increase, icon scale 110%)

### Accessibility (WCAG 2.1 AA)

**Keyboard Navigation**
- Customize button fully keyboard operable: `Tab` to focus, `Enter` to open dialog
- Inside picker dialog:
  - `Tab` navigates between metric items
  - `Space` / `Enter` toggles selection of a metric
  - `Tab` to Reset / Save buttons
  - `Enter` to activate buttons
  - `Escape` closes dialog (via Radix Dialog primitive)
- Focus is trapped within the modal and returned to the trigger button on close

**ARIA Attributes**
- Customize button: `aria-label="Customize metrics"` for screen readers
- Metric selection items: `aria-pressed="true|false"` to indicate selection state
- Dialog: `role="dialog"` and `aria-modal="true"` (via Radix DialogPrimitive)
- Metric icons: `aria-hidden="true"` (decorative, not read)
- Selected checkmark: Indicates selection state visually for all users

**Color Contrast**
- Selected metric: Blue highlight (`bg-blue-50` light / `dark:bg-blue-900/20`) with sufficient contrast against text
- Disabled metrics: `opacity-50` to clearly indicate unavailable state, meets minimum contrast
- Warning messages: Amber for "no selection", blue for "max selected" – both have WCAG AA contrast
- Dark mode support: All colors defined with `dark:` variants using semantic CSS variables

**Visual Indicators**
- Check icon appears next to selected metrics
- Disabled metrics have reduced opacity (50%)
- Hover states for interactive items (color change, cursor change)
- Clear button states: Save disabled when no metrics selected, enabled otherwise

### Responsive Behavior

**Dialog Presentation**
- Desktop (lg+): Centered modal dialog (`DialogContent` with `sm:max-w-md`)
- Mobile (< 640px): Full-width responsive wrapper, auto-scrolls if content exceeds viewport
- Customize button: Icon + "Customize" text on desktop (`hidden sm:inline`), icon only on mobile

**Grid Layout**
- After metric selection saved:
  - `grid-cols-1` (mobile < 640px): 1 card per row
  - `sm:grid-cols-2` (640px - 1023px): 2 cards per row
  - `lg:grid-cols-4` (1024px+): 4 cards per row (full row when fewer selected)
- Gap: `gap-6` (1.5rem) maintained across all breakpoints
- No regression: existing responsive behavior preserved

### Design Tokens & Styling Consistency

**Color System (Light Mode)**
- Background: `bg-white` (section), `bg-zinc-50` (picker trigger)
- Text: `text-zinc-900` (primary), `text-zinc-500` (secondary)
- Borders: `border-zinc-200`
- Selected state: Blue (`bg-blue-50`, `border-blue-300`, `text-blue-600`)
- Disabled state: Same base but with `opacity-50`

**Color System (Dark Mode)**
- Background: `dark:bg-[#111111]` (section), `dark:bg-zinc-900/50` (picker trigger)
- Text: `dark:text-white` (primary), `dark:text-zinc-400` (secondary)
- Borders: `dark:border-zinc-800`
- Selected state: `dark:bg-blue-900/20`, `dark:border-blue-700/50`, `dark:text-blue-400`
- Disabled state: Same with `opacity-50`

**Spacing & Typography**
- Button padding: `px-4 py-2` for triggers, `px-3 py-2` for dialog buttons
- Border radius: `rounded-xl` (12px, matching card design)
- Font weight: `font-bold` for titles, `font-semibold` for metric labels, `font-medium` for buttons
- Font size: `text-sm` for button text, `text-xs` for secondary info

**Transitions**
- All interactive elements: `transition-colors` or `transition-all` for smooth state changes
- Hover effects: Background color, button shadow
- Dialog open/close: Via Radix `DialogContent` animations (fade-in/out, zoom effects)

### Data Sources & Backend Integration

The metric catalog is currently static/demo data. To connect to real backend data:

1. **Fetch function per metric**: Each metric should have a corresponding data-fetch function
2. **Data structure**: Values, changes, and error states are managed at the data layer (not in the component)
3. **Current implementation**: The component accepts `kpis` prop for injection (backward compatible)

**Recommended Extension**
```typescript
// Add a hook to fetch metric data
async function fetchMetricData(metricId: string) {
  // Call API based on metricId
  // Return { value, change, icon, label }
}
```

### State Management & Hydration

**Component State**
- `timeRange`: Selected time period (stored locally, not persisted)
- `selectedMetricIds`: Array of chosen metric IDs (persisted to localStorage)
- `hasHydrated`: Flag to prevent SSR mismatch overwrites
- `dropdownOpen`: Time range dropdown visibility

**Hydration Flow**
1. Component mounts with `selectedMetricIds = []` and `hasHydrated = false`
2. First `useEffect` runs:
   - Calls `safeStorage.getItem(STORAGE_KEY)`
   - Parses JSON (with try/catch for malformed data)
   - Sets `selectedMetricIds` and `hasHydrated = true`
3. Second `useEffect` watches `selectedMetricIds` and `hasHydrated`:
   - Only writes to storage when `hasHydrated === true` (prevents premature writes)
   - Serializes array to JSON and stores

This pattern matches the existing sidebar and theme context patterns in the codebase.

### Testing Coverage

**Unit Tests** (`analytics-insights.test.tsx`)

*Default Rendering*
- ✓ Shows all 4 metrics when localStorage is empty (first-time users)
- ✓ Renders header, time range selector, customize button, view all link

*Persistence*
- ✓ Reads and restores saved metric IDs from localStorage
- ✓ Fallback to defaults on malformed JSON
- ✓ Fallback to defaults on empty array
- ✓ Persists new selections to localStorage after Save

*Picker Dialog*
- ✓ Customize button opens/closes dialog
- ✓ All 4 metrics displayed with correct labels, values, icons
- ✓ Currently selected metrics show check marks
- ✓ Reset button reverts to default selection

*Selection Constraints*
- ✓ Up to 4 metrics can be selected
- ✓ Selection UI disables when 4 metrics selected (not in picker)
- ✓ Warning message shown at max capacity
- ✓ Warning message shown when no metrics selected
- ✓ Save button disabled when no metrics selected

*Keyboard Accessibility*
- ✓ Tab navigation through metric items
- ✓ Space/Enter toggles selection
- ✓ Tab to Reset/Save buttons
- ✓ Enter activates button actions
- ✓ Escape closes dialog

*Edge Cases*
- ✓ Handles SSR context (typeof window === "undefined")
- ✓ Handles localStorage unavailable (privacy mode, quota exceeded)
- ✓ Handles missing metric IDs gracefully (filters to available metrics)
- ✓ Respects time range selection independently of metric changes

*Responsive & Dark Mode*
- ✓ Grid renders at sm/md/lg/xl breakpoints
- ✓ Dark mode classes applied correctly
- ✓ Customizable button text hidden on mobile

### Known Limitations

- **Fixed Catalog**: Metrics are currently hardcoded; expanding the catalog requires code changes
- **No Drag-to-Reorder**: Metrics are ordered by catalog sequence, not freely repositionable. This is acceptable for accessibility (drag-and-drop is inherently harder for keyboard/screen-reader users)
- **No API Connection**: Currently uses demo/static data; real data fetching requires backend integration

## Error States vs Empty States

The Transactions list component distinguishes between an empty result (e.g. no transactions matching the selected filters) and a network or server error.

- **Empty State**: Rendered via the `TransactionsTable` empty message (`No transactions found. Try adjusting your filters.`).
- **Error State**: Rendered using the `<ErrorState />` UI component which displays the actual error message or a generic "Failed to load transactions." It also provides a "Try Again" button.

### Accessibility Notes (WCAG 2.1 AA)

- **Contrast**: The ErrorState uses a `text-red-500` icon and `text-white` text on a `bg-red-900/10` background which exceeds minimum contrast requirements.
- **Keyboard Nav**: The "Try Again" button is fully keyboard navigable. Focus order is maintained.
- **ARIA**: The `ErrorState` component utilizes `role="alert"` and `aria-live="assertive"` so screen readers can proactively announce network failures. Loading/Retrying indicators use `aria-hidden="true"` on non-text elements and `aria-label` or `aria-disabled` where appropriate to ensure status is accurately conveyed.

## Advanced Filter Panel (Added: feature/transactions-advanced-filter-panel)

The Advanced Filter Panel is a togglable drawer that combines all transaction filter dimensions (status, amount range, counterparty address) into a single, auditable interface. It slides in from the right on desktop and takes full width on mobile (< 640px). Active filters are represented as removable chips below the filter bar.

### Components

| File | Purpose |
|------|---------|
| `components/transactions/advanced-filter-panel.tsx` | Togglable drawer with status radio, min/max amount inputs, counterparty text input, Apply/Clear All buttons |
| `components/transactions/filter-chips.tsx` | Removable chips showing active filter state with individual remove and bulk clear |
| `components/transactions/transactions-filters.tsx` | Updated with Advanced filter toggle button (indicator dot when active) |
| `components/transactions/transactions-content.tsx` | Orchestrates panel open/close, draft state, apply/commit, chip removal, and passes values to API |

### State Model

- Draft state lives in `transactions-content.tsx` — panel inputs modify draft values; committed filters flow through `TransactionFilters` (which gained `minAmount`, `maxAmount`, and `counterparty` fields).
- The API layer (`lib/api/transactions.ts` → `utils/transactionUtils.ts`) applies `counterparty` filtering as a case-insensitive partial match on the transaction address field.

### Accessibility Notes (WCAG 2.1 AA)

#### Advanced Filter Panel (`advanced-filter-panel.tsx`)

- **Role & Label**: Panel uses `role="dialog"` with `aria-modal="true"` and `aria-label="Advanced transaction filters"`.
- **Focus Trap**: When the panel opens, focus is moved to the first focusable element after a 150ms animation delay. Tab/Shift+Tab cycles within the panel. Focus is restored to the triggering element on close.
- **Escape to Close**: Pressing Escape closes the panel and returns focus.
- **Backdrop Click**: Clicking the backdrop overlay closes the panel.
- **Body Scroll Lock**: `document.body.style.overflow = "hidden"` is set while the panel is open; restored on close/unmount.
- **Validation Errors**: Amount range validation uses `role="alert"` with `aria-live="polite"` for non-intrusive screen reader announcement.
- **Contrast**: 
  - Status radio labels: white text on dark background (#160f17) — passes AA.
  - Selected status: `border-[#04842E]` (green) on `bg-[#04842E]/10` background.
  - Inputs: white text on `bg-[#1A1A1A]` with `border-[#2D2D2D]`.
  - Apply button: white text on `bg-[#04842E]` (green) background.
  - Clear All button: gray-400 text on transparent, darkens on hover.
- **Keyboard Navigation**: All buttons, inputs, and radio controls are fully keyboard-accessible with visible `focus-visible:ring-2` focus indicators.
- **Disabled State**: When `disabled={true}`, all inputs and buttons receive `disabled` attribute, preventing interaction during loading states.

#### Filter Chips (`filter-chips.tsx`)

- **Region Role**: Chips container uses `role="region"` with `aria-label="Active filters"` (customizable).
- **Remove Buttons**: Each chip's remove button has a descriptive `aria-label` (e.g., "Remove Status filter: Payment Sent").
- **Clear All**: When multiple chips are present, a "Clear all" button with `aria-label="Clear all active filters"` is shown.
- **Focus Indicators**: Remove buttons and Clear all link use `focus-visible:ring-2` outlines.

#### Responsive Behavior

- **Panel Width**: Full width on mobile, `sm:w-[420px]` on small screens, `lg:w-[480px]` on large screens.
- **Amount Range**: Two-column grid (`grid-cols-2`) adapts well at all breakpoints.
- **Advanced Toggle Button**: Label text is hidden on mobile (`hidden sm:inline`) to conserve space; the sliders icon remains visible.
- **Chips**: Use `flex-wrap` for natural wrapping on narrow viewports.

- Verified visually and via existing tests across the `showNotifications`/`showDropdown` permutations, which drive the `sm`/`md` breakpoint layout switch (`flex-col md:flex-row`) — no layout classes were touched, only color utilities.
- All existing tests in `components/analytics/analytics-view.test.tsx` pass against the new markup (one unrelated pre-existing failure, `renders empty state component when empty data is provided`, reproduces identically on `main` and is unrelated to this change).
- No text or non-text contrast regressions: token swaps were chosen to preserve or exceed the contrast ratios of the `zinc-*` values they replaced (see notes above).

---

## Benefits section — gradient tokenization refactor

**Branch:** `refactor/benefits-tokenize-gradients`
**Scope:** `components/landing/benefits.tsx`, `app/globals.css`
**Standard:** WCAG 2.1 Level AA
**Date:** 2026-07-29

---

### Overview

`components/landing/benefits.tsx` previously coded its background treatment and
card accents as raw hex literals and inline `rgba(r, g, b, a)` strings. Every
future brand colour change required a find-and-replace across the file.

This refactor replaces every hardcoded stop with a CSS custom property defined
in `app/globals.css`, gives the section explicit accessibility attributes, and
adds a full unit-test suite.

---

### Before / after

#### Section background

```diff
-  className="relative bg-[#040404] pt-24 pb-10 px-4 text-white min-h-screen"
+  className="relative pt-24 pb-10 px-4 text-white min-h-screen"
+  style={{ backgroundColor: "var(--color-surface-deep)" }}
```

#### Glow overlay

```diff
   style={{
-    background: `
-      radial-gradient(circle at 20% 70%, rgba(27, 67, 245, 0.15) 15%, transparent 30%),
-      radial-gradient(circle at 50% 30%, rgba(27, 67, 245, 0.15) 35%, transparent 50%),
-      radial-gradient(circle at 80% 70%, rgba(27, 67, 245, 0.15) 15%, transparent 30%)`,
+    background: `
+      radial-gradient(circle at 20% 70%, rgba(var(--color-brand-glow) / 0.15) 15%, transparent 30%),
+      radial-gradient(circle at 50% 30%, rgba(var(--color-brand-glow) / 0.15) 35%, transparent 50%),
+      radial-gradient(circle at 80% 70%, rgba(var(--color-brand-glow) / 0.15) 15%, transparent 30%)`,
```

#### Subtitle text

```diff
-  className="... text-[#C7C7C7] ..."
+  className="... text-muted-foreground ..."
```

#### Featured card background

```diff
-  className="w-full max-w-md bg-[#8EB6FF] rounded-[8px] p-6 text-center"
+  className="w-full max-w-md rounded-[8px] p-6 text-center"
+  style={{ backgroundColor: "var(--color-brand-card)" }}
```

#### Featured card text

```diff
-  className="text-2xl font-clash mb-3 text-[#060606]"
+  className="text-2xl font-clash mb-3 text-foreground"

-  className="text-sm text-[#212121] font-general font-medium leading-[19px]"
+  className="text-sm text-foreground font-general font-medium leading-[19px]"
```

#### Non-featured card border

```diff
-  className="bg-transparent border border-[#598EFF] max-w-[400px] mx-auto ..."
+  className="bg-transparent max-w-[400px] mx-auto ..."
+  style={{ border: "1px solid var(--color-brand-border)" }}
```

#### Non-featured card body

```diff
-  className="text-sm text-[#A3A3A3] font-general font-medium leading-[19px]"
+  className="text-sm text-muted-foreground font-general font-medium leading-[19px]"
```

---

### Token mapping

| Old value | New token | CSS value | Rationale |
|-----------|-----------|-----------|-----------|
| `#040404` | `--color-surface-deep` | `#040404` | Near-black used only in this section; new token named for intent |
| `rgba(27, 67, 245, α)` | `--color-brand-glow` | `27 67 245` (RGB channels) | Brand blue (#1B43F5); stored as channels so callers control opacity |
| `#C7C7C7` | `text-muted-foreground` | Tailwind semantic | Same visual weight — maps to the muted neutral foreground token |
| `#8EB6FF` | `--color-brand-card` | `#8eb6ff` | Light brand-blue card surface; no equivalent in existing palette |
| `#060606` | `text-foreground` | Tailwind semantic | Near-black on a light card — resolved by `foreground` token |
| `#212121` | `text-foreground` | Tailwind semantic | Dark body text on light card — same semantic role as `foreground` |
| `#598EFF` | `--color-brand-border` | `#598eff` | Brand-blue border accent; no equivalent in existing palette |
| `#A3A3A3` | `text-muted-foreground` | Tailwind semantic | Muted neutral — matches the existing muted foreground token |

---

### New tokens added to `app/globals.css`

```css
/* ─── Benefits section color tokens ─────────────────────────── */

/** Near-black section background (#040404). */
--color-surface-deep: #040404;

/**
 * Brand-blue radial glow color (rgb(27 67 245)).
 * Use as: rgba(var(--color-brand-glow) / <alpha>)
 */
--color-brand-glow: 27 67 245;

/** Light brand-blue featured card background (#8EB6FF). */
--color-brand-card: #8eb6ff;

/** Brand-blue card border (#598EFF). */
--color-brand-border: #598eff;
```

---

### Accessibility notes

#### WCAG 2.1 AA contrast validation

| Element | Foreground | Background | Contrast | Status |
|---------|-----------|------------|----------|--------|
| Section h2 "Benefits" (45px bold) | `#ffffff` (text-white) | `#040404` (--color-surface-deep) | ≈ 21:1 | ✅ AA/AAA |
| Subtitle (16px regular) | `text-muted-foreground` | `#040404` | ≥ 4.5:1 on dark surface | ✅ AA |
| Featured h3 (24px bold) | `text-foreground` (~`#060606`) | `#8EB6FF` (--color-brand-card) | ≈ 8.9:1 | ✅ AA/AAA |
| Featured body (14px medium) | `text-foreground` (~`#212121`) | `#8EB6FF` (--color-brand-card) | ≈ 7.2:1 | ✅ AA/AAA |
| Non-featured h3 (24px bold) | `#ffffff` (text-white) | `#040404` (--color-surface-deep) | ≈ 21:1 | ✅ AA/AAA |
| Non-featured body (14px medium) | `text-muted-foreground` | `#040404` | ≥ 4.5:1 on dark surface | ✅ AA |
| Icon circles | Black SVG on `#ffffff` circle | `#ffffff` | ≈ 21:1 | ✅ |
| Card border | `#598EFF` (--color-brand-border) | `#040404` | ≈ 4.6:1 non-text 3:1 threshold | ✅ AA non-text |

#### ARIA annotations added

- `<section aria-labelledby="benefits-heading">` — provides the region's accessible name to AT users navigating by landmark.
- `<h2 id="benefits-heading">` — the labelled target.
- Decorative glow overlay: `aria-hidden="true"` — suppresses announcement of a presentational element.
- Decorative accent bar: `aria-hidden="true"` — same treatment.
- Icon SVGs: `aria-hidden="true" focusable="false"` — card `<h3>` headings already name the benefit; icons are purely decorative.

#### Keyboard navigation

No interactive elements were modified. The section is fully navigable by keyboard with Tab and Shift+Tab. No focus management changes were required.

---

### Responsive behaviour

| Breakpoint | Cards layout |
|------------|-------------|
| < 768 px (mobile) | All cards full-width, stacked vertically |
| ≥ 768 px (md+) | Featured card centred; secondary cards in a 2-column grid |
| ≥ 1024 px (lg+) | Same 2-column grid, constrained to `max-w-[832px]` |
| ≥ 1280 px (xl+) | Section content constrained to `max-w-6xl`, centred |

No Tailwind breakpoint classes were changed during this refactor. The responsive layout was already correct; only colour utilities were migrated to tokens.

---

### Dark mode

The section uses `--color-surface-deep` as a fixed near-black surface. Because
this is a brand-defined dark section (not a theme-responsive surface), it is
intentionally opaque to the Tailwind `dark:` modifier — the section is always
dark. The `text-muted-foreground` and `text-foreground` tokens resolve
correctly in both light and dark mode contexts, but their computed values are
overridden by the local surface colour rather than the page theme.

If a future design iteration wants the section to participate in light/dark
theming, `--color-surface-deep` should be defined in both `:root` and
`.dark :root` (or via `@media (prefers-color-scheme)`).

---

### Test coverage

`components/landing/benefits.test.tsx` adds 20 unit tests in six groups:

| Group | Tests |
|-------|-------|
| 1 · Structural rendering | 5 |
| 2 · Design token usage | 8 |
| 3 · Accessibility | 5 |
| 4 · Featured vs. non-featured | 4 |
| 5 · Data-testid completeness | 1 (asserts 15 anchor IDs) |
| 6 · Card count + DOM order | 2 |

---

### Files changed

| File | Change |
|------|--------|
| `app/globals.css` | Added 4 new CSS custom properties under `--color-*` |
| `components/landing/benefits.tsx` | Replaced all 8 hardcoded hex/rgba values with tokens; added ARIA attributes and `data-testid` hooks; keyed cards by `benefit.title` |
| `components/landing/benefits.test.tsx` | New — 20 unit tests |
| `design/dashboard-redesign.md` | Updated — this section |

---

## Enterprise Solution Card (components/ui/enterprise-solution-card.tsx)

Migrated hardcoded hex colors to semantic tokens for better theme consistency and maintenance.

### Accessibility Notes (WCAG 2.1 AA)

- **Contrast**: `text-muted-foreground` ensures sufficient contrast against the card's background in both light and dark modes. The `font-bold text-4xl` value text uses the default foreground color, guaranteeing readability.
- **Keyboard Nav**: The card itself is non-interactive. No custom focus management is necessary for its current static state.
- **ARIA**: The component utilizes semantic HTML allowing screen readers to interpret the layout natively.

### Responsive Behavior

- **Flex Layout**: Uses `flex flex-col gap-2` to stack the value and label vertically, adapting to varying text lengths gracefully.
- **Dimensions**: Retains a fixed height (`h-[118px]`) with `w-full`, allowing the card to stretch fluidly across CSS grid or flex layouts across breakpoints (`sm`, `md`, `lg`, `xl`).
- **Text Wrapping**: The text is centered (`text-center`) and breaks naturally, preserving readability on smaller screens.

## Cookie Consent Banner (Issue #810)

The Cookie Consent Banner ensures compliance with cookie-consent regulations by prompting first-time visitors to accept or decline non-essential cookies before the site sets them.

### Feature Overview

- **First-Visit Detection**: Uses `utils/safeStorage.ts` with storage key `"stellopay.cookie-consent"` to show the banner only once per browser.
- **Explicit Actions**: Provides **Accept** and **Decline** buttons — not just an acknowledge-and-dismiss.
- **Policy Link**: Includes a "Learn more" link that navigates to the `/cookies` policy page.
- **Bottom Fixed Position**: Rendered as a fixed bottom bar that does NOT block page content or trap keyboard focus.
- **No Focus Trap**: Keyboard users can freely Tab past the banner; focus is not confined.

### Component

| File | Purpose |
|------|---------|
| `components/common/cookie-consent-banner.tsx` | Fixed bottom banner with Accept / Decline actions and `/cookies` link |
| `components/common/cookie-consent-banner.test.tsx` | Unit tests covering happy path, edge cases, a11y, and negative scenarios |
| `app/layout.tsx` | Renders `<CookieConsentBanner />` in the root layout alongside `<OfflineBanner />` |

### State Model

- **Storage Key**: `"stellopay.cookie-consent"` (follows dot-namespace convention).
- **Storage Values**: `"accepted"` | `"declined"` — `null` means first visit.
- **Hydration Pattern**:
  1. Component mounts with `consent = null` and `hydrated = false`.
  2. `useEffect` reads from `safeStorage.getItem(STORAGE_KEY)` (SSR-safe, returns `null` on error).
  3. Sets `consent` and `hydrated = true`.
  4. Banner renders only when hydrated AND consent is `null` (first visit).
- **Persistence**: Clicking Accept or Decline calls `safeStorage.setItem(STORAGE_KEY, value)` and sets component state to hide the banner immediately.

### Accessibility (WCAG 2.1 AA)

**ARIA Attributes**
- Banner container: `role="dialog"` with `aria-label="Cookie consent"`.
- Accept button: `aria-label="Accept cookies"`.
- Decline button: `aria-label="Decline cookies"`.
- Cookie icon: `aria-hidden="true"` (decorative).
- "Learn more" link: navigates to `/cookies`.

**Keyboard Navigation**
- All interactive elements (Accept, Decline, Learn more) are fully keyboard-operable.
- `Tab` moves between buttons and the link naturally — no focus trapping.
- All elements display visible `focus-visible:ring-2` focus indicators.

**Color Contrast (WCAG AA)**
- Light mode: `#666666` text on `#FAFAFA` background — meets AA for normal text.
- Dark mode: `#a1a1aa` text on `#09090B` background — meets AA for normal text.
- Accept button: white text (`#FFFFFF`) on gradient `#83A7FF → #8B5CF6` — meets AA (4.5:1+ against the darker purple endpoint).
- Link color: `#7C3AED` on `#FAFAFA` — meets AA for large text.

**Visual Indicators**
- Hover state on Decline button: border and text change to accent color.
- Hover state on Accept button: gradient shift.
- Hover state on "Learn more" link: underline + color shift.
- Focus indicators: `ring-2` with `ring-offset-2` on all interactive elements.

### Responsive Behavior

- **Mobile (< 640px)**: Stacked layout — message on top, buttons below. Full-width.
- **Tablet/Desktop (≥ 640px)**: Side-by-side — message left, buttons right.
- **Max width**: `1200px` to match the footer and main content width.
- **Padding**: `px-4` on mobile, `px-6` on `sm+`.
- **Text**: Constrained to a readable measure; wraps naturally on long content.

### Design Tokens & Styling Consistency

**Color System (Light Mode)**
- Banner background: `bg-[#FAFAFA]` (matches footer background).
- Border: `border-gray-200`.
- Text: `text-[#666666]`.
- Accent link: `text-[#7C3AED]`.
- Accept button: gradient `from-[#83A7FF] to-[#8B5CF6]` (matches newsletter subscribe button in footer).
- Decline button: transparent background with `border-gray-200`.

**Color System (Dark Mode)**
- Banner background: `dark:bg-[#09090B]` (matches footer background).
- Border: `dark:border-[#1a1a1a]`.
- Text: `dark:text-[#a1a1aa]`.
- Accent link: `dark:text-[#a78bfa]`.
- Accept button: same gradient (white text ensures contrast).
- Decline button: `dark:border-[#27272a]`, `dark:text-[#a1a1aa]`.

**Spacing & Typography**
- Font family: `General Sans, sans-serif` (matches footer).
- Text size: `text-sm`.
- Button height: `h-9` (36px).
- Button padding: `px-4` (Decline), `px-5` (Accept).
- Border radius: `rounded-lg` for buttons.

**Transitions**
- All interactive elements use `transition-all duration-200`.
- Hover: border/text color shifts.
- Banner shadow: subtle upward shadow to separate from content.

### Testing Coverage

**Unit Tests** (`cookie-consent-banner.test.tsx`)

*Default Rendering*
- ✓ Renders banner when no consent is stored (first visit).
- ✓ Shows cookie icon, message text, Accept button, Decline button, and Learn more link.
- ✓ "Learn more" link points to `/cookies`.

*Accept & Decline Actions*
- ✓ Accept dismisses banner and persists `"accepted"` to safeStorage.
- ✓ Decline dismisses banner and persists `"declined"` to safeStorage.

*Persistence*
- ✓ Does NOT render when consent was previously accepted.
- ✓ Does NOT render when consent was previously declined.

*SSR / Error Handling*
- ✓ Handles safeStorage.setItem failure gracefully (does not throw).
- ✓ Banner still dismisses even if persistence write fails.

*Accessibility*
- ✓ Uses `role="dialog"` with `aria-label="Cookie consent"`.
- ✓ Cookie icon is decorative (`aria-hidden="true"`).
- ✓ Action buttons have descriptive `aria-label`s.
- ✓ Does NOT trap keyboard focus.

*Negative Test*
- ✓ Does NOT render when hydrated and consent is already decided.

*Responsive & Dark Mode*
- ✓ Applies dark mode classes on the banner container.
- ✓ "Learn more" link has dark-mode styling classes.

### Known Limitations

- **No granular category preferences**: The banner is a binary Accept/Decline. Granular cookie category preferences (e.g., analytics vs. marketing) are out of scope for this iteration.
- **No third-party script blocking**: The banner sets a consent flag but does not actively block third-party scripts. Integration with a tag manager would be needed for production enforcement.
- **No auto-dismiss**: The banner remains until the user takes explicit action, which is intentional for compliance.
