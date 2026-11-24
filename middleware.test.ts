// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware, validatePathname, MiddlewareValidationError } from "./middleware";
import {
  middleware,
  MiddlewareValidationError,
  validatePathname,
} from "./middleware";

const ORIGIN = "http://localhost:3000";
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

function request(pathname: string, cookie?: string) {
  return new NextRequest(new URL(pathname, ORIGIN), {
    headers: cookie ? { cookie } : undefined,
  it("throws EMPTY_PATHNAME for an empty string", () => {
    expect(() => validatePathname("")).toThrow(MiddlewareValidationError);
    try {
      validatePathname("");
    } catch (err) {
      expect(err).toBeInstanceOf(MiddlewareValidationError);
      expect((err as MiddlewareValidationError).code).toBe("EMPTY_PATHNAME");
    }
  });
}

/** NextResponse.next() marks pass-through with this header. */
const passedThrough = (res: Response) => res.headers.get("x-middleware-next") === "1";
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

describe("middleware route protection", () => {
  it.each(["/notifications", "/notifications/settings"])(
    "redirects unauthenticated requests for %s to the session-expired page",
    (pathname) => {
      const res = middleware(request(pathname));
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

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location") ?? "");
      expect(location.pathname).toBe("/auth/session-expired");
      expect(location.searchParams.get("returnTo")).toBe(pathname);
    },
  );
  it("returns valid pathnames including boundary length of 2048 characters", () => {
    expect(validatePathname("/")).toBe("/");
    expect(validatePathname("/dashboard")).toBe("/dashboard");
    expect(validatePathname("/auth/login")).toBe("/auth/login");

  it.each(["next-auth.session-token=abc", "stellopay:session=abc"])(
    "lets an authenticated request (%s) reach /notifications",
    (cookie) => {
      const res = middleware(request("/notifications", cookie));
      expect(passedThrough(res)).toBe(true);
    },
  );

  it.each(["/dashboard", "/transactions", "/settings/preferences", "/account-summary"])(
    "still protects %s",
    (pathname) => {
      expect(middleware(request(pathname)).status).toBe(307);
      expect(passedThrough(middleware(request(pathname, "stellopay:session=abc")))).toBe(true);
    },
  );

  it.each(["/auth/login", "/help/support", "/offline", "/verify-email"])(
    "still lets public route %s through without a session",
    (pathname) => {
      expect(passedThrough(middleware(request(pathname)))).toBe(true);
    },
  );
    const maxLengthPathname = "/" + "a".repeat(2047);
    expect(maxLengthPathname).toHaveLength(2048);
    expect(validatePathname(maxLengthPathname)).toBe(maxLengthPathname);
  });
});

describe("validatePathname", () => {
  it("accepts a normal pathname", () => {
    expect(validatePathname("/notifications")).toBe("/notifications");
describe("middleware", () => {
  it("passes through public routes without a session cookie", () => {
    const request = new NextRequest("http://localhost/auth/login");
    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it.each([
    [42, "INVALID_PATHNAME"],
    ["", "EMPTY_PATHNAME"],
    ["notifications", "INVALID_PATHNAME"],
    [`/${"a".repeat(2048)}`, "PATHNAME_TOO_LONG"],
  ])("rejects %j with %s", (input, code) => {
    expect(() => validatePathname(input)).toThrow(MiddlewareValidationError);
    try {
      validatePathname(input);
    } catch (error) {
      expect((error as MiddlewareValidationError).code).toBe(code);
    }
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
