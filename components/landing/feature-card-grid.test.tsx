import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FeatureCardGrid } from "./feature-card-grid";
import { Shield } from "lucide-react";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      article: ({ children, className, ...props }: any) => (
        <article className={className} data-testid="motion-article" {...props}>
          {children}
        </article>
      ),
    },
  };
});

describe("FeatureCardGrid", () => {
  const mockProps = {
    icon: Shield,
    title: "Test Feature",
    description: "This is a test feature description.",
    link: "/test",
    index: 0,
  };

  it("renders correctly with given props", () => {
    render(<FeatureCardGrid {...mockProps} />);
    
    expect(screen.getByText("Test Feature")).toBeInTheDocument();
    expect(screen.getByText("This is a test feature description.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Learn more/i })).toHaveAttribute("href", "/test");
  });

  it("applies the motion wrapper", () => {
    render(<FeatureCardGrid {...mockProps} />);
    expect(screen.getByTestId("motion-article")).toBeInTheDocument();
  });

  it("renders with correct accessibility elements", () => {
    render(<FeatureCardGrid {...mockProps} />);
    
    // Check if the article tag is present (via our mock)
    const article = screen.getByTestId("motion-article");
    expect(article).toBeInTheDocument();

    // Link should be accessible
    const link = screen.getByRole("link", { name: /Learn more/i });
    expect(link).toBeInTheDocument();
  });

  it("marks decorative icon as aria-hidden", () => {
    const { container } = render(<FeatureCardGrid {...mockProps} />);
    
    // The icon container should be aria-hidden
    const iconContainers = container.querySelectorAll('[aria-hidden="true"]');
    expect(iconContainers.length).toBeGreaterThanOrEqual(1);
  });
});
