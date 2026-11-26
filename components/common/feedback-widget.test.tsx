import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import FeedbackWidget from "./feedback-widget";

const API_BASE_URL = "https://api.example.test";
const SUCCESS_MESSAGE =
  "Thank you! Your feedback has been submitted successfully.";
const ERROR_MESSAGE = "Something went wrong. Please try again later.";

async function openFeedbackForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Open feedback form" }));
  return screen.getByRole("dialog", { name: "Send Feedback" });
}

async function enterValidFeedback(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: "Subject" }), "A feedback subject");
  await user.type(
    screen.getByRole("textbox", { name: "Description" }),
    "This is a detailed description of the feedback.",
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("FeedbackWidget", () => {
  it("opens with an accessible dialog and passes the axe check", async () => {
    const user = userEvent.setup();
    const { container } = render(<FeedbackWidget />);

    await openFeedbackForm(user);

    const results = await axe(container);
    expect(results.violations).toEqual([]);
    expect(screen.getByRole("textbox", { name: "Subject" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);
    const trigger = screen.getByRole("button", { name: "Open feedback form" });

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "Send Feedback" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it("rejects empty and overlong feedback without submitting", async () => {
    const fetchMock = vi.fn();
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE_URL);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<FeedbackWidget />);
    await openFeedbackForm(user);

    await user.click(screen.getByRole("button", { name: "Send Feedback" }));

    expect(screen.getByText("Subject is required")).toBeInTheDocument();
    expect(
      screen.getByText("Please provide at least 10 characters"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Subject" }), {
      target: { value: "s".repeat(101) },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "d".repeat(2001) },
    });
    await user.click(screen.getByRole("button", { name: "Send Feedback" }));

    expect(
      screen.getByText("Subject cannot exceed 100 characters"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Description cannot exceed 2000 characters"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits valid feedback and calls onSubmitSuccess", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE_URL);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const onSubmitSuccess = vi.fn();
    const user = userEvent.setup();
    render(<FeedbackWidget onSubmitSuccess={onSubmitSuccess} />);
    await openFeedbackForm(user);
    await enterValidFeedback(user);

    await user.click(screen.getByRole("button", { name: "Send Feedback" }));

    expect(await screen.findByText(SUCCESS_MESSAGE)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/support`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "A feedback subject",
          description: "This is a detailed description of the feedback.",
          type: "bug",
          screenshot: null,
        }),
      }),
    );
    expect(onSubmitSuccess).toHaveBeenCalledOnce();
  });

  it.each([
    ["rejects", "reject"],
    ["returns a non-2xx response", "http"],
  ])("shows an error and keeps the draft when fetch %s", async (_label, failure) => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE_URL);
    const fetchMock = vi.fn();
    if (failure === "reject") {
      fetchMock.mockRejectedValue(new Error("network failure"));
    } else {
      fetchMock.mockResolvedValue({ ok: false });
    }
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<FeedbackWidget />);
    await openFeedbackForm(user);
    await enterValidFeedback(user);

    await user.click(screen.getByRole("button", { name: "Send Feedback" }));

    expect(await screen.findByText(ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Subject" })).toHaveValue(
      "A feedback subject",
    );
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      "This is a detailed description of the feedback.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports success without a request when the API base URL is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<FeedbackWidget />);
    await openFeedbackForm(user);
    await enterValidFeedback(user);

    await user.click(screen.getByRole("button", { name: "Send Feedback" }));

    expect(await screen.findByText(SUCCESS_MESSAGE)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
