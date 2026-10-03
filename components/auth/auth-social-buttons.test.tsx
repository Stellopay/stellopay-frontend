import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthSocialButtons } from "./auth-social-buttons";
import { OAuthCallbackError } from "@/lib/api/auth";

// next/image is a server-side Next.js component — replace it with a plain img
// so tests run correctly in jsdom.
// eslint-disable-next-line @next/next/no-img-element
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

// Mock the auth API module
vi.mock("@/lib/api/auth", () => ({
  OAuthCallbackError: class OAuthCallbackError extends Error {
    constructor(message: string, public readonly code: string) {
      super(message);
      this.name = "OAuthCallbackError";
    }
  },
  simulateOAuth: vi.fn(),
}));

// Mock the oauthProviders module so each test controls which providers
// are "configured" without mutating process.env.
vi.mock("@/lib/api/oauthProviders", () => ({
  getConfiguredOAuthProviders: vi.fn(() => ["google", "apple"]),
  isOAuthProviderConfigured: vi.fn(() => true),
}));

import { getConfiguredOAuthProviders } from "@/lib/api/oauthProviders";

const mockConfigured = getConfiguredOAuthProviders as ReturnType<
  typeof vi.fn
>;

describe("AuthSocialButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigured.mockReturnValue(["google", "apple"]);
  });
  afterEach(() => vi.restoreAllMocks());

  // ——— Provider gating ———

  it("renders no social buttons or divider when no providers are configured", () => {
    mockConfigured.mockReturnValue([]);
    const { container } = render(<AuthSocialButtons />);
    expect(
      screen.queryByRole("button", { name: /continue with google/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /continue with apple/i }),
    ).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the Google button when only Google is configured", () => {
    mockConfigured.mockReturnValue(["google"]);
    render(<AuthSocialButtons />);
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /continue with apple/i }),
    ).not.toBeInTheDocument();
  });

  it("renders only the Apple button when only Apple is configured", () => {
    mockConfigured.mockReturnValue(["apple"]);
    render(<AuthSocialButtons />);
    expect(
      screen.getByRole("button", { name: /continue with apple/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /continue with google/i }),
    ).not.toBeInTheDocument();
  });

  it("renders both provider buttons when both are configured", () => {
    render(<AuthSocialButtons />);
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with apple/i }),
    ).toBeInTheDocument();
  });

  it("shows provider logos in the idle state", () => {
    render(<AuthSocialButtons />);
    expect(screen.getByAltText(/google logo/i)).toBeInTheDocument();
    expect(screen.getByAltText(/apple logo/i)).toBeInTheDocument();
  });

  it("all buttons are enabled and not busy in the default idle state", () => {
    render(<AuthSocialButtons />);
    const googleBtn = screen.getByRole("button", {
      name: /continue with google/i,
    });
    const appleBtn = screen.getByRole("button", {
      name: /continue with apple/i,
    });

    expect(googleBtn).not.toBeDisabled();
    expect(appleBtn).not.toBeDisabled();
    expect(googleBtn).toHaveAttribute("aria-busy", "false");
    expect(appleBtn).toHaveAttribute("aria-busy", "false");
  });

  // ——— Failure path ———

  it("surfaces an OAuth error when the provider flow rejects", async () => {
    const { simulateOAuth } = await import("@/lib/api/auth");
    (simulateOAuth as ReturnType<typeof vi.fn>).mockRejectedValue(
      new OAuthCallbackError("User has denied permission", "access_denied"),
    );

    render(<AuthSocialButtons />);
    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: /continue with google/i }),
      );
    });

    expect(screen.getByText("User has denied permission")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /use email instead/i }),
    ).toBeInTheDocument();
  });

  it("disables buttons while a provider flow is in-flight", async () => {
    const { simulateOAuth } = await import("@/lib/api/auth");
    let resolveFlow!: () => void;
    const flowPromise = new Promise<void>((res) => {
      resolveFlow = res;
    });
    (simulateOAuth as ReturnType<typeof vi.fn>).mockImplementation(
      () => flowPromise,
    );

    render(<AuthSocialButtons />);
    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: /continue with google/i }),
      );
    });

    const googleBtn = screen.getByRole("button", {
      name: /continue with google/i,
    });
    expect(googleBtn).toBeDisabled();
    expect(googleBtn).toHaveAttribute("aria-busy", "true");

    await act(async () => {
      resolveFlow();
      await flowPromise;
    });
  });
});
