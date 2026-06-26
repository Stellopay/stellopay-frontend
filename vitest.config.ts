import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: { plugins: [] },
  },
  resolve: {
    alias: {
      '@': repoRoot,
    },
  },
  test: {
    globals: true,
    include: ['**/*.test.ts', '**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'utils/authUtils.ts',
        'utils/transactionUtils.ts',
        'utils/paginationUtils.ts',
        'utils/date-utils.ts',
        'types/auth.ts',
        'types/wallet.ts',
        'context/wallet-context.tsx',
        'components/analytics/analytics-view.tsx',
        'components/analytics/client-analytics-view.tsx',
        'components/common/notification-panel.tsx',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.config.*',
        'vitest.config.ts',
        'tests/**',
        'vitest.setup.ts',
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
