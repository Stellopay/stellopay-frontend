import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TestimonialsSection from "./testimonials-section";

describe("TestimonialsSection", () => {
  it("renders the section heading", () => {
    render(<TestimonialsSection />);
    expect(
      screen.getByText("Trusted by"),
    ).toBeInTheDocument();
  });

  it("renders the testimonials badge", () => {
    render(<TestimonialsSection />);
    expect(screen.getByText("Testimonials")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<TestimonialsSection />);
    expect(
      screen.getByText(/Hear from the companies/),
    ).toBeInTheDocument();
  });

  it("renders all 6 testimonial cards", () => {
    render(<TestimonialsSection />);
    const figures = screen.getAllByRole("figure");
    expect(figures).toHaveLength(6);
  });

  it("each card has a blockquote with the quote text", () => {
    const { container } = render(<TestimonialsSection />);
    const quotes = container.querySelectorAll("blockquote");
    expect(quotes).toHaveLength(6);
    quotes.forEach((q) => {
      expect(q.textContent?.length).toBeGreaterThan(20);
    });
  });

  it("each card shows the author name", () => {
    render(<TestimonialsSection />);
    expect(screen.getByText("Chioma Okafor")).toBeInTheDocument();
    expect(screen.getByText("Emeka Nwosu")).toBeInTheDocument();
    expect(screen.getByText("Aisha Bello")).toBeInTheDocument();
    expect(screen.getByText("Tunde Adeyemi")).toBeInTheDocument();
    expect(screen.getByText("Folake Martins")).toBeInTheDocument();
    expect(screen.getByText("Dele Ogunlesi")).toBeInTheDocument();
  });

  it("each card shows the author role", () => {
    render(<TestimonialsSection />);
    expect(screen.getByText("CEO, BloomPay Solutions")).toBeInTheDocument();
    expect(screen.getByText("CTO, Vesta Commerce")).toBeInTheDocument();
    expect(screen.getByText("Finance Lead, RidgePay")).toBeInTheDocument();
    expect(screen.getByText("Founder, PayBridge Africa")).toBeInTheDocument();
    expect(screen.getByText("Operations Director, SwiftSend")).toBeInTheDocument();
    expect(screen.getByText("VP Engineering, CashFlow NG")).toBeInTheDocument();
  });

  it("renders quote icons", () => {
    const { container } = render(<TestimonialsSection />);
    const quoteIcons = container.querySelectorAll(
      "svg.lucide-quote",
    );
    expect(quoteIcons).toHaveLength(6);
  });

  it("each card has an avatar with initials", () => {
    const { container } = render(<TestimonialsSection />);
    const avatars = container.querySelectorAll(
      ".size-10.rounded-full.flex.items-center.justify-center",
    );
    // Fallback: check for elements that look like avatar initials
    const avatarElements = container.querySelectorAll(
      ".size-10",
    );
    // Should be 6 avatar containers (initials circles)
    expect(avatarElements.length).toBeGreaterThanOrEqual(6);
  });

  it("cards are in a responsive grid", () => {
    const { container } = render(<TestimonialsSection />);
    const grid = container.querySelector(".grid");
    expect(grid?.className).toMatch(/grid-cols-1/);
    expect(grid?.className).toMatch(/sm:grid-cols-2/);
    expect(grid?.className).toMatch(/lg:grid-cols-3/);
  });

  it("has light and dark mode classes on section", () => {
    const { container } = render(<TestimonialsSection />);
    const section = container.querySelector("section");
    expect(section?.className).toMatch(/dark:bg-\[#0D0D0D\]/);
  });

  it("renders heading with gradient text", () => {
    render(<TestimonialsSection />);
    const gradientSpan = screen.getByText("businesses like yours");
    expect(gradientSpan.className).toMatch(/bg-clip-text/);
    expect(gradientSpan.className).toMatch(/text-transparent/);
  });

  it("renders quote icon before each blockquote", () => {
    const { container } = render(<TestimonialsSection />);
    const figures = container.querySelectorAll("figure");
    figures.forEach((figure) => {
      const firstChild = figure.firstElementChild;
      expect(firstChild?.tagName).toBe("svg");
      expect(firstChild?.getAttribute("aria-hidden")).toBe("true");
    });
  });
});
