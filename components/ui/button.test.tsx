import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button, buttonVariants } from "./button";

describe("Button — rendering", () => {
  it("renders its children as a native button element by default", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button.tagName).toBe("BUTTON");
  });

  it("applies the default variant and size classes when none are specified", () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole("button", { name: "Default" });
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("text-primary-foreground");
    expect(button).toHaveClass("h-9");
  });

  it("merges a custom className with the variant classes", () => {
    render(<Button className="w-full">Full width</Button>);
    const button = screen.getByRole("button", { name: "Full width" });
    expect(button).toHaveClass("w-full");
    expect(button).toHaveClass("bg-primary");
  });
});

describe("Button — variants", () => {
  it.each([
    ["default", "bg-primary"],
    ["destructive", "bg-destructive"],
    ["outline", "bg-background"],
    ["secondary", "bg-secondary"],
    ["ghost", "hover:bg-accent"],
    ["link", "text-primary"],
  ] as const)("applies the %s variant classes", (variant, expectedClass) => {
    render(<Button variant={variant}>{variant}</Button>);
    expect(screen.getByRole("button", { name: variant })).toHaveClass(
      expectedClass,
    );
  });
});

describe("Button — sizes", () => {
  it.each([
    ["default", "h-9"],
    ["sm", "h-8"],
    ["lg", "h-10"],
    ["icon", "size-9"],
  ] as const)("applies the %s size classes", (size, expectedClass) => {
    render(<Button size={size}>{size}</Button>);
    expect(screen.getByRole("button", { name: size })).toHaveClass(
      expectedClass,
    );
  });
});

describe("Button — interaction", () => {
  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Submit
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("passes through the native type attribute", () => {
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "type",
      "submit",
    );
  });
});

describe("Button — asChild", () => {
  it("renders its child element instead of a button when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/somewhere">Go</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Go" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveClass("bg-primary");
  });
});

describe("buttonVariants", () => {
  it("returns the base classes plus the requested variant/size", () => {
    const classes = buttonVariants({ variant: "outline", size: "sm" });
    expect(classes).toContain("border");
    expect(classes).toContain("h-8");
  });
});
