import { describe, expect, it } from "vitest";

import {
  checkPasswordRequirements,
  isPasswordStrong,
  isValidEmail,
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
