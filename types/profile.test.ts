import { describe, expect, it } from "vitest";

import type { ProfileData } from "./profile";
import {
  PROFILE_FIELDS,
  countCompletedProfileDataFields,
  isProfileDataComplete,
  totalProfileDataFields,
} from "./profile";

const COMPLETE_PROFILE: ProfileData = {
  firstName: "Ada",
  lastName: "Lovelace",
  displayName: "Ada Lovelace",
  email: "ada@stellopay.test",
  timezone: "Europe/London",
  currency: "GBP",
  legalEntity: "Analytical Engines Ltd",
  billingCountry: "United Kingdom",
};

function emptyProfile(): ProfileData {
  return {
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    timezone: "",
    currency: "",
    legalEntity: "",
    billingCountry: "",
  };
}

function profileWith(field: keyof ProfileData, value: string): ProfileData {
  return { ...emptyProfile(), [field]: value };
}

describe("PROFILE_FIELDS", () => {
  it("lists every profile field in display order", () => {
    expect(PROFILE_FIELDS).toEqual([
      "firstName",
      "lastName",
      "displayName",
      "email",
      "timezone",
      "currency",
      "legalEntity",
      "billingCountry",
    ]);
  });

  it("covers exactly the keys of a complete profile", () => {
    expect([...PROFILE_FIELDS].sort()).toEqual(
      Object.keys(COMPLETE_PROFILE).sort(),
    );
  });
});

describe("totalProfileDataFields", () => {
  it("returns the number of tracked profile fields", () => {
    expect(totalProfileDataFields()).toBe(8);
  });

  it("agrees with the length of PROFILE_FIELDS", () => {
    expect(totalProfileDataFields()).toBe(PROFILE_FIELDS.length);
  });

  it("is stable across calls", () => {
    expect(totalProfileDataFields()).toBe(totalProfileDataFields());
  });
});

describe("isProfileDataComplete", () => {
  it("returns true when every field holds a value", () => {
    expect(isProfileDataComplete(COMPLETE_PROFILE)).toBe(true);
  });

  it("counts values with surrounding whitespace as present", () => {
    const padded = Object.fromEntries(
      PROFILE_FIELDS.map((field) => [field, `  ${COMPLETE_PROFILE[field]}  `]),
    ) as unknown as ProfileData;

    expect(isProfileDataComplete(padded)).toBe(true);
  });

  it("returns false for an entirely empty profile", () => {
    expect(isProfileDataComplete(emptyProfile())).toBe(false);
  });

  it("returns false when every field is whitespace only", () => {
    const whitespace = Object.fromEntries(
      PROFILE_FIELDS.map((field) => [field, "   "]),
    ) as unknown as ProfileData;

    expect(isProfileDataComplete(whitespace)).toBe(false);
  });

  it.each(PROFILE_FIELDS)(
    "returns false when only %s is empty",
    (field) => {
      expect(
        isProfileDataComplete({ ...COMPLETE_PROFILE, [field]: "" }),
      ).toBe(false);
    },
  );

  it.each(PROFILE_FIELDS)(
    "returns false when only %s is whitespace",
    (field) => {
      expect(
        isProfileDataComplete({ ...COMPLETE_PROFILE, [field]: " \t\n " }),
      ).toBe(false);
    },
  );

  it("returns false when the last tracked field is the only missing one", () => {
    expect(
      isProfileDataComplete({ ...COMPLETE_PROFILE, billingCountry: "" }),
    ).toBe(false);
  });
});

describe("countCompletedProfileDataFields", () => {
  it("returns zero for an entirely empty profile", () => {
    expect(countCompletedProfileDataFields(emptyProfile())).toBe(0);
  });

  it("returns zero when every field is whitespace only", () => {
    const whitespace = Object.fromEntries(
      PROFILE_FIELDS.map((field) => [field, "   "]),
    ) as unknown as ProfileData;

    expect(countCompletedProfileDataFields(whitespace)).toBe(0);
  });

  it("returns the total for a fully populated profile", () => {
    expect(countCompletedProfileDataFields(COMPLETE_PROFILE)).toBe(
      totalProfileDataFields(),
    );
  });

  it.each(PROFILE_FIELDS)(
    "counts a single populated field: %s",
    (field) => {
      expect(
        countCompletedProfileDataFields(profileWith(field, "value")),
      ).toBe(1);
    },
  );

  it("counts partially populated profiles without exceeding the total", () => {
    const count = countCompletedProfileDataFields({
      ...emptyProfile(),
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@stellopay.test",
      currency: "GBP",
    });

    expect(count).toBe(4);
    expect(count).toBeLessThanOrEqual(totalProfileDataFields());
  });

  it("does not count whitespace-only fields as completed", () => {
    expect(
      countCompletedProfileDataFields({
        ...emptyProfile(),
        firstName: "Ada",
        lastName: "   ",
        email: "\t",
      }),
    ).toBe(1);
  });

  it("counts fields whose values are padded with whitespace", () => {
    const padded = Object.fromEntries(
      PROFILE_FIELDS.map((field) => [field, ` ${COMPLETE_PROFILE[field]} `]),
    ) as unknown as ProfileData;

    expect(countCompletedProfileDataFields(padded)).toBe(
      totalProfileDataFields(),
    );
  });

  it("never reports more than the number of tracked fields", () => {
    expect(countCompletedProfileDataFields(COMPLETE_PROFILE)).toBe(
      PROFILE_FIELDS.length,
    );
  });
});
