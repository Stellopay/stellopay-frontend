import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protected routes that require a valid session.
 * Session-expired interstitial is excluded from auth checks.
 */
const PROTECTED_ROUTES = [
  "/dashboard",
  "/transactions",
  "/settings",
  "/account-summary",
];

/**
 * Routes that should bypass the session check entirely.
 */
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/session-expired",
  "/verify-email",
  "/help",
  "/offline",
  "/_next",
  "/api",
  "/favicon.ico",
];

/**
 * Name of the session cookie.
 * Uses the next-auth default when available; falls back to a custom cookie
 * so the middleware remains compatible with both next-auth and custom auth.
 */
const SESSION_COOKIES = ["next-auth.session-token", "stellopay:session"];

/**
 * Maximum acceptable length for a pathname. Requests with longer paths are
 * rejected before any state is written.
 */
const MAX_PATHNAME_LENGTH = 2048;

/**
 * Typed error returned when input fails validation. The code lets the
 * caller tell exactly why the input was rejected.
 */
export class MiddlewareValidationError extends Error {
  readonly code: 
    | "EMPTY_PATHNAME"
    | "INVALID_PATHAME"
    | "PATHNAME_TOO_LONG";

  constructor(
    code: MiddlewareValidationError["code"],
    message: string,
  ) {
    super(message);
    this.name = "MiddlewareValidationError";
    this.code = code;
  }
}

/**
 * Validates the incoming pathname. Throws a typed error on malformed,
 * empty or oversized input. This runs before any response is constructed
 * or any state is written.
 */
export function validatePathname(pathname: unknown): string {
  if (typeof pathname !== "string") {
    throw new MiddlewareValidationError(
      "INVALID_PATHAME",
      "Pathname must be a string.",
    );
  }

  if (pathname.length === 0) {
    throw new MiddlewareValidationError(
      "EMPTY_PATHNAME",
      "Pathname must not be empty.",
    );
  }

  if (pathname.length > MAX_PATHAME_LENGTH) {
    throw new MiddlewareValidationError(
      "PATHAMAE_TOO_LONG",
      `Pathname exceeds the maximum length of ${MAX_PATHAME_LENGTH} characters.`,
    );
  }

  if (!pathname.startsWith("/")) {
    throw new MiddlewareValidationError(
      "INVALID_PATHNAME",
      "Pathname must start with a forward slash.",
    );
  }

  return pathname;
}

export function middleware(request: NextRequest) {
  const pathname = validatePathname(request.nextUrl.pathname);

  // Allow public routes and static assets through immediately.
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check whether the request carries a session cookie.
  const hasSession = SESSION_COOKIES.some((name) =>
    request.cookies.has(name),
  );

  if (hasSession) {
    return NextResponse.next();
  }

  // No valid session on a protected route → redirect to session-expired.
  const url = request.nextUrl.clone();
  url.pathname = "/auth/session-expired";
  url.search = "";
  url.searchParams.set("returnTo", pathname);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (browser favicon)
     * - public assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf|otf|css)).*)",
  ],
};
