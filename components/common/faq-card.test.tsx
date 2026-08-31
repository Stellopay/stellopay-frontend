import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FaqCard from "./faq-card";
import React from "react";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

// highlight-text renders plain text when query is empty, so no mark tags expected
vi.mock("@/components/common/highlight-text", () => ({
  HighlightText: ({
    text,
    query,
  }: {
    text: string;
    query: string;
  }) => {
    if (!query) return <>{text}</>;
    return (
      <>
        {text.split(new RegExp(`(${query})`, "gi")).map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i}>{part}</mark>
          ) : (
            part
          ),
        )}
      </>
    );
  },
}));

const defaultProps = {
  title: "Account Management",
  subtitle: "Update your profile, reset your password, and manage your account.",
  link: "/help/support/accountManagement",
};

describe("FaqCard", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  // ── Basic rendering ──────────────────────────────────────────────────

  it("renders title and subtitle", () => {
    render(<FaqCard {...defaultProps} />);
    expect(screen.getByText("Account Management")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Update your profile, reset your password, and manage your account.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the external link icon", () => {
    const { container } = render(<FaqCard {...defaultProps} />);
    const icon = container.querySelector("svg.lucide-square-arrow-out-up-right");
    expect(icon).toBeInTheDocument();
  });

  // ── Accessibility / role ─────────────────────────────────────────────

  it("uses role='button' and is keyboard-focusable", () => {
    render(<FaqCard {...defaultProps} />);
    const card = screen.getByRole("button", { name: /Account Management/i });
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("tabIndex", "0");
  });

  it("has an aria-label equal to the title when articleCount is not provided", () => {
    render(<FaqCard {...defaultProps} />);
    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("aria-label", "Account Management");
  });

  // ── Navigation ───────────────────────────────────────────────────────

  it("navigates on click", () => {
    render(<FaqCard {...defaultProps} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith("/help/support/accountManagement");
  });

  it("navigates on Enter key", () => {
    render(<FaqCard {...defaultProps} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/help/support/accountManagement");
  });

  it("navigates on Space key", () => {
    render(<FaqCard {...defaultProps} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(mockPush).toHaveBeenCalledWith("/help/support/accountManagement");
  });

  it("uses default link when no link is provided", () => {
    render(<FaqCard title="Test" subtitle="Desc" />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith("/settings/preferences");
  });

  // ── icon prop ────────────────────────────────────────────────────────

  it("renders an icon when icon prop is provided", () => {
    render(
      <FaqCard
        {...defaultProps}
        icon={<span data-testid="custom-icon">★</span>}
      />,
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("does not render icon wrapper div when icon prop is omitted", () => {
    const { container } = render(<FaqCard {...defaultProps} />);
    // The icon wrapper is a div with aria-hidden=true and a specific size class
    const iconWrapperDiv = container.querySelector(
      "div[aria-hidden='true'].w-10.h-10",
    );
    expect(iconWrapperDiv).not.toBeInTheDocument();
  });

  // ── articleCount prop ────────────────────────────────────────────────

  it("renders article count badge when articleCount is provided", () => {
    render(<FaqCard {...defaultProps} articleCount={6} />);
    expect(screen.getByText("6 articles")).toBeInTheDocument();
  });

  it("renders '1 article' (singular) when articleCount is 1", () => {
    render(<FaqCard {...defaultProps} articleCount={1} />);
    expect(screen.getByText("1 article")).toBeInTheDocument();
  });

  it("includes articleCount in aria-label when provided", () => {
    render(<FaqCard {...defaultProps} articleCount={6} />);
    const card = screen.getByRole("button");
    expect(card).toHaveAttribute(
      "aria-label",
      "Account Management: 6 articles",
    );
  });

  it("does not render article count badge when articleCount is not provided", () => {
    render(<FaqCard {...defaultProps} />);
    expect(screen.queryByText(/articles?/)).not.toBeInTheDocument();
  });

  // ── highlightQuery prop ──────────────────────────────────────────────

  it("highlights matching text in title when highlightQuery is provided", () => {
    render(<FaqCard {...defaultProps} highlightQuery="Account" />);
    const mark = screen.getByText("Account");
    expect(mark.tagName).toBe("MARK");
  });

  it("highlights matching text in subtitle when highlightQuery is provided", () => {
    render(<FaqCard {...defaultProps} highlightQuery="profile" />);
    const mark = screen.getByText("profile");
    expect(mark.tagName).toBe("MARK");
  });

  it("renders plain text when no highlightQuery is provided", () => {
    render(<FaqCard {...defaultProps} />);
    expect(screen.queryByRole("mark")).not.toBeInTheDocument();
  });

  // ── Styling ──────────────────────────────────────────────────────────

  it("clamps subtitle to 2 lines", () => {
    render(<FaqCard {...defaultProps} />);
    const subtitle = screen.getByText(
      "Update your profile, reset your password, and manage your account.",
    );
    expect(subtitle.className).toMatch(/line-clamp-2/);
  });

  it("has hover shadow and border tokens", () => {
    const { container } = render(<FaqCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/hover:shadow-md/);
    expect(card.className).toMatch(/hover:border-zinc-300/);
  });

  it("has focus-visible ring styles", () => {
    const { container } = render(<FaqCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/focus-visible:ring-2/);
  });

  it("has light and dark mode classes", () => {
    const { container } = render(<FaqCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/bg-white/);
    expect(card.className).toMatch(/dark:bg-\[#121212\]/);
    expect(card.className).toMatch(/border-zinc-200/);
    expect(card.className).toMatch(/dark:border-\[#2E2E2E\]/);
  });

  it("has responsive flex layout", () => {
    const { container } = render(<FaqCard {...defaultProps} />);
    const inner = container.firstChild?.firstChild as HTMLElement;
    expect(inner.className).toMatch(/flex-col/);
    expect(inner.className).toMatch(/sm:flex-row/);
    expect(inner.className).toMatch(/items-start/);
  });

  it("renders long text without layout breakage", () => {
    render(
      <FaqCard
        title="A very long FAQ card title that should still wrap gracefully without breaking the layout"
        subtitle="This is an extremely long subtitle that goes on and on and on and on and on and on and on to test that the card handles overflow gracefully and the icon stays aligned with the title."
      />,
    );
    const card = screen.getByRole("button");
    expect(card).toBeInTheDocument();
    const title = screen.getByText(
      "A very long FAQ card title that should still wrap gracefully without breaking the layout",
    );
    expect(title.className).toMatch(/text-base/);
  });
});
