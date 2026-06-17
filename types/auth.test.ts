import { describe, expect, it } from "vitest";

import { loginSchema, signUpSchema } from "@/types/auth";

const validSignUp = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  password: "Password@1",
  confirmPassword: "Password@1",
  agreeToTerms: true,
};

const validLogin = {
  email: "ada@example.com",
  password: "password",
};

function issuesFor(
  schema: typeof signUpSchema | typeof loginSchema,
  payload: unknown,
) {
  const result = schema.safeParse(payload);

  if (result.success) {
    return [];
  }

  return result.error.issues;
}

function issueFor(
  schema: typeof signUpSchema | typeof loginSchema,
  payload: unknown,
  path: string,
) {
  return issuesFor(schema, payload).find(
    (issue) => issue.path.join(".") === path,
  );
}

describe("signUpSchema", () => {
  it("accepts a valid signup with matching passwords and accepted terms", () => {
    expect(signUpSchema.safeParse(validSignUp).success).toBe(true);
  });

  it("accepts signup values at the minimum positive boundaries", () => {
    expect(
      signUpSchema.safeParse({
        ...validSignUp,
        fullName: "Al",
        password: "Str0ng@1",
        confirmPassword: "Str0ng@1",
        agreeToTerms: true,
      }).success,
    ).toBe(true);
  });

  it("rejects a too-short full name with the configured message", () => {
    expect(
      issueFor(signUpSchema, { ...validSignUp, fullName: "A" }, "fullName"),
    ).toMatchObject({
      path: ["fullName"],
      message: "Full name must be at least 2 characters.",
    });
  });

  it("rejects an invalid email with the configured message", () => {
    expect(
      issueFor(signUpSchema, { ...validSignUp, email: "not-an-email" }, "email"),
    ).toMatchObject({
      path: ["email"],
      message: "Please enter a valid email address.",
    });
  });

  it("rejects passwords shorter than eight characters with the configured message", () => {
    expect(
      issueFor(
        signUpSchema,
        { ...validSignUp, password: "seven77", confirmPassword: "seven77" },
        "password",
      ),
    ).toMatchObject({
      path: ["password"],
      message: "Password must be at least 8 characters.",
    });
  });

  it("rejects passwords missing an uppercase letter with the configured message", () => {
    expect(
      issueFor(
        signUpSchema,
        { ...validSignUp, password: "password@1", confirmPassword: "password@1" },
        "password",
      ),
    ).toMatchObject({
      path: ["password"],
      message: "Password must include at least one uppercase letter.",
    });
  });

  it("rejects passwords missing a special character with the configured message", () => {
    expect(
      issueFor(
        signUpSchema,
        { ...validSignUp, password: "Password1", confirmPassword: "Password1" },
        "password",
      ),
    ).toMatchObject({
      path: ["password"],
      message: "Password must include at least one special character.",
    });
  });

  it("rejects mismatched confirmation passwords on confirmPassword", () => {
    expect(
      issueFor(
        signUpSchema,
        { ...validSignUp, confirmPassword: "Different@1" },
        "confirmPassword",
      ),
    ).toMatchObject({
      path: ["confirmPassword"],
      message: "Passwords don't match",
    });
  });

  it("rejects unaccepted terms with the configured message", () => {
    expect(
      issueFor(
        signUpSchema,
        { ...validSignUp, agreeToTerms: false },
        "agreeToTerms",
      ),
    ).toMatchObject({
      path: ["agreeToTerms"],
      message: "You must agree to the terms and conditions.",
    });
  });

  it.each([
    {
      name: "missing fullName",
      path: "fullName",
      payload: {
        email: validSignUp.email,
        password: validSignUp.password,
        confirmPassword: validSignUp.confirmPassword,
        agreeToTerms: validSignUp.agreeToTerms,
      },
    },
    {
      name: "non-string fullName",
      path: "fullName",
      payload: { ...validSignUp, fullName: 42 },
    },
    {
      name: "missing email",
      path: "email",
      payload: {
        fullName: validSignUp.fullName,
        password: validSignUp.password,
        confirmPassword: validSignUp.confirmPassword,
        agreeToTerms: validSignUp.agreeToTerms,
      },
    },
    {
      name: "non-string email",
      path: "email",
      payload: { ...validSignUp, email: 42 },
    },
    {
      name: "missing password",
      path: "password",
      payload: {
        fullName: validSignUp.fullName,
        email: validSignUp.email,
        confirmPassword: validSignUp.confirmPassword,
        agreeToTerms: validSignUp.agreeToTerms,
      },
    },
    {
      name: "non-string password",
      path: "password",
      payload: { ...validSignUp, password: 42 },
    },
    {
      name: "missing confirmPassword",
      path: "confirmPassword",
      payload: {
        fullName: validSignUp.fullName,
        email: validSignUp.email,
        password: validSignUp.password,
        agreeToTerms: validSignUp.agreeToTerms,
      },
    },
    {
      name: "non-string confirmPassword",
      path: "confirmPassword",
      payload: { ...validSignUp, confirmPassword: 42 },
    },
    {
      name: "missing agreeToTerms",
      path: "agreeToTerms",
      payload: {
        fullName: validSignUp.fullName,
        email: validSignUp.email,
        password: validSignUp.password,
        confirmPassword: validSignUp.confirmPassword,
      },
    },
    {
      name: "non-boolean agreeToTerms",
      path: "agreeToTerms",
      payload: { ...validSignUp, agreeToTerms: "true" },
    },
  ])("rejects $name with invalid_type on the field path", ({ payload, path }) => {
    expect(issueFor(signUpSchema, payload, path)).toMatchObject({
      path: [path],
      code: "invalid_type",
    });
  });

});

describe("loginSchema", () => {
  it("accepts valid login data with rememberMe true", () => {
    expect(loginSchema.safeParse({ ...validLogin, rememberMe: true }).success).toBe(
      true,
    );
  });

  it("accepts valid login data with rememberMe false", () => {
    expect(loginSchema.safeParse({ ...validLogin, rememberMe: false }).success).toBe(
      true,
    );
  });

  it("rejects invalid login emails with the configured message", () => {
    expect(
      issueFor(
        loginSchema,
        { ...validLogin, email: "not-an-email", rememberMe: true },
        "email",
      ),
    ).toMatchObject({
      path: ["email"],
      message: "Please enter a valid email address.",
    });
  });

  it("rejects short login passwords with the configured message", () => {
    expect(
      issueFor(
        loginSchema,
        { ...validLogin, password: "short", rememberMe: true },
        "password",
      ),
    ).toMatchObject({
      path: ["password"],
      message: "Password must be at least 8 characters.",
    });
  });

  it.each([
    {
      name: "missing email",
      path: "email",
      payload: { password: validLogin.password, rememberMe: true },
    },
    {
      name: "non-string email",
      path: "email",
      payload: { ...validLogin, email: 42, rememberMe: true },
    },
    {
      name: "missing password",
      path: "password",
      payload: { email: validLogin.email, rememberMe: true },
    },
    {
      name: "non-string password",
      path: "password",
      payload: { ...validLogin, password: 42, rememberMe: true },
    },
  ])("rejects $name with invalid_type on the field path", ({ payload, path }) => {
    expect(issueFor(loginSchema, payload, path)).toMatchObject({
      path: [path],
      code: "invalid_type",
    });
  });

  it("rejects missing rememberMe", () => {
    expect(issueFor(loginSchema, validLogin, "rememberMe")).toMatchObject({
      path: ["rememberMe"],
      code: "invalid_type",
    });
  });

  it("rejects non-boolean rememberMe", () => {
    expect(
      issueFor(loginSchema, { ...validLogin, rememberMe: "true" }, "rememberMe"),
    ).toMatchObject({
      path: ["rememberMe"],
      code: "invalid_type",
    });
  });
});
