/**
 * Shared motion duration/easing tokens for framer-motion transitions.
 *
 * Usage:
 *   import { transition } from "@/lib/motion";
 *   <motion.div transition={transition.slow}>...</motion.div>
 *
 * Reduced-motion:
 *   Use `useReducedMotion()` and pass the variants returned by
 *   `resolveVariants()` or manually switch to `variants.fadeOnly` when
 *   the user prefers reduced motion.
 */

export const duration = {
  /** 200ms — Micro-interactions (hover, tap, focus ring) */
  fast: 0.2,
  /** 300ms — Standard UI transitions (accordion, panel toggle) */
  base: 0.3,
  /** 500ms — Entrance / scroll-reveal animations */
  slow: 0.5,
  /** 600ms — Layout animations, spring-like movement */
  xslow: 0.6,
} as const;

export const easing = {
  /** Smooth deceleration — ideal for entrance animations */
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Gentle ease in-out — ideal for UI transitions */
  easeInOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
} as const;

/**
 * Pre-built framer-motion `transition` objects keyed by use case.
 * These can be passed directly to the `transition` prop on motion elements.
 */
export const transition = {
  fast: { duration: duration.fast, ease: easing.easeOut },
  base: { duration: duration.base, ease: easing.easeInOut },
  slow: { duration: duration.slow, ease: easing.easeOut },
  spring: {
    type: "spring" as const,
    bounce: 0.2,
    duration: duration.xslow,
  },
} as const;

/**
 * Pre-built framer-motion `variants` for common animation patterns.
 *
 * Each variant object can be passed to the `variants` prop on a motion
 * element. Use `initial` and `whileInView` (or `animate`) to trigger.
 */
export const variants = {
  /** Opacity-only fade (used when reduced-motion is preferred) */
  fadeOnly: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  /** Fade + slide up (standard scroll-reveal) */
  fadeSlideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  /** Fade + slide down (e.g., accordion content) */
  fadeSlideDown: {
    hidden: { height: 0, opacity: 0 },
    visible: { height: "auto", opacity: 1 },
  },
} as const;

/**
 * Returns variants based on the user's reduced-motion preference.
 *
 * When `prefersReduced` is `true`, returns `fadeOnly` variants (no
 * y-transform, no duration). Otherwise returns a `fadeSlideUp` variant
 * with the configured `slow` transition and optional staggered delay.
 */
export function resolveVariants(
  prefersReduced: boolean,
  delay = 0,
): { hidden: { opacity: number; y?: number }; visible: Record<string, unknown> } {
  if (prefersReduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0 } },
    };
  }

  return {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.slow, delay, ease: easing.easeOut },
    },
  };
}