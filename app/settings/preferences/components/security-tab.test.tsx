import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

import SecurityTab, {
  BACKUP_CODE_COUNT,
  DEFAULT_TWO_FACTOR_ENABLED,
  TWO_FACTOR_CODE_LENGTH,
  createApiKeySecret,
  formatBackupCodesFile,
  generateBackupCodes,
  getVerificationCodeError,
} from "./security-tab";

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
        screen.getByText(
          "Password must include at least one uppercase letter.",
        ),
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

    await waitFor(() =>
      expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument(),
    );
  });

  it("disables the submit button while saving", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab />);
    fillValidPasswords();

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    // Capture the element before clicking: once saving starts, the button's
    // label switches to "Saving...", so a fresh getByRole(name: /update
    // password/i) query would no longer match it.
    const submitButton = getSubmitButton();
    fireEvent.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());
  });

  it("disables both password inputs while saving", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab />);
    fillValidPasswords();

    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    fireEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(getPasswordInput()).toBeDisabled();
      expect(getConfirmInput()).toBeDisabled();
    });
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
        expect(screen.getByText(/failed to save changes/i)).toBeInTheDocument(),
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
        expect(screen.getByText(/failed to save changes/i)).toBeInTheDocument(),
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
        expect(screen.getByText(/failed to save changes/i)).toBeInTheDocument(),
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

    // Advance past the 1500ms simulated save. `advanceTimersByTimeAsync`
    // (unlike `advanceTimersByTime`) also flushes the microtask queue, so
    // the resolved promise's state updates commit before we assert — and
    // wrapping in `act` keeps React aware of that commit.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(screen.getByText(/password policy satisfied/i)).toBeInTheDocument();

    // Advance past the 5000ms auto-clear
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(
      screen.queryByText(/password policy satisfied/i),
    ).not.toBeInTheDocument();
  });

  it("error message auto-clears after 5 s", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    render(<SecurityTab />);
    fillValidPasswords();

    await vi.waitFor(() => expect(getSubmitButton()).not.toBeDisabled());

    fireEvent.click(getSubmitButton());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(screen.getByText(/failed to save changes/i)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(
      screen.queryByText(/failed to save changes/i),
    ).not.toBeInTheDocument();
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

// ---------------------------------------------------------------------------
// 2FA verification code — validation helper (unit tests)
// ---------------------------------------------------------------------------

describe("SecurityTab — getVerificationCodeError helper", () => {
  it("returns null for an empty string (user hasn't typed yet)", () => {
    expect(getVerificationCodeError("")).toBeNull();
  });

  it("returns null for a valid 6-digit numeric code", () => {
    expect(getVerificationCodeError("123456")).toBeNull();
    expect(getVerificationCodeError("000000")).toBeNull();
    expect(getVerificationCodeError("999999")).toBeNull();
  });

  it("rejects code that contains non-digit characters with a digits-only message", () => {
    expect(getVerificationCodeError("123A56")).toMatch(/only contain digits/i);
    expect(getVerificationCodeError("12-456")).toMatch(/only contain digits/i);
    expect(getVerificationCodeError("123 56")).toMatch(/only contain digits/i);
    expect(getVerificationCodeError("abcdef")).toMatch(/only contain digits/i);
  });

  it("rejects a code that is too short with a 'too short' message", () => {
    const err = getVerificationCodeError("12345");
    expect(err).toMatch(/too short/i);
    expect(err).toContain("1 digit");

    const err2 = getVerificationCodeError("12");
    expect(err2).toMatch(/too short/i);
    expect(err2).toContain("4 digits");
  });

  it("rejects a code that is too long with a 'too long' message", () => {
    const err = getVerificationCodeError("1234567");
    expect(err).toMatch(/too long/i);
    expect(err).toContain("1 digit");

    const err2 = getVerificationCodeError("1234567890");
    expect(err2).toMatch(/too long/i);
    expect(err2).toContain("4 digits");
  });

  it("does not trim whitespace — surrounding spaces trigger the digits-only error", () => {
    expect(getVerificationCodeError(" 123456")).toMatch(/only contain digits/i);
    expect(getVerificationCodeError("123456 ")).toMatch(/only contain digits/i);
  });

  it("code length constant matches the expected TOTP size", () => {
    expect(TWO_FACTOR_CODE_LENGTH).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// 2FA setup flow — panel open/close + controlled toggle behaviour
// ---------------------------------------------------------------------------

describe("SecurityTab — 2FA setup panel open/close", () => {
  /**
   * Click the Authenticator toggle card via its switch button. The toggle's
   * `role="switch"` combined with `aria-pressed` / `aria-checked` lets us
   * query it reliably.
   */
  function clickTwoFactorSwitch() {
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    return sw;
  }

  it("toggling 2FA OFF from the enabled state flips the switch directly (no panel)", () => {
    render(<SecurityTab twoFactorEnabled={true} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    expect(sw).toHaveAttribute("aria-checked", "true");

    fireEvent.click(sw);

    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(
      screen.queryByRole("form", { name: /authenticator verification setup/i }),
    ).not.toBeInTheDocument();
  });

  it("toggling 2FA ON from the disabled state opens the setup panel and does NOT flip the switch yet", () => {
    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    expect(sw).toHaveAttribute("aria-checked", "false");

    fireEvent.click(sw);

    // Switch must remain OFF until a valid code is submitted.
    expect(sw).toHaveAttribute("aria-checked", "false");
    // Setup panel appears.
    expect(
      screen.getByRole("form", { name: /authenticator verification setup/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/6-digit verification code/i),
    ).toBeInTheDocument();
  });

  it("controlled onTwoFactorEnabledChange is NOT called when the panel opens (toggle is gated)", () => {
    const onChange = vi.fn();
    render(
      <SecurityTab
        twoFactorEnabled={false}
        onTwoFactorEnabledChange={onChange}
      />,
    );

    clickTwoFactorSwitch();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("controlled onTwoFactorEnabledChange IS called when the user turns 2FA off directly", () => {
    const onChange = vi.fn();
    render(
      <SecurityTab
        twoFactorEnabled={true}
        onTwoFactorEnabledChange={onChange}
      />,
    );

    clickTwoFactorSwitch();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("cancel button in the setup panel closes it, clears the typed code, and leaves 2FA disabled", () => {
    render(<SecurityTab twoFactorEnabled={false} />);
    clickTwoFactorSwitch();

    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    expect(input).toHaveValue("123456");

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(
      screen.queryByRole("form", { name: /authenticator verification setup/i }),
    ).not.toBeInTheDocument();
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    expect(sw).toHaveAttribute("aria-checked", "false");

    // Re-open the panel to confirm the code did NOT persist.
    fireEvent.click(sw);
    const reopenedInput = screen.getByLabelText(/6-digit verification code/i);
    expect(reopenedInput).toHaveValue("");
  });
});

// ---------------------------------------------------------------------------
// 2FA setup flow — client-side validation + submit gating
// ---------------------------------------------------------------------------

describe("SecurityTab — 2FA verification code validation", () => {
  /**
   * Renders SecurityTab with 2FA disabled, then clicks the toggle to open
   * the setup panel. Returns the code input and verify submit button so the
   * caller can simulate typing and submitting.
   */
  function openSetupPanel() {
    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    const getVerifyButton = () =>
      screen.getByRole("button", { name: /verify and enable/i });
    return { input, getVerifyButton };
  }

  it("setup panel starts with an empty input, no inline error, and the submit button disabled", () => {
    const { input, getVerifyButton } = openSetupPanel();
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(getVerifyButton()).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("submit button stays disabled for a partial / incomplete code (e.g. 3 digits) and no inline error shown", () => {
    const { input, getVerifyButton } = openSetupPanel();
    fireEvent.change(input, { target: { value: "123" } });

    expect(input).toHaveValue("123");
    // Too-short code: inline error is shown (via helper).
    expect(screen.getByRole("alert")).toHaveTextContent(/too short/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(getVerifyButton()).toBeDisabled();
  });

  it("shows inline 'too short' error and keeps submit disabled for a 5-digit code", () => {
    const { input, getVerifyButton } = openSetupPanel();
    fireEvent.change(input, { target: { value: "12345" } });

    expect(screen.getByRole("alert")).toHaveTextContent(/1 digit.*too short/i);
    expect(getVerifyButton()).toBeDisabled();
  });

  it("shows inline 'too long' error and keeps submit disabled for a 7-digit code", () => {
    const { input, getVerifyButton } = openSetupPanel();
    fireEvent.change(input, { target: { value: "1234567" } });

    expect(screen.getByRole("alert")).toHaveTextContent(/too long/i);
    expect(getVerifyButton()).toBeDisabled();
  });

  it("shows inline 'digits only' error and keeps submit disabled when letters are mixed in", () => {
    const { input, getVerifyButton } = openSetupPanel();
    fireEvent.change(input, { target: { value: "123A56" } });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/only contain digits/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(getVerifyButton()).toBeDisabled();
  });

  it("enables the submit button once the code is exactly 6 numeric digits", async () => {
    const { input, getVerifyButton } = openSetupPanel();
    fireEvent.change(input, { target: { value: "743891" } });

    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await waitFor(() => expect(getVerifyButton()).not.toBeDisabled());
  });

  it("submit button becomes disabled again if the user deletes part of a previously-valid code", async () => {
    const { input, getVerifyButton } = openSetupPanel();
    fireEvent.change(input, { target: { value: "123456" } });
    await waitFor(() => expect(getVerifyButton()).not.toBeDisabled());

    fireEvent.change(input, { target: { value: "12345" } });
    expect(getVerifyButton()).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(/too short/i);
  });

  it("inline error resets when the user starts correcting a previously invalid value", () => {
    const { input } = openSetupPanel();
    fireEvent.change(input, { target: { value: "123A56" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/digits/i);

    fireEvent.change(input, { target: { value: "123" } });
    // Error changed to 'too short', not lingering 'digits' message.
    expect(screen.getByRole("alert")).toHaveTextContent(/too short/i);
    expect(screen.queryByText(/only contain digits/i)).not.toBeInTheDocument();
  });

  it("verification code input exposes its instruction text via aria-describedby", () => {
    const { input } = openSetupPanel();
    expect(input).toHaveAccessibleDescription(/no spaces or letters/i);
  });

  it("verification code input exposes an inline error via aria-describedby after invalid input", () => {
    const { input } = openSetupPanel();
    fireEvent.change(input, { target: { value: "123A56" } });

    const alert = screen.getByRole("alert");
    expect(input).toHaveAccessibleDescription(alert.textContent ?? "");
  });
});

// ---------------------------------------------------------------------------
// 2FA setup flow — submission success / failure outcomes
// ---------------------------------------------------------------------------

describe("SecurityTab — 2FA verification submit", () => {
  function openSetupPanelWith(
    props: React.ComponentProps<typeof SecurityTab> = {},
  ) {
    const mergedProps = { twoFactorEnabled: false, ...props } as const;
    render(<SecurityTab {...mergedProps} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    const getVerifyButton = () =>
      screen.getByRole("button", { name: /verify and enable/i });
    return { input, getVerifyButton };
  }

  it("successful submission: flips 2FA toggle ON, closes the panel, and clears the input", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const onChange = vi.fn();
    const { input, getVerifyButton } = openSetupPanelWith({
      onTwoFactorEnabledChange: onChange,
    });

    fireEvent.change(input, { target: { value: "009911" } });
    await waitFor(() => expect(getVerifyButton()).not.toBeDisabled());

    fireEvent.click(getVerifyButton());

    // Button shows loading state while verifying.
    await waitFor(() =>
      expect(screen.getByText(/verifying\.\.\./i)).toBeInTheDocument(),
    );

    // After simulated save resolves:
    await waitFor(
      () => {
        const sw = screen.getByRole("switch", {
          name: /authenticator app verification/i,
        });
        expect(sw).toHaveAttribute("aria-checked", "true");
      },
      { timeout: 3000 },
    );

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(true);

    // Panel is closed → no setup form in DOM.
    expect(
      screen.queryByRole("form", { name: /authenticator verification setup/i }),
    ).not.toBeInTheDocument();

    // Reopen the panel to confirm state was fully reset: input is empty and
    // submit is disabled.
    const sw2 = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    // 2FA is now true; turning it off then on again re-opens setup.
    fireEvent.click(sw2); // toggle off
    fireEvent.click(sw2); // toggle on (re-open setup)
    const reopenedInput = screen.getByLabelText(/6-digit verification code/i);
    expect(reopenedInput).toHaveValue("");
    expect(
      screen.getByRole("button", { name: /verify and enable/i }),
    ).toBeDisabled();
  });

  it("successful submission: a success banner is shown via the status area", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const { input, getVerifyButton } = openSetupPanelWith();
    fireEvent.change(input, { target: { value: "112233" } });
    await waitFor(() => expect(getVerifyButton()).not.toBeDisabled());
    fireEvent.click(getVerifyButton());

    await waitFor(
      () =>
        expect(
          screen.getByText(/authenticator app verified/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("failed submission: clears the verification code input (security) and shows a server error inline", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.95);
    const onChange = vi.fn();
    const { input, getVerifyButton } = openSetupPanelWith({
      onTwoFactorEnabledChange: onChange,
    });

    fireEvent.change(input, { target: { value: "987654" } });
    await waitFor(() => expect(getVerifyButton()).not.toBeDisabled());
    fireEvent.click(getVerifyButton());

    await waitFor(
      () => {
        // 2FA toggle never flipped.
        const sw = screen.getByRole("switch", {
          name: /authenticator app verification/i,
        });
        expect(sw).toHaveAttribute("aria-checked", "false");
        // Input was cleared after failure.
        expect(input).toHaveValue("");
        // Error surfaced inline.
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(/didn't work.*try again/i);
      },
      { timeout: 3000 },
    );

    expect(onChange).not.toHaveBeenCalled();
    // Because the input is now empty the submit button must be disabled again.
    expect(getVerifyButton()).toBeDisabled();
  });

  it("failed submission: after the input is cleared, re-typing a valid code re-enables submit", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.95);
    const { input, getVerifyButton } = openSetupPanelWith();

    fireEvent.change(input, { target: { value: "121212" } });
    await waitFor(() => expect(getVerifyButton()).not.toBeDisabled());
    fireEvent.click(getVerifyButton());

    // Wait for failure → input cleared.
    await waitFor(() => expect(input).toHaveValue(""), { timeout: 3000 });

    // Re-type a valid code and confirm submit is enabled once more.
    fireEvent.change(input, { target: { value: "555444" } });
    await waitFor(() => expect(getVerifyButton()).not.toBeDisabled());
  });
});

// ---------------------------------------------------------------------------
// 2FA setup flow — security properties
// ---------------------------------------------------------------------------

describe("SecurityTab — 2FA verification security", () => {
  it("never logs the actual verification code to console during a failed submit", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.95);
    const consoleSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => void 0);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => void 0);

    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    const submit = screen.getByRole("button", { name: /verify and enable/i });

    const secretCode = "773311";
    fireEvent.change(input, { target: { value: secretCode } });
    await waitFor(() => expect(submit).not.toBeDisabled());
    fireEvent.click(submit);

    await waitFor(
      () =>
        expect(screen.getByRole("alert")).toHaveTextContent(
          /didn't work.*try again/i,
        ),
      { timeout: 3000 },
    );

    const allLogged = [
      ...consoleSpy.mock.calls.flat(),
      ...consoleErrorSpy.mock.calls.flat(),
    ]
      .map(String)
      .join(" ");
    expect(allLogged).not.toContain(secretCode);
  });

  it("never logs the actual verification code to console during a successful submit", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.05);
    const consoleSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => void 0);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => void 0);

    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    const submit = screen.getByRole("button", { name: /verify and enable/i });

    const secretCode = "228844";
    fireEvent.change(input, { target: { value: secretCode } });
    await waitFor(() => expect(submit).not.toBeDisabled());
    fireEvent.click(submit);

    await waitFor(
      () =>
        expect(
          screen.getByText(/authenticator app verified/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    const allLogged = [
      ...consoleSpy.mock.calls.flat(),
      ...consoleErrorSpy.mock.calls.flat(),
    ]
      .map(String)
      .join(" ");
    expect(allLogged).not.toContain(secretCode);
  });

  it("server error text does not include the user's previously typed code even when it matches a 'too long' description", () => {
    // Regression: ensure no leaked code fragment in error text.
    const err = getVerificationCodeError("12345678");
    expect(err).not.toContain("12345678");
    expect(err).not.toContain("12345");
  });
});

// ---------------------------------------------------------------------------
// API key management
// ---------------------------------------------------------------------------

describe("SecurityTab - API key management", () => {
  const getApiKeyNameInput = () => screen.getByLabelText(/key name/i);
  const getCreateKeyButton = () =>
    screen.getByRole("button", { name: /create key/i });

  it("renders seeded API keys with name, creation date, and last-used timestamp", () => {
    render(<SecurityTab />);

    expect(screen.getByText("API keys")).toBeInTheDocument();
    expect(screen.getByText("Mobile payouts service")).toBeInTheDocument();
    expect(screen.getByText("Reporting sync")).toBeInTheDocument();
    expect(screen.getByText("Jul 12, 2026")).toBeInTheDocument();
    expect(screen.getByText("Jun 28, 2026")).toBeInTheDocument();
    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
    expect(screen.getAllByText("Never used").length).toBeGreaterThan(0);
  });

  it("requires a recognizable key name before creation", () => {
    render(<SecurityTab />);

    expect(getCreateKeyButton()).toBeDisabled();

    fireEvent.change(getApiKeyNameInput(), { target: { value: "Go" } });
    expect(getCreateKeyButton()).toBeDisabled();

    fireEvent.submit(screen.getByRole("form", { name: /create api key/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/at least 3/i);
  });

  it("creates a key, shows a loading state, and reveals the raw secret once", async () => {
    render(<SecurityTab />);

    fireEvent.change(getApiKeyNameInput(), {
      target: { value: "Billing export worker" },
    });
    fireEvent.click(getCreateKeyButton());

    expect(screen.getByText(/creating\.\.\./i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Billing export worker")).toBeInTheDocument(),
    );

    expect(screen.getByText(/api key created/i)).toBeInTheDocument();
    expect(screen.getByText(/^sk_live_billing_expo_/)).toBeInTheDocument();
    expect(screen.getByText(/it will not be shown again/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hide secret/i }));
    expect(
      screen.queryByText(/^sk_live_billing_expo_/),
    ).not.toBeInTheDocument();
  });

  it("copies the newly revealed raw secret to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<SecurityTab />);

    fireEvent.change(getApiKeyNameInput(), {
      target: { value: "Warehouse importer" },
    });
    fireEvent.click(getCreateKeyButton());

    await waitFor(() =>
      expect(screen.getByText(/^sk_live_warehouse_im_/)).toBeInTheDocument(),
    );
    const secret = screen.getByText(/^sk_live_warehouse_im_/).textContent ?? "";

    fireEvent.click(
      screen.getByRole("button", {
        name: /copy raw api key for warehouse importer/i,
      }),
    );

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(secret));
    expect(screen.getByText("Copied")).toBeInTheDocument();
  });

  it("surfaces clipboard failures without hiding the one-time secret", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    });

    render(<SecurityTab />);
    fireEvent.change(getApiKeyNameInput(), { target: { value: "ERP sync" } });
    fireEvent.click(getCreateKeyButton());

    await waitFor(() =>
      expect(screen.getByText(/^sk_live_erp_sync_/)).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /copy raw api key for erp sync/i }),
    );

    await waitFor(() => expect(screen.getByText("Failed")).toBeInTheDocument());
    expect(screen.getByText(/^sk_live_erp_sync_/)).toBeInTheDocument();
  });

  it("rotates a key only after destructive confirmation and reveals the replacement secret", async () => {
    render(<SecurityTab />);

    fireEvent.click(screen.getAllByRole("button", { name: /^rotate$/i })[0]);
    const confirmButton = screen.getByRole("button", { name: /rotate key/i });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Type "ROTATE" to continue'), {
      target: { value: "ROTATE" },
    });
    fireEvent.click(confirmButton);

    await waitFor(() =>
      expect(screen.getByText(/api key rotated/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/^sk_live_mobile_payou_/)).toBeInTheDocument();
    expect(screen.getAllByText("Just now").length).toBeGreaterThan(0);
  });

  it("revokes keys only after destructive confirmation and shows the empty state", async () => {
    render(<SecurityTab />);

    for (const keyName of ["Mobile payouts service", "Reporting sync"]) {
      fireEvent.click(screen.getAllByRole("button", { name: /^revoke$/i })[0]);
      fireEvent.change(screen.getByLabelText('Type "REVOKE" to continue'), {
        target: { value: "REVOKE" },
      });
      fireEvent.click(screen.getByRole("button", { name: /revoke key/i }));

      await waitFor(() =>
        expect(screen.queryByText(keyName)).not.toBeInTheDocument(),
      );
    }

    expect(screen.getByText("0 active")).toBeInTheDocument();
    expect(screen.getByText(/no active api keys/i)).toBeInTheDocument();
  });
});

describe("SecurityTab - createApiKeySecret helper", () => {
  it("normalizes long integration names without exposing whitespace", () => {
    const secret = createApiKeySecret("  Finance Partner Export Job  ");

    expect(secret).toMatch(/^sk_live_finance_part_/);
    expect(secret).not.toContain(" ");
  });
});

// ---------------------------------------------------------------------------
// Backup codes (recovery codes) — unit tests for helpers
// ---------------------------------------------------------------------------

describe("SecurityTab — generateBackupCodes helper", () => {
  it("returns the default count of codes when no argument is passed", () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(BACKUP_CODE_COUNT);
  });

  it("returns the requested number of codes", () => {
    expect(generateBackupCodes(8)).toHaveLength(8);
    expect(generateBackupCodes(10)).toHaveLength(10);
  });

  it("each code matches the XXXXX-XXXXX format", () => {
    const codes = generateBackupCodes(20);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z0-9]{5}-[A-Z0-9]{5}$/);
    }
  });

  it("all codes within a set are unique", () => {
    const codes = generateBackupCodes(10);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("does not contain lowercase letters", () => {
    const codes = generateBackupCodes(10);
    const all = codes.join("");
    expect(all).toEqual(all.toUpperCase());
  });
});

describe("SecurityTab — formatBackupCodesFile helper", () => {
  it("includes a descriptive header with guidance text", () => {
    const result = formatBackupCodesFile(["ABCDE-12345", "FGHIJ-67890"]);
    expect(result).toContain("StelloPay two-factor backup codes");
    expect(result).toContain("Store them somewhere safe and private");
  });

  it("includes each code prefixed by its 1-based index", () => {
    const codes = ["ABCDE-12345", "FGHIJ-67890"];
    const result = formatBackupCodesFile(codes);
    expect(result).toContain("1. ABCDE-12345");
    expect(result).toContain("2. FGHIJ-67890");
  });

  it("ends with a trailing newline", () => {
    const result = formatBackupCodesFile(["ABCDE-12345"]);
    expect(result.endsWith("\n")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Backup codes — UI display after 2FA setup
// ---------------------------------------------------------------------------

describe("SecurityTab — backup codes panel", () => {
  /**
   * Opens the 2FA setup panel, types a valid code, and submits it
   * successfully, which triggers backup codes generation.
   */
  async function enableTwoFactorAndGetBackupCodes() {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    const verifyButton = screen.getByRole("button", { name: /verify and enable/i });
    await waitFor(() => expect(verifyButton).not.toBeDisabled());
    fireEvent.click(verifyButton);

    // Wait for success banner (2FA enabled + backup codes generated).
    await waitFor(
      () =>
        expect(
          screen.getByText(/authenticator app verified/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    return { screen };
  }

  it("shows the backup codes panel after successful 2FA setup", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    const verifyButton = screen.getByRole("button", { name: /verify and enable/i });
    await waitFor(() => expect(verifyButton).not.toBeDisabled());
    fireEvent.click(verifyButton);

    await waitFor(
      () =>
        expect(
          screen.getByText(/authenticator app verified/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    expect(
      screen.getByRole("region", { name: /two-factor backup codes/i }),
    ).toBeInTheDocument();
  });

  it("renders the correct number of backup codes in the panel", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    const verifyButton = screen.getByRole("button", { name: /verify and enable/i });
    await waitFor(() => expect(verifyButton).not.toBeDisabled());
    fireEvent.click(verifyButton);

    await waitFor(
      () =>
        expect(
          screen.getByText(/authenticator app verified/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    const codeItems = screen.getAllByRole("listitem");
    expect(codeItems).toHaveLength(BACKUP_CODE_COUNT);
  });

  it("each visible code matches the XXXXX-XXXXX format", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    const verifyButton = screen.getByRole("button", { name: /verify and enable/i });
    await waitFor(() => expect(verifyButton).not.toBeDisabled());
    fireEvent.click(verifyButton);

    await waitFor(
      () =>
        expect(
          screen.getByText(/authenticator app verified/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    const codeItems = screen.getAllByRole("listitem");
    for (const item of codeItems) {
      expect(item.textContent).toMatch(/^[A-Z0-9]{5}-[A-Z0-9]{5}$/);
    }
  });

  it("copy all button copies codes to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    const verifyButton = screen.getByRole("button", { name: /verify and enable/i });
    await waitFor(() => expect(verifyButton).not.toBeDisabled());
    fireEvent.click(verifyButton);

    await waitFor(
      () =>
        expect(
          screen.getByText(/authenticator app verified/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    fireEvent.click(
      screen.getByRole("button", { name: /copy all backup codes/i }),
    );

    await waitFor(() => expect(screen.getByText("Copied")).toBeInTheDocument());
    // Should have written to clipboard (joined with newlines).
    expect(writeText.mock.calls[0][0]).toContain("-");
    expect(writeText.mock.calls[0][0]).toContain("\n");
  });

  it("download button triggers a file download", async () => {
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    const verifyButton = screen.getByRole("button", { name: /verify and enable/i });
    await waitFor(() => expect(verifyButton).not.toBeDisabled());
    fireEvent.click(verifyButton);

    await waitFor(
      () =>
        expect(
          screen.getByText(/authenticator app verified/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    const linkClick = vi.fn();
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(
      (tagName, options) => {
        const el = originalCreateElement(tagName, options);
        if (tagName === "a") {
          el.click = linkClick;
        }
        return el;
      },
    );
    vi.spyOn(document.body, "appendChild").mockImplementation(appendChild);
    vi.spyOn(document.body, "removeChild").mockImplementation(removeChild);

    fireEvent.click(
      screen.getByRole("button", { name: /download backup codes/i }),
    );

    expect(createObjectURL).toHaveBeenCalled();
    expect(appendChild).toHaveBeenCalled();
    expect(linkClick).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it("dismiss button hides the backup codes panel", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    const verifyButton = screen.getByRole("button", { name: /verify and enable/i });
    await waitFor(() => expect(verifyButton).not.toBeDisabled());
    fireEvent.click(verifyButton);

    await waitFor(
      () =>
        expect(
          screen.getByText(/authenticator app verified/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    expect(
      screen.getByRole("region", { name: /two-factor backup codes/i }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /i've saved these codes/i }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: /two-factor backup codes/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("backup codes region has proper ARIA attributes", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    const verifyButton = screen.getByRole("button", { name: /verify and enable/i });
    await waitFor(() => expect(verifyButton).not.toBeDisabled());
    fireEvent.click(verifyButton);

    await waitFor(
      () =>
        expect(
          screen.getByText(/authenticator app verified/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    const region = screen.getByRole("region", {
      name: /two-factor backup codes/i,
    });
    expect(region).toBeInTheDocument();

    const list = screen.getByRole("list", { name: /your backup codes/i });
    expect(list).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Backup codes — regeneration flow
// ---------------------------------------------------------------------------

describe("SecurityTab — backup codes regeneration", () => {
  function renderWith2FAEnabled() {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab twoFactorEnabled={true} />);
    return { screen };
  }

  it("shows the backup codes management section when 2FA is enabled and no codes are displayed", () => {
    render(<SecurityTab twoFactorEnabled={true} />);
    expect(screen.getByText("Backup codes")).toBeInTheDocument();
    expect(
      screen.getByText(/generate backup codes to recover access/i),
    ).toBeInTheDocument();
  });

  it("regeneration button opens destructive confirmation dialog", () => {
    render(<SecurityTab twoFactorEnabled={true} />);
    const regenerateButton = screen.getByRole("button", {
      name: /^regenerate$/i,
    });
    fireEvent.click(regenerateButton);

    expect(
      screen.getByText(/this will invalidate all previously generated backup codes/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /regenerate codes/i }),
    ).toBeDisabled();
  });

  it("requires exact REGENERATE token to confirm", () => {
    render(<SecurityTab twoFactorEnabled={true} />);
    fireEvent.click(screen.getByRole("button", { name: /^regenerate$/i }));

    const confirmButton = screen.getByRole("button", {
      name: /regenerate codes/i,
    });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(
      screen.getByLabelText(/type "REGENERATE" to continue/i),
      { target: { value: "REGENERATE" } },
    );

    expect(confirmButton).not.toBeDisabled();
  });

  it("shows the backup codes panel after successful regeneration", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab twoFactorEnabled={true} />);

    fireEvent.click(screen.getByRole("button", { name: /^regenerate$/i }));

    fireEvent.change(
      screen.getByLabelText(/type "REGENERATE" to continue/i),
      { target: { value: "REGENERATE" } },
    );

    fireEvent.click(screen.getByRole("button", { name: /regenerate codes/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("region", { name: /two-factor backup codes/i }),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByText(/new backup codes generated/i),
    ).toBeInTheDocument();
  });

  it("does not show the backup codes section when 2FA is disabled", () => {
    render(<SecurityTab twoFactorEnabled={false} />);
    expect(screen.queryByText(/generate backup codes to recover access/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Backup codes — security properties
// ---------------------------------------------------------------------------

describe("SecurityTab — backup codes security", () => {
  it("does not leak backup codes into console.log or console.error", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const consoleLogSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => void 0);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => void 0);

    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    const verifyButton = screen.getByRole("button", { name: /verify and enable/i });
    await waitFor(() => expect(verifyButton).not.toBeDisabled());
    fireEvent.click(verifyButton);

    await waitFor(
      () =>
        expect(
          screen.getByText(/authenticator app verified/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    const codeItems = screen.getAllByRole("listitem");
    const codeTexts = codeItems.map((item) => item.textContent ?? "");

    const allLogs = [
      ...consoleLogSpy.mock.calls.flat(),
      ...consoleErrorSpy.mock.calls.flat(),
    ]
      .map(String)
      .join(" ");

    for (const code of codeTexts) {
      expect(allLogs).not.toContain(code);
    }
  });

  it("does not include raw codes in status messages", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<SecurityTab twoFactorEnabled={false} />);
    const sw = screen.getByRole("switch", {
      name: /authenticator app verification/i,
    });
    fireEvent.click(sw);
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    const verifyButton = screen.getByRole("button", { name: /verify and enable/i });
    await waitFor(() => expect(verifyButton).not.toBeDisabled());
    fireEvent.click(verifyButton);

    await waitFor(
      () =>
        expect(
          screen.getByText(/authenticator app verified/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );

    const codeItems = screen.getAllByRole("listitem");
    const codeTexts = codeItems.map((item) => item.textContent ?? "");

    const body = document.body.textContent ?? "";

    // The codes themselves are in the body (they're rendered).
    // But the status message should not contain any code fragment.
    const statusElements = screen.getAllByRole("status");
    for (const el of statusElements) {
      for (const code of codeTexts) {
        expect(el.textContent).not.toContain(code);
      }
    }
  });
});
