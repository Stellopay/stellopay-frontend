import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "./theme-context";

type Listener = (event: MediaQueryListEvent) => void;

let matches = false;
let listeners = new Set<Listener>();

const fireSystemThemeChange = (nextMatches: boolean) => {
  matches = nextMatches;
  const event = { matches: nextMatches } as MediaQueryListEvent;
  listeners.forEach((listener) => listener(event));
};

function ThemeProbe() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div>
      <p data-testid="theme">{theme}</p>
      <p data-testid="resolved-theme">{resolvedTheme}</p>
      <button type="button" onClick={() => setTheme("light")}>
        light
      </button>
      <button type="button" onClick={() => setTheme("dark")}>
        dark
      </button>
      <button type="button" onClick={() => setTheme("system")}>
        system
      </button>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
    </div>
  );
}

const renderTheme = () =>
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );

describe("ThemeProvider", () => {
  beforeEach(() => {
    matches = false;
    listeners = new Set();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        addEventListener: (_event: "change", listener: Listener) => {
          listeners.add(listener);
        },
        removeEventListener: (_event: "change", listener: Listener) => {
          listeners.delete(listener);
        },
      })),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("defaults to system and resolves the current OS preference", async () => {
    matches = true;

    renderTheme();

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("system");
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
      expect(document.documentElement).toHaveClass("dark");
    });
    expect(window.localStorage.getItem("theme")).toBe("system");
  });

  it("hydrates a stored light preference without following system dark", async () => {
    window.localStorage.setItem("theme", "light");
    matches = true;

    renderTheme();

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("light");
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
      expect(document.documentElement).not.toHaveClass("dark");
    });
  });

  it("rejects unknown stored values and falls back to system", async () => {
    window.localStorage.setItem("theme", "solarized");
    matches = false;

    renderTheme();

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("system");
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    });
    expect(window.localStorage.getItem("theme")).toBe("system");
  });

  it("cycles light to dark to system", async () => {
    window.localStorage.setItem("theme", "light");

    renderTheme();

    await act(async () => screen.getByRole("button", { name: "toggle" }).click());
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");

    await act(async () => screen.getByRole("button", { name: "toggle" }).click());
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
  });

  it("updates resolved theme live while system mode is active", async () => {
    renderTheme();

    await waitFor(() => {
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    });

    act(() => fireSystemThemeChange(true));

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("cleans up the matchMedia change listener on unmount", () => {
    const { unmount } = renderTheme();

    expect(listeners.size).toBe(1);
    unmount();
    expect(listeners.size).toBe(0);
  });
});
