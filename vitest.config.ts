import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  css: {
    // Skip the project's Tailwind/PostCSS pipeline during unit tests.
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
      reportOnFailure: true,
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
        // These files have unrelated syntax errors or coverage-remapper issues.
        "app/settings/preferences/components/notifications-section.tsx",
        "app/verify-email/page.tsx",
        "app/dashboard/page.tsx",
        "components/common/navbar.tsx",
        "components/common/nav-link.tsx",
        "components/dashboard/dashboard-header.tsx",
        "components/dashboard/quick-transfer.tsx",
      ],
      all: false,
      thresholds: {
        lines: 68,
        functions: 63,
        branches: 63,
        statements: 66,
      },
    },
  },
});
