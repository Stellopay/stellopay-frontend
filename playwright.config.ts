import { defineConfig, devices } from "@playwright/test";

// Retry twice in CI to absorb transient flakes; run clean locally.
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: ".",
  testMatch: ["tests/**/*.spec.ts", "e2e/**/*.spec.ts"],
  // Dashboard routes pull in Radix dialog and dropdown trees from the
  // NetworkSwitcher integration; the first cold compile under `next dev`
  // routinely needs more than the previous 60s budget.
  timeout: 180_000,
  retries: isCI ? 2 : 0,
  // Keep workers:1 so independent tests don't race on the single dev server.
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },

  // ---------------------------------------------------------------------------
  // Visual regression — snapshot path
  //
  // Snapshots are written to tests/__snapshots__/<testFilePath>/<project>/
  // and are committed to the repo so every branch has a deterministic baseline.
  //
  // To regenerate all baselines after an approved design change, run:
  //   npx playwright test --update-snapshots
  // See CONTRIBUTING.md § "Visual Regression Baselines" for the full workflow.
  // ---------------------------------------------------------------------------
  snapshotPathTemplate:
    "{testDir}/__snapshots__/{testFilePath}/{projectName}/{arg}{ext}",

  // ---------------------------------------------------------------------------
  // Visual regression — pixel-diff tolerance
  //
  // maxDiffPixelRatio: 0.01 — at most 1% of pixels may differ before a test
  //   fails. Absorbs sub-pixel antialiasing variation across machines while
  //   still catching real layout shifts.
  //
  // threshold: 0.15 — per-pixel colour distance tolerance on a 0–1 scale.
  //   0.15 forgives minor gamma / rendering differences between OS versions.
  // ---------------------------------------------------------------------------
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.15,
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      // webkit — covers Safari rendering and dialog behaviour
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npx next dev -p 3000 --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
