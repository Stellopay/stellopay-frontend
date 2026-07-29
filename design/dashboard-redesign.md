# Dashboard Redesign

Main Figma Design Workspace:

https://www.figma.com/design/TzFU3lyfPfsM4Jzh6rXGzl/Stellopay-Dashboard-Redesign?node-id=2067-1817&t=PZ6D5lwLGX9gwnOJ-1

---

## Account Overview — Copy Address Affordance

**Branch:** `feat/account-overview-copy-address-feedback`

### What was added

The `AccountOverview` welcome heading now includes an inline **Copy** button
immediately after the truncated wallet address. The button provides clear,
accessible confirmation that the copy operation succeeded (or failed) before
the user can trigger it a second time.

```
Welcome back,  GABC...F123  [Copy ⎘]  👋
                             ↑
                  idle / copied / error
```

### Component: `CopyAddressButton`

A private sub-component declared in
`components/dashboard/account-overview.tsx`. It is **not exported** because it
is only needed in this one location; the wallets-settings surface keeps its own
equivalent.

#### States

| State    | Button label | Icon     | Colour tokens                          | aria-label              |
|----------|-------------|----------|----------------------------------------|-------------------------|
| `idle`   | Copy        | Copy ⎘   | `text-zinc-500 dark:text-zinc-400`     | "Copy wallet address"   |
| `copied` | Copied      | Check ✓  | `text-emerald-600 dark:text-emerald-400` | "Address copied"        |
| `error`  | Failed      | X ✗      | `text-destructive`                     | "Copy failed — try again" |

#### Timing

- `copied` → `idle`: **2 000 ms** (driven by `copyToClipboardWithTimeout`).
- `error` → `idle`: **3 000 ms** (driven by a local `setTimeout`).

#### Clipboard strategy

Uses `copyToClipboardWithTimeout` from `utils/clipboardUtils.ts` (spec
requirement). That utility:

1. Tries `navigator.clipboard.writeText` (modern async Clipboard API,
   HTTPS / localhost only).
2. Falls back to `document.execCommand('copy')` (synchronous legacy, works in
   non-secure contexts and older browsers).
3. On total failure calls `window.alert()`.

`CopyAddressButton` intercepts the `window.alert` call for the duration of the
handler to suppress the blocking dialog and set the `error` state instead.
`window.alert` is **always restored** — both on the happy path (early restore
after `setCopied(true)`) and after the Promise settles.

The **full address** is copied to the clipboard. The truncated form
(`GABC...F123`) is the only representation ever rendered in the DOM.

### Accessibility (WCAG 2.1 AA)

| Criterion | Implementation |
|---|---|
| **Perceivable** | `aria-label` updates on each state transition so the button's accessible name always reflects the current action. |
| **Operable** | The button is a native `<button type="button">`, fully keyboard-operable (Tab to focus, Enter/Space to activate). Focus ring: `focus-visible:ring-2 focus-visible:ring-zinc-400`. |
| **Understandable** | An `aria-live="polite"` + `aria-atomic="true"` `role="status"` region (`data-testid="copy-address-announcement"`) announces the copy result to screen readers without interrupting ongoing speech. The region is visually hidden (`sr-only`) and does not shift layout. |
| **Robust** | Icons carry `aria-hidden="true"` — meaning is conveyed through the button label and the live region. The button itself never contains only an icon. |

Colour contrast (Tailwind design tokens, both light and dark):

| Element | Foreground | Background | Estimated ratio |
|---|---|---|---|
| Idle button text | `zinc-500` (#71717a) | `white` (#ffffff) | ≈ 4.6 : 1 ✓ |
| Copied state | `emerald-600` (#059669) | `white` (#ffffff) | ≈ 4.5 : 1 ✓ |
| Failed state | `destructive` (CSS var, ~`#dc2626`) | `white` (#ffffff) | ≈ 5.9 : 1 ✓ |
| Dark idle | `zinc-400` (#a1a1aa) | `#111111` | ≈ 6.2 : 1 ✓ |
| Dark copied | `emerald-400` (#34d399) | `#111111` | ≈ 7.5 : 1 ✓ |

### Responsive behaviour

The button is an `inline-flex` element inside the existing `flex-wrap` heading.
At all breakpoints (sm 640 → xl 1280) it wraps naturally with the address span
when space is constrained. No breakpoint-specific markup was added.

### Tests

New describe block: **"AccountOverview – copy address button"** in
`components/dashboard/account-overview.test.tsx`.

Coverage:

| Category | Tests |
|---|---|
| Presence | Button rendered when connected; absent when disconnected; `type="button"` |
| Clipboard | Writes full address; truncated form is the only DOM text |
| Success feedback | "Copied" text; aria-label update; live region; 2 s auto-reset; live region clears |
| Error feedback | "Failed" text; aria-label update; live region; 3 s auto-reset |
| Accessibility | `role="status"`, `aria-live="polite"`, `aria-atomic="true"`; keyboard Enter |

Run the suite:

```bash
npx vitest run components/dashboard/account-overview.test.tsx --coverage.enabled=false
```

---

## Shared StatCard Primitive (#805)

**Branch:** `refactor/shared-stat-card-primitive`

### What was added

Extracted a unified `StatCard` primitive (`components/ui/stat-card.tsx`) that consolidation-wise replaces duplicate card markups previously found in both landing page stats (`components/landing/stats-cards.tsx`) and dashboard account summary cards (`components/dashboard/account-summary-card.tsx`).

### Component API (`StatCardProps`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `"sm"` \| `"lg"` | `"sm"` | Controls scale variant: `"sm"` (compact/dashboard) vs `"lg"` (large/landing) |
| `title` | `ReactNode` | `undefined` | Card primary label or title |
| `subtitle` | `ReactNode` | `undefined` | Secondary sub-label for compact cards |
| `value` | `ReactNode` | *(required)* | Main stat value (string, number, or animated element) |
| `valueTestId` | `string` | `undefined` | Test identifier for value container |
| `icon` | `ReactNode` | `undefined` | Header icon element |
| `iconBgColor` | `string` | `""` | Background color utility for icon wrapper |
| `change` | `string` | `undefined` | Trend change text (e.g. `+12.5% vs last month`) |
| `isPositive` | `boolean` | `undefined` | Trend direction flag (emerald vs rose) |
| `trendSlot` | `ReactNode` | `undefined` | Custom trend badge override |
| `chartSlot` | `ReactNode` | `undefined` | Bottom slot (e.g., mini bar chart) |
| `href` | `string` | `undefined` | Optional link destination for interactive cards |
| `ariaLabel` | `string` | `undefined` | Accessible label when rendered as a link |
| `testId` | `string` | `undefined` | Data-testid for card wrapper |

### Accessibility (WCAG 2.1 AA)

| Aspect | Implementation & Contrast Ratios |
|---|---|
| **Color Contrast (Light)** | Value text `zinc-900` (#18181b, 16:1), title `zinc-500` (#71717a, 4.6:1), positive trend `emerald-700` (#047857, 5.5:1), negative trend `rose-700` (#be123c, 6:1). Landing scale value `#6B47ED` (4.5:1). |
| **Color Contrast (Dark)** | Dark value `white` (#ffffff, 21:1), dark title `zinc-400` (#a1a1aa, 6.2:1), positive trend `emerald-400` (#34d399, 7+:1), negative trend `rose-400` (#fb7185, 7+:1). Landing scale value `#A78BFA` (7+:1). |
| **Keyboard Navigation** | Link variant (`href` provided) renders a standard accessible `<Link>` with clear focus indicator: `focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white focus-visible:ring-offset-2`. |
| **Screen Readers & ARIA** | Interactive link variants accept `ariaLabel`. Decorative trend arrows carry `aria-hidden="true"`. |

### Responsive Behavior Across Breakpoints

- **`sm` (640px)**: Grid adjusts from 1-column stack to multi-column layout on landing. Text sizes scale (`text-2xl` to `text-3xl`).
- **`md` (768px)**: Landing scale padding scales up (`px-8 py-10`), label text grows (`text-base`).
- **`lg` (1024px)**: 4-column layout for landing stat card grids.
- **`xl` (1280px)**: Full width container constraints with smooth overflow protection (`truncate`, `min-w-0`, `max-w-full`).

### Tests

Suite run:

```bash
node node_modules/vitest/vitest.mjs run components/ui/stat-card.test.tsx components/dashboard/account-summary-card.test.tsx components/landing/stats-cards.test.tsx
```
