# Settings Information Architecture

## Granular Cookie Consent

### Overview
This document specifies the information architecture for user cookie preferences under the settings panel.

### Categories
1. **Essential Cookies:** Mandatory system cookies required for application sessions and core functionality (locked on).
2. **Analytics Cookies:** Optional telemetry collection to analyze traffic and usage patterns.
3. **Marketing Cookies:** Optional tracking for tailored communications and feature announcements.

### Persistence
Preferences are independently tracked and stored locally via safe storage/localStorage keys (`stellopay_cookie_preferences`).

---

## Two-Factor Backup (Recovery) Codes

### Overview
When a user enables authenticator app verification (2FA), a one-time set of 10 single-use backup codes is generated and shown in a prominent panel. These codes serve as the sole recovery path if the user loses access to their authenticator device.

### Flow
1. **2FA setup complete** → 10 backup codes generated via `generateBackupCodes()` (cryptographically random, `XXXXX-XXXXX` format)
2. **Show-once panel** appears in the Verification controls card with:
   - All 10 codes in a 2-column grid (`role="list"` / `role="listitem"`)
   - "Copy all" button → joins codes with `\n`, writes to clipboard
   - "Download" button → creates a `.txt` file via `formatBackupCodesFile()`
   - "I've saved these codes" → dismisses the panel, codes removed from state
3. **Persistent regenerate link** appears after dismissal (only when 2FA is enabled):
   - Shows "Backup codes" label with guidance text
   - "Regenerate" trigger → opens `DestructiveActionDialog` with token `"REGENERATE"`
   - On confirmation → generates fresh codes, re-shows the panel
4. **Disabling 2FA** → backup codes state is cleared

### Security
- Codes generated via `crypto.randomUUID()` (fallback: `Math.random()`)
- Guaranteed uniqueness via `Set` collection
- Never logged to console or included in status messages
- Dismissed codes leave React state entirely
- Regeneration invalidates all prior codes

### Accessibility (WCAG 2.1 AA)
- Backup codes panel uses `role="region"` with `aria-label="Two-factor backup codes"`
- Code grid uses `role="list"` / `role="listitem"` for proper screenreader enumeration
- Buttons have explicit `aria-label` attributes
- Copy/download feedback uses `aria-live="polite"` status regions
- DestructiveActionDialog inherits its own accessibility (auto-focus, `aria-invalid`, `aria-describedby`)

### Responsive Breakpoints
| Breakpoint | Layout |
|---|---|
| `sm (640px)` | Codes grid switches from 1 to 2 columns |
| `md (768px)` | Regenerate section switches from stacked to row layout |
| `lg (1024px)` | No additional changes |
| `xl (1280px)` | Parent layout switches to 2-column card layout |

### Design Tokens
All styles use existing CSS variable tokens:
- `bg-emerald-500/5` / `border-emerald-500/20` for the show-once panel
- `bg-zinc-50` / `border-zinc-200` for the persistent section
- Code cells use `bg-white` / `dark:bg-[#09090B]` with monospace font

### Exports
| Export | Type | Description |
|---|---|---|
| `BACKUP_CODE_COUNT` | `number` | How many codes per set (10) |
| `generateBackupCodes(count)` | `string[]` | Generates `count` unique codes in `XXXXX-XXXXX` format |
| `formatBackupCodesFile(codes)` | `string` | Formats codes as a downloadable `.txt` file content |
