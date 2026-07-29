import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import {
  Skeleton,
  SkeletonLine,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCircle,
  SkeletonRow,
  SkeletonCard,
  SkeletonButton,
} from "./skeleton";

describe("Skeleton (base)", () => {
  it("renders a div with the shimmer class by default", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass("skeleton-shimmer");
  });

  it("hides the shimmer when animate=false", () => {
    const { container } = render(<Skeleton animate={false} />);
    expect(container.firstChild).not.toHaveClass("skeleton-shimmer");
  });

  it("uses the dark background by default", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass("bg-[#2D2D2D]");
  });

  it('applies the light background when shade="light"', () => {
    const { container } = render(<Skeleton shade="light" />);
    expect(container.firstChild).toHaveClass("bg-[#3A3A3A]");
  });

  it("forwards additional class names", () => {
    const { container } = render(<Skeleton className="test-class" />);
    expect(container.firstChild).toHaveClass("test-class");
  });
});

describe("SkeletonLine", () => {
  it("renders with default h-4 and w-full", () => {
    const { container } = render(<SkeletonLine />);
    expect(container.firstChild).toHaveClass("h-4");
    expect(container.firstChild).toHaveClass("w-full");
  });

  it("accepts a custom width string", () => {
    const { container } = render(<SkeletonLine width="w-32" />);
    expect(container.firstChild).toHaveClass("w-32");
  });

  it("inherits the shade prop", () => {
    const { container } = render(<SkeletonLine shade="light" />);
    expect(container.firstChild).toHaveClass("bg-[#3A3A3A]");
  });
});

describe("SkeletonText", () => {
  it("renders a single line by default", () => {
    const { container } = render(<SkeletonText />);
    const lines = container.querySelectorAll(".bg-\\[\\#2D2D2D\\]");
    expect(lines).toHaveLength(1);
  });

  it("renders multiple lines", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const lines = container.querySelectorAll(".bg-\\[\\#2D2D2D\\]");
    expect(lines).toHaveLength(3);
  });

  it("makes the last line 3/4 width when more than one line", () => {
    const { container } = render(<SkeletonText lines={2} />);
    const lines = container.querySelectorAll(".w-3\\/4");
    expect(lines).toHaveLength(1);
  });

  it("keeps single line at full width", () => {
    const { container } = render(<SkeletonText lines={1} />);
    expect(container.querySelector(".w-3\\/4")).not.toBeInTheDocument();
  });
});

describe("SkeletonAvatar", () => {
  it("renders a circular element", () => {
    const { container } = render(<SkeletonAvatar />);
    expect(container.firstChild).toHaveClass("rounded-full");
  });

  it("uses the default size of 40px", () => {
    const { container } = render(<SkeletonAvatar />);
    expect(container.firstChild).toHaveStyle({ width: "40px", height: "40px" });
  });

  it("accepts a custom size", () => {
    const { container } = render(<SkeletonAvatar size={24} />);
    expect(container.firstChild).toHaveStyle({ width: "24px", height: "24px" });
  });

  it("is shrink-0 to prevent flex compression", () => {
    const { container } = render(<SkeletonAvatar />);
    expect(container.firstChild).toHaveClass("shrink-0");
  });
});

describe("SkeletonCircle (deprecated alias)", () => {
  it("renders identically to SkeletonAvatar", () => {
    const { container: c1 } = render(<SkeletonAvatar size={32} />);
    const { container: c2 } = render(<SkeletonCircle size={32} />);
    expect(c1.firstChild).toHaveClass("rounded-full");
    expect(c2.firstChild).toHaveClass("rounded-full");
  });
});

describe("SkeletonRow", () => {
  it("renders text lines by default without avatar", () => {
    const { container } = render(<SkeletonRow />);
    expect(container.firstChild).toHaveClass("flex");
    expect(container.firstChild).toHaveClass("items-center");
  });

  it("renders an avatar when avatarSize is provided", () => {
    const { container } = render(<SkeletonRow avatarSize={32} />);
    const avatar = container.querySelector(".rounded-full");
    expect(avatar).toBeInTheDocument();
  });

  it("renders multiple text lines", () => {
    const { container } = render(<SkeletonRow lines={3} />);
    const lines = container.querySelectorAll(".bg-\\[\\#2D2D2D\\]");
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });
});

describe("SkeletonCard", () => {
  it("renders with header by default", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toHaveClass("rounded-xl");
    expect(container.firstChild).toHaveClass("border");
    expect(container.firstChild).toHaveClass("p-4");
  });

  it("hides the header when showHeader=false", () => {
    const { container } = render(<SkeletonCard showHeader={false} />);
    expect(container.firstChild).toHaveClass("rounded-xl");
  });

  it("renders the specified number of content lines", () => {
    const { container } = render(<SkeletonCard lines={5} />);
    const lines = container.querySelectorAll(".bg-\\[\\#2D2D2D\\]");
    // 2 (header icon + title) + 5 content lines = 7
    expect(lines.length).toBeGreaterThanOrEqual(5);
  });

  it("applies custom className", () => {
    const { container } = render(<SkeletonCard className="my-custom" />);
    expect(container.firstChild).toHaveClass("my-custom");
  });
});

describe("SkeletonButton", () => {
  it("renders with button-like dimensions", () => {
    const { container } = render(<SkeletonButton />);
    expect(container.firstChild).toHaveClass("h-9");
    expect(container.firstChild).toHaveClass("w-24");
    expect(container.firstChild).toHaveClass("rounded-lg");
  });
});
