// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware, validatePathname, MiddlewareValidationError } from "./middleware";

const ORIGIN = "http://localhost:3000";

function request(pathname: string, cookie?: string) {
  return new NextRequest(new URL(pathname, ORIGIN), {
    headers: cookie ? { cookie } : undefined,
  });
}

/** NextResponse.next() marks pass-through with this header. */
const passedThrough = (res: Response) => res.headers.get("x-middleware-next") === "1";

describe("middleware route protection", () => {
  it.each(["/notifications", "/notifications/settings"])(
    "redirects unauthenticated requests for %s to the session-expired page",
    (pathname) => {
      const res = middleware(request(pathname));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location") ?? "");
      expect(location.pathname).toBe("/auth/session-expired");
      expect(location.searchParams.get("returnTo")).toBe(pathname);
    },
  );

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
});

describe("validatePathname", () => {
  it("accepts a normal pathname", () => {
    expect(validatePathname("/notifications")).toBe("/notifications");
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
  });
});
