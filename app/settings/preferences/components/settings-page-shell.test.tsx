import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("SettingsPageShell unsaved-changes navigation guard", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("does not warn when switching sections with no unsaved changes", async () => {
    const user = userEvent.setup();
    render(<SettingsPageShell />);
    const confirmSpy = vi.spyOn(window, "confirm");

    // Radix's TabsTrigger activates on pointer events, not a bare click, so
    // this needs userEvent (which dispatches the full pointer sequence)
    // rather than fireEvent.click.
    await user.click(screen.getByRole("tab", { name: /notifications/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: /notifications/i })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("warns before switching sections with an unsaved account edit, and stays put if cancelled", async () => {
    const user = userEvent.setup();
    render(<SettingsPageShell />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: "Ada" } });

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    await user.click(screen.getByRole("tab", { name: /notifications/i }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: /account/i })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("allows switching sections with an unsaved edit once the user confirms", async () => {
    const user = userEvent.setup();
    render(<SettingsPageShell />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: "Ada" } });

    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("tab", { name: /notifications/i }));

    expect(screen.getByRole("tab", { name: /notifications/i })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("clears the dirty flag after a successful save, so a later navigation is unprompted", async () => {
    const user = userEvent.setup();
    // The simulated save in AccountSection has a random failure chance;
    // force the success branch deterministically (same pattern used in
    // account-section.test.tsx).
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SettingsPageShell />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: "Ada" } });
    fireEvent.click(
      screen.getByRole("button", { name: /save account changes/i }),
    );

    await waitFor(
      () =>
        expect(
          screen.getByText(/staged and ready for backend save/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    const confirmSpy = vi.spyOn(window, "confirm");
    await user.click(screen.getByRole("tab", { name: /notifications/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(
      screen.getByRole("tab", { name: /notifications/i }),
    ).toHaveAttribute("data-state", "active");
  });

  it("prevents a tab close/reload when there are unsaved changes", () => {
    render(<SettingsPageShell />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: "Ada" } });

    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("does not prevent a tab close/reload when there are no unsaved changes", () => {
    render(<SettingsPageShell />);

    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});
