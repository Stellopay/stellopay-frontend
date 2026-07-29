import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordStrengthIndicator } from "./password-strength-indicator";
import type { PasswordStrengthResult } from "@/utils/authUtils";

describe("PasswordStrengthIndicator", () => {
  const createStrengthResult = (
    strength: "weak" | "fair" | "strong",
    score: number,
    feedback: string
  ): PasswordStrengthResult => ({
    strength,
    score,
    feedback,
  });

  describe("accessibility", () => {
    it("has proper ARIA attributes", () => {
      const strengthResult = createStrengthResult("fair", 60, "Good start!");
      
      render(<PasswordStrengthIndicator strengthResult={strengthResult} />);
      
      // Check main container
      expect(screen.getByRole("region", { name: "Password strength indicator" })).toBeInTheDocument();
      
      // Check progress bar
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute("aria-valuenow", "60");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
      expect(progressBar).toHaveAttribute("aria-label", "Password strength: Fair");
      
      // Check live regions
      expect(screen.getByText("Fair")).toHaveAttribute("aria-live", "polite");
      expect(screen.getByText("Good start!")).toHaveAttribute("aria-live", "polite");
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("updates aria-live regions when strength changes", () => {
      const weakResult = createStrengthResult("weak", 20, "Use at least 8 characters");
      const { rerender } = render(<PasswordStrengthIndicator strengthResult={weakResult} />);
      
      expect(screen.getByText("Weak")).toHaveAttribute("aria-live", "polite");
      expect(screen.getByText("Use at least 8 characters")).toHaveAttribute("aria-live", "polite");
      
      const strongResult = createStrengthResult("strong", 85, "Strong password");
      rerender(<PasswordStrengthIndicator strengthResult={strongResult} />);
      
      expect(screen.getByText("Strong")).toHaveAttribute("aria-live", "polite");
      expect(screen.getByText("Strong password")).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("visual representation", () => {
    it("renders weak password with red styling", () => {
      const weakResult = createStrengthResult("weak", 25, "Add uppercase letters");
      
      render(<PasswordStrengthIndicator strengthResult={weakResult} />);
      
      expect(screen.getByText("Weak")).toHaveClass("text-red-400");
      expect(screen.getByText("Add uppercase letters")).toHaveClass("text-red-400");
      
      // Check progress bar width (minimum 10% for visibility)
      const progressBar = screen.getByRole("progressbar");
      const progressFill = progressBar.firstChild as HTMLElement;
      expect(progressFill).toHaveClass("bg-red-500");
    });

    it("renders fair password with yellow styling", () => {
      const fairResult = createStrengthResult("fair", 65, "Good start! Add numbers");
      
      render(<PasswordStrengthIndicator strengthResult={fairResult} />);
      
      expect(screen.getByText("Fair")).toHaveClass("text-yellow-400");
      expect(screen.getByText("Good start! Add numbers")).toHaveClass("text-yellow-400");
      
      const progressBar = screen.getByRole("progressbar");
      const progressFill = progressBar.firstChild as HTMLElement;
      expect(progressFill).toHaveClass("bg-yellow-500");
    });

    it("renders strong password with green styling", () => {
      const strongResult = createStrengthResult("strong", 90, "Strong password");
      
      render(<PasswordStrengthIndicator strengthResult={strongResult} />);
      
      expect(screen.getByText("Strong")).toHaveClass("text-green-400");
      expect(screen.getByText("Strong password")).toHaveClass("text-green-400");
      
      const progressBar = screen.getByRole("progressbar");
      const progressFill = progressBar.firstChild as HTMLElement;
      expect(progressFill).toHaveClass("bg-green-500");
    });

    it("applies minimum width for very low scores", () => {
      const veryWeakResult = createStrengthResult("weak", 5, "Use at least 8 characters");
      
      render(<PasswordStrengthIndicator strengthResult={veryWeakResult} />);
      
      const progressBar = screen.getByRole("progressbar");
      const progressFill = progressBar.firstChild as HTMLElement;
      
      // Should have minimum 10% width even for very low scores
      expect(progressFill).toHaveStyle({ width: "10%" });
    });

    it("shows correct width for various scores", () => {
      const testCases = [
        { score: 0, expectedWidth: "10%" }, // minimum width
        { score: 25, expectedWidth: "25%" },
        { score: 50, expectedWidth: "50%" },
        { score: 75, expectedWidth: "75%" },
        { score: 100, expectedWidth: "100%" },
      ];

      testCases.forEach(({ score, expectedWidth }) => {
        // Use "weak" strength for score 0 to ensure minimum width is applied
        const strength = score === 0 ? "weak" : "fair";
        const result = createStrengthResult(strength, score, "Test feedback");
        const { unmount } = render(<PasswordStrengthIndicator strengthResult={result} />);
        
        const progressBar = screen.getByRole("progressbar");
        const progressFill = progressBar.firstChild as HTMLElement;
        
        expect(progressFill).toHaveStyle({ width: expectedWidth });
        
        unmount(); // Clean up for next test
      });
    });
  });

  describe("feedback display", () => {
    it("shows feedback by default", () => {
      const result = createStrengthResult("fair", 60, "Good start! Add special characters");
      
      render(<PasswordStrengthIndicator strengthResult={result} />);
      
      expect(screen.getByText("Good start! Add special characters")).toBeInTheDocument();
    });

    it("hides feedback when showFeedback is false", () => {
      const result = createStrengthResult("fair", 60, "Good start! Add special characters");
      
      render(<PasswordStrengthIndicator strengthResult={result} showFeedback={false} />);
      
      expect(screen.queryByText("Good start! Add special characters")).not.toBeInTheDocument();
      expect(screen.getByText("Fair")).toBeInTheDocument(); // Strength label should still show
    });

    it("handles empty feedback gracefully", () => {
      const result = createStrengthResult("strong", 85, "");
      
      render(<PasswordStrengthIndicator strengthResult={result} />);
      
      expect(screen.getByText("Strong")).toBeInTheDocument();
      // Should not crash with empty feedback
    });
  });

  describe("custom styling", () => {
    it("applies custom className", () => {
      const result = createStrengthResult("fair", 60, "Test feedback");
      
      render(<PasswordStrengthIndicator strengthResult={result} className="custom-class" />);
      
      const container = screen.getByRole("region", { name: "Password strength indicator" });
      expect(container).toHaveClass("custom-class");
      expect(container).toHaveClass("space-y-2"); // Should maintain default classes too
    });

    it("maintains proper structure with custom styling", () => {
      const result = createStrengthResult("weak", 30, "Add uppercase letters");
      
      render(
        <PasswordStrengthIndicator 
          strengthResult={result} 
          className="mt-4 p-2 border" 
          showFeedback={true}
        />
      );
      
      const container = screen.getByRole("region", { name: "Password strength indicator" });
      expect(container).toHaveClass("mt-4", "p-2", "border", "space-y-2");
      
      // Verify internal structure is intact
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.getByText("Weak")).toBeInTheDocument();
      expect(screen.getByText("Add uppercase letters")).toBeInTheDocument();
    });
  });

  describe("strength transitions", () => {
    it("handles strength level changes smoothly", () => {
      const weakResult = createStrengthResult("weak", 20, "Use at least 8 characters");
      const { rerender } = render(<PasswordStrengthIndicator strengthResult={weakResult} />);
      
      // Initial weak state
      expect(screen.getByText("Weak")).toHaveClass("text-red-400");
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "20");
      
      // Transition to fair
      const fairResult = createStrengthResult("fair", 60, "Good start! Add special characters");
      rerender(<PasswordStrengthIndicator strengthResult={fairResult} />);
      
      expect(screen.getByText("Fair")).toHaveClass("text-yellow-400");
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "60");
      
      // Transition to strong
      const strongResult = createStrengthResult("strong", 85, "Strong password");
      rerender(<PasswordStrengthIndicator strengthResult={strongResult} />);
      
      expect(screen.getByText("Strong")).toHaveClass("text-green-400");
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "85");
    });
  });

  describe("text-based strength indication", () => {
    it("provides text labels that are not color-dependent", () => {
      const testCases = [
        { strength: "weak" as const, expectedLabel: "Weak" },
        { strength: "fair" as const, expectedLabel: "Fair" },
        { strength: "strong" as const, expectedLabel: "Strong" },
      ];

      testCases.forEach(({ strength, expectedLabel }) => {
        const result = createStrengthResult(strength, 50, "Test feedback");
        const { rerender } = render(<PasswordStrengthIndicator strengthResult={result} />);
        
        const label = screen.getByText(expectedLabel);
        expect(label).toBeInTheDocument();
        expect(label).toHaveClass("text-sm", "font-medium", "min-w-[4rem]");
        
        rerender(<div />); // Clear for next test
      });
    });

    it("ensures text is readable and accessible", () => {
      const result = createStrengthResult("fair", 65, "Good progress!");
      
      render(<PasswordStrengthIndicator strengthResult={result} />);
      
      const strengthLabel = screen.getByText("Fair");
      const feedback = screen.getByText("Good progress!");
      
      // Check that text has appropriate sizing and contrast classes
      expect(strengthLabel).toHaveClass("text-sm", "font-medium");
      expect(feedback).toHaveClass("text-xs");
      
      // Verify aria-live for screen readers
      expect(strengthLabel).toHaveAttribute("aria-live", "polite");
      expect(feedback).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("edge cases", () => {
    it("handles extreme score values", () => {
      const extremeCases = [
        { score: -10, strength: "weak" as const },
        { score: 0, strength: "weak" as const },
        { score: 150, strength: "strong" as const }, // Over 100
      ];

      extremeCases.forEach(({ score, strength }) => {
        const result = createStrengthResult(strength, score, "Test feedback");
        
        const { unmount } = render(<PasswordStrengthIndicator strengthResult={result} />);
        
        const progressBar = screen.getByRole("progressbar");
        expect(progressBar).toHaveAttribute("aria-valuenow", score.toString());
        
        unmount(); // Clean up for next test
      });
    });

    it("handles long feedback messages", () => {
      const longFeedback = "This is a very long feedback message that should still display properly without breaking the layout or causing accessibility issues";
      const result = createStrengthResult("fair", 60, longFeedback);
      
      render(<PasswordStrengthIndicator strengthResult={result} />);
      
      expect(screen.getByText(longFeedback)).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });
});