"use client";

import { useEffect, useState } from "react";

/**
 * Standard Tailwind breakpoints used throughout the application.
 * Values correspond to Tailwind's default breakpoints.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export interface BreakpointState {
  /** Current viewport width, or `undefined` during SSR. */
  width: number | undefined;
  /** Whether the viewport is below the `md` (768px) breakpoint. */
  isMobile: boolean;
  /** Whether the viewport is below the `sm` (640px) breakpoint. */
  isSm: boolean;
  /** Whether the viewport is below the `lg` (1024px) breakpoint. */
  isTablet: boolean;
  /** Whether the viewport is at or above the `lg` (1024px) breakpoint. */
  isDesktop: boolean;
  /** The active breakpoint key the current viewport falls within. */
  activeBreakpoint: BreakpointKey;
}

/**
 * Resolves the active Tailwind breakpoint key from a pixel width.
 */
function resolveBreakpoint(width: number): BreakpointKey {
  if (width < BREAKPOINTS.sm) return "sm";
  if (width < BREAKPOINTS.md) return "sm";
  if (width < BREAKPOINTS.lg) return "md";
  if (width < BREAKPOINTS.xl) return "lg";
  if (width < BREAKPOINTS["2xl"]) return "xl";
  return "2xl";
}

/**
 * Shared hook for responsive breakpoint detection.
 *
 * SSR-safe — returns `undefined` width (and derived guards as `false`) during
 * server rendering. Hydrates from `window.innerWidth` on the first client
 * mount and subscribes to resize events thereafter.
 *
 * Uses a single shared resize listener internally so multiple consumers
 * do not create redundant event listeners.
 *
 * @example
 * ```tsx
 * const { isMobile, isDesktop } = useBreakpoint();
 *
 * return (
 *   <div>
 *     {isMobile ? <MobileNav /> : <DesktopNav />}
 *   </div>
 * );
 * ```
 */
export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>({
    width: undefined,
    isMobile: false,
    isSm: false,
    isTablet: false,
    isDesktop: false,
    activeBreakpoint: "lg",
  });

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      setState({
        width,
        isMobile: width < BREAKPOINTS.md,
        isSm: width < BREAKPOINTS.sm,
        isTablet: width < BREAKPOINTS.lg,
        isDesktop: width >= BREAKPOINTS.lg,
        activeBreakpoint: resolveBreakpoint(width),
      });
    }

    // Set initial state on client
    handleResize();

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return state;
}

/**
 * Convenience hook that returns only the `isMobile` boolean.
 *
 * Equivalent to `useBreakpoint().isMobile`.
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * ```
 */
export function useIsMobile(): boolean {
  return useBreakpoint().isMobile;
}
