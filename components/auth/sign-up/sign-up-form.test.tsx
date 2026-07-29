import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SignUpForm } from "./sign-up-form";

// Mock ResizeObserver which is needed by Radix UI
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

/**
 * Fill all visible form fields with valid data using fireEvent (synchronous,
 * compatible with vi.useFakeTimers) and submit the form.
 */
function fillVisibleFields() {
  fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), {
    target: { value: "Jane Doe" },
  });
  fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), {
    target: { value: "jane@example.com" },
  });

  const passwords = screen.getAllByPlaceholderText(/password/i);
  fireEvent.change(passwords[0], { target: { value: "StrongPass1!" } });
  fireEvent.change(passwords[1], { target: { value: "StrongPass1!" } });

  fireEvent.click(screen.getByRole("checkbox"));
}

/**
 * Fill the honeypot input (used by tests that simulate bot behaviour).
 */
function fillHoneypot(value: string) {
  const container = document.querySelector(
    'input[name="website"]',
  ) as HTMLInputElement | null;
  if (container) {
    fireEvent.change(container, { target: { value } });
  }
}

describe("SignUpForm — bot mitigation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Honeypot field presence and accessibility ───────────────────

  it("renders a visually hidden honeypot text input in the DOM", () => {
    const { container } = render(<SignUpForm />);
    const honeypotInput = container.querySelector(
      'input[name="website"]',
    ) as HTMLInputElement | null;
    expect(honeypotInput).not.toBeNull();
    expect(honeypotInput!.type).toBe("text");
    // Must NOT be display:none or type=hidden, otherwise smart bots ignore it
    expect(honeypotInput!.type).not.toBe("hidden");
  });

  it("is excluded from the accessibility tree via aria-hidden on the wrapper", () => {
    render(<SignUpForm />);
    // The honeypot should NOT be findable by role queries because the
    // parent div has aria-hidden=true, which removes it from the
    // accessibility tree entirely.
    expect(
      screen.queryByRole("textbox", { name: /website/i }),
    ).not.toBeInTheDocument();
  });

  it("excludes the honeypot from the tab order", () => {
    const { container } = render(<SignUpForm />);
    const honeypotInput = container.querySelector(
      'input[name="website"]',
    ) as HTMLInputElement | null;
    expect(honeypotInput).not.toBeNull();
    expect(honeypotInput).toHaveAttribute("tabIndex", "-1");
  });

  it("disables autocomplete on the honeypot to prevent accidental browser filling", () => {
    const { container } = render(<SignUpForm />);
    const honeypotInput = container.querySelector(
      'input[name="website"]',
    ) as HTMLInputElement | null;
    expect(honeypotInput).toHaveAttribute("autoComplete", "off");
  });

  it("honeypot field has a deceptive name attribute that bots recognise", () => {
    const { container } = render(<SignUpForm />);
    const honeypotInput = container.querySelector(
      'input[name="website"]',
    ) as HTMLInputElement | null;
    expect(honeypotInput).not.toBeNull();
  });

  it("honeypot wrapper div is present and has aria-hidden=true", () => {
    const { container } = render(<SignUpForm />);
    const honeypotInput = container.querySelector(
      'input[name="website"]',
    ) as HTMLInputElement | null;
    const wrapper = honeypotInput?.closest("[aria-hidden=true]");
    expect(wrapper).not.toBeNull();
  });

  // ─── Honeypot submission guard ──────────────────────────────────

  it("silently blocks submission when the honeypot field is filled (simulated bot)", async () => {
    render(<SignUpForm />);

    fillVisibleFields();
    fillHoneypot("spam-site.com");

    // Advance past the minimum-time guard so we only test the honeypot
    vi.advanceTimersByTime(4_000);

    await userEvent.click(
      screen.getByRole("button", { name: /Create Account/i }),
    );
    await tick();

    // The email modal must NOT appear — the submission is silently discarded
    expect(
      screen.queryByRole("heading", { name: /check your email/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  /** Helper: wait for fake timers to process any pending micro-tasks. */
  async function tick(ms = 0) {
    await vi.advanceTimersByTimeAsync(ms);
  }

  it("silently blocks submission when the honeypot contains only whitespace", async () => {
    render(<SignUpForm />);

    fillVisibleFields();
    fillHoneypot("   ");

    vi.advanceTimersByTime(4_000);
    await userEvent.click(
      screen.getByRole("button", { name: /Create Account/i }),
    );
    await tick();

    expect(
      screen.queryByRole("heading", { name: /check your email/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // ─── Minimum-time guard ─────────────────────────────────────────

  it("silently blocks submission when completed faster than the minimum time", async () => {
    render(<SignUpForm />);

    fillVisibleFields();
    // Only 500ms elapsed — well below the 3s minimum
    vi.advanceTimersByTime(500);

    await userEvent.click(
      screen.getByRole("button", { name: /Create Account/i }),
    );
    await tick();

    expect(
      screen.queryByRole("heading", { name: /check your email/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("blocks submission at exactly MINIMUM_FORM_TIME_MS minus 1 (boundary)", async () => {
    render(<SignUpForm />);

    fillVisibleFields();
    vi.advanceTimersByTime(2_999);

    await userEvent.click(
      screen.getByRole("button", { name: /Create Account/i }),
    );
    await tick();

    expect(
      screen.queryByRole("heading", { name: /check your email/i }),
    ).not.toBeInTheDocument();
  });

  it("allows submission at exactly MINIMUM_FORM_TIME_MS (boundary)", async () => {
    render(<SignUpForm />);

    fillVisibleFields();
    vi.advanceTimersByTime(3_000);

    await userEvent.click(
      screen.getByRole("button", { name: /Create Account/i }),
    );
    await tick();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /check your email/i }),
      ).toBeInTheDocument();
    });
  });

  // ─── Happy path (both guards pass) ──────────────────────────────

  it("allows submission when honeypot is empty and enough time has elapsed", async () => {
    render(<SignUpForm />);

    fillVisibleFields();
    vi.advanceTimersByTime(4_000);

    await userEvent.click(
      screen.getByRole("button", { name: /Create Account/i }),
    );
    await tick();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /check your email/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  // ─── Stealth: no error feedback when blocked ────────────────────

  it("does not render any error alert or dialog when submission is blocked", async () => {
    render(<SignUpForm />);

    fillVisibleFields();
    fillHoneypot("spam");
    vi.advanceTimersByTime(4_000);

    await userEvent.click(
      screen.getByRole("button", { name: /Create Account/i }),
    );
    await tick();

    // No dialog or heading should appear — the block is stealthy
    expect(
      screen.queryByRole("heading", { name: /check your email/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
