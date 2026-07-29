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
- Change profile photo crop: 1 section tap + photo action + crop/save interaction
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

## Account Avatar Crop

The Account tab profile photo action opens a focused crop dialog for upload,
crop, and save without moving users away from settings.

Behavior:

- The crop frame is always square and documents a fixed `512 x 512` output
  contract for backend/image-processing wiring.
- Users can upload an image, zoom from `100%` to `300%`, pan inside the crop
  frame, and rotate in 90-degree increments.
- Dragging the crop preview pans the image for pointer users.
- The current crop values are visible for review: zoom, rotation, pan X, and
  pan Y.
- Non-image uploads are rejected inline before crop controls enable.

Accessibility and responsive notes:

- The upload field has a visible label, helper text, and `aria-invalid` error
  state.
- Zoom uses a native range input, so keyboard users can adjust it with standard
  slider keys.
- Pan is available through arrow-key handling on the focused crop preview and
  through explicit Pan up/down/left/right buttons.
- Rotate controls are regular buttons with visible labels and icon affordances.
- Disabled controls remain discoverable before upload while preventing invalid
  crop saves.
- The dialog stacks controls below the square preview on narrow screens, then
  shifts controls beside the preview at `lg` 1024px and wider. Long file names,
  helper text, and crop values wrap within the dialog at `sm` 640px, `md`
  768px, `lg` 1024px, and `xl` 1280px.

## Notes

- The UI remains prototype-safe: save and destructive actions currently update local confirmation states until backend wiring exists.
- The branch for this work is `design/settings-ia`.
