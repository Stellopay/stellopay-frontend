import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import React from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "./card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Hello</Card>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders with default elevation-1 when no elevation prop is given", () => {
    const { container } = render(<Card>Default</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass("shadow-elevation-1");
  });

  it.each([1, 2, 3, 4] as const)(
    "applies shadow-elevation-%s when elevation=%s",
    (elevation) => {
      const { container } = render(
        <Card elevation={elevation}>Elevation {elevation}</Card>,
      );
      expect(container.firstChild).toHaveClass(`shadow-elevation-${elevation}`);
    },
  );

  it("applies extra className alongside elevation classes", () => {
    const { container } = render(
      <Card className="dark:bg-slate-800 rtl:mr-4">Custom</Card>,
    );
    expect(container.firstChild).toHaveClass("dark:bg-slate-800", "rtl:mr-4");
    expect(container.firstChild).toHaveClass("shadow-elevation-1");
  });

  it("sets data-slot attribute", () => {
    render(<Card>Slot</Card>);
    expect(screen.getByText("Slot")).toHaveAttribute("data-slot", "card");
  });
});

describe("Card sub-components", () => {
  it("renders CardHeader", () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders CardTitle", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText("Title")).toBeInTheDocument();
  });

  it("renders CardDescription", () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("renders CardContent", () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders CardFooter", () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders CardAction", () => {
    render(<CardAction>Action</CardAction>);
    expect(screen.getByText("Action")).toBeInTheDocument();
  });
});
