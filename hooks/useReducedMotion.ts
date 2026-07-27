"use client";

import { useEffect, useState } from "react";

/**
 * Returns `true` when the user has requested reduced motion at the OS level
 * (`prefers-reduced-motion: reduce`).
 *
 * Falls back to `false` on the server (SSR) so hydration is stable; the
 * value is updated on the client after mount.
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mql.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}
