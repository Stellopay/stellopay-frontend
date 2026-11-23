import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  middleware,
  MiddlewareValidationError,
  validatePathname,
} from "./middleware";

describe("validatePathname", () => {
  it("throws INVALID_PATHNAME for non-string inputs", () => {
    for (const input of [null, undefined, 123, {}, []]) {
      expect(() => validatePathname(input)).toThrow(MiddlewareValidationError);
      try {
        validatePathname(input);
      } catch (err) {
        expect(err).toBeInstanceOf(MiddlewareValidationError);
        expect((err as MiddlewareValidationError).code).toBe(
          "INVALID_PATHNAME",
        );
      }
    }
  });

  it("throws EMPTY_PATHNAME for an empty string", () => {
    expect(() => validatePathname("")).toThrow(MiddlewareValidationError);
    try {
      validatePathname("");
    } catch (err) {
      expect(err).toBeInstanceOf(MiddlewareValidationError);
      expect((err as MiddlewareValidationError).code).toBe("EMPTY_PATHNAME");
    }
  });

  it("throws PATHNAME_TOO_LONG when pathname exceeds 2048 characters", () => {
    const tooLong = "/" + "a".repeat(2048);
    expect(() => validatePathname(tooLong)).toThrow(MiddlewareValidationError);
    try {
      validatePathname(tooLong);
    } catch (err) {
      expect(err).toBeInstanceOf(MiddlewareValidationError);
      expect((err as MiddlewareValidationError).code).toBe("PATHNAME_TOO_LONG");
    }
  });

  it("throws INVALID_PATHNAME when pathname does not start with a forward slash", () => {
    expect(() => validatePathname("dashboard")).toThrow(
      MiddlewareValidationError,
    );
    try {
      validatePathname("dashboard");
    } catch (err) {
      expect(err).toBeInstanceOf(MiddlewareValidationError);
      expect((err as MiddlewareValidationError).code).toBe("INVALID_PATHNAME");
    }
  });

  it("returns valid pathnames including boundary length of 2048 characters", () => {
    expect(validatePathname("/")).toBe("/");
    expect(validatePathname("/dashboard")).toBe("/dashboard");
    expect(validatePathname("/auth/login")).toBe("/auth/login");

    const maxLengthPathname = "/" + "a".repeat(2047);
    expect(maxLengthPathname).toHaveLength(2048);
    expect(validatePathname(maxLengthPathname)).toBe(maxLengthPathname);
  });
});

describe("middleware", () => {
  it("passes through public routes without a session cookie", () => {
    const request = new NextRequest("http://localhost/auth/login");
    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects protected routes without a session cookie to /auth/session-expired with returnTo", () => {
    const request = new NextRequest("http://localhost/dashboard");
    const response = middleware(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe(
      "http://localhost/auth/session-expired?returnTo=%2Fdashboard",
    );
  });

  it("passes through protected routes when next-auth.session-token cookie is present", () => {
    const request = new NextRequest("http://localhost/dashboard", {
      headers: {
        cookie: "next-auth.session-token=valid-token",
      },
    });
    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("passes through protected routes when stellopay:session cookie is present", () => {
    const request = new NextRequest("http://localhost/settings", {
      headers: {
        cookie: "stellopay:session=valid-token",
      },
    });
    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
