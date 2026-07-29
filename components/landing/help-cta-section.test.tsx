import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import HelpCTASection from "./help-cta-section";

describe("HelpCTASection", () => {
  it("renders the heading and buttons", () => {
    render(<HelpCTASection />);
    expect(
      screen.getByText("Still have questions? We're here to help"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /contact support/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /visit help center/i }),
    ).toBeInTheDocument();
  });

  it("has a gradient CTA button with contrast-more fallback classes", () => {
    render(<HelpCTASection />);
    const button = screen.getByRole("button", { name: /contact support/i });
    expect(button.className).toContain("bg-gradient-to-r");
    expect(button.className).toContain("contrast-more:bg-[#5B21B6]");
    expect(button.className).toContain("contrast-more:bg-none");
    expect(button.className).toContain("contrast-more:shadow-none");
    expect(button.className).toContain("contrast-more:hover:opacity-100");
  });

  it("renders the outline button with link", () => {
    render(<HelpCTASection />);
    const link = screen.getByRole("link", { name: /visit help center/i });
    expect(link).toHaveAttribute("href", "/help");
  });

  it("renders the heading with the correct id for aria-labelledby", () => {
    render(<HelpCTASection />);

    const heading = screen.getByRole("heading", {
      name: /Still have questions\? We're here to help/i,
    });
    expect(heading).toHaveAttribute("id", "help-cta-heading");
  });

  it("renders the section with aria-labelledby pointing to the heading", () => {
    render(<HelpCTASection />);

    const section = screen.getByRole("region");
    expect(section).toHaveAttribute("aria-labelledby", "help-cta-heading");
  });

  describe("keyboard focus visibility", () => {
    it('the "Contact Support" button has focus-visible ring styles using the --ring token', () => {
      render(<HelpCTASection />);

      const button = screen.getByRole("button", { name: /contact support/i });
      expect(button.className).toContain("focus-visible:ring-ring/50");
      expect(button.className).toContain("focus-visible:ring-[3px]");
      expect(button.className).toContain("focus-visible:border-ring");
      // outline-none is inherited from the base Button variant (components/ui/button.tsx)
      expect(button.className).toContain("outline-none");
    });

    it('the "Visit Help Center" link button has focus-visible ring styles using the --ring token', () => {
      render(<HelpCTASection />);

      const link = screen.getByRole("link", { name: /visit help center/i });
      expect(link.className).toContain("focus-visible:ring-ring/50");
      expect(link.className).toContain("focus-visible:ring-[3px]");
      expect(link.className).toContain("focus-visible:border-ring");
      // outline-none is inherited from the base Button variant (components/ui/button.tsx)
      expect(link.className).toContain("outline-none");
    });

    it("does not use hardcoded focus ring colors on the primary button", () => {
      render(<HelpCTASection />);

      const button = screen.getByRole("button", { name: /contact support/i });
      expect(button.className).not.toContain("focus-visible:ring-[#7C3AED]");
      expect(button.className).not.toContain("focus-visible:ring-offset-2");
    });

    it("does not use hardcoded focus ring colors on the outline button", () => {
      render(<HelpCTASection />);

      const link = screen.getByRole("link", { name: /visit help center/i });
      expect(link.className).not.toContain("focus-visible:ring-[#7C3AED]");
      expect(link.className).not.toContain("focus-visible:ring-offset-2");
    });
  });

  describe("keyboard navigation", () => {
    it("both CTAs are reachable in logical tab order — primary then secondary", async () => {
      const user = userEvent.setup();
      render(<HelpCTASection />);

      // Start with no focused element
      expect(document.body).toHaveFocus();

      // First Tab should focus the "Contact Support" button
      await user.tab();
      expect(
        screen.getByRole("button", { name: /contact support/i }),
      ).toHaveFocus();

      // Second Tab should move to the "Visit Help Center" link
      await user.tab();
      expect(
        screen.getByRole("link", { name: /visit help center/i }),
      ).toHaveFocus();
    });

    it("Shift+Tab moves focus in reverse — secondary then primary", async () => {
      const user = userEvent.setup();
      render(<HelpCTASection />);

      // Navigate to the link first
      await user.tab();
      await user.tab();
      expect(
        screen.getByRole("link", { name: /visit help center/i }),
      ).toHaveFocus();

      // Shift+Tab should go back to the button
      await user.tab({ shift: true });
      expect(
        screen.getByRole("button", { name: /contact support/i }),
      ).toHaveFocus();
    });
  });

  describe("responsive layout", () => {
    it("has responsive padding classes on the section", () => {
      render(<HelpCTASection />);

      const section = screen.getByRole("region");
      expect(section.className).toContain("px-4");
      expect(section.className).toContain("sm:px-6");
      expect(section.className).toContain("lg:px-8");
    });

    it("renders buttons with full-width on mobile and auto-width on larger screens", () => {
      render(<HelpCTASection />);

      const button = screen.getByRole("button", { name: /contact support/i });
      expect(button.className).toContain("w-full");
      expect(button.className).toContain("sm:w-auto");

      const link = screen.getByRole("link", { name: /visit help center/i });
      expect(link.className).toContain("w-full");
      expect(link.className).toContain("sm:w-auto");
    });

    it("renders the button container as a column on mobile and row on larger screens", () => {
      render(<HelpCTASection />);

      const section = screen.getByRole("region");
      const container = section.querySelector(".flex");
      expect(container?.className).toContain("flex-col");
      expect(container?.className).toContain("sm:flex-row");
    });
  });

  describe("dark mode", () => {
    it("has dark mode text color on the heading", () => {
      render(<HelpCTASection />);

      const heading = screen.getByRole("heading", {
        name: /Still have questions\?/i,
      });
      expect(heading.className).toContain("dark:text-[#FAFAFA]");
    });

    it("has dark mode background on the section", () => {
      render(<HelpCTASection />);

      const section = screen.getByRole("region");
      expect(section.className).toContain("dark:bg-[#040404]");
    });
  });

  describe("accessibility", () => {
    it("the section uses <section> with role='region'", () => {
      render(<HelpCTASection />);

      // The <section> element implicitly gets a region role when it has aria-labelledby
      expect(screen.getByRole("region").tagName).toBe("SECTION");
    });

    it("the heading has an accessible font size that scales across breakpoints", () => {
      render(<HelpCTASection />);

      const heading = screen.getByRole("heading", {
        name: /Still have questions\?/i,
      });
      expect(heading.className).toContain("text-2xl");
      expect(heading.className).toContain("sm:text-3xl");
      expect(heading.className).toContain("md:text-4xl");
    });
  });
});
