# Accessibility (A11y) Checklist - Stellopay Frontend

## Overview
This checklist defines the mandatory accessibility requirements (targeting WCAG 2.1 AA compliance) for all components and views in the Stellopay frontend.

## Components

### How It Works (`components/landing/how-it-works.tsx`)
- **Reduced Motion**: Scroll-triggered framer-motion animations are gated behind the `useReducedMotion` hook. When `prefers-reduced-motion: reduce` is active, step cards perform an instant opacity swap with no transform, ensuring users with vestibular disorders are not exposed to slide/fade animations.
- **Contrast**: All text meets WCAG 2.1 AA contrast ratios in both light and dark mode.
- **Keyboard Navigation**: The section is navigable via standard document flow; no custom keyboard traps.
- **Responsive Breakpoints**: The three-step grid collapses to a single column at `sm` (640px), two columns at `md` (768px), and three columns at `lg` (1024px).
