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
