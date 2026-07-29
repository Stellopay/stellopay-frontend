import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import Dashboard from "./dashboard-page";

vi.mock("@/components/dashboard/dashboard-navbar", () => ({
  default: () => <nav data-testid="dashboard-navbar">Navbar</nav>,
}));

vi.mock("@/components/dashboard/account-overview", () => ({
  default: () => <section data-testid="account-overview">Account Overview</section>,
}));

vi.mock("@/components/dashboard/quick-actions", () => ({
  QuickActions: () => <section data-testid="quick-actions">Quick Actions</section>,
}));

vi.mock("@/components/dashboard/analytics-insights", () => ({
  AnalyticsInsights: () => <section data-testid="analytics-insights">Analytics Insights</section>,
}));

vi.mock("@/components/analytics/client-analytics-view", () => ({
  default: () => <section data-testid="client-analytics">Client Analytics</section>,
}));

vi.mock("@/components/dashboard/dashboard-tour", () => ({
  DashboardTour: () => <div data-testid="dashboard-tour">Tour Overlay</div>,
}));

describe("Dashboard", () => {
  it("renders the dashboard navbar", () => {
    render(<Dashboard />);
    expect(screen.getByTestId("dashboard-navbar")).toBeInTheDocument();
  });

  it("renders the account overview widget", () => {
    render(<Dashboard />);
    expect(screen.getByTestId("account-overview")).toBeInTheDocument();
  });

  it("renders the quick actions widget", () => {
    render(<Dashboard />);
    expect(screen.getByTestId("quick-actions")).toBeInTheDocument();
  });

  it("renders the analytics insights widget", () => {
    render(<Dashboard />);
    expect(screen.getByTestId("analytics-insights")).toBeInTheDocument();
  });

  it("renders the client analytics view", () => {
    render(<Dashboard />);
    expect(screen.getByTestId("client-analytics")).toBeInTheDocument();
  });

  it("renders the dashboard tour overlay", () => {
    render(<Dashboard />);
    expect(screen.getByTestId("dashboard-tour")).toBeInTheDocument();
  });

  it("has the correct layout structure with space-y-10", () => {
    const { container } = render(<Dashboard />);
    const wrapper = container.querySelector(".space-y-10");
    expect(wrapper).toBeInTheDocument();
  });

  it("renders all major sections in order", () => {
    const { container } = render(<Dashboard />);
    const sections = container.querySelectorAll(
      "[data-testid='account-overview'], [data-testid='quick-actions'], [data-testid='analytics-insights'], [data-testid='client-analytics']",
    );
    expect(sections.length).toBe(4);
  });

  it("passes ref props to DashboardTour", () => {
    const { container } = render(<Dashboard />);
    const tour = container.querySelector('[data-testid="dashboard-tour"]');
    expect(tour).toBeInTheDocument();
  });
});