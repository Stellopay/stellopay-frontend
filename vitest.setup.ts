import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

const mockFont = () => ({
  className: "mock-font",
  variable: "mock-font-variable",
  style: {},
});

vi.mock("next/font/google", () => ({
  Inter: mockFont,
}));

vi.mock("next/font/local", () => ({
  default: mockFont,
}));

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
}

if (typeof window !== "undefined") {
  const storage = window.localStorage;

  if (
    typeof storage?.clear !== "function" ||
    typeof storage?.getItem !== "function" ||
    typeof storage?.setItem !== "function"
  ) {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
  }
}
