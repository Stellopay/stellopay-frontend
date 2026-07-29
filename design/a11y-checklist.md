# Accessibility (A11y) Checklist - Stellopay Frontend

## Overview
This checklist defines the mandatory accessibility requirements (targeting WCAG 2.1 AA compliance) for all components and views in the Stellopay frontend.

---

## Dashboard Navbar Mobile Drawer

### Component
`components/dashboard/dashboard-navbar.tsx`

### Requirements covered
| Requirement | WCAG Criterion | Implementation |
|---|---|---|
| **Focus trap** — Tab/Shift+Tab cycles within the open drawer | WCAG 2.1.2 (No Keyboard Trap) | `useEffect` listens for `keydown` events. Tab from last element wraps to first; Shift+Tab from first wraps to last. |
| **Escape to close** — pressing Escape closes the drawer | WCAG 2.1.2 (No Keyboard Trap) | `handleKeyDown` checks `e.key === "Escape"` and closes the drawer. |
| **Focus return** — focus returns to the hamburger trigger on close | WCAG 2.4.3 (Focus Order) | A `useRef`-based effect compares previous open state; when transitioning from open → closed, `menuButtonRef.current?.focus()` is called. |
| **Initial focus** — focus moves into the drawer on open | WCAG 2.4.3 (Focus Order) | On open, the first focusable element inside the drawer receives focus. |
| **ARIA attributes** — `role="dialog"`, `aria-modal="true"`, `aria-label`, `aria-expanded`, `aria-controls` | WCAG 4.1.2 (Name, Role, Value) | Drawer has `role="dialog"` and `aria-modal="true"`; trigger has `aria-expanded` and `aria-controls` pointing to the drawer id. |
| **Backdrop / overlay** — clicking outside closes the drawer | WCAG 2.1.1 (Keyboard) | An overlay div with `aria-hidden="true"` covers the viewport and calls `setMobileDrawerOpen(false)` on click. |
| **Body scroll lock** — background content does not scroll while drawer is open | WCAG 2.4.7 (Focus Visible) | `document.body.style.overflow = "hidden"` is set when open and restored on close/unmount. |
| **Responsive visibility** — drawer only appears below `sm` breakpoint | WCAG 1.4.10 (Reflow) | The hamburger toggle is hidden above `sm` (`sm:hidden`), and the drawer itself uses `sm:hidden` to only render on mobile. |

### Test coverage
Tests are in `components/dashboard/dashboard-navbar.test.tsx` and cover:
- Drawer open/close via toggle button
- Escape key closes the drawer
- Tab focus cycling (forward and backward)
- Shift+Tab focus cycling
- Focus returns to trigger on close (Escape, button click, overlay click)
- `aria-modal`, `role="dialog"`, `aria-expanded`, `aria-controls` presence
- Body scroll lock and cleanup on unmount
- Icon toggle (hamburger → X)

---