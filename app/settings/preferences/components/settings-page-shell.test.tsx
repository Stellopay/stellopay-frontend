import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettingsPageShell from "./settings-page-shell";

// next/navigation is only available inside the Next.js runtime; stub the two
// hooks the shell calls so it can render under jsdom.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/settings/preferences",
}));

// AccountSection renders an avatar with next/image, which jsdom cannot load.
vi.mock("next/image", () => ({
  default: ({
    alt,
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

/** Return the summary card element identified by its label text. */
function summaryValue(label: string): HTMLElement {
  const card = screen.getByText(label).closest('[data-slot="card"]');
  if (!card) throw new Error(`Summary card for "${label}" not found`);
  return card as HTMLElement;
}

describe("SettingsPageShell summary cards", () => {
  afterEach(() => {
    cleanup();
  });

  it("derives every summary card value from live state, not hardcoded copy", () => {
    render(<SettingsPageShell />);

    // Defaults: profile fully seeded, 5 notification prefs on, 2FA on, 2 wallets.
    expect(within(summaryValue("Profile readiness")).getByText("Complete"))
      .toBeInTheDocument();
    expect(within(summaryValue("Alerts enabled")).getByText("5 active"))
      .toBeInTheDocument();
    expect(within(summaryValue("Security posture")).getByText("2-step on"))
      .toBeInTheDocument();
    expect(within(summaryValue("Wallet coverage")).getByText("2 linked"))
      .toBeInTheDocument();
  });

  it("updates the Alerts enabled card when a notification toggle changes", () => {
    // Open straight on the Notifications section so its toggles are mounted.
    render(<SettingsPageShell initialSection="notifications" />);

    expect(within(summaryValue("Alerts enabled")).getByText("5 active"))
      .toBeInTheDocument();

    // Disable one alert in the section editor.
    const transactionToggle = screen.getByRole("switch", {
      name: /transaction alerts, enabled/i,
    });
    fireEvent.click(transactionToggle);

    // The always-visible summary card reflects the change immediately.
    expect(within(summaryValue("Alerts enabled")).getByText("4 active"))
      .toBeInTheDocument();
    expect(
      within(summaryValue("Alerts enabled")).queryByText("5 active"),
    ).not.toBeInTheDocument();
  });
});
