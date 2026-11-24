import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DashboardPage from "./page";

vi.mock("@/components/dashboard/dashboard-page", () => ({
  default: () => <div data-testid="dashboard">Dashboard</div>,
}));

describe("DashboardPage", () => {
  it("renders the dashboard route content", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
  });
});
