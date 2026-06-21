import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SettingsPageShell from "./settings-page-shell";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings/preferences",
  useRouter: () => ({
    replace,
  }),
}));

describe("SettingsPageShell", () => {
  it("updates summary cards when section state changes", () => {
    render(<SettingsPageShell initialSection="notifications" />);

    const alertsSummary = screen
      .getByText("Alerts enabled")
      .closest('[data-slot="card"]') as HTMLElement | null;
    expect(alertsSummary).not.toBeNull();
    expect(within(alertsSummary!).getByText("5 active")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("switch", { name: "Marketing and announcements" }),
    );

    expect(within(alertsSummary!).getByText("6 active")).toBeInTheDocument();
  });
});
