import { describe, expect, it } from "vitest";

import {
  loginSchema,
  passwordPolicySchema,
  passwordPolicy,
  passwordSchema,
  signUpSchema,
  changePasswordSchema,
} from "@/types/auth";

const validSignUp = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  password: "Password@1",
  confirmPassword: "Password@1",
  agreeToTerms: true,
};

const validLogin = {
  email: "ada@example.com",
  password: "Password@1",
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

function withoutField<T extends object>(
  payload: T,
  field: keyof T,
): Partial<T> {
  const payloadWithoutField: Partial<T> = { ...payload };
  delete payloadWithoutField[field];

  return payloadWithoutField;
}

describe("shared password policy", () => {
  it("exports a shared password schema and policy for all auth forms", () => {
    expect(passwordPolicy.rules).toHaveLength(3);
    expect(passwordSchema.safeParse("Password@1").success).toBe(true);
    expect(passwordSchema.safeParse("password").success).toBe(false);
  });

  it.each([
    {
      rule: passwordPolicy.rules[0],
      password: "Pass@1",
    },
    {
      rule: passwordPolicy.rules[1],
      password: "password@1",
    },
    {
      rule: passwordPolicy.rules[2],
      password: "Password1",
    },
  ])("surfaces the shared $rule.id policy message", ({ rule, password }) => {
    const result = passwordSchema.safeParse(password);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(rule.message);
  });
});

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
      issueFor(
        signUpSchema,
        { ...validSignUp, email: "not-an-email" },
        "email",
      ),
    ).toMatchObject({
      path: ["email"],
      message: "Please enter a valid email address.",
    });
  });

  it.each([
    {
      name: "minimum length",
      password: "seven77",
      message: passwordPolicy.rules[0].message,
    },
    {
      name: "uppercase letter",
      password: "password@1",
      message: passwordPolicy.rules[1].message,
    },
    {
      name: "special character",
      password: "Password1",
      message: passwordPolicy.rules[2].message,
    },
  ])(
    "rejects passwords missing a $name rule with the shared policy message",
    ({ password, message }) => {
      expect(
        issueFor(
          signUpSchema,
          { ...validSignUp, password, confirmPassword: password },
          "password",
        ),
      ).toMatchObject({
        path: ["password"],
        message,
      });
    },
  );

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
      payload: withoutField(validSignUp, "fullName"),
    },
    {
      name: "non-string fullName",
      path: "fullName",
      payload: { ...validSignUp, fullName: 42 },
    },
    {
      name: "missing email",
      path: "email",
      payload: withoutField(validSignUp, "email"),
    },
    {
      name: "non-string email",
      path: "email",
      payload: { ...validSignUp, email: 42 },
    },
    {
      name: "missing password",
      path: "password",
      payload: withoutField(validSignUp, "password"),
    },
    {
      name: "non-string password",
      path: "password",
      payload: { ...validSignUp, password: 42 },
    },
    {
      name: "missing confirmPassword",
      path: "confirmPassword",
      payload: withoutField(validSignUp, "confirmPassword"),
    },
    {
      name: "non-string confirmPassword",
      path: "confirmPassword",
      payload: { ...validSignUp, confirmPassword: 42 },
    },
    {
      name: "missing agreeToTerms",
      path: "agreeToTerms",
      payload: withoutField(validSignUp, "agreeToTerms"),
    },
    {
      name: "non-boolean agreeToTerms",
      path: "agreeToTerms",
      payload: { ...validSignUp, agreeToTerms: "true" },
    },
  ])(
    "rejects $name with invalid_type on the field path",
    ({ payload, path }) => {
      expect(issueFor(signUpSchema, payload, path)).toMatchObject({
        path: [path],
        code: "invalid_type",
      });
    },
  );
});

describe("loginSchema", () => {
  it("accepts valid login data with rememberMe true", () => {
    expect(
      loginSchema.safeParse({ ...validLogin, rememberMe: true }).success,
    ).toBe(true);
  });

  it("accepts valid login data with rememberMe false", () => {
    expect(
      loginSchema.safeParse({ ...validLogin, rememberMe: false }).success,
    ).toBe(true);
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

  it("rejects short login passwords with the shared minimum-length message", () => {
    expect(
      issueFor(
        loginSchema,
        { ...validLogin, password: "short", rememberMe: true },
        "password",
      ),
    ).toMatchObject({
      path: ["password"],
      message: passwordPolicy.rules[0].message,
    });
  });

  it.each([
    {
      name: "missing email",
      path: "email",
      payload: { ...withoutField(validLogin, "email"), rememberMe: true },
    },
    {
      name: "non-string email",
      path: "email",
      payload: { ...validLogin, email: 42, rememberMe: true },
    },
    {
      name: "missing password",
      path: "password",
      payload: { ...withoutField(validLogin, "password"), rememberMe: true },
    },
    {
      name: "non-string password",
      path: "password",
      payload: { ...validLogin, password: 42, rememberMe: true },
    },
  ])(
    "rejects $name with invalid_type on the field path",
    ({ payload, path }) => {
      expect(issueFor(loginSchema, payload, path)).toMatchObject({
        path: [path],
        code: "invalid_type",
      });
    },
  );

  it("rejects missing rememberMe", () => {
    expect(issueFor(loginSchema, validLogin, "rememberMe")).toMatchObject({
      path: ["rememberMe"],
      code: "invalid_type",
    });
  });

  it("rejects non-boolean rememberMe", () => {
    expect(
      issueFor(
        loginSchema,
        { ...validLogin, rememberMe: "true" },
        "rememberMe",
      ),
    ).toMatchObject({
      path: ["rememberMe"],
      code: "invalid_type",
    });
  });
});

// ---------------------------------------------------------------------------
// passwordPolicySchema
// ---------------------------------------------------------------------------

describe("passwordPolicySchema", () => {
  it("accepts a strong password", () => {
    expect(passwordPolicySchema.safeParse("StrongPass@1").success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = passwordPolicySchema.safeParse("Ab@1");
    expect(result.success).toBe(false);
    expect(!result.success && result.error.issues[0].message).toBe(
      "Password must be at least 8 characters.",
    );
  });

  it("rejects a password with no uppercase letter", () => {
    const result = passwordPolicySchema.safeParse("weakpass@1");
    expect(result.success).toBe(false);
    expect(!result.success && result.error.issues[0].message).toBe(
      "Password must include at least one uppercase letter.",
    );
  });

  it("rejects a password with no special character", () => {
    const result = passwordPolicySchema.safeParse("StrongPass1");
    expect(result.success).toBe(false);
    expect(!result.success && result.error.issues[0].message).toBe(
      "Password must include at least one special character.",
    );
  });

  it("accepts passwords with each supported special character", () => {
    const specials = ["@", "!", "#", "%", "$", "^", "&", "*"];
    for (const char of specials) {
      expect(
        passwordPolicySchema.safeParse(`StrongPass${char}1`).success,
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// changePasswordSchema
// ---------------------------------------------------------------------------

const validChange = {
  newPassword: "StrongPass@1",
  confirmPassword: "StrongPass@1",
};

describe("changePasswordSchema", () => {
  it("accepts matching strong passwords", () => {
    expect(changePasswordSchema.safeParse(validChange).success).toBe(true);
  });

  it("rejects when newPassword is too short", () => {
    const result = changePasswordSchema.safeParse({
      ...validChange,
      newPassword: "Ab@1",
      confirmPassword: "Ab@1",
    });
    expect(result.success).toBe(false);
    const issues = !result.success ? result.error.issues : [];
    expect(issues.some((i) => i.path[0] === "newPassword")).toBe(true);
  });

  it("rejects when newPassword has no uppercase letter", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "weakpass@1",
      confirmPassword: "weakpass@1",
    });
    expect(result.success).toBe(false);
    const issues = !result.success ? result.error.issues : [];
    expect(
      issues.some(
        (i) =>
          i.path[0] === "newPassword" &&
          i.message.includes("uppercase"),
      ),
    ).toBe(true);
  });

  it("rejects when newPassword has no special character", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "StrongPass1",
      confirmPassword: "StrongPass1",
    });
    expect(result.success).toBe(false);
    const issues = !result.success ? result.error.issues : [];
    expect(
      issues.some(
        (i) =>
          i.path[0] === "newPassword" &&
          i.message.includes("special character"),
      ),
    ).toBe(true);
  });

  it("rejects when passwords don't match, placing the error on confirmPassword", () => {
    const result = changePasswordSchema.safeParse({
      ...validChange,
      confirmPassword: "DifferentPass@1",
    });
    expect(result.success).toBe(false);
    const issues = !result.success ? result.error.issues : [];
    const confirmIssue = issues.find((i) => i.path[0] === "confirmPassword");
    expect(confirmIssue).toMatchObject({
      path: ["confirmPassword"],
      message: "Passwords don't match.",
    });
  });

  it("rejects when newPassword is missing", () => {
    const result = changePasswordSchema.safeParse({
      confirmPassword: "StrongPass@1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when confirmPassword is missing", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "StrongPass@1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when both fields are empty strings", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });

  it("allows confirmPassword that is an empty string when newPassword is weak (newPassword error wins)", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "weak",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
    const issues = !result.success ? result.error.issues : [];
    expect(issues.some((i) => i.path[0] === "newPassword")).toBe(true);
  });
});
