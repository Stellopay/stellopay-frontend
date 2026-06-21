import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SecurityTab from "@/app/settings/preferences/components/security-tab";

describe("SecurityTab password change form", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows inline errors for weak passwords", async () => {
    render(<SecurityTab />);

    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "Current1!" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "weak" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "weak" },
    });
    fireEvent.blur(screen.getByLabelText("New password"));

    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeDisabled();
  });

  it("surfaces a confirm-password mismatch error", async () => {
    render(<SecurityTab />);

    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "Current1!" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "Newpass1!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "Different1!" },
    });
    fireEvent.blur(screen.getByLabelText("Confirm password"));

    expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeDisabled();
  });

  it("submits a valid password change and never logs password values", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<SecurityTab />);

    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "Current1!" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "Newpass1!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "Newpass1!" },
    });

    const button = await screen.findByRole("button", {
      name: /update password/i,
    });
    expect(button).toBeEnabled();

    fireEvent.click(button);

    await waitFor(
      () => {
        expect(
          screen.getByText(/password policy satisfied/i),
        ).toBeInTheDocument();
      },
      { timeout: 2500 },
    );
    expect(consoleLog).not.toHaveBeenCalled();
  });
});
