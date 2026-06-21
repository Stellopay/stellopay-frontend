import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'mock-inter',
    variable: '--font-inter',
    style: { fontFamily: 'Inter' },
  }),
}));

vi.mock('next/font/local', () => ({
  default: () => ({
    className: 'mock-local-font',
    variable: '--font-local',
    style: { fontFamily: 'Local Font' },
  }),
}));
