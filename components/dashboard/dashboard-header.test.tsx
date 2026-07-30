import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardHeader } from "./dashboard-header";

describe("DashboardHeader Component", () => {
  it("renders the dashboard heading", () => {
    render(<DashboardHeader />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders a custom title", () => {
    render(<DashboardHeader title="My Dashboard" />);
    expect(screen.getByText("My Dashboard")).toBeInTheDocument();
  });

  it("renders primary action when provided", () => {
    render(
      <DashboardHeader
        primaryAction={<button>Primary</button>}
      />
    );
    expect(screen.getByTestId("primary-action")).toBeInTheDocument();
    expect(screen.getByText("Primary")).toBeInTheDocument();
  });

  it("renders secondary controls on desktop", () => {
    render(
      <DashboardHeader
        secondaryControls={[
          <button key="1">Control 1</button>,
          <button key="2">Control 2</button>,
        ]}
      />
    );
    expect(
      screen.getByTestId("secondary-controls-desktop")
    ).toBeInTheDocument();
  });

  it("renders kebab menu button on mobile", () => {
    render(
      <DashboardHeader
        secondaryControls={[<button key="1">Control 1</button>]}
      />
    );
    expect(screen.getByTestId("kebab-menu-button")).toBeInTheDocument();
  });

  it("toggles kebab menu open and closed", () => {
    render(
      <DashboardHeader
        secondaryControls={[<button key="1">Control 1</button>]}
      />
    );
    const menuButton = screen.getByTestId("kebab-menu-button");

    // Menu should be closed initially
    expect(screen.queryByTestId("kebab-menu")).not.toBeInTheDocument();

    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByTestId("kebab-menu")).toBeInTheDocument();

    // Close menu
    fireEvent.click(menuButton);
    expect(screen.queryByTestId("kebab-menu")).not.toBeInTheDocument();
  });

  it("shows secondary controls inside kebab menu when open", () => {
    render(
      <DashboardHeader
        secondaryControls={[
          <button key="1">Control 1</button>,
          <button key="2">Control 2</button>,
        ]}
      />
    );
    fireEvent.click(screen.getByTestId("kebab-menu-button"));
    const menu = screen.getByTestId("kebab-menu");
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveTextContent("Control 1");
    expect(menu).toHaveTextContent("Control 2");
  });

  it("does not render kebab menu button when no secondary controls", () => {
    render(<DashboardHeader />);
    expect(
      screen.queryByTestId("kebab-menu-button")
    ).not.toBeInTheDocument();
  });

  it("kebab menu button has correct aria-expanded attribute", () => {
    render(
      <DashboardHeader
        secondaryControls={[<button key="1">Control 1</button>]}
      />
    );
    const menuButton = screen.getByTestId("kebab-menu-button");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });
});