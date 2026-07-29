import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AccountSection, {
  AVATAR_CROP_OUTPUT_SIZE,
  AVATAR_PAN_KEYBOARD_STEP,
  AVATAR_ZOOM_MAX,
  AVATAR_ZOOM_MIN,
} from "./account-section";

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

vi.mock("@/components/ui/form", () => ({
  FormMessage: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <p className={className}>{children}</p>,
}));

const getEmailInput = () => screen.getByLabelText("Email address");
const getSaveButton = () =>
  screen.getByRole("button", { name: /save account changes/i });

function openAvatarDialog() {
  render(<AccountSection />);
  fireEvent.click(screen.getByRole("button", { name: /change photo/i }));
}

function uploadAvatar(
  file = new File(["avatar"], "avatar.png", { type: "image/png" }),
) {
  fireEvent.change(screen.getByLabelText("Photo"), {
    target: { files: [file] },
  });
}

describe("AccountSection avatar crop controls", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:avatar-preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the crop dialog with upload guidance and fixed square output copy", () => {
    openAvatarDialog();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Crop profile photo")).toBeInTheDocument();
    expect(
      screen.getByText(
        `Output is saved as a fixed square crop at ${AVATAR_CROP_OUTPUT_SIZE} x ${AVATAR_CROP_OUTPUT_SIZE}.`,
      ),
    ).toBeInTheDocument();
  });

  it("disables crop controls until an image is uploaded", () => {
    openAvatarDialog();

    expect(screen.getByLabelText("Zoom")).toBeDisabled();
    expect(screen.getByRole("button", { name: /zoom in/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /pan left/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /rotate right/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /save cropped photo/i }),
    ).toBeDisabled();
  });

  it("rejects non-image uploads with an accessible error", () => {
    openAvatarDialog();
    uploadAvatar(new File(["notes"], "notes.txt", { type: "text/plain" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/choose an image/i);
    expect(screen.getByLabelText("Photo")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("uploads an image and enables zoom, pan, rotate, and save controls", () => {
    openAvatarDialog();
    uploadAvatar();

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(
      screen.getByAltText(/crop preview for avatar.png/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /zoom in/i })).not.toBeDisabled();
    expect(
      screen.getByRole("button", { name: /pan right/i }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole("button", { name: /rotate right/i }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole("button", { name: /save cropped photo/i }),
    ).not.toBeDisabled();
  });

  it("supports zoom with both buttons and the keyboard-operable range input", () => {
    openAvatarDialog();
    uploadAvatar();

    const zoom = screen.getByLabelText("Zoom");
    expect(zoom).toHaveValue(String(AVATAR_ZOOM_MIN));

    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    expect(zoom).toHaveValue("1.1");

    fireEvent.change(zoom, { target: { value: "2.4" } });
    expect(screen.getByText("240%")).toBeInTheDocument();

    fireEvent.change(zoom, { target: { value: String(AVATAR_ZOOM_MAX) } });
    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    expect(zoom).toHaveValue(String(AVATAR_ZOOM_MAX));
  });

  it("supports keyboard and button panning while keeping values bounded", () => {
    openAvatarDialog();
    uploadAvatar();

    const preview = screen.getByTestId("avatar-crop-preview");

    fireEvent.keyDown(preview, { key: "ArrowRight" });
    expect(
      screen.getByText(`${AVATAR_PAN_KEYBOARD_STEP}px`),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /pan down/i }));
    expect(screen.getAllByText(`${AVATAR_PAN_KEYBOARD_STEP}px`)).toHaveLength(
      2,
    );

    fireEvent.keyDown(preview, { key: "ArrowLeft", shiftKey: true });
    expect(
      screen.getByText(`-${AVATAR_PAN_KEYBOARD_STEP}px`),
    ).toBeInTheDocument();
  });

  it("supports pointer dragging to pan the crop image", () => {
    openAvatarDialog();
    uploadAvatar();

    const preview = screen.getByTestId("avatar-crop-preview");
    preview.setPointerCapture = vi.fn();

    fireEvent.pointerDown(preview, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(preview, {
      pointerId: 1,
      clientX: 124,
      clientY: 132,
    });
    fireEvent.pointerUp(preview, { pointerId: 1 });

    expect(screen.getByText("24px")).toBeInTheDocument();
    expect(screen.getByText("32px")).toBeInTheDocument();
  });

  it("rotates in 90-degree increments in both directions", () => {
    openAvatarDialog();
    uploadAvatar();

    fireEvent.click(screen.getByRole("button", { name: /rotate right/i }));
    expect(screen.getByText("90 deg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /rotate left/i }));
    expect(screen.getByText("0 deg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /rotate left/i }));
    expect(screen.getByText("270 deg")).toBeInTheDocument();
  });

  it("saves the cropped avatar and announces the fixed output resolution", async () => {
    openAvatarDialog();
    uploadAvatar();

    fireEvent.click(
      screen.getByRole("button", { name: /save cropped photo/i }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByAltText("Profile photo")).toHaveAttribute(
      "src",
      "blob:avatar-preview",
    );
    expect(
      screen.getByText(
        `Profile photo crop saved at ${AVATAR_CROP_OUTPUT_SIZE} x ${AVATAR_CROP_OUTPUT_SIZE}.`,
      ),
    ).toBeInTheDocument();
  });
});

describe("AccountSection email validation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the default demo email valid and Save enabled", () => {
    render(<AccountSection />);

    expect(getEmailInput()).toHaveValue("user@example.com");
    expect(getSaveButton()).not.toBeDisabled();
  });

  it("shows an inline error and aria-invalid when the email is malformed on blur", () => {
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, { target: { value: "user@" } });
    fireEvent.blur(emailInput);

    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText(/enter a valid email address/i),
    ).toBeInTheDocument();
  });

  it("does not show an error before the field has been touched", () => {
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, { target: { value: "user@" } });

    expect(emailInput).toHaveAttribute("aria-invalid", "false");
  });

  it.each([
    { label: "empty email", email: "" },
    { label: "missing TLD", email: "user@domain" },
    { label: "malformed local/domain pairing", email: "user@domain." },
  ])("disables Save for $label", ({ email }) => {
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, { target: { value: email } });
    fireEvent.blur(emailInput);

    expect(getSaveButton()).toBeDisabled();
  });

  it("blocks save for a malformed email by disabling Save and ignoring clicks on it", async () => {
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, { target: { value: "user@domain" } });
    fireEvent.blur(emailInput);

    const saveButton = getSaveButton();
    expect(saveButton).toBeDisabled();

    fireEvent.click(saveButton);

    expect(
      screen.queryByText(/staged and ready for backend save/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/saving\.\.\./i)).not.toBeInTheDocument();
  });

  it("trims leading and trailing whitespace before validating, treating the result as valid", () => {
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, { target: { value: "  user@example.com  " } });
    fireEvent.blur(emailInput);

    expect(emailInput).toHaveValue("user@example.com");
    expect(emailInput).toHaveAttribute("aria-invalid", "false");
    expect(getSaveButton()).not.toBeDisabled();
  });

  it("saves successfully once a previously invalid email is corrected", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, { target: { value: "not-an-email" } });
    fireEvent.blur(emailInput);
    expect(getSaveButton()).toBeDisabled();

    fireEvent.change(emailInput, { target: { value: "valid@example.com" } });
    expect(getSaveButton()).not.toBeDisabled();
    fireEvent.click(getSaveButton());

    await waitFor(
      () =>
        expect(
          screen.getByText(/staged and ready for backend save/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("shows a failure status message when the simulated save rejects", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    render(<AccountSection />);

    fireEvent.click(getSaveButton());

    await waitFor(
      () =>
        expect(screen.getByText(/failed to save changes/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("normalizes a whitespace-padded email at save time even without a prior blur", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, {
      target: { value: "  user@example.com  " },
    });
    fireEvent.click(getSaveButton());

    await waitFor(() => expect(emailInput).toHaveValue("user@example.com"));
  });

  it("updates the other profile fields via their onChange handlers", () => {
    render(<AccountSection />);

    fireEvent.change(screen.getByLabelText("First name"), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText("Last name"), {
      target: { value: "Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Ada L." },
    });
    fireEvent.change(screen.getByLabelText("Timezone"), {
      target: { value: "UTC" },
    });
    fireEvent.change(screen.getByLabelText("Settlement currency"), {
      target: { value: "EUR" },
    });

    expect(screen.getByLabelText("First name")).toHaveValue("Ada");
    expect(screen.getByLabelText("Last name")).toHaveValue("Lovelace");
    expect(screen.getByLabelText("Display name")).toHaveValue("Ada L.");
    expect(screen.getByLabelText("Timezone")).toHaveValue("UTC");
    expect(screen.getByLabelText("Settlement currency")).toHaveValue("EUR");
  });
});

describe("AccountSection locale preview", () => {
  it("renders a date preview and currency preview with the default profile", () => {
    render(<AccountSection />);

    const datePreview = screen.getByTestId("locale-date-preview");
    const currencyPreview = screen.getByTestId("locale-currency-preview");

    expect(datePreview).toBeInTheDocument();
    expect(datePreview.textContent).toBeTruthy();
    expect(currencyPreview).toBeInTheDocument();
    expect(currencyPreview.textContent).toBeTruthy();
  });

  it("has an accessible region with a polite live region", () => {
    render(<AccountSection />);

    const region = screen.getByRole("region", {
      name: "Locale format preview",
    });

    expect(region).toHaveAttribute("aria-live", "polite");
  });

  it("updates the date preview when the timezone changes", () => {
    render(<AccountSection />);

    const datePreview = screen.getByTestId("locale-date-preview");
    const initial = datePreview.textContent;

    fireEvent.change(screen.getByLabelText("Timezone"), {
      target: { value: "UTC" },
    });

    // With a different timezone the displayed text should change
    expect(datePreview.textContent).not.toBe(initial);
  });

  it("updates the currency preview when the currency changes", () => {
    render(<AccountSection />);

    const currencyPreview = screen.getByTestId("locale-currency-preview");
    const initial = currencyPreview.textContent;

    fireEvent.change(screen.getByLabelText("Settlement currency"), {
      target: { value: "EUR" },
    });

    // EUR format should differ from the default USD format
    expect(currencyPreview.textContent).not.toBe(initial);
  });

  it("shows the preview heading label", () => {
    render(<AccountSection />);

    expect(screen.getByText("Preview")).toBeInTheDocument();
  });
});

describe("AccountSection status timeout lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.1);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("clears the profile-save status message after the queued timeout", async () => {
    render(<AccountSection />);

    fireEvent.click(
      screen.getByRole("button", { name: /save account changes/i }),
    );

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      screen.getByText(
        "Account profile changes are staged and ready for backend save.",
      ),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(
      screen.getByText(
        "Account profile changes are staged and ready for backend save.",
      ),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(
      screen.queryByText(
        "Account profile changes are staged and ready for backend save.",
      ),
    ).not.toBeInTheDocument();
  });

  it("clears the queued status timeout when the section unmounts", async () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const { unmount } = render(<AccountSection />);

    fireEvent.click(
      screen.getByRole("button", { name: /save account changes/i }),
    );

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      screen.getByText(
        "Account profile changes are staged and ready for backend save.",
      ),
    ).toBeInTheDocument();

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });

  it("does not schedule a status reset after unmounting during save", async () => {
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");
    const { unmount } = render(<AccountSection />);

    fireEvent.click(
      screen.getByRole("button", { name: /save account changes/i }),
    );
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    const resetTimers = setTimeoutSpy.mock.calls.filter(
      ([, delay]) => delay === 5000,
    );
    expect(resetTimers).toHaveLength(0);
  });
});
