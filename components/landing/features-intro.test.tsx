import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeaturesIntro } from "./features-intro";

describe("FeaturesIntro", () => {
  describe("default rendering", () => {
    it("renders the intro header with default tag, headline, and paragraph", () => {
      render(<FeaturesIntro />);

      expect(
        screen.getByText("Features That Make Us Different"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Everything you need to/),
      ).toBeInTheDocument();
      expect(
        screen.getByText("scale your business"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Built for modern businesses. Designed for global payments. Powered by blockchain technology./,
        ),
      ).toBeInTheDocument();
    });

    it("renders the four default feature cards", () => {
      render(<FeaturesIntro />);

      expect(screen.getByText("Secure Transactions")).toBeInTheDocument();
      expect(screen.getByText("Instant Payments")).toBeInTheDocument();
      expect(screen.getByText("User Friendly Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Real-Time Notifications")).toBeInTheDocument();
    });

    it("renders a section with id='KeyFeatures' for anchor linking", () => {
      render(<FeaturesIntro />);

      const section = document.getElementById("KeyFeatures");
      expect(section).toBeInTheDocument();
      expect(section?.tagName).toBe("SECTION");
    });
  });

  describe("custom props", () => {
    it("renders custom tag, headline, and paragraph", () => {
      render(
        <FeaturesIntro
          tag="Our Differentiators"
          headlinePrefix="Built to"
          headlineGradient="empower teams"
          paragraph="A custom paragraph about the product."
        />,
      );

      expect(screen.getByText("Our Differentiators")).toBeInTheDocument();
      expect(screen.getByText(/Built to/)).toBeInTheDocument();
      expect(screen.getByText("empower teams")).toBeInTheDocument();
      expect(
        screen.getByText("A custom paragraph about the product."),
      ).toBeInTheDocument();
    });

    it("renders custom feature cards", () => {
      const customFeatures = [
        {
          imageSrc: "/test.svg",
          title: "Custom Feature 1",
          description: "Custom description 1",
        },
        {
          imageSrc: "/test2.svg",
          title: "Custom Feature 2",
          description: "Custom description 2",
        },
      ];

      render(<FeaturesIntro features={customFeatures} />);

      expect(screen.getByText("Custom Feature 1")).toBeInTheDocument();
      expect(screen.getByText("Custom Feature 2")).toBeInTheDocument();
      expect(
        screen.queryByText("Secure Transactions"),
      ).not.toBeInTheDocument();
    });

    it("accepts a custom section id", () => {
      render(<FeaturesIntro id="custom-features-section" />);

      expect(
        document.getElementById("custom-features-section"),
      ).toBeInTheDocument();
      expect(
        document.getElementById("KeyFeatures"),
      ).not.toBeInTheDocument();
    });

    it("renders no feature cards when passed an empty array", () => {
      render(<FeaturesIntro features={[]} />);

      expect(
        screen.queryByText("Secure Transactions"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("Features That Make Us Different"),
      ).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("renders the tag as readable text content", () => {
      render(<FeaturesIntro />);

      expect(
        screen.getByText("Features That Make Us Different"),
      ).toBeInTheDocument();
    });

    it("renders feature card images with alt text", () => {
      render(<FeaturesIntro />);

      const images = screen.getAllByRole("img");
      expect(images.length).toBeGreaterThanOrEqual(4);

      const altTexts = images.map((img) => img.getAttribute("alt"));
      expect(altTexts).toContain("Secure Transactions");
      expect(altTexts).toContain("Instant Payments");
    });
  });

  describe("dark mode", () => {
    it("applies dark mode background and text classes to the section", () => {
      render(<FeaturesIntro />);

      const section = document.getElementById("KeyFeatures");
      expect(section).not.toBeNull();
      // The section has dark mode transition classes
      expect(section!.className).toContain("dark:bg-[#040404]");
      expect(section!.className).toContain("transition-colors");
    });
  });
});
