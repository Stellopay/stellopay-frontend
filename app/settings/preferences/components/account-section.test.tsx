import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountSection } from './account-section';

describe('AccountSection Component - Cookie Preferences', () => {
  it('renders cookie preferences categories correctly', () => {
    render(<AccountSection />);
    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
    expect(screen.getByText('Essential Cookies')).toBeInTheDocument();
    expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
    expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
  });

  it('allows toggling analytics and marketing options', () => {
    render(<AccountSection />);
    const analyticsCheckbox = screen.getByLabelText('Analytics cookies toggle') as HTMLInputElement;
    const marketingCheckbox = screen.getByLabelText('Marketing cookies toggle') as HTMLInputElement;

    expect(analyticsCheckbox.checked).toBe(false);
    fireEvent.click(analyticsCheckbox);
    expect(analyticsCheckbox.checked).toBe(true);

    expect(marketingCheckbox.checked).toBe(false);
    fireEvent.click(marketingCheckbox);
    expect(marketingCheckbox.checked).toBe(true);
  });
});
