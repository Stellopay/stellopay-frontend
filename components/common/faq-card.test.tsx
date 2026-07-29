import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FaqCard from "./faq-card";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
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

  it("uses role='button' and is keyboard-focusable", () => {
    render(<FaqCard {...defaultProps} />);
    const card = screen.getByRole("button", {
      name: /Account Management/i,
    });
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("tabIndex", "0");
  });

  it("has an aria-label that includes title and subtitle", () => {
    render(<FaqCard {...defaultProps} />);
    const card = screen.getByRole("button");
    expect(card).toHaveAttribute(
      "aria-label",
      "Account Management: Update your profile, reset your password, and manage your account.",
    );
  });

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

  it("renders text with theme-aware colors", () => {
    render(<FaqCard {...defaultProps} />);
    const title = screen.getByText("Account Management");
    expect(title.className).toMatch(/text-zinc-900/);
    expect(title.className).toMatch(/dark:text-white/);
  });

  it("renders long text without layout breakage", () => {
    render(
      <FaqCard
        title="A very long FAQ card title that should still wrap gracefully without breaking the layout"
        subtitle="This is an extremely long subtitle that goes on and on and on and on and on and on and on and on and on and on and on and on and on and on to test that the card handles overflow gracefully and the icon stays aligned with the title."
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
