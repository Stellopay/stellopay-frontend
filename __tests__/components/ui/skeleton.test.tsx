import { render, screen } from "@testing-library/react";
import {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonButton,
} from "@/components/ui/skeleton";

describe("Skeleton Component", () => {
  describe("Base Skeleton", () => {
    it("renders with default props", () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass("rounded-md");
      expect(skeleton).toHaveClass("bg-[#2D2D2D]"); // dark shade default
    });

    it("renders with light shade", () => {
      render(<Skeleton data-testid="skeleton" shade="light" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("bg-[#3A3A3A]");
    });

    it("renders with dark shade", () => {
      render(<Skeleton data-testid="skeleton" shade="dark" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("bg-[#2D2D2D]");
    });

    it("includes shimmer animation class when animate is true", () => {
      render(<Skeleton data-testid="skeleton" animate={true} />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("skeleton-shimmer");
    });

    it("excludes shimmer animation class when animate is false", () => {
      render(<Skeleton data-testid="skeleton" animate={false} />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).not.toHaveClass("skeleton-shimmer");
    });

    it("accepts custom className", () => {
      render(<Skeleton data-testid="skeleton" className="w-full h-4" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("w-full");
      expect(skeleton).toHaveClass("h-4");
    });
  });

  describe("SkeletonText", () => {
    it("renders single line by default", () => {
      const { container } = render(<SkeletonText data-testid="skeleton-text" />);
      const skeletons = container.querySelectorAll(".skeleton-shimmer");
      expect(skeletons).toHaveLength(1);
    });

    it("renders multiple lines when specified", () => {
      const { container } = render(
        <SkeletonText data-testid="skeleton-text" lines={3} />
      );
      const skeletons = container.querySelectorAll(".skeleton-shimmer");
      expect(skeletons).toHaveLength(3);
    });

    it("last line has shorter width when multiple lines", () => {
      const { container } = render(
        <SkeletonText data-testid="skeleton-text" lines={3} />
      );
      const skeletons = container.querySelectorAll(".skeleton-shimmer");
      const lastSkeleton = skeletons[skeletons.length - 1];
      expect(lastSkeleton).toHaveClass("w-3/4");
    });
  });

  describe("SkeletonCircle", () => {
    it("renders with default size", () => {
      render(<SkeletonCircle data-testid="skeleton-circle" />);
      const skeleton = screen.getByTestId("skeleton-circle");
      expect(skeleton).toHaveClass("rounded-full");
      expect(skeleton).toHaveStyle({ width: "40px", height: "40px" });
    });

    it("renders with custom size", () => {
      render(<SkeletonCircle data-testid="skeleton-circle" size={60} />);
      const skeleton = screen.getByTestId("skeleton-circle");
      expect(skeleton).toHaveStyle({ width: "60px", height: "60px" });
    });
  });

  describe("SkeletonButton", () => {
    it("renders with default styles", () => {
      render(<SkeletonButton data-testid="skeleton-button" />);
      const skeleton = screen.getByTestId("skeleton-button");
      expect(skeleton).toHaveClass("h-9");
      expect(skeleton).toHaveClass("w-24");
      expect(skeleton).toHaveClass("rounded-lg");
    });

    it("accepts custom className", () => {
      render(
        <SkeletonButton data-testid="skeleton-button" className="w-32 h-12" />
      );
      const skeleton = screen.getByTestId("skeleton-button");
      expect(skeleton).toHaveClass("w-32");
      expect(skeleton).toHaveClass("h-12");
    });
  });
});
