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
    expect(
      within(summaryValue("Profile readiness")).getByText("Complete"),
    ).toBeInTheDocument();
    expect(
      within(summaryValue("Alerts enabled")).getByText("5 active"),
    ).toBeInTheDocument();
    expect(
      within(summaryValue("Security posture")).getByText("2-step on"),
    ).toBeInTheDocument();
    expect(
      within(summaryValue("Wallet coverage")).getByText("2 linked"),
    ).toBeInTheDocument();
  });

  it("updates the Alerts enabled card when a notification toggle changes", () => {
    // Open straight on the Notifications section so its toggles are mounted.
    render(<SettingsPageShell initialSection="notifications" />);

    expect(
      within(summaryValue("Alerts enabled")).getByText("5 active"),
    ).toBeInTheDocument();

    // Disable one alert in the section editor.
    const transactionToggle = screen.getByRole("switch", {
      name: /transaction alerts, enabled/i,
    });
    fireEvent.click(transactionToggle);

    // The always-visible summary card reflects the change immediately.
    expect(
      within(summaryValue("Alerts enabled")).getByText("4 active"),
    ).toBeInTheDocument();
    expect(
      within(summaryValue("Alerts enabled")).queryByText("5 active"),
    ).not.toBeInTheDocument();
  });
});

describe("SettingsPageShell keyboard tabs", () => {
  afterEach(() => {
    cleanup();
  });

  function settingsTabs() {
    const tablist = screen.getByRole("tablist", {
      name: "Settings sections",
    });
    return within(tablist).getAllByRole("tab");
  }

  it("keeps only the active settings tab in the tab order", () => {
    render(<SettingsPageShell initialSection="notifications" />);

    const tabs = settingsTabs();
    const tabbableTabs = tabs.filter((tab) => tab.tabIndex === 0);

    expect(tabbableTabs).toHaveLength(1);
    expect(tabbableTabs[0]).toHaveTextContent(/notifications/i);
    expect(screen.getByRole("tab", { name: /notifications/i }))
      .toHaveAttribute("aria-selected", "true");
  });

  it("cycles focus and active section with ArrowRight and ArrowLeft", () => {
    render(<SettingsPageShell initialSection="notifications" />);

    const notificationsTab = screen.getByRole("tab", {
      name: /notifications/i,
    });
    notificationsTab.focus();

    fireEvent.keyDown(notificationsTab, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: /security/i })).toHaveFocus();
    expect(screen.getByRole("tab", { name: /security/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(screen.getByRole("tab", { name: /security/i }), {
      key: "ArrowLeft",
    });
    expect(screen.getByRole("tab", { name: /notifications/i })).toHaveFocus();
    expect(screen.getByRole("tab", { name: /notifications/i }))
      .toHaveAttribute("aria-selected", "true");
  });

  it("moves to the first and last settings tabs with Home and End", () => {
    render(<SettingsPageShell initialSection="notifications" />);

    const notificationsTab = screen.getByRole("tab", {
      name: /notifications/i,
    });
    notificationsTab.focus();

    fireEvent.keyDown(notificationsTab, { key: "End" });
    expect(screen.getByRole("tab", { name: /wallets/i })).toHaveFocus();
    expect(screen.getByRole("tab", { name: /wallets/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(screen.getByRole("tab", { name: /wallets/i }), {
      key: "Home",
    });
    expect(screen.getByRole("tab", { name: /account/i })).toHaveFocus();
    expect(screen.getByRole("tab", { name: /account/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

describe("SettingsPageShell unsaved changes guard", () => {
  afterEach(() => {
    cleanup();
  });

  it("intercepts tab switch when there are unsaved edits, and handles Stay", () => {
    render(<SettingsPageShell initialSection="account" />);

    // Dirty the account tab
    const firstNameInput = screen.getByLabelText(/first name/i);
    const originalValue = (firstNameInput as HTMLInputElement).value;
    fireEvent.change(firstNameInput, { target: { value: "Dirty Name" } });

    // Attempt to switch to notifications
    fireEvent.click(screen.getByRole("tab", { name: /notifications/i }));

    // Assert the guard intercepts
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();

    // Confirm choosing to stay leaves both the tab and unsaved edits intact
    fireEvent.click(screen.getByRole("button", { name: /stay/i }));
    
    // Dialog should be gone
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    
    // Tab should still be account
    expect(screen.getByRole("tab", { name: /account/i })).toHaveAttribute("aria-selected", "true");
    
    // Edit should still be intact
    expect(screen.getByLabelText(/first name/i)).toHaveValue("Dirty Name");
  });

  it("intercepts tab switch and handles Discard changes", () => {
    render(<SettingsPageShell initialSection="account" />);

    // Dirty the account tab
    const firstNameInput = screen.getByLabelText(/first name/i);
    const originalValue = (firstNameInput as HTMLInputElement).value;
    fireEvent.change(firstNameInput, { target: { value: "Dirty Name" } });

    // Attempt to switch to notifications
    fireEvent.click(screen.getByRole("tab", { name: /notifications/i }));

    // Confirm choosing to discard changes actually switches tabs and clears dirty state
    fireEvent.click(screen.getByRole("button", { name: /discard changes/i }));
    
    // Dialog should be gone
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    
    // Tab should now be notifications
    expect(screen.getByRole("tab", { name: /notifications/i })).toHaveAttribute("aria-selected", "true");
    
    // Switch back to account to verify dirty state was cleared
    fireEvent.click(screen.getByRole("tab", { name: /account/i }));
    expect(screen.getByLabelText(/first name/i)).toHaveValue(originalValue);
  });
});
