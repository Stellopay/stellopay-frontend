# PR Description: Add Keyboard Shortcuts to Quick Actions (#599)

## Overview
This PR implements keyboard shortcuts for common dashboard actions in `components/dashboard/quick-actions.tsx`. Power users can now trigger quick actions using intuitive single-letter keyboard shortcuts (e.g. `S` for Send Payment, `R` for View Reports) without needing to click with a mouse.

## Key Changes

### 1. Component Enhancements (`components/dashboard/quick-actions.tsx`)
- Extended `QuickActionItem` interface with optional `shortcut?: string`.
- Added default shortcuts for active default actions:
  - **Send Payment**: Key `S` (routes to `/transactions`).
  - **View Reports**: Key `R` (routes to `/analytics-view`).
- Added a global `keydown` event listener attached to `window`:
  - **Input Suppression**: Automatically checks whether `document.activeElement` or `event.target` is an `<input>`, `<textarea>`, `<select>`, or `contentEditable` element, suppressing shortcut execution when user is typing.
  - **Modifier Key Safety**: Ignores shortcut key combinations involving `Ctrl`, `Cmd` (`Meta`), or `Alt` to prevent conflicts with browser or system shortcuts.
  - **Action Filtering**: Skips disabled actions and executes `action.onClick()` or `router.push(action.href)` for active actions.
- Enhanced UX Discoverability:
  - Added visible `<kbd>` badges to active action cards displaying their shortcut key.
  - Added `title` tooltips (e.g. `Send Payment (Shortcut: S)`) on interactive action cards.

### 2. Coverage & Configuration (`vitest.config.ts`)
- Added `components/dashboard/quick-actions.tsx` to Vitest `coverage.include` paths.

### 3. Unit Tests (`components/dashboard/quick-actions.test.tsx`)
- Added comprehensive unit tests for:
  - Triggering `router.push` when shortcut for `href` action is pressed.
  - Triggering `onClick` callback when shortcut for `onClick` action is pressed.
  - Case-insensitive shortcut matching (e.g., `S` vs `s`).
  - Shortcut suppression when focused inside `<input>`, `<textarea>`, `<select>`, or `contentEditable` elements.
  - Shortcut suppression when `Ctrl`, `Meta`, or `Alt` modifier keys are pressed.
  - Filtering out disabled action shortcuts.
  - Visual shortcut hint rendering (`<kbd>` badges and `title` tooltips).
  - Event listener cleanup on component unmount.
- **Test Coverage**: Achieved 100% Statements, 100% Branches, 100% Functions, and 100% Lines coverage for `quick-actions.tsx`.

## Acceptance Criteria Checklist
- [x] Defined shortcuts trigger their actions.
- [x] Shortcuts are suppressed while a text input/textarea/select/contentEditable has focus.
- [x] Shortcut hints are visible and discoverable in the UI (`<kbd>` badges and tooltips).
- [x] 100% test coverage for modified component (exceeds 95% minimum requirement).
- [x] Unit tests pass clean.

## Verification Commands
```bash
export PATH=/home/timiturn3r/.nvm/versions/node/v24.18.0/bin:$PATH
npm test -- components/dashboard/quick-actions.test.tsx
```
