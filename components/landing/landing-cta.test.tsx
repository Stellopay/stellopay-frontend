import { type ReactElement, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  LandingCta,
  LandingCtaInputError,
  MAX_HEADING_LENGTH,
  MAX_SUBTEXT_LENGTH,
  validateLandingCtaInput,
  type LandingCtaField,
  type LandingCtaInputErrorCode,
} from "./landing-cta";

const VALID_HEADING = "Ready to revolutionize your payments?";
const VALID_SUBTEXT =
  "Start accepting crypto payments today and join the future of global commerce.";

function validProps() {
  return { heading: VALID_HEADING, subtext: VALID_SUBTEXT };
}

function oversized(field: "heading" | "subtext"): string {
  const length = field === "heading" ? MAX_HEADING_LENGTH : MAX_SUBTEXT_LENGTH;
  return `${field} ${"x".repeat(length)}`.slice(0, length + 1);
}

/** Renders and returns the typed rejection, failing the test if none is thrown. */
function catchRender(ui: ReactElement): LandingCtaInputError {
  let caught: unknown;
  try {
    render(ui);
  } catch (error) {
    caught = error;
  }
  expect(caught, "render must reject the invalid input").toBeInstanceOf(
    LandingCtaInputError,
  );
  return caught as LandingCtaInputError;
}

function expectRejection(
  error: LandingCtaInputError,
  field: LandingCtaField,
  code: LandingCtaInputErrorCode,
): void {
  expect(error).toBeInstanceOf(Error);
  expect(error.name).toBe("LandingCtaInputError");
  expect(error.field).toBe(field);
  expect(error.code).toBe(code);
}

describe("LandingCta — valid input is unaffected", () => {
  it("renders heading, subtext and children", () => {
    render(
      <LandingCta {...validProps()}>
        <button type="button">Get started</button>
      </LandingCta>,
    );

    expect(
      screen.getByRole("heading", { name: VALID_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByText(VALID_SUBTEXT)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Get started" }),
    ).toBeInTheDocument();
  });

  it("keeps children interactive", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <LandingCta {...validProps()}>
        <button type="button" onClick={onClick}>
          Get started
        </button>
      </LandingCta>,
    );

    await user.click(screen.getByRole("button", { name: "Get started" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies aria-labelledby to the section and merges className", () => {
    render(
      <LandingCta
        {...validProps()}
        ariaLabelledby="cta-heading"
        className="extra"
      >
        <button type="button">Get started</button>
      </LandingCta>,
    );

    const section = screen.getByRole("region");
    expect(section).toHaveAttribute("aria-labelledby", "cta-heading");
    expect(section.className).toContain("extra");
    expect(section.className).toContain("bg-white");
  });

  it("accepts copy exactly at the length limits", () => {
    expect(() =>
      validateLandingCtaInput(
        "h".repeat(MAX_HEADING_LENGTH),
        "s".repeat(MAX_SUBTEXT_LENGTH),
      ),
    ).not.toThrow();
  });
});

describe("validateLandingCtaInput — typed rejections", () => {
  it("rejects malformed (non-string) values with MALFORMED", () => {
    const malformedValues: unknown[] = [null, undefined, 42, {}, ["x"]];

    for (const heading of malformedValues) {
      let caught: unknown;
      try {
        validateLandingCtaInput(heading, VALID_SUBTEXT);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(LandingCtaInputError);
      expectRejection(caught as LandingCtaInputError, "heading", "MALFORMED");
    }
  });

  it("names the runtime type in the malformed message so the caller can tell why", () => {
    let caught: unknown;
    try {
      validateLandingCtaInput(VALID_HEADING, null);
    } catch (error) {
      caught = error;
    }
    const error = caught as LandingCtaInputError;
    expectRejection(error, "subtext", "MALFORMED");
    expect(error.message).toContain("`subtext` must be a string");
    expect(error.message).toContain("received null");
  });

  it("rejects empty and whitespace-only values with EMPTY", () => {
    for (const heading of ["", " ", "  \t\n  "]) {
      let caught: unknown;
      try {
        validateLandingCtaInput(heading, VALID_SUBTEXT);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(LandingCtaInputError);
      expectRejection(caught as LandingCtaInputError, "heading", "EMPTY");
    }
  });

  it("rejects oversized values with OVERSIZED and reports the limit", () => {
    let caught: unknown;
    try {
      validateLandingCtaInput(oversized("heading"), VALID_SUBTEXT);
    } catch (error) {
      caught = error;
    }
    const headingError = caught as LandingCtaInputError;
    expectRejection(headingError, "heading", "OVERSIZED");
    expect(headingError.message).toContain(`exceeds ${MAX_HEADING_LENGTH}`);
    expect(headingError.message).toContain(
      `received ${MAX_HEADING_LENGTH + 1}`,
    );

    caught = undefined;
    try {
      validateLandingCtaInput(VALID_HEADING, oversized("subtext"));
    } catch (error) {
      caught = error;
    }
    expectRejection(caught as LandingCtaInputError, "subtext", "OVERSIZED");
  });

  it("reports whitespace-only oversized input as EMPTY, not OVERSIZED", () => {
    let caught: unknown;
    try {
      validateLandingCtaInput(
        VALID_HEADING,
        " ".repeat(MAX_SUBTEXT_LENGTH + 1),
      );
    } catch (error) {
      caught = error;
    }
    expectRejection(caught as LandingCtaInputError, "subtext", "EMPTY");
  });

  it("reports the first invalid field when both are invalid", () => {
    let caught: unknown;
    try {
      validateLandingCtaInput("", oversized("subtext"));
    } catch (error) {
      caught = error;
    }
    expectRejection(caught as LandingCtaInputError, "heading", "EMPTY");
  });
});

describe("LandingCta — rejection happens before anything renders", () => {
  function StatefulChild({ onRender }: { onRender: () => void }) {
    onRender();
    return <button type="button">Continue</button>;
  }

  it("rejects an empty heading without mounting children or writing state", () => {
    const onRender = vi.fn();

    const error = catchRender(
      <LandingCta heading="" subtext={VALID_SUBTEXT}>
        <StatefulChild onRender={onRender} />
      </LandingCta>,
    );

    expectRejection(error, "heading", "EMPTY");
    expect(onRender).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
    expect(document.querySelector("section")).toBeNull();
  });

  it("rejects a malformed heading cast through an untyped caller", () => {
    const heading = { text: "not a string" } as unknown as string;
    const error = catchRender(
      <LandingCta heading={heading} subtext={VALID_SUBTEXT}>
        <button type="button">Continue</button>
      </LandingCta>,
    );

    expectRejection(error, "heading", "MALFORMED");
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
    expect(document.querySelector("section")).toBeNull();
  });

  it("rejects oversized subtext without rendering the card", () => {
    const error = catchRender(
      <LandingCta heading={VALID_HEADING} subtext={oversized("subtext")}>
        <button type="button">Continue</button>
      </LandingCta>,
    );

    expectRejection(error, "subtext", "OVERSIZED");
    expect(document.querySelector("section")).toBeNull();
  });

  it("throws the typed error from render so an error boundary can surface it", () => {
    let caught: unknown;
    try {
      render(
        <LandingCta heading=" " subtext={VALID_SUBTEXT}>
          <span>child</span>
        </LandingCta>,
      );
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(LandingCtaInputError);
    expect((caught as LandingCtaInputError).code).toBe("EMPTY");
  });
});
