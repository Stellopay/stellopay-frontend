import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AccountSection from "./account-section";
import type { ProfileData } from "@/types/profile";

/**
 * These tests exercise the section in *standalone* mode, where it owns the
 * request. The real `@/lib/api/profile` client runs (only `fetch` is stubbed)
 * so the consumer states are validated against the actual boundary checks.
 */
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const API_BASE = "https://api.stellopay.test";

const VALID_PROFILE: ProfileData = {
  firstName: "Ada",
  lastName: "Lovelace",
  displayName: "Ada Lovelace",
  email: "ada@stellopay.test",
  timezone: "Europe/London",
  currency: "GBP",
  legalEntity: "Analytical Engines Ltd",
  billingCountry: "United Kingdom",
};

const EMPTY_PROFILE = Object.fromEntries(
  Object.keys(VALID_PROFILE).map((key) => [key, ""]),
) as ProfileData;

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("AccountSection — standalone load states", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  // ── Success ─────────────────────────────────────────────────────────────
  it("renders a loading state first, then the real profile from the API", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    fetchMock.mockResolvedValue(jsonResponse(VALID_PROFILE));

    render(<AccountSection />);

    expect(screen.getByTestId("profile-loading")).toBeInTheDocument();
    expect(screen.getByText("Loading profile…")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByLabelText("First Name")).toHaveValue("Ada"),
    );
    expect(screen.getByLabelText("Email")).toHaveValue("ada@stellopay.test");
    expect(screen.queryByTestId("profile-loading")).not.toBeInTheDocument();
  });

  it("does not label API-backed data as demo data", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    fetchMock.mockResolvedValue(jsonResponse(VALID_PROFILE));

    render(<AccountSection />);

    await waitFor(() =>
      expect(screen.getByLabelText("First Name")).toHaveValue("Ada"),
    );
    expect(screen.queryByTestId("profile-placeholder-badge")).not.toBeInTheDocument();
    expect(screen.queryByText("Demo Data")).not.toBeInTheDocument();
  });

  // ── Empty ───────────────────────────────────────────────────────────────
  it("renders an explicit empty state when the profile has no values", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    fetchMock.mockResolvedValue(jsonResponse(EMPTY_PROFILE));

    render(<AccountSection />);

    await waitFor(() =>
      expect(screen.getByLabelText("First Name")).toHaveValue(""),
    );
    expect(screen.getByText(/your profile is empty/i)).toBeInTheDocument();
  });

  // ── Error ───────────────────────────────────────────────────────────────
  it("renders a retryable error state when the request fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    render(<AccountSection />);

    await waitFor(() => expect(screen.getByTestId("profile-error")).toBeInTheDocument());
    const panel = screen.getByTestId("profile-error");
    expect(
      within(panel).getByText("Could not load your profile"),
    ).toBeInTheDocument();
    expect(panel).toHaveTextContent(/check your connection/i);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    // The form must not be rendered as if the data had loaded.
    expect(screen.queryByLabelText("First Name")).not.toBeInTheDocument();
  });

  it("recovers when the user retries a failed load", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fetchMock.mockResolvedValueOnce(jsonResponse(VALID_PROFILE));

    render(<AccountSection />);

    await waitFor(() => expect(screen.getByTestId("profile-error")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() =>
      expect(screen.getByLabelText("First Name")).toHaveValue("Ada"),
    );
    expect(screen.queryByTestId("profile-error")).not.toBeInTheDocument();
  });

  it("renders an error state when the response fails boundary validation", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    // Missing fields: the client must reject this rather than render it.
    fetchMock.mockResolvedValue(jsonResponse({ firstName: "Ada" }));

    render(<AccountSection />);

    await waitFor(() => expect(screen.getByTestId("profile-error")).toBeInTheDocument());
    expect(screen.getByTestId("profile-error")).toHaveTextContent(/invalid profile/i);
  });

  // ── Slow response ───────────────────────────────────────────────────────
  it("keeps the loading state visible while a slow response is in flight", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    const gate = deferred<Response>();
    fetchMock.mockReturnValue(gate.promise);

    render(<AccountSection />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByTestId("profile-loading")).toBeInTheDocument();
    expect(screen.queryByLabelText("First Name")).not.toBeInTheDocument();

    gate.resolve(jsonResponse(VALID_PROFILE));

    await waitFor(() =>
      expect(screen.getByLabelText("First Name")).toHaveValue("Ada"),
    );
    expect(screen.queryByTestId("profile-loading")).not.toBeInTheDocument();
  });

  // ── Placeholder ─────────────────────────────────────────────────────────
  it("shows an explicit placeholder flag when the endpoint is unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");

    render(<AccountSection />);

    await waitFor(() =>
      expect(screen.getByTestId("profile-placeholder-badge")).toBeInTheDocument(),
    );
    expect(screen.getByText("Demo Data")).toBeInTheDocument();
    expect(screen.getByTestId("profile-section")).toHaveTextContent(
      /profile api is not configured yet/i,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
