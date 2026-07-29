# Settings IA: Danger Zone Confirmations

## Pattern
Irreversible, high-impact actions (e.g., account deactivation, removing a primary wallet, signing out all sessions) must use the `DestructiveActionDialog` component rather than native `window.confirm()`. This ensures a consistent, branded, and accessible experience across the settings UI.

## Accessibility Annotations
- **Contrast**: Red/destructive colors used in the dialog meet WCAG 2.1 AA minimum contrast ratios (4.5:1 for regular text, 3:1 for large text).
- **Keyboard Navigation**: The confirmation input is auto-focused when the dialog opens. Focus is trapped within the dialog, and pressing `Escape` dismisses the dialog and restores focus to the trigger element. The `Confirm` button is reachable via `Tab` and triggers on `Enter`/`Space` when enabled.
- **ARIA**:
  - Dialog uses `role="dialog"` and `aria-modal="true"`.
  - The confirmation input has `aria-invalid` tied to the current validation state and `aria-describedby` linking to inline error messages.
  - Form errors use `role="alert"` with `aria-live="polite"` for screen readers.
  - Buttons use `aria-disabled` or the native `disabled` attribute appropriately.

## Responsive Behavior
- **sm (640px)**: Dialog takes up full width minus padding, elements stack vertically.
- **md (768px)**: Dialog becomes a centered modal with appropriate max-width. Side-by-side elements adjust correctly.
- **lg (1024px)**: Standard modal width.
- **xl (1280px)**: Modal size remains constrained to avoid overly long line lengths.

## Usage
Import `DestructiveActionDialog` from `app/settings/preferences/components/destructive-action-dialog.tsx`.

```tsx
<DestructiveActionDialog
  triggerLabel="Action Name"
  title="Action Title"
  description="Action description."
  impactItems={[
    "Impact 1",
    "Impact 2"
  ]}
  confirmationToken="CONFIRM"
  confirmationLabel='Type "CONFIRM" to proceed'
  confirmLabel="Confirm Action"
  onConfirm={handleConfirm}
/>
```
