/**
 * Unit tests for Footer (components/common/footer.tsx).
 *
 * Pins the behaviour issue #1264 asks to harden:
 *
 *  1. Newsletter email validation gate — malformed, empty and oversized
 *     input is rejected with a typed error; rejection happens before any
 *     state is written (the field is never cleared, isSubmitting never
 *     flips); the caller can tell why via `error.code`; valid input is
 *     unaffected and still runs the existing submit flow.
 *  2. The cookie consent banner and static footer content, which had no
 *     coverage at all.
 */

import type { ImgHTMLAttributes } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";

import Footer, {
  NEWSLETTER_EMAIL_MAX_LENGTH,
  validateNewsletterEmail,
  type NewsletterEmailErrorCode,
} from "./footer";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

const CONSENT_KEY = "stellopay.cookie-consent";

/** Asserts the input is rejected and returns its typed error code. */
function rejectionCode(value: unknown): NewsletterEmailErrorCode {
  const result = validateNewsletterEmail(value);
  if (result.valid) {
    throw new Error(
      `expected ${JSON.stringify(value) ?? String(value)} to be rejected`,
    );
  }
  expect(result.error.message.length).toBeGreaterThan(0);
  return result.error.code;
}

function getNewsletterInput(): HTMLInputElement {
  return screen.getByPlaceholderText(
    messages.footer.newsletter.placeholder,
  ) as HTMLInputElement;
}

function getNewsletterForm(): HTMLFormElement {
  const form = getNewsletterInput().closest("form");
  if (!form) throw new Error("newsletter form not found");
  return form;
}

function idleSubmitButton(): HTMLButtonElement {
  return screen.getByRole("button", {
    name: messages.footer.newsletter.subscribe,
  }) as HTMLButtonElement;
}

/** Types into the newsletter input and submits the form. */
function submitEmail(value: string): void {
  fireEvent.change(getNewsletterInput(), { target: { value } });
  fireEvent.submit(getNewsletterForm());
}

describe("validateNewsletterEmail — typed rejections", () => {
  it("rejects an empty string with EMAIL_EMPTY", () => {
    expect(rejectionCode("")).toBe("EMAIL_EMPTY");
  });

  it("rejects whitespace-only input with EMAIL_EMPTY", () => {
    expect(rejectionCode("    \n  ")).toBe("EMAIL_EMPTY");
  });

  it("rejects null and undefined with EMAIL_EMPTY", () => {
    expect(rejectionCode(null)).toBe("EMAIL_EMPTY");
    expect(rejectionCode(undefined)).toBe("EMAIL_EMPTY");
  });

  it("rejects non-string values with EMAIL_MALFORMED", () => {
    expect(rejectionCode(42)).toBe("EMAIL_MALFORMED");
    expect(rejectionCode({})).toBe("EMAIL_MALFORMED");
    expect(rejectionCode(true)).toBe("EMAIL_MALFORMED");
  });

  it.each([
    ["plain text", "not-an-email"],
    ["missing TLD", "user@domain"],
    ["double at-sign", "user@@example.com"],
    ["space in address", "two words@example.com"],
    ["missing domain", "user@.com"],
  ])("rejects %s with EMAIL_MALFORMED", (_label, value) => {
    expect(rejectionCode(value)).toBe("EMAIL_MALFORMED");
  });

  it("rejects an address over the limit with EMAIL_OVERSIZED", () => {
    const oversized = `${"a".repeat(201)}@${"b".repeat(49)}.com`;
    expect(oversized.length).toBe(NEWSLETTER_EMAIL_MAX_LENGTH + 1);
    expect(rejectionCode(oversized)).toBe("EMAIL_OVERSIZED");
  });

  it("checks size before shape: oversized garbage reports EMAIL_OVERSIZED, not EMAIL_MALFORMED", () => {
    expect(rejectionCode("x".repeat(300))).toBe("EMAIL_OVERSIZED");
  });

  it("gives each failure reason a distinct code so the caller can tell them apart", () => {
    const empty = rejectionCode("");
    const malformed = rejectionCode("not-an-email");
    const oversized = rejectionCode("x".repeat(NEWSLETTER_EMAIL_MAX_LENGTH + 1));

    expect(new Set([empty, malformed, oversized]).size).toBe(3);
  });

  it("returns a typed error object carrying code and message", () => {
    const result = validateNewsletterEmail("not-an-email");

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.code).toBe("EMAIL_MALFORMED");
      expect(typeof result.error.message).toBe("string");
      expect(result.error.message).not.toBe("");
    }
  });

  it("states the length limit in the oversized message", () => {
    const result = validateNewsletterEmail("x".repeat(NEWSLETTER_EMAIL_MAX_LENGTH + 1));

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.message).toContain(String(NEWSLETTER_EMAIL_MAX_LENGTH));
    }
  });
});

describe("validateNewsletterEmail — valid input is unaffected", () => {
  it("accepts a plain address", () => {
    expect(validateNewsletterEmail("user@example.com")).toEqual({
      valid: true,
    });
  });

  it("accepts an address padded with surrounding whitespace", () => {
    expect(validateNewsletterEmail("  user@example.com  ")).toEqual({
      valid: true,
    });
  });

  it("accepts an address exactly at the length limit (boundary)", () => {
    const atLimit = `${"a".repeat(200)}@${"b".repeat(49)}.com`;
    expect(atLimit.length).toBe(NEWSLETTER_EMAIL_MAX_LENGTH);
    expect(validateNewsletterEmail(atLimit)).toEqual({ valid: true });
  });

  it("returns no error payload on success", () => {
    const result = validateNewsletterEmail("user@example.com");
    expect(result).not.toHaveProperty("error");
  });
});

describe("Footer — newsletter submission gate (#1264)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Hide the consent banner so these tests only exercise the form.
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects an empty submit without writing any state", () => {
    render(<Footer />);

    fireEvent.submit(getNewsletterForm());

    // isSubmitting never flipped (label + enabled state unchanged) and the
    // field was never cleared.
    expect(idleSubmitButton()).not.toBeDisabled();

    vi.advanceTimersByTime(1000);

    expect(getNewsletterInput()).toHaveValue("");
    expect(idleSubmitButton()).not.toBeDisabled();
    expect(idleSubmitButton()).toHaveTextContent(
      messages.footer.newsletter.subscribe,
    );
  });

  it("rejects a malformed address before any state is written", () => {
    render(<Footer />);

    submitEmail("not-an-email");

    // Rejected input is left untouched so the user can correct it.
    expect(getNewsletterInput()).toHaveValue("not-an-email");
    expect(idleSubmitButton()).not.toBeDisabled();
    expect(idleSubmitButton()).toHaveTextContent(
      messages.footer.newsletter.subscribe,
    );

    vi.advanceTimersByTime(1000);

    // Still no submission pipeline started after the delay would have run.
    expect(getNewsletterInput()).toHaveValue("not-an-email");
    expect(idleSubmitButton()).not.toBeDisabled();
  });

  it("rejects an oversized address before any state is written", () => {
    render(<Footer />);
    const oversized = `${"a".repeat(201)}@${"b".repeat(49)}.com`;

    submitEmail(oversized);

    expect(getNewsletterInput()).toHaveValue(oversized);
    expect(idleSubmitButton()).not.toBeDisabled();

    vi.advanceTimersByTime(1000);

    expect(getNewsletterInput()).toHaveValue(oversized);
    expect(idleSubmitButton()).not.toBeDisabled();
    expect(idleSubmitButton()).toHaveTextContent(
      messages.footer.newsletter.subscribe,
    );
  });

  it("runs the existing submit flow for valid input (unchanged behaviour)", async () => {
    render(<Footer />);

    submitEmail("user@example.com");

    // Submission started: button shows the pending label and is disabled.
    const pendingButton = screen.getByRole("button", {
      name: messages.footer.newsletter.subscribing,
    });
    expect(pendingButton).toBeDisabled();
    // Field stays populated while the submission is in flight.
    expect(getNewsletterInput()).toHaveValue("user@example.com");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // On completion the field clears and the button returns to idle.
    expect(getNewsletterInput()).toHaveValue("");
    expect(idleSubmitButton()).not.toBeDisabled();
    expect(idleSubmitButton()).toHaveTextContent(
      messages.footer.newsletter.subscribe,
    );
  });
});

describe("Footer — cookie consent banner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the banner when no consent is stored", async () => {
    render(<Footer />);

    await waitFor(() => {
      expect(screen.getByTestId("cookie-consent-banner")).toBeInTheDocument();
    });
  });

  it("hides the banner and persists 'accepted' when Accept is clicked", async () => {
    render(<Footer />);
    await waitFor(() => {
      expect(screen.getByTestId("cookie-consent-banner")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("cookie-consent-accept"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("cookie-consent-banner"),
      ).not.toBeInTheDocument();
    });
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe("accepted");
  });

  it("hides the banner and persists 'rejected' when Reject is clicked", async () => {
    render(<Footer />);
    await waitFor(() => {
      expect(screen.getByTestId("cookie-consent-banner")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("cookie-consent-reject"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("cookie-consent-banner"),
      ).not.toBeInTheDocument();
    });
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe("rejected");
  });

  it("dismisses the banner without writing consent when the close button is clicked", async () => {
    render(<Footer />);
    await waitFor(() => {
      expect(screen.getByTestId("cookie-consent-banner")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("cookie-consent-close"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("cookie-consent-banner"),
      ).not.toBeInTheDocument();
    });
    expect(window.localStorage.getItem(CONSENT_KEY)).toBeNull();
  });

  it("does not show the banner when consent was already stored", () => {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    render(<Footer />);

    expect(
      screen.queryByTestId("cookie-consent-banner"),
    ).not.toBeInTheDocument();
  });
});

describe("Footer — static content", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(CONSENT_KEY, "accepted");
  });

  it("renders the newsletter section from messages", () => {
    render(<Footer />);

    expect(
      screen.getByText(messages.footer.newsletter.heading),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.footer.newsletter.description),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(messages.footer.newsletter.placeholder),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.footer.newsletter.subscribe }),
    ).toBeInTheDocument();
  });

  it("renders every footer link category with its links", () => {
    render(<Footer />);

    expect(screen.getByText(messages.footer.categories.product)).toBeInTheDocument();
    expect(screen.getByText(messages.footer.categories.company)).toBeInTheDocument();
    expect(screen.getByText(messages.footer.categories.resources)).toBeInTheDocument();
    expect(screen.getByText(messages.footer.categories.legal)).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: messages.footer.links.pricing }),
    ).toHaveAttribute("href", "#Pricing");
    expect(
      screen.getByRole("link", { name: messages.footer.links.privacy }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: messages.footer.links.documentation }),
    ).toHaveAttribute("href", "/docs");
  });

  it("renders social links with safe external attributes", () => {
    render(<Footer />);

    const expected = [
      [messages.footer.socialLinks.twitter, "https://twitter.com/stellopay"],
      [
        messages.footer.socialLinks.linkedIn,
        "https://linkedin.com/company/stellopay",
      ],
      [messages.footer.socialLinks.gitHub, "https://github.com/stellopay"],
      [messages.footer.socialLinks.email, "mailto:contact@stellopay.com"],
    ] as const;

    for (const [label, href] of expected) {
      const link = screen.getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("renders the bottom bar legal links", () => {
    render(<Footer />);

    expect(
      screen.getByRole("link", { name: messages.footer.bottomBar.privacyPolicy }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: messages.footer.bottomBar.termsOfService }),
    ).toHaveAttribute("href", "/terms");
    // "Cookie Policy" appears in both the nav column and the bottom bar;
    // every instance must point at /cookies.
    expect(
      screen.getAllByRole("link", {
        name: messages.footer.bottomBar.cookiePolicy,
      }).length,
    ).toBeGreaterThan(0);
    for (const link of screen.getAllByRole("link", {
      name: messages.footer.bottomBar.cookiePolicy,
    })) {
      expect(link).toHaveAttribute("href", "/cookies");
    }
  });

  it("links the logo back to the home page", () => {
    render(<Footer />);

    expect(
      screen.getByRole("link", { name: /stellopay/i }),
    ).toHaveAttribute("href", "/");
  });
});
