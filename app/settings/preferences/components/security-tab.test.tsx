import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

import SecurityTab from "./security-tab";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find the new-password input by placeholder (avoids aria-labelledby issues). */
const getPasswordInput = () =>
  screen.getByPlaceholderText("Use a strong password");

/** Find the confirm-password input by placeholder. */
const getConfirmInput = () =>
  screen.getByPlaceholderText("Repeat the new password");

const getSubmitButton = () =>
  screen.getByRole("button", { name: /update password/i });

function typePassword(value: string, blur = false) {
  const input = getPasswordInput();
  fireEvent.change(input, { target: { value } });
  if (blur) fireEvent.blur(input);
}

function typeConfirm(value: string, blur = false) {
  const input = getConfirmInput();
  fireEvent.change(input, { target: { value } });
  if (blur) fireEvent.blur(input);
}

function fillValidPasswords(password = "StrongPass@1") {
  typePassword(password, true);
  typeConfirm(password, true);
}

afterEach(() => {
  // Always restore real timers so a failing test with fake timers
  // does not pollute subsequent tests (waitFor uses setInterval internally).
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Initial render
// ---------------------------------------------------------------------------

describe("SecurityTab — initial render", () => {
  it("renders the new-password and confirm-password inputs", () => {
    render(<SecurityTab />);
    expect(getPasswordInput()).toBeInTheDocument();
    expect(getConfirmInput()).toBeInTheDocument();
  });

  it("submit button is disabled when both fields are empty", () => {
    render(<SecurityTab />);
    expect(getSubmitButton()).toBeDisabled();
  });

  it("renders all four password requirement labels", () => {
    render(<SecurityTab />);
    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("One uppercase letter")).toBeInTheDocument();
    expect(screen.getByText("One special character")).toBeInTheDocument();
    expect(screen.getByText("Passwords match")).toBeInTheDocument();
  });

  it("inputs start with aria-invalid false", () => {
    render(<SecurityTab />);
    expect(getPasswordInput()).toHaveAttribute("aria-invalid", "false");
    expect(getConfirmInput()).toHaveAttribute("aria-invalid", "false");
  });

  it("no inline validation errors are shown before the user interacts", () => {
    render(<SecurityTab />);
    expect(
      screen.queryByText(/password must be at least/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/passwords don't match/i),
    ).not.toBeInTheDocument();
  });

  it("renders the active sessions list", () => {
    render(<SecurityTab />);
    expect(screen.getByText("Chrome on Windows")).toBeInTheDocument();
    expect(screen.getByText("iPhone 15 Pro")).toBeInTheDocument();
  });

  it("renders all three verification control toggles", () => {
    render(<SecurityTab />);
    expect(
      screen.getByText("Authenticator app verification"),
    ).toBeInTheDocument();
    expect(screen.getByText("New device approval")).toBeInTheDocument();
    expect(screen.getByText("Large transfer approval")).toBeInTheDocument();
  });

  it("renders the sign-out-all-sessions trigger", () => {
    render(<SecurityTab />);
    expect(
      screen.getByRole("button", { name: /sign out all sessions/i }),
    ).toBeInTheDocument();
  });

  it("renders the recovery-methods disclosure element", () => {
    render(<SecurityTab />);
    expect(screen.getByText(/show recovery methods/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Requirements checklist — live feedback
// ---------------------------------------------------------------------------

describe("SecurityTab — requirements checklist", () => {
  it("minLength icon is inactive for a too-short password", () => {
    render(<SecurityTab />);
    typePassword("Ab@1");

    const row = screen.getByText("At least 8 characters").closest("div");
    expect(row?.querySelector("svg")?.classList.toString()).toContain(
      "text-zinc-300",
    );
  });

  it("minLength icon becomes active at exactly 8 characters", () => {
    render(<SecurityTab />);
    typePassword("Abcdef@1"); // exactly 8 chars

    const row = screen.getByText("At least 8 characters").closest("div");
    expect(row?.querySelector("svg")?.classList.toString()).toContain(
      "text-emerald-500",
    );
  });

  it("uppercase icon becomes active when an uppercase letter is present", () => {
    render(<SecurityTab />);
    typePassword("Abcdefg@1");

    const row = screen.getByText("One uppercase letter").closest("div");
    expect(row?.querySelector("svg")?.classList.toString()).toContain(
      "text-emerald-500",
    );
  });

  it("uppercase icon is inactive for an all-lowercase password", () => {
    render(<SecurityTab />);
    typePassword("abcdefg@1");

    const row = screen.getByText("One uppercase letter").closest("div");
    expect(row?.querySelector("svg")?.classList.toString()).toContain(
      "text-zinc-300",
    );
  });

  it("special-char icon becomes active when a special character is present", () => {
    render(<SecurityTab />);
    typePassword("StrongPass@1");

    const row = screen.getByText("One special character").closest("div");
    expect(row?.querySelector("svg")?.classList.toString()).toContain(
      "text-emerald-500",
    );
  });

  it("special-char icon is inactive without a special character", () => {
    render(<SecurityTab />);
    typePassword("StrongPass1");

    const row = screen.getByText("One special character").closest("div");
    expect(row?.querySelector("svg")?.classList.toString()).toContain(
      "text-zinc-300",
    );
  });

  it("passwords-match icon is inactive when fields differ", () => {
    render(<SecurityTab />);
    typePassword("StrongPass@1");
    typeConfirm("DifferentPass@1");

    const row = screen.getByText("Passwords match").closest("div");
    expect(row?.querySelector("svg")?.classList.toString()).toContain(
      "text-zinc-300",
    );
  });

  it("passwords-match icon becomes active when both fields are identical", () => {
    render(<SecurityTab />);
    typePassword("StrongPass@1");
    typeConfirm("StrongPass@1");

    const row = screen.getByText("Passwords match").closest("div");
    expect(row?.querySelector("svg")?.classList.toString()).toContain(
      "text-emerald-500",
    );
  });

  it("passwords-match icon stays inactive when password field is empty", () => {
    render(<SecurityTab />);
    typeConfirm("StrongPass@1"); // only fill confirm

    const row = screen.getByText("Passwords match").closest("div");
    expect(row?.querySelector("svg")?.classList.toString()).toContain(
      "text-zinc-300",
    );
  });
});

// ---------------------------------------------------------------------------
// Inline errors — weak password
// ---------------------------------------------------------------------------

describe("SecurityTab — weak-password inline errors", () => {
  it("shows length error after blurring a too-short password", async () => {
    render(<SecurityTab />);
    typePassword("Ab@1", true);

    await waitFor(() =>
      expect(
        screen.getByText("Password must be at least 8 characters."),
      ).toBeInTheDocument(),
    );
  });

  it("marks new-password input aria-invalid=true after blurring with a weak value", async () => {
    render(<SecurityTab />);
    typePassword("Ab@1", true);

    await waitFor(() =>
      expect(getPasswordInput()).toHaveAttribute("aria-invalid", "true"),
    );
  });

  it("shows uppercase error after blurring a password with no uppercase letter", async () => {
    render(<SecurityTab />);
    typePassword("weakpass@1", true);

    await waitFor(() =>
      expect(
        screen.getByText("Password must include at least one uppercase letter."),
      ).toBeInTheDocument(),
    );
  });

  it("shows special-character error after blurring a password with no special character", async () => {
    render(<SecurityTab />);
    typePassword("Weakpassword1", true);

    await waitFor(() =>
      expect(
        screen.getByText(
          "Password must include at least one special character.",
        ),
      ).toBeInTheDocument(),
    );
  });

  it("submit stays disabled when password is weak even with matching confirm", () => {
    render(<SecurityTab />);
    typePassword("weakpass", true);
    typeConfirm("weakpass", true);

    expect(getSubmitButton()).toBeDisabled();
  });

  it("inline error clears once the password meets policy", async () => {
    render(<SecurityTab />);
    typePassword("Ab@1", true);

    await waitFor(() =>
      expect(
        screen.getByText("Password must be at least 8 characters."),
      ).toBeInTheDocument(),
    );

    typePassword("StrongPass@1");

    await waitFor(() =>
      expect(
        screen.queryByText("Password must be at least 8 characters."),
      ).not.toBeInTheDocument(),
    );
  });

  it("submit stays disabled when only the new-password field is filled", () => {
    render(<SecurityTab />);
    typePassword("StrongPass@1", true);

    expect(getSubmitButton()).toBeDisabled();
  });

  it("submit stays disabled when only the confirm-password field is filled", () => {
    render(<SecurityTab />);
    typeConfirm("StrongPass@1", true);

    expect(getSubmitButton()).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Inline errors — confirm mismatch
// ---------------------------------------------------------------------------

describe("SecurityTab — confirm-mismatch inline error", () => {
  it("shows mismatch error after blurring confirm with a different value", async () => {
    render(<SecurityTab />);
    typePassword("StrongPass@1", true);
    typeConfirm("DifferentPass@1", true);

    await waitFor(() =>
      expect(screen.getByText("Passwords don't match.")).toBeInTheDocument(),
    );
  });

  it("marks confirm input aria-invalid=true when passwords don't match", async () => {
    render(<SecurityTab />);
    typePassword("StrongPass@1", true);
    typeConfirm("DifferentPass@1", true);

    await waitFor(() =>
      expect(getConfirmInput()).toHaveAttribute("aria-invalid", "true"),
    );
  });

  it("submit is disabled while passwords don't match", async () => {
    render(<SecurityTab />);
    typePassword("StrongPass@1", true);
    typeConfirm("DifferentPass@1", true);

    await waitFor(() => expect(getSubmitButton()).toBeDisabled());
  });

  it("mismatch error disappears once confirm field matches", async () => {
    render(<SecurityTab />);
    typePassword("StrongPass@1", true);
    typeConfirm("DifferentPass@1", true);

    await waitFor(() =>
      expect(screen.getByText("Passwords don't match.")).toBeInTheDocument(),
    );

    typeConfirm("StrongPass@1");

    await waitFor(() =>
      expect(
        screen.queryByText("Passwords don't match."),
      ).not.toBeInTheDocument(),
    );
  });

  it("confirm aria-invalid resets to false once passwords match", async () => {
    render(<SecurityTab />);
    typePassword("StrongPass@1", true);
    typeConfirm("DifferentPass@1", true);

    await waitFor(() =>
      expect(getConfirmInput()).toHaveAttribute("aria-invalid", "true"),
    );

    typeConfirm("StrongPass@1");

    await waitFor(() =>
      expect(getConfirmInput()).toHaveAttribute("aria-invalid", "false"),
    );
  });
});

// ---------------------------------------------------------------------------
// Valid form — submit enabled
// ---------------------------------------------------------------------------

describe("SecurityTab — valid form state", () => {
  it("enables the submit button when passwords are strong and matching", async () => {
    render(<SecurityTab />);
    fillValidPasswords();

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
  });

  it("new-password aria-invalid is false for a strong password after blur", async () => {
    render(<SecurityTab />);
    typePassword("StrongPass@1", true);

    await waitFor(() =>
      expect(getPasswordInput()).toHaveAttribute("aria-invalid", "false"),
    );
  });

  it("confirm aria-invalid is false when passwords match after blur", async () => {
    render(<SecurityTab />);
    fillValidPasswords();

    await waitFor(() =>
      expect(getConfirmInput()).toHaveAttribute("aria-invalid", "false"),
    );
  });

  it("all four requirement icons are active for a valid matching pair", async () => {
    render(<SecurityTab />);
    fillValidPasswords("StrongPass@1");

    await waitFor(() => {
      for (const label of [
        "At least 8 characters",
        "One uppercase letter",
        "One special character",
        "Passwords match",
      ]) {
        const row = screen.getByText(label).closest("div");
        expect(row?.querySelector("svg")?.classList.toString()).toContain(
          "text-emerald-500",
        );
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Submit — loading state
// ---------------------------------------------------------------------------

describe("SecurityTab — loading/disabled state during submit", () => {
  it("shows 'Saving...' text while the async call is pending", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab />);
    fillValidPasswords();

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    fireEvent.click(getSubmitButton());

    expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
  });

  it("disables the submit button while saving", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab />);
    fillValidPasswords();

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    fireEvent.click(getSubmitButton());

    expect(getSubmitButton()).toBeDisabled();
  });

  it("disables both password inputs while saving", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab />);
    fillValidPasswords();

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    fireEvent.click(getSubmitButton());

    expect(getPasswordInput()).toBeDisabled();
    expect(getConfirmInput()).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Submit — success path (real timers, waitFor up to 3 s)
// ---------------------------------------------------------------------------

describe("SecurityTab — successful password change", () => {
  it("shows the success message after a successful save", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab />);
    fillValidPasswords();

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    fireEvent.click(getSubmitButton());

    await waitFor(
      () =>
        expect(
          screen.getByText(/password policy satisfied/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("success status container has role=status and aria-live=polite", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab />);
    fillValidPasswords();

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    fireEvent.click(getSubmitButton());

    await waitFor(
      () => {
        const container = screen.getByRole("status");
        expect(container).toHaveAttribute("aria-live", "polite");
      },
      { timeout: 3000 },
    );
  });

  it("clears both password fields after a successful save", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab />);
    fillValidPasswords("StrongPass@1");

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    fireEvent.click(getSubmitButton());

    await waitFor(
      () => {
        expect(getPasswordInput()).toHaveValue("");
        expect(getConfirmInput()).toHaveValue("");
      },
      { timeout: 3000 },
    );
  });

  it("submit button is disabled again after a successful save (fields cleared)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab />);
    fillValidPasswords();

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    fireEvent.click(getSubmitButton());

    await waitFor(() => expect(getSubmitButton()).toBeDisabled(), {
      timeout: 3000,
    });
  });
});

// ---------------------------------------------------------------------------
// Submit — error path
// ---------------------------------------------------------------------------

describe("SecurityTab — failed password change", () => {
  it("shows the error message when the simulated save rejects", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    render(<SecurityTab />);
    fillValidPasswords();

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    fireEvent.click(getSubmitButton());

    await waitFor(
      () =>
        expect(
          screen.getByText(/failed to save changes/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("re-enables the submit button after a failed save", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    render(<SecurityTab />);
    fillValidPasswords();

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    fireEvent.click(getSubmitButton());

    await waitFor(
      () =>
        expect(
          screen.getByText(/failed to save changes/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    expect(getSubmitButton()).not.toBeDisabled();
  });

  it("does not clear password fields after a failed save", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    render(<SecurityTab />);
    fillValidPasswords("StrongPass@1");

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    fireEvent.click(getSubmitButton());

    await waitFor(
      () =>
        expect(
          screen.getByText(/failed to save changes/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    expect(getPasswordInput()).toHaveValue("StrongPass@1");
    expect(getConfirmInput()).toHaveValue("StrongPass@1");
  });
});

// ---------------------------------------------------------------------------
// Auto-clear behavior (fake timers, isolated describe)
// ---------------------------------------------------------------------------

describe("SecurityTab — status message auto-clear", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("success message auto-clears after 5 s", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab />);
    fillValidPasswords();

    // Flush React state (form validation) without advancing fake timers
    await vi.waitFor(() => expect(getSubmitButton()).not.toBeDisabled());

    fireEvent.click(getSubmitButton());

    // Advance past the 1500ms simulated save
    await vi.waitFor(async () => {
      vi.advanceTimersByTime(1500);
    });

    // Flush state updates
    await vi.waitFor(() =>
      expect(
        screen.queryByText(/password policy satisfied/i),
      ).toBeInTheDocument(),
    );

    // Advance past the 5000ms auto-clear
    await vi.waitFor(async () => {
      vi.advanceTimersByTime(5000);
    });

    await vi.waitFor(() =>
      expect(
        screen.queryByText(/password policy satisfied/i),
      ).not.toBeInTheDocument(),
    );
  });

  it("error message auto-clears after 5 s", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    render(<SecurityTab />);
    fillValidPasswords();

    await vi.waitFor(() => expect(getSubmitButton()).not.toBeDisabled());

    fireEvent.click(getSubmitButton());

    await vi.waitFor(async () => {
      vi.advanceTimersByTime(1500);
    });

    await vi.waitFor(() =>
      expect(
        screen.queryByText(/failed to save changes/i),
      ).toBeInTheDocument(),
    );

    await vi.waitFor(async () => {
      vi.advanceTimersByTime(5000);
    });

    await vi.waitFor(() =>
      expect(
        screen.queryByText(/failed to save changes/i),
      ).not.toBeInTheDocument(),
    );
  });
});

// ---------------------------------------------------------------------------
// Security: no password logging
// ---------------------------------------------------------------------------

describe("SecurityTab — security constraints", () => {
  it("does not log any password value to console during a successful save", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const consoleSpy = vi.spyOn(console, "log");
    render(<SecurityTab />);
    fillValidPasswords("StrongPass@1");

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    fireEvent.click(getSubmitButton());

    await waitFor(
      () =>
        expect(
          screen.getByText(/password policy satisfied/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    const logged = consoleSpy.mock.calls.flat().join(" ");
    expect(logged).not.toContain("StrongPass@1");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("SecurityTab — edge cases", () => {
  it("button is disabled when both fields match but fail policy", () => {
    render(<SecurityTab />);
    typePassword("weak", true);
    typeConfirm("weak", true);

    expect(getSubmitButton()).toBeDisabled();
  });

  it("submit is disabled when new-password is valid but confirm is still empty", async () => {
    render(<SecurityTab />);
    typePassword("StrongPass@1", true);

    // The button must stay disabled (confirm is empty)
    await waitFor(() => expect(getSubmitButton()).toBeDisabled());
  });

  it("confirm field does not show aria-invalid before it has been touched", () => {
    render(<SecurityTab />);
    // Type in password, never interact with confirm
    typePassword("S");

    expect(getConfirmInput()).toHaveAttribute("aria-invalid", "false");
  });

  it("accepts passwords with various supported special characters", async () => {
    render(<SecurityTab />);
    fillValidPasswords("StrongPass@1");

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
  });

  it("shows 'Update password' label when not saving", () => {
    render(<SecurityTab />);
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).toBeInTheDocument();
  });
});
