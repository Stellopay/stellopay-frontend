# Accessibility Checklist — WCAG 2.1 AA Baseline

## Overview
This checklist defines the mandatory accessibility requirements (targeting WCAG 2.1 AA compliance) for all components and views in the Stellopay frontend.

## Reduced Motion (WCAG 2.1 Success Criterion 2.3.3 — Animation from Interactions)

### Requirement
Every component that uses framer-motion (or any JS-driven animation) **must** check the user's `prefers-reduced-motion: reduce` OS-level preference and disable or simplify the animation accordingly.

### Implementation

| Component | Hook used | Animation type | Reduced-motion behavior |
|---|---|---|---|
| `components/landing/hero.tsx` | `useReducedMotion()` | Decorative gradient orbs, rotated floating cards | Orbs hidden entirely; card rotation disabled |
| `components/common/nav-link.tsx` | `useReducedMotion()` | Spring-animated active-link background (`motion.div` with `layoutId`) | Static `<div>` replaces `<motion.div>` — same visual, no animation |
| `components/landing/faq-section.tsx` | `useReducedMotion()` | Accordion expand/collapse (`AnimatePresence` + `motion.div`) | Content rendered directly without animation wrapper |

### Shared test helper
Use `mockMatchMediaReducedMotion()` from `utils/test-utils.tsx` to assert a component renders its reduced-motion variant:

```tsx
import { mockMatchMediaReducedMotion } from "@/utils/test-utils";

it("renders without animation when reduced motion is preferred", () => {
  mockMatchMediaReducedMotion(true);
  render(<MyComponent />);
  // assert static variant is rendered
});
```

### Audit checklist for new components
- [ ] Does the component use `framer-motion` or CSS `@keyframes`?
- [ ] Does it call `useReducedMotion()` and branch on the result?
- [ ] Does the reduced-motion variant preserve the same content and functionality?
- [ ] Is there a test that mocks `matchMedia` to verify the static variant?

## Color contrast
All foreground/background color pairs must meet WCAG 2.1 AA contrast ratios:
- **Normal text** (<18px / <14px bold): minimum 4.5:1
- **Large text** (>=18px / >=14px bold): minimum 3:1
- **UI components / graphical objects**: minimum 3:1

Reference: `globals.css` defines all colors as CSS custom properties using OKLCH values. The `@custom-variant contrast-more` in `globals.css` supports forced-contrast adjustments.

## Keyboard navigation
- Every interactive element must be reachable and operable via keyboard.
- Visible focus indicators are required (ring or outline, minimum 2px offset).
- Custom focus styles use `focus-visible` where appropriate.
- Tab order follows the visual reading order (left-to-right, top-to-bottom).
- No keyboard traps — focus must not get stuck in any widget.

## ARIA
- Landmarks use semantic HTML (`<nav>`, `<main>`, `<aside>`, `<section>`) or explicit `role` attributes.
- Interactive controls have accessible names (either visible label text or `aria-label` / `aria-labelledby`).
- Dynamic content uses `aria-live` regions (polite for non-critical updates, assertive for time-sensitive alerts).
- Accordion headers use `aria-expanded` and `aria-controls`.
- Current page links use `aria-current="page"`.

## Responsive behavior
All components must function correctly across breakpoints:
- **sm**: 640px — mobile portrait
- **md**: 768px — mobile landscape / small tablet
- **lg**: 1024px — tablet / small desktop
- **xl**: 1280px — desktop

Test at each breakpoint: content is not clipped, interactive targets are at least 44×44px, and text does not overflow.

## Dark mode
- Components use `dark:` Tailwind variants consistently.
- Theme toggle persists in `localStorage` and respects `prefers-color-scheme`.
- Reduced-motion checks are independent of theme — both light and dark modes should respect the same motion preference.

## Testing
- Unit tests run via `pnpm test` (Vitest + React Testing Library).
- E2E accessibility scans run via `pnpm test:e2e` (Playwright + axe-core).
- Coverage target: 95% lines, functions, branches, statements.
