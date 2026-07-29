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

## Accessibility & Guidelines
- **WCAG 2.1 AA Compliance:** Minimum relative line-height threshold of `1.4` enforced across all body and caption copy to ensure reading legibility.
- **Responsive Behavior:** Scale scales down proportionally at `< sm` (`640px`) breakpoints using responsive utility overrides.

## Notification Panel Clear-All & Undo Window (#792)

- **Contrast**: The ErrorState uses a `text-red-500` icon and `text-white` text on a `bg-red-900/10` background which exceeds minimum contrast requirements.
- **Keyboard Nav**: The "Try Again" button is fully keyboard navigable. Focus order is maintained.
- **ARIA**: The `ErrorState` component utilizes `role="alert"` and `aria-live="assertive"` so screen readers can proactively announce network failures. Loading/Retrying indicators use `aria-hidden="true"` on non-text elements and `aria-label` or `aria-disabled` where appropriate to ensure status is accurately conveyed.

---

## Transaction Quick-View Dialog

The transactions table includes an in-place quick-view dialog that allows users to inspect full transaction details without leaving the filtered table view. This is distinct from the full-page `/transactions/[id]` route.

### Features

- **In-place quick-view**: Opens a modal dialog on row click showing full transaction details
- **View Full Details link**: Includes a link inside the dialog to navigate to the dedicated `/transactions/[id]` route
- **Focus restoration**: Returns focus to the triggering row when the dialog closes
- **Responsive**: Works on both desktop table view and mobile card view
- **Optional fields support**: Displays memo, counterparty, fee, and transaction hash when available

### Accessibility Notes (WCAG 2.1 AA)

- **Contrast**: 
  - Focus ring (`focus:ring-[#D7E0EF]`) provides clear 3:1 contrast against dark background
  - All text meets 4.5:1 contrast ratio requirements
- **Keyboard Navigation**:
  - View detail buttons are fully keyboard accessible (Tab to focus, Enter/Space to activate)
  - Dialog can be closed with Escape key
  - Focus is trapped within the dialog while open
  - Focus returns to the triggering element when dialog closes
- **ARIA**:
  - Dialog uses `DialogTitle` and `DialogDescription` for proper accessible name and description
  - View detail buttons have descriptive `aria-label` (e.g., "View details for transaction 123")
  - Status badges have `aria-label` (e.g., "Status: Completed")
  - "View Full Details" link has `aria-label` for context
  - Decorative icons use `aria-hidden="true"`
- **Screen Reader Support**:
  - Dialog title and description are announced on open
  - All fields are properly labeled with semantic HTML
  - Status is announced with context ("Status: Completed" rather than just "Completed")

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| sm (640px) | Mobile card view - cards are clickable to open dialog |
| md (768px) | Desktop table view - view detail button in each row |
| lg (1024px) | Same as desktop, expanded dialog width |
| xl (1280px) | Same as desktop, expanded dialog width |

### Dark Mode

The dialog uses design tokens (`bg-background`, `text-muted-foreground`, etc.) that adapt to dark mode automatically. All contrast requirements are met in both light and dark modes.
