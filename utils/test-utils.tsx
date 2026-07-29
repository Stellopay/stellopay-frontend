import { type RenderResult, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";

type MatchMediaMock = ReturnType<typeof createMatchMediaMock>;

function createMatchMediaMock(initialMatches: boolean) {
  const listeners: Set<(e: MediaQueryListEvent) => void> = new Set();

  const mql = {
    get matches() {
      return initialMatches;
    },
    addEventListener: vi.fn(
      (_event: string, handler: (e: MediaQueryListEvent) => void) => {
        listeners.add(handler);
      },
    ),
    removeEventListener: vi.fn(
      (_event: string, handler: (e: MediaQueryListEvent) => void) => {
        listeners.delete(handler);
      },
    ),
  };

  const matchMedia = vi.fn((query: string) =>
    query === "(prefers-reduced-motion: reduce)" ? mql : { matches: false },
  );

  function setMatches(matches: boolean) {
    const event = { matches } as MediaQueryListEvent;
    listeners.forEach((fn) => fn(event));
  }

  return { matchMedia, mql, setMatches };
}

export function mockMatchMediaReducedMotion(prefersReduced: boolean) {
  const mock = createMatchMediaMock(prefersReduced);
  vi.stubGlobal("matchMedia", mock.matchMedia);
  return mock;
}

export function renderWithReducedMotion(
  ui: ReactElement,
  prefersReduced: boolean,
): RenderResult & { mockMatchMedia: MatchMediaMock } {
  const mock = mockMatchMediaReducedMotion(prefersReduced);
  const result = render(ui);
  return { ...result, mockMatchMedia: mock };
}

export function mockUseReducedMotion() {
  const fn = vi.fn().mockReturnValue(false);
  vi.mock("@/hooks/useReducedMotion", () => ({
    useReducedMotion: () => fn(),
  }));
  return fn;
}
