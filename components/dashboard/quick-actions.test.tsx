import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Send, BarChart3 } from "lucide-react";

// next/link is only available inside the Next.js runtime; render it as a plain
// anchor so jsdom can assert href values without a router context.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
    title,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
    title?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel} title={title}>
      {children}
    </a>
  ),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

import { QuickActions, type QuickActionItem } from "./quick-actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Titles of the four actions that have no destination yet. */
const COMING_SOON_TITLES = [
  "Request Payment",
  "New Contract",
  "Create Invoice",
  "Add Recipient",
];

/** Default actions rendered when no `actions` prop is supplied. */
function renderDefault() {
  return render(<QuickActions />);
}

// ---------------------------------------------------------------------------
// Default action destinations
// ---------------------------------------------------------------------------

describe("QuickActions – default destinations", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders all six action cards", () => {
    renderDefault();

    expect(
      screen.getByRole("link", { name: "Send Payment" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Reports" }),
    ).toBeInTheDocument();

    for (const title of COMING_SOON_TITLES) {
      expect(
        screen.getByLabelText(`${title}, coming soon`),
      ).toBeInTheDocument();
    }
  });

  it("routes Send Payment to /transactions", () => {
    renderDefault();

    const link = screen.getByRole("link", { name: "Send Payment" });
    expect(link).toHaveAttribute("href", "/transactions");
  });

  it("routes View Reports to /analytics-view", () => {
    renderDefault();

    const link = screen.getByRole("link", { name: "View Reports" });
    expect(link).toHaveAttribute("href", "/analytics-view");
  });

  it("no two distinct active actions share the same href", () => {
    renderDefault();

    const links = screen
      .getAllByRole("link")
      .filter(
        (el) => !el.closest("header") && el.getAttribute("href") !== undefined,
      );

    // Exclude the Customize link (it has no aria-label matching an action)
    const actionLinks = links.filter((el) =>
      ["Send Payment", "View Reports"].includes(
        el.getAttribute("aria-label") ?? "",
      ),
    );

    const hrefs = actionLinks.map((el) => el.getAttribute("href"));
    const uniqueHrefs = new Set(hrefs);
    expect(uniqueHrefs.size).toBe(hrefs.length);
  });
});

// ---------------------------------------------------------------------------
// Disabled / Coming Soon cards
// ---------------------------------------------------------------------------

describe("QuickActions – disabled (coming soon) cards", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it.each(COMING_SOON_TITLES)(
    '"%s" is not rendered as a link or button',
    (title) => {
      renderDefault();

      expect(
        screen.queryByRole("link", { name: title }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: title }),
      ).not.toBeInTheDocument();
    },
  );

  it.each(COMING_SOON_TITLES)(
    '"%s" card exposes an accessible label containing "coming soon"',
    (title) => {
      renderDefault();

      const card = screen.getByLabelText(`${title}, coming soon`);
      expect(card).toBeInTheDocument();
    },
  );

  it.each(COMING_SOON_TITLES)(
    '"%s" card displays a visible "Coming soon" label',
    (title) => {
      renderDefault();

      const card = screen.getByLabelText(`${title}, coming soon`);
      expect(card).toHaveTextContent(/coming soon/i);
    },
  );

  it.each(COMING_SOON_TITLES)(
    '"%s" card is not focusable via keyboard tab',
    (title) => {
      renderDefault();

      const card = screen.getByLabelText(`${title}, coming soon`);
      // Non-interactive divs have tabIndex -1 by default (not in tab order)
      expect(card.tagName).not.toBe("A");
      expect(card.tagName).not.toBe("BUTTON");
      expect(card).not.toHaveAttribute("tabindex", "0");
    },
  );
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe("QuickActions – accessibility", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("all icons inside active cards are aria-hidden", () => {
    renderDefault();

    // Every svg inside a link or button must carry aria-hidden
    const interactiveCards = [
      ...screen.getAllByRole("link"),
      ...screen.getAllByRole("button"),
    ];

    for (const card of interactiveCards) {
      const svgs = card.querySelectorAll("svg");
      for (const svg of svgs) {
        expect(svg).toHaveAttribute("aria-hidden");
      }
    }
  });

  it("every active card has an accessible name", () => {
    renderDefault();

    const links = screen.getAllByRole("link");
    const buttons = screen.getAllByRole("button");

    for (const el of [...links, ...buttons]) {
      const name = el.getAttribute("aria-label") ?? el.textContent?.trim();
      expect(name).toBeTruthy();
    }
  });

  it("disabled cards each have a non-empty aria-label", () => {
    renderDefault();

    for (const title of COMING_SOON_TITLES) {
      const card = screen.getByLabelText(`${title}, coming soon`);
      expect(card.getAttribute("aria-label")).toMatch(/coming soon/i);
    }
  });
});

// ---------------------------------------------------------------------------
// Button variant (onClick)
// ---------------------------------------------------------------------------

describe("QuickActions – onClick button variant", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("fires the onClick handler when the button card is clicked", () => {
    const handler = vi.fn();
    const customActions: QuickActionItem[] = [
      {
        icon: Send,
        title: "Custom Action",
        subtitle: "Does something",
        onClick: handler,
        borderColor: "border-zinc-200",
        bgColor: "bg-zinc-50",
        iconColor: "text-zinc-500",
      },
    ];

    render(<QuickActions actions={customActions} />);

    fireEvent.click(screen.getByRole("button", { name: "Custom Action" }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("button card has aria-label equal to its title", () => {
    const customActions: QuickActionItem[] = [
      {
        icon: Send,
        title: "Pay Now",
        subtitle: "Instant payment",
        onClick: vi.fn(),
        borderColor: "border-zinc-200",
        bgColor: "bg-zinc-50",
        iconColor: "text-zinc-500",
      },
    ];

    render(<QuickActions actions={customActions} />);

    const btn = screen.getByRole("button", { name: "Pay Now" });
    expect(btn).toHaveAttribute("aria-label", "Pay Now");
  });
});

// ---------------------------------------------------------------------------
// Link variant (href)
// ---------------------------------------------------------------------------

describe("QuickActions – href link variant", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("link card has aria-label equal to its title", () => {
    const customActions: QuickActionItem[] = [
      {
        icon: BarChart3,
        title: "Go to Reports",
        subtitle: "See data",
        href: "/analytics-view",
        borderColor: "border-zinc-200",
        bgColor: "bg-zinc-50",
        iconColor: "text-zinc-500",
      },
    ];

    render(<QuickActions actions={customActions} />);

    const link = screen.getByRole("link", { name: "Go to Reports" });
    expect(link).toHaveAttribute("href", "/analytics-view");
    expect(link).toHaveAttribute("aria-label", "Go to Reports");
  });

  it("only renders internal hrefs (no external navigation)", () => {
    renderDefault();

    const links = screen.getAllByRole("link");
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      // Must be a relative path or an anchor — not an absolute URL
      expect(href).not.toMatch(/^https?:\/\//);
    }
  });
});

// ---------------------------------------------------------------------------
// Customize control
// ---------------------------------------------------------------------------

describe("QuickActions – Customize control", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders a Customize button when onCustomize is provided", () => {
    const onCustomize = vi.fn();
    render(<QuickActions onCustomize={onCustomize} />);

    fireEvent.click(screen.getByRole("button", { name: /customize/i }));
    expect(onCustomize).toHaveBeenCalledTimes(1);
  });

  it("renders a Customize link when customizeHref is provided", () => {
    render(<QuickActions customizeHref="/settings/preferences" />);

    const link = screen.getByRole("link", { name: /customize/i });
    expect(link).toHaveAttribute("href", "/settings/preferences");
  });
});

// ---------------------------------------------------------------------------
// Custom actions prop
// ---------------------------------------------------------------------------

describe("QuickActions – custom actions prop", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders only the supplied custom actions", () => {
    const customActions: QuickActionItem[] = [
      {
        icon: Send,
        title: "Alpha",
        subtitle: "First action",
        href: "/alpha",
        borderColor: "border-zinc-200",
        bgColor: "bg-zinc-50",
        iconColor: "text-zinc-500",
      },
      {
        icon: BarChart3,
        title: "Beta",
        subtitle: "Second action",
        disabled: true,
        borderColor: "border-zinc-200",
        bgColor: "bg-zinc-50",
        iconColor: "text-zinc-500",
      },
    ];

    render(<QuickActions actions={customActions} />);

    expect(screen.getByRole("link", { name: "Alpha" })).toHaveAttribute(
      "href",
      "/alpha",
    );
    expect(
      screen.queryByRole("link", { name: "Beta" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Beta, coming soon")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------

describe("QuickActions – keyboard shortcuts", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("triggers router.push when key for default href action is pressed", () => {
    renderDefault();

    fireEvent.keyDown(window, { key: "s" });
    expect(mockPush).toHaveBeenCalledWith("/transactions");

    fireEvent.keyDown(window, { key: "r" });
    expect(mockPush).toHaveBeenCalledWith("/analytics-view");
  });

  it("triggers onClick callback when key for custom onClick action is pressed", () => {
    const onClickMock = vi.fn();
    const customActions: QuickActionItem[] = [
      {
        icon: Send,
        title: "Quick Send",
        subtitle: "Send money",
        shortcut: "q",
        onClick: onClickMock,
        borderColor: "border-zinc-200",
        bgColor: "bg-zinc-50",
        iconColor: "text-zinc-500",
      },
    ];

    render(<QuickActions actions={customActions} />);

    fireEvent.keyDown(window, { key: "q" });
    expect(onClickMock).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shortcuts are case-insensitive", () => {
    renderDefault();

    fireEvent.keyDown(window, { key: "S" });
    expect(mockPush).toHaveBeenCalledWith("/transactions");

    fireEvent.keyDown(window, { key: "R" });
    expect(mockPush).toHaveBeenCalledWith("/analytics-view");
  });

  it("suppresses shortcuts when an input field has focus", () => {
    render(
      <div>
        <input data-testid="test-input" type="text" />
        <QuickActions />
      </div>
    );

    const input = screen.getByTestId("test-input");
    input.focus();

    fireEvent.keyDown(input, { key: "s" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("suppresses shortcuts when a textarea has focus", () => {
    render(
      <div>
        <textarea data-testid="test-textarea" />
        <QuickActions />
      </div>
    );

    const textarea = screen.getByTestId("test-textarea");
    textarea.focus();

    fireEvent.keyDown(textarea, { key: "s" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("suppresses shortcuts when a select element has focus", () => {
    render(
      <div>
        <select data-testid="test-select">
          <option value="1">Option 1</option>
        </select>
        <QuickActions />
      </div>
    );

    const select = screen.getByTestId("test-select");
    select.focus();

    fireEvent.keyDown(select, { key: "s" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("suppresses shortcuts when target is contentEditable", () => {
    render(
      <div>
        <div data-testid="test-editable" contentEditable="true" />
        <QuickActions />
      </div>
    );

    const editable = screen.getByTestId("test-editable");
    editable.focus();

    fireEvent.keyDown(editable, { key: "s" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("suppresses shortcuts when modifier keys are pressed", () => {
    renderDefault();

    fireEvent.keyDown(window, { key: "s", ctrlKey: true });
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "s", metaKey: true });
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "s", altKey: true });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not trigger shortcut for disabled actions", () => {
    const customActions: QuickActionItem[] = [
      {
        icon: Send,
        title: "Disabled Action",
        subtitle: "Not ready",
        shortcut: "d",
        disabled: true,
        borderColor: "border-zinc-200",
        bgColor: "bg-zinc-50",
        iconColor: "text-zinc-500",
      },
    ];

    render(<QuickActions actions={customActions} />);

    fireEvent.keyDown(window, { key: "d" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("renders visual shortcut hint badge (<kbd>) and title hint", () => {
    renderDefault();

    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();

    const sendLink = screen.getByRole("link", { name: "Send Payment" });
    expect(sendLink).toHaveAttribute("title", "Send Payment (Shortcut: S)");
  });

  it("does not navigate or call handler if action has shortcut but no onClick or href", () => {
    const customActions: QuickActionItem[] = [
      {
        icon: Send,
        title: "No-op Action",
        subtitle: "Nothing defined",
        shortcut: "n",
        borderColor: "border-zinc-200",
        bgColor: "bg-zinc-50",
        iconColor: "text-zinc-500",
      },
    ];

    render(<QuickActions actions={customActions} />);

    fireEvent.keyDown(window, { key: "n" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("cleans up keydown listener when unmounted", () => {
    const { unmount } = renderDefault();
    unmount();

    fireEvent.keyDown(window, { key: "s" });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
