# Settings Information Architecture & Accessibility (IA)

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
