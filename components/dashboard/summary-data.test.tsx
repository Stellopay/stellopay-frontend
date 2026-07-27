/**
 * @fileoverview Tests for components/dashboard/summary-data.tsx
 *
 * Covers:
 * - summaryCardsData shape and content
 * - SummaryCardSkeleton: renders correct structure, aria-hidden, shade prop
 * - SummaryCardsSkeleton: renders correct count, role/aria attributes, shade forwarding
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import {
  summaryCardsData,
  SummaryCardSkeleton,
  SummaryCardsSkeleton,
} from './summary-data';

// ─── summaryCardsData ─────────────────────────────────────────────────────────

describe('summaryCardsData', () => {
  it('exports exactly three summary cards', () => {
    expect(summaryCardsData).toHaveLength(3);
  });

  it('each card has the required fields', () => {
    for (const card of summaryCardsData) {
      expect(card).toHaveProperty('title');
      expect(card).toHaveProperty('subtitle');
      expect(card).toHaveProperty('value');
      expect(card).toHaveProperty('change');
      expect(card).toHaveProperty('isPositive');
      expect(card).toHaveProperty('iconBgColor');
      expect(card).toHaveProperty('chartColor');
      expect(card).toHaveProperty('chartData');
    }
  });

  it('each card has at least one chart data point', () => {
    for (const card of summaryCardsData) {
      expect(card.chartData.length).toBeGreaterThan(0);
    }
  });

  it('includes Total Balance, Paid This Month, and To Be Paid cards', () => {
    const titles = summaryCardsData.map((c) => c.title);
    expect(titles).toContain('Total Balance');
    expect(titles).toContain('Paid This Month');
    expect(titles).toContain('To Be Paid');
  });
});

// ─── SummaryCardSkeleton ──────────────────────────────────────────────────────

describe('SummaryCardSkeleton', () => {
  it('renders without crashing', () => {
    render(<SummaryCardSkeleton />);
  });

  it('is marked aria-hidden so screen readers skip it', () => {
    render(<SummaryCardSkeleton />);
    // The outermost wrapper must carry aria-hidden="true".
    const card = document.querySelector('[aria-hidden="true"]');
    expect(card).toBeInTheDocument();
  });

  it('contains an icon placeholder skeleton', () => {
    const { container } = render(<SummaryCardSkeleton />);
    // Icon placeholder: w-12 h-12 rounded-xl
    const iconSkeleton = container.querySelector('.w-12.h-12.rounded-xl');
    expect(iconSkeleton).toBeInTheDocument();
  });

  it('contains a value placeholder skeleton', () => {
    const { container } = render(<SummaryCardSkeleton />);
    // Value placeholder: h-8 w-36
    const valueSkeleton = container.querySelector('.h-8.w-36');
    expect(valueSkeleton).toBeInTheDocument();
  });

  it('contains a chart placeholder skeleton', () => {
    const { container } = render(<SummaryCardSkeleton />);
    // Chart placeholder: h-12 w-full rounded-lg
    const chartSkeleton = container.querySelector('.h-12.rounded-lg');
    expect(chartSkeleton).toBeInTheDocument();
  });

  it('accepts and forwards an extra className to the wrapper', () => {
    const { container } = render(<SummaryCardSkeleton className="test-extra-class" />);
    expect(container.firstChild).toHaveClass('test-extra-class');
  });

  it('applies the dark shade by default', () => {
    const { container } = render(<SummaryCardSkeleton />);
    // Skeleton dark shade uses bg-[#2D2D2D]
    const darkSkeleton = container.querySelector('.bg-\\[\\#2D2D2D\\]');
    expect(darkSkeleton).toBeInTheDocument();
  });

  it('applies the light shade when shade="light"', () => {
    const { container } = render(<SummaryCardSkeleton shade="light" />);
    // Skeleton light shade uses bg-[#3A3A3A]
    const lightSkeleton = container.querySelector('.bg-\\[\\#3A3A3A\\]');
    expect(lightSkeleton).toBeInTheDocument();
  });
});

// ─── SummaryCardsSkeleton ─────────────────────────────────────────────────────

describe('SummaryCardsSkeleton', () => {
  it('renders without crashing', () => {
    render(<SummaryCardsSkeleton />);
  });

  it('has role="status" for assistive technology', () => {
    render(<SummaryCardsSkeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-label="Loading account summary"', () => {
    render(<SummaryCardsSkeleton />);
    expect(
      screen.getByRole('status', { name: /loading account summary/i }),
    ).toBeInTheDocument();
  });

  it('has aria-busy="true" while rendering', () => {
    render(<SummaryCardsSkeleton />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders the same number of skeleton cards as summaryCardsData entries', () => {
    const { container } = render(<SummaryCardsSkeleton />);
    // Each SummaryCardSkeleton root carries aria-hidden="true"
    const skeletonCards = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletonCards).toHaveLength(summaryCardsData.length);
  });

  it('uses the dark shade by default', () => {
    const { container } = render(<SummaryCardsSkeleton />);
    const darkSkeletons = container.querySelectorAll('.bg-\\[\\#2D2D2D\\]');
    expect(darkSkeletons.length).toBeGreaterThan(0);
  });

  it('forwards shade="light" to each child skeleton', () => {
    const { container } = render(<SummaryCardsSkeleton shade="light" />);
    const lightSkeletons = container.querySelectorAll('.bg-\\[\\#3A3A3A\\]');
    expect(lightSkeletons.length).toBeGreaterThan(0);
  });

  it('uses the grid layout matching the real cards grid', () => {
    render(<SummaryCardsSkeleton />);
    const grid = screen.getByRole('status');
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-1');
  });
});
