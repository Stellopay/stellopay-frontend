"use client";

import { useEffect, useRef } from "react";

const HIGHLIGHT_DURATION_MS = 3000;
const HIGHLIGHT_CLASS = "animate-search-highlight";

export function useSearchHighlight(
  highlightedLabel: string | null,
): void {
  const previousLabel = useRef<string | null>(null);

  useEffect(() => {
    if (!highlightedLabel || highlightedLabel === previousLabel.current) {
      return;
    }

    previousLabel.current = highlightedLabel;

    const escaped = CSS.escape(highlightedLabel);
    const element = document.querySelector<HTMLElement>(
      `[data-search-label="${escaped}"]`,
    );

    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });

    element.classList.add(HIGHLIGHT_CLASS);

    const timer = setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS);
    }, HIGHLIGHT_DURATION_MS);

    return () => {
      clearTimeout(timer);
      element.classList.remove(HIGHLIGHT_CLASS);
    };
  }, [highlightedLabel]);
}
