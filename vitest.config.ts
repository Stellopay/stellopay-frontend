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
      include: [
        "hooks/useCountdown.ts",
        "utils/authUtils.ts",
        "utils/date-utils.ts",
        "utils/formatUtils.ts",
        "utils/navigationUtils.ts",
        "utils/transactionUtils.ts",
        "utils/paginationUtils.ts",
        "utils/stellarAddress.ts",
        "utils/commonUtils.ts",
        "types/auth.ts",
        "app/error.tsx",
        "app/global-error.tsx",
        "context/wallet-context.tsx",
        "context/theme-context.tsx",
        "components/analytics/analytics-view.tsx",
        "components/analytics/client-analytics-view.tsx",
        "components/common/notification-panel.tsx",
        "components/ui/pagination.tsx",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/*.config.*",
        "vitest.config.ts",
        "tests/**",
        "vitest.setup.ts",
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
    },
  },
});
