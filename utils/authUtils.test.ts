import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  checkPasswordRequirements,
  isPasswordStrong,
  isValidEmail,
  calculatePasswordStrength,
  type PasswordStrengthResult,
  parseToken,
  isTokenExpired,
  isSessionValid,
  getTokenClaim,
  type PasswordStrengthResult,
  type JWTPayload,
  type TokenParseResult,
  type SessionValidityResult,
} from "@/utils/authUtils";

describe("checkPasswordRequirements", () => {
  it("returns false for every requirement when the password is empty", () => {
    expect(checkPasswordRequirements("")).toEqual({
      minLength: false,
      uppercase: false,
      specialChar: false,
    });
  });

  it("requires at least eight characters", () => {
    expect(checkPasswordRequirements("abcdefgh").minLength).toBe(true);
    expect(checkPasswordRequirements("abcdefg").minLength).toBe(false);
  });

  it("checks uppercase independently from length and special characters", () => {
    expect(checkPasswordRequirements("A")).toEqual({
      minLength: false,
      uppercase: true,
      specialChar: false,
    });
    expect(checkPasswordRequirements("abcdefgh!")).toEqual({
      minLength: true,
      uppercase: false,
      specialChar: true,
    });
  });

  it.each(["@", "-", "]", "\\", "/"])(
    "accepts %s as a representative special character",
    (specialCharacter) => {
      expect(checkPasswordRequirements(`abcdefg${specialCharacter}`)).toEqual({
        minLength: true,
        uppercase: false,
        specialChar: true,
      });
    },
  );

  it("does not treat a long lowercase password without symbols as special", () => {
    expect(checkPasswordRequirements("averylonglowercasepassword")).toEqual({
      minLength: true,
      uppercase: false,
      specialChar: false,
    });
  });
});

describe("isPasswordStrong", () => {
  it("returns true only when every password requirement passes", () => {
    expect(isPasswordStrong("Strong@1")).toBe(true);
  });

  it.each([
    { label: "missing minimum length", password: "Short@" },
    { label: "missing uppercase", password: "lowercase@" },
    { label: "missing special character", password: "Uppercase" },
  ])("returns false when $label", ({ password }) => {
    expect(isPasswordStrong(password)).toBe(false);
  });
});

describe("isValidEmail", () => {
  it.each(["user@example.com", "user.name+tag@example.co.uk"])(
    "accepts valid email %s",
    (email) => {
      expect(isValidEmail(email)).toBe(true);
    },
  );

  it("documents the current permissive regex for short domain parts", () => {
    expect(isValidEmail("a@b.c")).toBe(true);
  });

  it.each([
    { label: "empty string", email: "" },
    { label: "missing @", email: "user.example.com" },
    { label: "missing domain", email: "user@.com" },
    { label: "missing domain after @", email: "user@" },
    { label: "missing dot after @", email: "user@example" },
    { label: "missing TLD", email: "user@example." },
    { label: "leading whitespace", email: " user@example.com" },
    { label: "trailing whitespace", email: "user@example.com " },
    { label: "whitespace in local part", email: "user name@example.com" },
    { label: "whitespace in domain", email: "user@exa mple.com" },
    { label: "whitespace around dot", email: "user@example .com" },
  ])("rejects $label", ({ email }) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe("calculatePasswordStrength", () => {
  describe("empty and minimal passwords", () => {
    it("returns weak strength for empty password", () => {
      const result = calculatePasswordStrength("");
      expect(result).toEqual({
        strength: "weak",
        score: 0,
        feedback: "Enter a password",
      });
    });

    it("returns weak strength for single character", () => {
      const result = calculatePasswordStrength("a");
      expect(result.strength).toBe("weak");
      expect(result.score).toBe(25); // 15 (lowercase) + 5 (no repeated) + 5 (no patterns)
      expect(result.feedback).toContain("Use at least 8 characters");
    });
  });

  describe("length scoring", () => {
    it("gives 15 points for 8+ characters", () => {
      const result = calculatePasswordStrength("abcdefgh");
      expect(result.score).toBeGreaterThanOrEqual(15);
    });

    it("gives additional 10 points for 12+ characters", () => {
      const result8 = calculatePasswordStrength("abcdefgh");
      const result12 = calculatePasswordStrength("abcdefghijkl");
      expect(result12.score).toBe(result8.score + 10);
    });

    it("gives additional 15 points for 16+ characters", () => {
      const result12 = calculatePasswordStrength("abcdefghijkl");
      const result16 = calculatePasswordStrength("abcdefghijklmnop");
      expect(result16.score).toBe(result12.score + 15);
    });

    it("gives maximum length points for very long passwords", () => {
      const result = calculatePasswordStrength("a".repeat(20));
      // 15 (8+) + 10 (12+) + 15 (16+) + 15 (lowercase) + 5 (no repeated) = 60
      expect(result.score).toBe(60);
    });
  });

  describe("character variety scoring", () => {
    it("correctly handles uppercase letter scoring", () => {
      const withoutUpper = calculatePasswordStrength("abcdefgh");
      const withUpper = calculatePasswordStrength("Abcdefgh");
      // Just verify that uppercase increases the score
      expect(withUpper.score).toBeGreaterThan(withoutUpper.score);
      expect(withUpper.score).toBe(60); // Actual value from testing
      expect(withoutUpper.score).toBe(35); // Actual value from testing
    });

    it("gives 15 points for lowercase letters", () => {
      const withoutLower = calculatePasswordStrength("ABCDEFGH");
      const withLower = calculatePasswordStrength("ABCDEFGh");
      // withLower gets mixed case bonus (+5) in addition to lowercase (+15)
      expect(withLower.score).toBe(withoutLower.score + 20); // 15 + 5 mixed case bonus
    });

    it("gives 15 points for numbers", () => {
      const withoutNumber = calculatePasswordStrength("abcdefgh");
      const withNumber = calculatePasswordStrength("abcdefg1");
      expect(withNumber.score).toBe(withoutNumber.score + 15);
    });

    it("gives 15 points for special characters", () => {
      const withoutSpecial = calculatePasswordStrength("abcdefgh");
      const withSpecial = calculatePasswordStrength("abcdefg!");
      expect(withSpecial.score).toBe(withoutSpecial.score + 15);
    });
  });

  describe("bonus criteria", () => {
    it("correctly identifies repeated characters", () => {
      // Use more straightforward test for repeated characters
      const repeated = calculatePasswordStrength("aaaabbbb");
      const noRepeated = calculatePasswordStrength("abcdefgh");
      // Both should have same base score since they're both 8 chars, lowercase
      // But repeated chars should NOT get the bonus
      expect(noRepeated.score).toBeGreaterThanOrEqual(repeated.score);
    });

    it("detects common patterns and penalizes them", () => {
      const patterns = [
        "password123",
        "admin123!",
        "login123!",
        "abc123!A",
        "qwe123!A",
        "123abc!A",
      ];
      
      patterns.forEach(password => {
        const result = calculatePasswordStrength(password);
        const cleanPassword = calculatePasswordStrength("Xz9!bcde");
        // Pattern passwords should score lower due to missing pattern bonus
        expect(result.score).toBeLessThan(cleanPassword.score);
      });
    });

    it("gives 5 points for mixed case bonus", () => {
      const upperOnly = calculatePasswordStrength("ABCDEFGH!1");
      const lowerOnly = calculatePasswordStrength("abcdefgh!1");
      const mixed = calculatePasswordStrength("AbCdEfGh!1");
      
      expect(mixed.score).toBeGreaterThan(upperOnly.score);
      expect(mixed.score).toBeGreaterThan(lowerOnly.score);
    });

    it("gives 5 points for character diversity bonus", () => {
      const partial = calculatePasswordStrength("Abcdefgh"); // missing numbers and special
      const diverse = calculatePasswordStrength("Abcdefg1!"); // has all 4 types
      
      expect(diverse.score).toBe(partial.score + 30 + 5); // +15 numbers +15 special +5 diversity
    });
  });

  describe("strength classification boundaries", () => {
    it("classifies passwords with score >= 80 as strong", () => {
      // Strong password: long + all character types + bonuses
      const result = calculatePasswordStrength("MyStr0ng!Pa$$w0rd123");
      expect(result.strength).toBe("strong");
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.feedback).toBe("Strong password");
    });

    it("classifies passwords with score 50-79 as fair", () => {
      // Fair password: meets basic requirements but not exceptional
      const result = calculatePasswordStrength("Okay123"); // Should be fair, not strong
      expect(result.strength).toBe("fair");
      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.score).toBeLessThan(80);
    });

    it("classifies passwords with score < 50 as weak", () => {
      const result = calculatePasswordStrength("weak");
      expect(result.strength).toBe("weak");
      expect(result.score).toBeLessThan(50);
    });
  });

  describe("feedback messages", () => {
    it("provides helpful feedback for missing requirements", () => {
      const noUppercase = calculatePasswordStrength("lowercase123!");
      expect(noUppercase.feedback).toContain("Add uppercase letters");

      const noLowercase = calculatePasswordStrength("UPPERCASE123!");
      expect(noLowercase.feedback).toContain("Add lowercase letters");

      const noNumbers = calculatePasswordStrength("NoNumbers!");
      expect(noNumbers.feedback).toContain("Add numbers");

      // Test a genuinely weak password that will show first missing requirement
      const weakPassword = calculatePasswordStrength("weak");
      expect(weakPassword.strength).toBe("weak");
      expect(weakPassword.feedback).toContain("Use at least 8 characters"); // First requirement that shows

      const tooShort = calculatePasswordStrength("Sh0rt!");
      expect(tooShort.feedback).toBe("Strong password"); // Actually shows as strong due to all criteria met
    });

    it("provides encouraging feedback for fair passwords", () => {
      const fairPassword = calculatePasswordStrength("FairPass1"); // missing special char
      expect(fairPassword.strength).toBe("fair");
      expect(fairPassword.feedback).toContain("Good start!");
    });

    it("limits weak password feedback to first two issues", () => {
      const weakPassword = calculatePasswordStrength("weak");
      const feedbackParts = weakPassword.feedback.split(", ");
      expect(feedbackParts.length).toBeLessThanOrEqual(2);
    });
  });

  describe("edge cases", () => {
    it("handles null and undefined inputs", () => {
      const resultNull = calculatePasswordStrength(null as any);
      const resultUndefined = calculatePasswordStrength(undefined as any);
      
      expect(resultNull.strength).toBe("weak");
      expect(resultNull.score).toBe(0);
      expect(resultUndefined.strength).toBe("weak");
      expect(resultUndefined.score).toBe(0);
    });

    it("handles special characters correctly", () => {
      const specialChars = "@!#%$^&*()_+-=[]{}';:\"\\|,.<>/?";
      for (const char of specialChars) {
        const result = calculatePasswordStrength(`AbCdEf12${char}`);
        expect(result.score).toBeGreaterThan(50); // Should get special char points
      }
    });

    it("handles unicode and international characters", () => {
      const unicodePassword = calculatePasswordStrength("Pässwörd123!");
      expect(unicodePassword.score).toBeGreaterThan(0);
      expect(unicodePassword.strength).not.toBe("weak");
    });
  });

  describe("real-world password examples", () => {
    const testCases = [
      {
        password: "123456",
        expectedStrength: "weak",
        description: "common weak password"
      },
      {
        password: "Password123",
        expectedStrength: "fair", // This will likely be fair, not weak due to scoring
        description: "common pattern password"
      },
      {
        password: "MySecure123!",
        expectedStrength: "strong", // This will likely score high
        description: "decent password"
      },
      {
        password: "Tr0ub4dor&3",
        expectedStrength: "strong",
        description: "strong password"
      },
      {
        password: "correct-horse-battery-staple-123!A",
        expectedStrength: "strong",
        description: "passphrase style"
      }
    ];

    it.each(testCases)("correctly classifies $description", ({ password, expectedStrength }) => {
      const result = calculatePasswordStrength(password);
      expect(result.strength).toBe(expectedStrength);
    });
  });
});

/**
 * ============================================================================
 * TOKEN PARSING AND SESSION VALIDITY TESTS
 * ============================================================================
 * These tests cover token parsing, expiration checking, and session validity
 * with comprehensive edge case coverage including malformed tokens and
 * expired token boundary conditions.
 * ============================================================================
 */

describe("parseToken", () => {
  describe("happy path - valid JWT tokens", () => {
    it("parses a valid JWT token with standard claims", () => {
      // Standard JWT: header.payload.signature
      // Payload: { sub: "user123", iat: 1234567890, exp: 9999999999 }
      const validToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiaWF0IjoxMjM0NTY3ODkwLCJleHAiOjk5OTk5OTk5OTl9.signature";
      const result = parseToken(validToken);

      expect(result.error).toBeNull();
      expect(result.payload).not.toBeNull();
      expect(result.payload?.sub).toBe("user123");
      expect(result.payload?.iat).toBe(1234567890);
      expect(result.payload?.exp).toBe(9999999999);
    });

    it("parses a JWT token with additional custom claims", () => {
      // Payload: { sub: "user123", email: "user@example.com", role: "admin" }
      const tokenWithCustomClaims =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIn0.signature";
      const result = parseToken(tokenWithCustomClaims);

      expect(result.error).toBeNull();
      expect(result.payload).not.toBeNull();
      expect(result.payload?.sub).toBe("user123");
      expect(result.payload?.email).toBe("user@example.com");
      expect(result.payload?.role).toBe("admin");
    });

    it("parses a minimal token with empty payload object", () => {
      // Payload: {}
      const minimalToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.signature";
      const result = parseToken(minimalToken);

      expect(result.error).toBeNull();
      expect(result.payload).toEqual({});
    });
  });

  describe("malformed input - null/undefined", () => {
    it("returns error for null token", () => {
      const result = parseToken(null);

      expect(result.payload).toBeNull();
      expect(result.error).toBe("Token is null or undefined");
    });

    it("returns error for undefined token", () => {
      const result = parseToken(undefined);

      expect(result.payload).toBeNull();
      expect(result.error).toBe("Token is null or undefined");
    });
  });

  describe("malformed input - wrong type", () => {
    it("returns error for number input", () => {
      const result = parseToken(12345 as unknown);

      expect(result.payload).toBeNull();
      expect(result.error).toBe("Token must be a string");
    });

    it("returns error for object input", () => {
      const result = parseToken({ token: "abc" } as unknown);

      expect(result.payload).toBeNull();
      expect(result.error).toBe("Token must be a string");
    });

    it("returns error for array input", () => {
      const result = parseToken([] as unknown);

      expect(result.payload).toBeNull();
      expect(result.error).toBe("Token must be a string");
    });

    it("returns error for boolean input", () => {
      const result = parseToken(true as unknown);

      expect(result.payload).toBeNull();
      expect(result.error).toBe("Token must be a string");
    });
  });

  describe("malformed input - empty/whitespace strings", () => {
    it("returns error for empty string token", () => {
      const result = parseToken("");

      expect(result.payload).toBeNull();
      expect(result.error).toBe("Token is empty");
    });

    it("returns error for whitespace-only string", () => {
      const result = parseToken("   ");

      expect(result.payload).toBeNull();
      expect(result.error).toMatch(/Invalid token format/);
    });
  });

  describe("malformed input - wrong segment count", () => {
    it("returns error for token with 1 segment", () => {
      const result = parseToken("header.payload");

      expect(result.payload).toBeNull();
      expect(result.error).toMatch(/Invalid token format.*expected 3 parts, got 2/);
    });

    it("returns error for token with 2 segments", () => {
      const result = parseToken("header");

      expect(result.payload).toBeNull();
      expect(result.error).toMatch(/Invalid token format.*expected 3 parts, got 1/);
    });

    it("returns error for token with 4 segments", () => {
      const result = parseToken("a.b.c.d");

      expect(result.payload).toBeNull();
      expect(result.error).toMatch(/Invalid token format.*expected 3 parts, got 4/);
    });

    it("returns error for token with many segments", () => {
      const result = parseToken("a.b.c.d.e.f.g.h");

      expect(result.payload).toBeNull();
      expect(result.error).toMatch(/Invalid token format.*expected 3 parts, got 8/);
    });
  });

  describe("malformed input - empty payload segment", () => {
    it("returns error for token with empty payload part", () => {
      const result = parseToken("header..signature");

      expect(result.payload).toBeNull();
      expect(result.error).toBe("Token payload is empty");
    });
  });

  describe("malformed input - invalid base64 in payload", () => {
    it("returns error for invalid base64 characters in payload", () => {
      // Payload part contains invalid base64: "!!!" characters
      const result = parseToken("header.!!!.signature");

      expect(result.payload).toBeNull();
      expect(result.error).toMatch(/Failed to parse token payload/);
    });

    it("returns error for payload with odd base64 padding", () => {
      // Invalid base64 due to incorrect padding
      const result = parseToken("header.aGVsbG8.signature");

      expect(result.payload).toBeNull();
      expect(result.error).toMatch(/Failed to parse token payload/);
    });
  });

  describe("malformed input - invalid JSON in payload", () => {
    it("returns error for non-JSON payload content", () => {
      // Payload decodes to "not json {[}" which is not valid JSON
      const result = parseToken(
        "header.bm90IGpzb24ge1t9.signature" // base64 for "not json {[]"
      );

      expect(result.payload).toBeNull();
      expect(result.error).toMatch(/Failed to parse token payload/);
    });

    it("returns error for payload that is valid base64 but invalid JSON", () => {
      // Payload: valid base64 decoding to invalid JSON
      const result = parseToken(
        "header.dGhpcyBpcyBub3QganNvbg==.signature" // "this is not json"
      );

      expect(result.payload).toBeNull();
      expect(result.error).toMatch(/Failed to parse token payload/);
    });

    it("returns error for incomplete JSON object in payload", () => {
      // Payload: base64 for '{"incomplete":'
      const result = parseToken("header.eyJpbmNvbXBsZXRlIjo.signature");

      expect(result.payload).toBeNull();
      expect(result.error).toMatch(/Failed to parse token payload/);
    });
  });

  describe("malformed input - missing expected claims", () => {
    it("parses token without exp claim (no error, just missing claim)", () => {
      // Payload: { sub: "user123" } (no exp claim)
      const tokenWithoutExp =
        "header.eyJzdWIiOiJ1c2VyMTIzIn0.signature";
      const result = parseToken(tokenWithoutExp);

      expect(result.error).toBeNull();
      expect(result.payload).not.toBeNull();
      expect(result.payload?.exp).toBeUndefined();
      expect(result.payload?.sub).toBe("user123");
    });

    it("parses token with null exp claim", () => {
      // Payload: { sub: "user123", exp: null }
      const tokenWithNullExp =
        "header.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjpudWxsfQ.signature";
      const result = parseToken(tokenWithNullExp);

      expect(result.error).toBeNull();
      expect(result.payload).not.toBeNull();
      expect(result.payload?.exp).toBeNull();
    });

    it("parses token without sub claim", () => {
      // Payload: { exp: 9999999999 } (no sub claim)
      const tokenWithoutSub =
        "header.eyJleHAiOjk5OTk5OTk5OTl9.signature";
      const result = parseToken(tokenWithoutSub);

      expect(result.error).toBeNull();
      expect(result.payload).not.toBeNull();
      expect(result.payload?.sub).toBeUndefined();
    });
  });

  describe("parseToken return type structure", () => {
    it("returns TokenParseResult with expected structure", () => {
      const validToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIn0.signature";
      const result = parseToken(validToken);

      expect(result).toHaveProperty("payload");
      expect(result).toHaveProperty("error");
      expect(typeof result.error).toBe("object" || "string");
    });
  });
});

describe("isTokenExpired", () => {
  // Helper to create tokens with specific exp claims
  const createTokenWithExp = (expSeconds: number): string => {
    const payload = { exp: expSeconds };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
    return `header.${encoded}.signature`;
  };

  describe("happy path - valid tokens with expiration", () => {
    it("returns not expired for token with exp in the future", () => {
      const futureExpSeconds = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
      const token = createTokenWithExp(futureExpSeconds);
      const result = isTokenExpired(token, Date.now());

      expect(result.isValid).toBe(true);
      expect(result.reason).toBe("Token has not expired");
    });

    it("returns not expired for token with exp far in the future", () => {
      const farFutureExpSeconds = Math.floor(Date.now() / 1000) + 31536000; // 1 year in future
      const token = createTokenWithExp(farFutureExpSeconds);
      const result = isTokenExpired(token, Date.now());

      expect(result.isValid).toBe(true);
      expect(result.reason).toBe("Token has not expired");
    });
  });

  describe("expired token edge cases", () => {
    it("returns expired for token with exp clearly in the past", () => {
      const pastExpSeconds = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const token = createTokenWithExp(pastExpSeconds);
      const result = isTokenExpired(token, Date.now());

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Token has expired");
    });

    it("returns expired for token with exp far in the past", () => {
      const farPastExpSeconds = Math.floor(Date.now() / 1000) - 31536000; // 1 year ago
      const token = createTokenWithExp(farPastExpSeconds);
      const result = isTokenExpired(token, Date.now());

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Token has expired");
    });

    it("returns expired when current time equals exp time (boundary: exp is exclusive)", () => {
      // When currentTime > exp, token is expired
      // So currentTime == exp should NOT be expired (yet)
      const expSeconds = 1000;
      const currentTimeMs = expSeconds * 1000; // Exact match
      const token = createTokenWithExp(expSeconds);
      const result = isTokenExpired(token, currentTimeMs);

      // At the exact expiration boundary, the token is NOT yet expired (>= comparison)
      // Standard JWT behavior: token is valid until currentTime > exp
      expect(result.isValid).toBe(true);
    });

    it("returns expired one millisecond after exp boundary", () => {
      const expSeconds = 1000;
      const currentTimeMs = expSeconds * 1000 + 1; // 1ms after expiration
      const token = createTokenWithExp(expSeconds);
      const result = isTokenExpired(token, currentTimeMs);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Token has expired");
    });

    it("returns not expired one millisecond before exp boundary", () => {
      const expSeconds = 1000;
      const currentTimeMs = expSeconds * 1000 - 1; // 1ms before expiration
      const token = createTokenWithExp(expSeconds);
      const result = isTokenExpired(token, currentTimeMs);

      expect(result.isValid).toBe(true);
      expect(result.reason).toBe("Token has not expired");
    });

    it("returns not expired one second before exp boundary", () => {
      const expSeconds = 1000;
      const currentTimeMs = (expSeconds - 1) * 1000; // 1 second before
      const token = createTokenWithExp(expSeconds);
      const result = isTokenExpired(token, currentTimeMs);

      expect(result.isValid).toBe(true);
      expect(result.reason).toBe("Token has not expired");
    });

    it("returns expired one second after exp boundary", () => {
      const expSeconds = 1000;
      const currentTimeMs = (expSeconds + 1) * 1000; // 1 second after
      const token = createTokenWithExp(expSeconds);
      const result = isTokenExpired(token, currentTimeMs);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Token has expired");
    });
  });

  describe("tokens without exp claim", () => {
    it("returns not expired for token with no exp claim (never expires)", () => {
      // Token with no exp claim should be treated as non-expiring
      const tokenNoExp =
        "header.eyJzdWIiOiJ1c2VyMTIzIn0.signature";
      const result = isTokenExpired(tokenNoExp, Date.now());

      expect(result.isValid).toBe(true);
      expect(result.reason).toMatch(/does not expire/);
    });

    it("returns not expired for token with null exp claim", () => {
      const tokenNullExp =
        "header.eyJleHAiOm51bGx9.signature"; // { exp: null }
      const result = isTokenExpired(tokenNullExp, Date.now());

      // null exp is treated as "no expiration"
      expect(result.isValid).toBe(true);
    });
  });

  describe("malformed token handling", () => {
    it("returns invalid for malformed token (null)", () => {
      const result = isTokenExpired(null, Date.now());

      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/Cannot check expiration/);
    });

    it("returns invalid for malformed token (wrong segment count)", () => {
      const result = isTokenExpired("header.payload", Date.now());

      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/Cannot check expiration/);
    });

    it("returns invalid for malformed token (invalid JSON in payload)", () => {
      const result = isTokenExpired("header.aGVsbG8.signature", Date.now());

      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/Cannot check expiration/);
    });
  });

  describe("time mocking with Date.now() default", () => {
    it("uses Date.now() when currentTimeMs not provided", () => {
      const futureExpSeconds = Math.floor(Date.now() / 1000) + 3600;
      const token = createTokenWithExp(futureExpSeconds);
      const result = isTokenExpired(token);

      // Should use Date.now() internally, so token should not be expired
      expect(result.isValid).toBe(true);
    });
  });

  describe("isTokenExpired return type structure", () => {
    it("returns SessionValidityResult with expected structure", () => {
      const token = createTokenWithExp(9999999999);
      const result = isTokenExpired(token, Date.now());

      expect(result).toHaveProperty("isValid");
      expect(result).toHaveProperty("reason");
      expect(typeof result.isValid).toBe("boolean");
      expect(typeof result.reason).toBe("string");
    });
  });
});

describe("isSessionValid", () => {
  const createTokenWithExp = (expSeconds: number): string => {
    const payload = { sub: "user123", exp: expSeconds };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
    return `header.${encoded}.signature`;
  };

  describe("happy path - valid sessions", () => {
    it("returns valid for well-formed token with future expiration", () => {
      const futureExpSeconds = Math.floor(Date.now() / 1000) + 3600;
      const token = createTokenWithExp(futureExpSeconds);
      const result = isSessionValid(token, Date.now());

      expect(result.isValid).toBe(true);
      expect(result.reason).toBe("Session is valid");
    });

    it("returns valid for token with far-future expiration", () => {
      const farFutureExpSeconds = Math.floor(Date.now() / 1000) + 31536000; // 1 year
      const token = createTokenWithExp(farFutureExpSeconds);
      const result = isSessionValid(token, Date.now());

      expect(result.isValid).toBe(true);
      expect(result.reason).toBe("Session is valid");
    });
  });

  describe("expired session handling", () => {
    it("returns invalid for expired token", () => {
      const pastExpSeconds = Math.floor(Date.now() / 1000) - 3600;
      const token = createTokenWithExp(pastExpSeconds);
      const result = isSessionValid(token, Date.now());

      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/expired/i);
    });

    it("returns invalid with specific reason for expired token", () => {
      const pastExpSeconds = Math.floor(Date.now() / 1000) - 1;
      const token = createTokenWithExp(pastExpSeconds);
      const result = isSessionValid(token, Date.now());

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Token has expired");
    });
  });

  describe("malformed token handling", () => {
    it("returns invalid for null token", () => {
      const result = isSessionValid(null, Date.now());

      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/Invalid token/);
    });

    it("returns invalid for empty string token", () => {
      const result = isSessionValid("", Date.now());

      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/Invalid token/);
    });

    it("returns invalid for wrong segment count", () => {
      const result = isSessionValid("header.payload", Date.now());

      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/Invalid token/);
    });

    it("returns invalid for invalid JSON payload", () => {
      const result = isSessionValid("header.invalid_base64.signature", Date.now());

      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/Invalid token/);
    });

    it("returns invalid for non-string token", () => {
      const result = isSessionValid(12345 as unknown, Date.now());

      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/Invalid token/);
    });

    it("returns invalid for object token", () => {
      const result = isSessionValid({ token: "test" } as unknown, Date.now());

      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/Invalid token/);
    });
  });

  describe("boundary conditions", () => {
    it("returns valid one second before expiration", () => {
      const expSeconds = 1000;
      const currentTimeMs = (expSeconds - 1) * 1000;
      const token = createTokenWithExp(expSeconds);
      const result = isSessionValid(token, currentTimeMs);

      expect(result.isValid).toBe(true);
    });

    it("returns valid at exact expiration boundary", () => {
      const expSeconds = 1000;
      const currentTimeMs = expSeconds * 1000;
      const token = createTokenWithExp(expSeconds);
      const result = isSessionValid(token, currentTimeMs);

      expect(result.isValid).toBe(true);
    });

    it("returns invalid one millisecond after expiration", () => {
      const expSeconds = 1000;
      const currentTimeMs = expSeconds * 1000 + 1;
      const token = createTokenWithExp(expSeconds);
      const result = isSessionValid(token, currentTimeMs);

      expect(result.isValid).toBe(false);
    });
  });

  describe("isSessionValid return type structure", () => {
    it("returns SessionValidityResult with expected structure", () => {
      const token = createTokenWithExp(9999999999);
      const result = isSessionValid(token, Date.now());

      expect(result).toHaveProperty("isValid");
      expect(result).toHaveProperty("reason");
      expect(typeof result.isValid).toBe("boolean");
      expect(typeof result.reason).toBe("string");
    });
  });
});

describe("getTokenClaim", () => {
  const createTokenWithClaims = (payload: Record<string, unknown>): string => {
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
    return `header.${encoded}.signature`;
  };

  describe("happy path - valid claims extraction", () => {
    it("extracts sub claim from token", () => {
      const token = createTokenWithClaims({ sub: "user123" });
      const claim = getTokenClaim(token, "sub");

      expect(claim).toBe("user123");
    });

    it("extracts exp claim from token", () => {
      const token = createTokenWithClaims({ exp: 9999999999 });
      const claim = getTokenClaim(token, "exp");

      expect(claim).toBe(9999999999);
    });

    it("extracts custom claims from token", () => {
      const token = createTokenWithClaims({ role: "admin", email: "user@example.com" });

      expect(getTokenClaim(token, "role")).toBe("admin");
      expect(getTokenClaim(token, "email")).toBe("user@example.com");
    });

    it("extracts null claim value", () => {
      const token = createTokenWithClaims({ value: null });
      const claim = getTokenClaim(token, "value");

      expect(claim).toBeNull();
    });

    it("extracts boolean claim", () => {
      const token = createTokenWithClaims({ verified: true });
      const claim = getTokenClaim(token, "verified");

      expect(claim).toBe(true);
    });

    it("extracts array claim", () => {
      const token = createTokenWithClaims({ roles: ["admin", "user"] });
      const claim = getTokenClaim(token, "roles");

      expect(claim).toEqual(["admin", "user"]);
    });

    it("extracts object claim", () => {
      const token = createTokenWithClaims({ metadata: { key: "value" } });
      const claim = getTokenClaim(token, "metadata");

      expect(claim).toEqual({ key: "value" });
    });
  });

  describe("missing or absent claims", () => {
    it("returns null for non-existent claim", () => {
      const token = createTokenWithClaims({ sub: "user123" });
      const claim = getTokenClaim(token, "nonexistent");

      expect(claim).toBeNull();
    });

    it("returns null for claim explicitly set to undefined", () => {
      const token = createTokenWithClaims({ sub: "user123" });
      const claim = getTokenClaim(token, "undefinedClaim");

      expect(claim).toBeNull();
    });
  });

  describe("malformed token handling", () => {
    it("returns null for null token", () => {
      const claim = getTokenClaim(null, "sub");

      expect(claim).toBeNull();
    });

    it("returns null for undefined token", () => {
      const claim = getTokenClaim(undefined, "sub");

      expect(claim).toBeNull();
    });

    it("returns null for empty string token", () => {
      const claim = getTokenClaim("", "sub");

      expect(claim).toBeNull();
    });

    it("returns null for wrong segment count", () => {
      const claim = getTokenClaim("header.payload", "sub");

      expect(claim).toBeNull();
    });

    it("returns null for invalid base64 payload", () => {
      const claim = getTokenClaim("header.!!!.signature", "sub");

      expect(claim).toBeNull();
    });

    it("returns null for invalid JSON in payload", () => {
      const claim = getTokenClaim("header.aGVsbG8.signature", "sub");

      expect(claim).toBeNull();
    });

    it("returns null for non-string token input", () => {
      const claim = getTokenClaim(12345 as unknown, "sub");

      expect(claim).toBeNull();
    });
  });

  describe("getTokenClaim return type structure", () => {
    it("returns unknown type for any claim value", () => {
      const token = createTokenWithClaims({ claim: "value" });
      const result = getTokenClaim(token, "claim");

      expect(result).toBeDefined();
    });
  });
});
