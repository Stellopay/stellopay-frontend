import React from "react";
import { render, screen } from "@testing-library/react";
import { DashboardHeader } from "./dashboard-header";

describe("DashboardHeader Component", () => {
  it("renders the dashboard heading", () => {
    render(<DashboardHeader />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("gives every icon-only dashboard action a unique accessible name", () => {
    render(<DashboardHeader />);

    expect(
      screen.getByRole("button", { name: "Search dashboard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View notifications" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open dashboard settings" }),
    ).toBeInTheDocument();
  });
});
