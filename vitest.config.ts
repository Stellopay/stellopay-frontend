import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  css: {
    // Empty inline PostCSS config: skips the project's Tailwind/PostCSS
    // pipeline during unit tests without tripping Vite's css.postcss types
    // (which accept a config object, not a boolean).
    postcss: { plugins: [] },
  },
  resolve: {
    alias: {
      "@": repoRoot,
    },
  },
  test: {
    globals: true,
    include: ["**/*.test.ts", "**/*.test.tsx"],
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Vitest skips generating the coverage report at all when any test
      // fails, unless this is set — which silently no-ops threshold
      // enforcement on a red run instead of enforcing it anyway.
      reportOnFailure: true,
      // Repository-wide, not a hand-picked allowlist (#1215): every source
      // directory the app actually ships from.
      include: [
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "hooks/**/*.{ts,tsx}",
        "utils/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
        "context/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/*.config.*",
        "vitest.config.ts",
        "tests/**",
        "vitest.setup.ts",
        "**/*.d.ts",
        "**/*.stories.{ts,tsx}",
        // These fail to parse under this vitest/coverage-v8 version's
        // uncovered-file remap step and can't currently be measured.
        // 4 have a genuine pre-existing syntax error (`tsc --noEmit` also
        // rejects them, unrelated to this issue — a separate fix):
        "app/settings/preferences/components/notifications-section.tsx",
        "app/verify-email/page.tsx",
        "components/landing/video-facade.tsx",
        "components/ui/form.tsx",
        // The other 5 are valid TS/TSX (tsc is fine with them) that only
        // the coverage remapper's parser chokes on (loses TS/TSX context;
        // see the `all` comment below). Re-include once that's fixed:
        "app/dashboard/page.tsx",
        "components/common/navbar.tsx",
        "components/common/nav-link.tsx",
        "components/dashboard/dashboard-header.tsx",
        "components/dashboard/quick-transfer.tsx",
      ],
      // `all: true` (the default) makes the v8 provider parse every matched
      // file that no test happens to import, including ones no test touches
      // at all, to report them as 0% instead of omitting them. As of this
      // vitest/coverage-v8 version that "uncovered file" parse path loses
      // TypeScript context and crashes on plain `interface` declarations in
      // otherwise valid files (e.g. components/dashboard/dashboard-header.tsx) —
      // a tooling bug, not a defect in those files. `all: false` reports only
      // files at least one test actually exercises, which sidesteps the crash
      // at the cost of silently omitting wholly-untested files from the
      // report rather than surfacing them as 0%. Revert to `all: true` once
      // that crash is fixed upstream (or the repo's TS syntax issues that
      // trigger it, like the one fixed in hooks/useUnsavedChangesGuard.ts,
      // are fully swept).
      all: false,
      // Measured baseline over this scope (app/, components/, hooks/,
      // utils/, lib/, context/; `all: false`, with the parse-crash files
      // above excluded): statements 68.58%, branches 65.83%, functions
      // 65.51%, lines 70.06%. Thresholds sit a few points under each to
      // leave slack for run-to-run variance while still catching a real
      // regression. Raising these is a deliberate, reviewed edit; lowering
      // them should fail review per #1215's acceptance criteria.
      thresholds: {
        lines: 68,
        functions: 63,
        branches: 63,
        statements: 66,
      },
    },
  },
});
