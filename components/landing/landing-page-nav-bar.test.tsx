import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LandingPageNavBar from "./landing-page-nav-bar";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Track the current pathname so individual tests can override it.
let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("@/components/common/network-switcher", () => ({
  default: () => <div data-testid="network-switcher" />,
}));

// next/link renders a plain <a> in the test environment.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function getHamburger() {
  return screen.getByTestId("hamburger-button");
}

function getPanel() {
  // The panel is always in the DOM; it's only exposed to the a11y tree when
  // aria-hidden is false (i.e. when open). Use queryByRole so it returns null
  // when the panel is hidden.
  return screen.queryByRole("dialog", { name: /mobile navigation menu/i });
}

function openMenu() {
  fireEvent.click(getHamburger());
}

// ── Test suites ───────────────────────────────────────────────────────────────

describe("LandingPageNavBar — initial render", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  it("renders the StelloPay logo link", () => {
    render(<LandingPageNavBar />);
    const logos = screen.getAllByRole("link", { name: /stellopay/i });
    expect(logos.length).toBeGreaterThanOrEqual(1);
    expect(logos[0]).toHaveAttribute("href", "/");
  });

  it("renders desktop nav links", () => {
    render(<LandingPageNavBar />);
    expect(screen.getByRole("link", { name: "Features" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pricing" })).toBeInTheDocument();
  });

  it("renders the hamburger button", () => {
    render(<LandingPageNavBar />);
    expect(getHamburger()).toBeInTheDocument();
  });

  it("panel is not visible on initial render", () => {
    render(<LandingPageNavBar />);
    expect(getPanel()).toBeNull();
  });

  it("hamburger starts with aria-expanded=false", () => {
    render(<LandingPageNavBar />);
    expect(getHamburger()).toHaveAttribute("aria-expanded", "false");
  });

  it("hamburger has aria-controls pointing at the panel id", () => {
    render(<LandingPageNavBar />);
    expect(getHamburger()).toHaveAttribute("aria-controls", "mobile-nav-panel");
  });

  it("hamburger has aria-haspopup=dialog", () => {
    render(<LandingPageNavBar />);
    expect(getHamburger()).toHaveAttribute("aria-haspopup", "dialog");
  });
});

describe("LandingPageNavBar — open / close", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  it("opens the panel when the hamburger is clicked", () => {
    render(<LandingPageNavBar />);
    openMenu();
    expect(getPanel()).toBeInTheDocument();
  });

  it("sets aria-expanded=true on the hamburger when open", () => {
    render(<LandingPageNavBar />);
    openMenu();
    expect(getHamburger()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the panel when the hamburger is clicked again", () => {
    render(<LandingPageNavBar />);
    openMenu();
    fireEvent.click(getHamburger());
    expect(getPanel()).toBeNull();
  });

  it("sets aria-expanded=false on the hamburger after close", () => {
    render(<LandingPageNavBar />);
    openMenu();
    fireEvent.click(getHamburger());
    expect(getHamburger()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the panel when the close button inside the panel is clicked", () => {
    render(<LandingPageNavBar />);
    openMenu();
    const panel = getPanel()!;
    const closeBtn = panel.querySelector<HTMLElement>("button[aria-label='Close menu']")!;
    fireEvent.click(closeBtn);
    expect(getPanel()).toBeNull();
  });
});

describe("LandingPageNavBar — panel ARIA semantics", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  it("panel has role=dialog", () => {
    render(<LandingPageNavBar />);
    openMenu();
    expect(getPanel()).toBeInTheDocument();
  });

  it("panel has aria-modal=true", () => {
    render(<LandingPageNavBar />);
    openMenu();
    const panel = getPanel()!;
    expect(panel).toHaveAttribute("aria-modal", "true");
  });

  it("panel has accessible name 'Mobile navigation menu'", () => {
    render(<LandingPageNavBar />);
    openMenu();
    expect(getPanel()).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: /mobile navigation menu/i }),
    ).toBeInTheDocument();
  });
});

describe("LandingPageNavBar — Escape key", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  it("closes the panel when Escape is pressed", () => {
    render(<LandingPageNavBar />);
    openMenu();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(getPanel()).toBeNull();
  });

  it("returns focus to the hamburger after Escape", () => {
    render(<LandingPageNavBar />);
    const btn = getHamburger();
    openMenu();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(btn);
  });
});

describe("LandingPageNavBar — focus trap", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  const FOCUSABLE = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

  it("Tab wraps from last focusable element to first", () => {
    render(<LandingPageNavBar />);
    openMenu();

    const panel = getPanel()!;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    expect(focusable.length).toBeGreaterThan(1);

    const last = focusable[focusable.length - 1];
    const first = focusable[0];

    act(() => last.focus());
    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(first);
  });

  it("Shift+Tab wraps from first focusable element to last", () => {
    render(<LandingPageNavBar />);
    openMenu();

    const panel = getPanel()!;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    act(() => first.focus());
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("focus returns to hamburger after close via button click", () => {
    render(<LandingPageNavBar />);
    const btn = getHamburger();
    openMenu();
    // Click the hamburger again to close
    fireEvent.click(btn);
    expect(document.activeElement).toBe(btn);
  });
});

describe("LandingPageNavBar — route-change close", () => {
  afterEach(() => {
    mockPathname = "/";
  });

  it("closes the panel when pathname changes", () => {
    const { rerender } = render(<LandingPageNavBar />);
    openMenu();
    expect(getPanel()).toBeInTheDocument();

    // Simulate route change by mutating the mock and re-rendering
    mockPathname = "/features";
    rerender(<LandingPageNavBar />);

    expect(getPanel()).toBeNull();
  });
});

describe("LandingPageNavBar — nav links inside panel", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  it("renders all nav links inside the open panel", () => {
    render(<LandingPageNavBar />);
    openMenu();

    const panel = getPanel()!;
    const links = Array.from(panel.querySelectorAll("a[href]")).map(
      (a) => (a as HTMLAnchorElement).href,
    );

    expect(links.some((h) => h.includes("/features"))).toBe(true);
    expect(links.some((h) => h.includes("/how-it-works"))).toBe(true);
    expect(links.some((h) => h.includes("/pricing"))).toBe(true);
    expect(links.some((h) => h.includes("/support"))).toBe(true);
  });

  it("renders Log in and Sign Up links inside the panel", () => {
    render(<LandingPageNavBar />);
    openMenu();

    const panel = getPanel()!;
    const loginLink = panel.querySelector<HTMLAnchorElement>("a[href='/auth/login']");
    const signUpLink = panel.querySelector<HTMLAnchorElement>("a[href='/auth/sign-up']");

    expect(loginLink).toBeInTheDocument();
    expect(signUpLink).toBeInTheDocument();
  });

  it("renders the network switcher inside the panel", () => {
    render(<LandingPageNavBar />);
    openMenu();

    // There may be two NetworkSwitchers (desktop hidden + mobile visible)
    const switchers = screen.getAllByTestId("network-switcher");
    expect(switchers.length).toBeGreaterThanOrEqual(1);
  });

  it("active link has aria-current=page when pathname matches", () => {
    mockPathname = "/features";
    render(<LandingPageNavBar />);
    openMenu();

    const panel = getPanel()!;
    const activeLink = panel.querySelector<HTMLAnchorElement>(
      "a[href='/features']",
    );
    expect(activeLink).toHaveAttribute("aria-current", "page");
  });

  it("inactive links do not have aria-current", () => {
    mockPathname = "/";
    render(<LandingPageNavBar />);
    openMenu();

    const panel = getPanel()!;
    const featuresLink = panel.querySelector<HTMLAnchorElement>(
      "a[href='/features']",
    );
    expect(featuresLink).not.toHaveAttribute("aria-current");
  });
});

describe("LandingPageNavBar — body scroll lock", () => {
  beforeEach(() => {
    mockPathname = "/";
    // Reset body overflow before each test
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("locks body scroll when panel is open", () => {
    render(<LandingPageNavBar />);
    openMenu();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body scroll when panel is closed", () => {
    render(<LandingPageNavBar />);
    openMenu();
    fireEvent.click(getHamburger());
    expect(document.body.style.overflow).toBe("");
  });
});

describe("LandingPageNavBar — backdrop overlay", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  it("clicking the backdrop closes the panel", () => {
    render(<LandingPageNavBar />);
    openMenu();
    expect(getPanel()).toBeInTheDocument();

    // The backdrop overlay has a fixed class we can identify
    const backdrop = document.querySelector<HTMLElement>(
      ".fixed.inset-0.bg-black\\/60",
    )!;
    fireEvent.click(backdrop);

    expect(getPanel()).toBeNull();
  });

  it("clicking the backdrop returns focus to hamburger", () => {
    render(<LandingPageNavBar />);
    const btn = getHamburger();
    openMenu();

    const backdrop = document.querySelector<HTMLElement>(
      ".fixed.inset-0.bg-black\\/60",
    )!;
    fireEvent.click(backdrop);

    expect(document.activeElement).toBe(btn);
  });
});
