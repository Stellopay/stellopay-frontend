import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'font-inter',
    variable: '--font-inter',
  }),
}));

vi.mock('next/font/local', () => ({
  default: () => ({
    className: 'font-local',
    variable: '--font-local',
  }),
}));
