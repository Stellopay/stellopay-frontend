import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DashboardLoading from "@/app/dashboard/loading";
import TransactionsLoading from "@/app/transactions/loading";
import SettingsPreferencesLoading from "@/app/settings/preferences/loading";

describe("route segment loading states", () => {
  it("renders an accessible dashboard loading skeleton", () => {
    render(<DashboardLoading />);

    const status = screen.getByRole("status", { name: /loading dashboard/i });
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
  });

  it("renders an accessible transactions loading skeleton", () => {
    render(<TransactionsLoading />);

    const status = screen.getByRole("status", {
      name: /loading transactions/i,
    });
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading transactions...")).toBeInTheDocument();
  });

  it("renders an accessible settings loading skeleton", () => {
    render(<SettingsPreferencesLoading />);

    const status = screen.getByRole("status", {
      name: /loading settings preferences/i,
    });
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByText("Loading settings preferences..."),
    ).toBeInTheDocument();
  });
});
