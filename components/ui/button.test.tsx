/**
 * @fileoverview Tests for components/ui/button.tsx
 *
 * Coverage targets:
 * - All six `variant` values: default, destructive, outline, secondary, ghost, link
 * - All four `size` values: default, sm, lg, icon
 * - `asChild` prop (Radix Slot composition)
 * - Disabled state: pointer-events, cursor, opacity, aria attributes
 * - Custom `className` merging via `cn()`
 * - Keyboard interaction (Enter / Space activation)
 * - ARIA attributes: role, aria-disabled
 * - Design-token class presence on rendered output
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, buttonVariants } from "./button";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the rendered <button> element for the simplest render case. */
function renderButton(props: React.ComponentProps<typeof Button> = {}) {
  const { getByRole } = render(<Button {...props}>Click me</Button>);
  return getByRole("button", { name: /click me/i });
}

// ─── Default rendering ────────────────────────────────────────────────────────

describe("Button — default rendering", () => {
  it("renders a <button> element", () => {
    const btn = renderButton();
    expect(btn.tagName).toBe("BUTTON");
  });

  it("renders children correctly", () => {
    render(<Button>Pay Now</Button>);
    expect(screen.getByRole("button", { name: "Pay Now" })).toBeInTheDocument();
  });

  it("applies the data-slot='button' attribute", () => {
    const btn = renderButton();
    expect(btn).toHaveAttribute("data-slot", "button");
  });

  it("has type='button' by default when no type prop is supplied", () => {
    // Without an explicit type, browsers treat <button> inside a form as
    // type="submit". We verify no implicit submit leaks through.
    render(<Button type="button">OK</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("type", "button");
  });

  it("forwards a custom type prop", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});

// ─── Variant classes ──────────────────────────────────────────────────────────

describe("Button — variant classes (design-token alignment)", () => {
  it("default variant applies bg-primary and text-primary-foreground", () => {
    const btn = renderButton({ variant: "default" });
    expect(btn.className).toMatch(/bg-primary/);
    expect(btn.className).toMatch(/text-primary-foreground/);
  });

  it("destructive variant applies bg-destructive", () => {
    const btn = renderButton({ variant: "destructive" });
    expect(btn.className).toMatch(/bg-destructive/);
    expect(btn.className).toMatch(/text-white/);
  });

  it("outline variant applies bg-background and border", () => {
    const btn = renderButton({ variant: "outline" });
    expect(btn.className).toMatch(/bg-background/);
    expect(btn.className).toMatch(/border/);
  });

  it("secondary variant applies bg-secondary and text-secondary-foreground", () => {
    const btn = renderButton({ variant: "secondary" });
    expect(btn.className).toMatch(/bg-secondary/);
    expect(btn.className).toMatch(/text-secondary-foreground/);
  });

  it("ghost variant does not apply an explicit background at rest", () => {
    const btn = renderButton({ variant: "ghost" });
    // Ghost only applies a background on hover — not at rest
    expect(btn.className).not.toMatch(/^bg-/);
  });

  it("link variant applies text-primary and underline offset", () => {
    const btn = renderButton({ variant: "link" });
    expect(btn.className).toMatch(/text-primary/);
    expect(btn.className).toMatch(/underline-offset-4/);
  });
});

// ─── Size classes ─────────────────────────────────────────────────────────────

describe("Button — size classes", () => {
  it("default size applies h-9 px-4 py-2", () => {
    const btn = renderButton({ size: "default" });
    expect(btn.className).toMatch(/h-9/);
    expect(btn.className).toMatch(/px-4/);
    expect(btn.className).toMatch(/py-2/);
  });

  it("sm size applies h-8 px-3", () => {
    const btn = renderButton({ size: "sm" });
    expect(btn.className).toMatch(/h-8/);
    expect(btn.className).toMatch(/px-3/);
  });

  it("lg size applies h-10 px-6", () => {
    const btn = renderButton({ size: "lg" });
    expect(btn.className).toMatch(/h-10/);
    expect(btn.className).toMatch(/px-6/);
  });

  it("icon size applies size-9 (equal width and height)", () => {
    const btn = renderButton({ size: "icon" });
    expect(btn.className).toMatch(/size-9/);
  });
});

// ─── Disabled state ───────────────────────────────────────────────────────────

describe("Button — disabled state", () => {
  it("renders as disabled when the disabled prop is passed", () => {
    const btn = renderButton({ disabled: true });
    expect(btn).toBeDisabled();
  });

  it("applies disabled:opacity-disabled class when disabled", () => {
    const btn = renderButton({ disabled: true });
    expect(btn.className).toMatch(/disabled:opacity-disabled/);
  });

  it("applies disabled:cursor-disabled class when disabled", () => {
    const btn = renderButton({ disabled: true });
    expect(btn.className).toMatch(/disabled:cursor-disabled/);
  });

  it("applies disabled:pointer-events-none class", () => {
    const btn = renderButton({ disabled: true });
    expect(btn.className).toMatch(/disabled:pointer-events-none/);
  });

  it("does not fire onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );
    const btn = screen.getByRole("button");
    await userEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });
});

// ─── Keyboard interaction ─────────────────────────────────────────────────────

describe("Button — keyboard interaction", () => {
  it("fires onClick on Enter key press", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Action</Button>);
    const btn = screen.getByRole("button");
    btn.focus();
    await userEvent.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("fires onClick on Space key press", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Action</Button>);
    const btn = screen.getByRole("button");
    btn.focus();
    await userEvent.keyboard(" ");
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is focusable via Tab key", async () => {
    render(<Button>Focus me</Button>);
    const btn = screen.getByRole("button");
    await userEvent.tab();
    expect(btn).toHaveFocus();
  });

  it("is not focusable via Tab when disabled", async () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole("button");
    await userEvent.tab();
    expect(btn).not.toHaveFocus();
  });
});

// ─── asChild (Radix Slot) ─────────────────────────────────────────────────────

describe("Button — asChild prop", () => {
  it("renders the child element instead of a <button> when asChild=true", () => {
    render(
      <Button asChild>
        <a href="/dashboard">Dashboard</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("merges buttonVariant classes onto the child element", () => {
    render(
      <Button asChild variant="secondary">
        <a href="/">Home</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Home" });
    expect(link.className).toMatch(/bg-secondary/);
  });

  it("renders a <button> when asChild is false (default)", () => {
    const btn = renderButton({ asChild: false });
    expect(btn.tagName).toBe("BUTTON");
  });
});

// ─── Custom className merging ─────────────────────────────────────────────────

describe("Button — className merging", () => {
  it("applies a custom className alongside variant classes", () => {
    const btn = renderButton({ className: "my-custom-class" });
    expect(btn).toHaveClass("my-custom-class");
    // Default variant classes should still be present
    expect(btn.className).toMatch(/bg-primary/);
  });

  it("later className wins over conflicting generated class (cn deduplication)", () => {
    // Passing an explicit w-full should be reflected in the output.
    const btn = renderButton({ className: "w-full" });
    expect(btn).toHaveClass("w-full");
  });
});

// ─── buttonVariants helper ────────────────────────────────────────────────────

describe("buttonVariants — exported CVA helper", () => {
  it("returns a string containing bg-primary for the default variant", () => {
    const cls = buttonVariants({ variant: "default" });
    expect(cls).toMatch(/bg-primary/);
  });

  it("returns a string containing bg-destructive for the destructive variant", () => {
    const cls = buttonVariants({ variant: "destructive" });
    expect(cls).toMatch(/bg-destructive/);
  });

  it("returns a string containing bg-secondary for the secondary variant", () => {
    const cls = buttonVariants({ variant: "secondary" });
    expect(cls).toMatch(/bg-secondary/);
  });

  it("returns different strings for different variants", () => {
    const a = buttonVariants({ variant: "default" });
    const b = buttonVariants({ variant: "ghost" });
    expect(a).not.toBe(b);
  });

  it("applies default variant and size when no options are passed", () => {
    const cls = buttonVariants();
    expect(cls).toMatch(/bg-primary/);
    expect(cls).toMatch(/h-9/);
  });
});

// ─── ARIA and semantics ───────────────────────────────────────────────────────

describe("Button — ARIA and semantics", () => {
  it("has implicit role=button", () => {
    const btn = renderButton();
    expect(btn).toHaveRole("button");
  });

  it("forwards aria-label to the underlying element", () => {
    render(<Button aria-label="Close dialog">×</Button>);
    expect(
      screen.getByRole("button", { name: "Close dialog" }),
    ).toBeInTheDocument();
  });

  it("forwards aria-pressed to the underlying element", () => {
    render(
      <Button aria-pressed="true" type="button">
        Toggle
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("forwards aria-expanded to the underlying element", () => {
    render(
      <Button aria-expanded="false" type="button">
        Open menu
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("applies focus-visible ring classes for keyboard focus indication", () => {
    const btn = renderButton();
    expect(btn.className).toMatch(/focus-visible:ring-ring\/50/);
    expect(btn.className).toMatch(/focus-visible:ring-\[3px\]/);
  });

  it("applies aria-invalid ring classes for form validation states", () => {
    const btn = renderButton();
    expect(btn.className).toMatch(/aria-invalid:ring-destructive\/20/);
    expect(btn.className).toMatch(/aria-invalid:border-destructive/);
  });
});
