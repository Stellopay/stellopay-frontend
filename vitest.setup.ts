import "@testing-library/jest-dom/vitest";
import { configureAxe } from "vitest-axe";

configureAxe();

// jsdom does not implement ResizeObserver, but recharts' ResponsiveContainer
// (used by dashboard/analytics widgets) requires one to mount. Stub it so
// components that render charts don't crash under jsdom.
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver =
    ResizeObserverStub as unknown as typeof ResizeObserver;
}
