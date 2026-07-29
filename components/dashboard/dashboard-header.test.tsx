import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardHeader } from './dashboard-header';

describe('DashboardHeader Component', () => {
  it('renders the dashboard heading', () => {
    render(<DashboardHeader />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
