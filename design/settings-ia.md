# Settings Information Architecture

## Overview

This pass restructures the settings surface around five primary sections:

- Account
- Notifications
- Security
- Wallets
- Statements

The goal is to keep frequent tasks obvious, reduce visual overload, and separate destructive actions from routine edits.

## IA Decisions

### 1. Clear section grouping

- **Account:** profile identity, email, locale, and billing-related defaults
- **Notifications:** alert priorities, channel routing, and quiet hours
- **Security:** password work, verification controls, and active sessions
- **Wallets:** connected wallets, outbound safeguards, and destructive wallet removal
- **Statements:** downloadable periodic statements and tax-relevant transaction summaries

The top chrome now uses a persistent settings section bar built from the existing `components/ui/tabs.tsx` primitive. The active section is mirrored into the URL with `?section=...` so users can deep-link directly into a settings area without creating additional nested routes.

### 2. Progressive disclosure

The page now exposes only high-frequency tasks by default and hides lower-frequency details behind disclosure patterns:

- Advanced identity and billing fields
- Delivery channel customization
- Recovery methods
- Wallet metadata and compliance checks
- Empty statement history when no downloadable documents have been generated yet

This keeps the initial scan light on both desktop and mobile while still keeping advanced controls on the same page.

### 3. Safe destructive actions

Destructive actions are isolated into explicit danger zones instead of appearing beside standard save actions.

Current destructive patterns:

- `Deactivate account`
- `Sign out all sessions`
- `Remove primary wallet`

Each destructive flow uses:

- A dedicated confirmation dialog
- Impact statements before confirmation
- A typed confirmation token before the destructive CTA enables

This keeps destructive actions deliberate and reduces accidental activation risk.

## Reachability

The intended click depth from `/settings/preferences` is:

- Change profile fields: 1 section tap + 1 save action
- Adjust notification priorities: 1 section tap + 1 toggle
- Change password: 1 section tap + form interaction
- Review wallet controls: 1 section tap + 1 toggle
- Download a statement or tax summary: 1 section tap + 1 download action
- Destructive actions: 1 section tap + 1 danger-zone action + typed confirmation

This keeps the overwhelming majority of settings tasks within the requested `<= 3 clicks` threshold from entry.

## Statements Section

The Statements tab lists generated documents by period using the shared
`components/ui/table.tsx` primitive. Each row includes the reporting period,
covered date range, document type, generation date, and a keyboard-focusable
download action with an explicit accessible name such as
`Download Q2 2026 Transaction statement`.

When no documents are available, the tab renders the shared
`components/ui/empty-state.tsx` component so the section has a clear, polite
screen-reader announcement instead of a blank panel.

Accessibility and responsive notes:

- Contrast follows the existing zinc/white/dark-mode settings tokens used by the other sections.
- The tab remains reachable through the existing Radix tabs keyboard model: arrow keys, Home, and End.
- The document list uses semantic table headers and a horizontal overflow wrapper from the shared table component for small screens.
- The table and empty state are designed to remain usable at `sm` 640px, `md` 768px, `lg` 1024px, and `xl` 1280px.
- Download links include visible text, an icon marked `aria-hidden`, and a specific `aria-label` per document.

## Testing And Screenshots

Automated coverage is provided with Playwright in `tests/settings.spec.ts`.

Covered flows:

- Desktop settings navigation across grouped sections
- Typed-confirmation gating for account deactivation
- Mobile visibility of the settings section navigation
- Unit coverage in `settings-page-shell.test.tsx` for statements tab routing, downloads, and the empty state

Generated screenshots:

- `design/screenshots/settings-desktop.png`
- `design/screenshots/settings-mobile.png`

The statements change is a settings-tab addition only. Capture updated
screenshots when the visual regression pass is run for the broader settings
surface.

## Notes

- The UI remains prototype-safe: save and destructive actions currently update local confirmation states until backend wiring exists.
- The branch for this work is `design/settings-ia`.

## Design Token Migration Notes

As part of ongoing design-system hygiene, all settings components should reference design tokens from `app/globals.css` rather than hardcoded hex colors.

A full migration matrix is maintained at `design/token-migration-matrix.md`.

### WCAG 2.1 AA Compliance

- All color contrast ratios in the settings surface meet or exceed AA standards (4.5:1 for normal text, 3:1 for large text and UI components).
- Focus indicators use the `--ring` token (`oklch(70.9% 0.00008 271.152)` in light mode) to ensure visible keyboard navigation.
- Destructive actions use `--destructive` token with sufficient contrast against both light and dark backgrounds.
- Color-coded status indicators (success, warning, error) are supplemented with icons and text labels for color-blind accessibility.

### Responsive Behavior

The settings page has been validated across the following breakpoints:

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| sm | 640px | Single-column layout, collapsible section navigation |
| md | 768px | Two-column grid for profile fields |
| lg | 1024px | Full settings section bar, expanded tables |
| xl | 1280px | Side-by-side profile and danger-zone cards |

### Keyboard Navigation

- All interactive elements are reachable via `Tab` and `Shift+Tab`.
- Section tabs use Radix's built-in keyboard model (arrow keys, Home, End).
- Destructive action dialogs trap focus within the modal and return focus to the trigger button on close.
- Typed confirmation inputs are auto-focused on dialog open.
