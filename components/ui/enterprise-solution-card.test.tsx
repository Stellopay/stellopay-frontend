import { render, screen } from "@testing-library/react";
import EnterpriseSolutionCard from "./enterprise-solution-card";

describe("EnterpriseSolutionCard", () => {
  it("renders correctly with given value and label", () => {
    render(
      <EnterpriseSolutionCard
        value="10k+"
        label="Active Users"
        className="test-class"
      />
    );
    expect(screen.getByText("10k+")).toBeInTheDocument();
    expect(screen.getByText("Active Users")).toBeInTheDocument();
  });

  it("applies the custom className to the value element", () => {
    render(
      <EnterpriseSolutionCard
        value="10k+"
        label="Active Users"
        className="text-red-500"
      />
    );
    const valueElement = screen.getByText("10k+");
    expect(valueElement).toHaveClass("text-red-500");
  });

  it("applies correct semantic tokens for borders and text", () => {
    const { container } = render(
      <EnterpriseSolutionCard
        value="10k+"
        label="Active Users"
        className="test-class"
      />
    );
    
    // Check border token
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass("border-border");
    
    // Check text token
    const labelElement = screen.getByText("Active Users");
    expect(labelElement).toHaveClass("text-muted-foreground");
  });
});
