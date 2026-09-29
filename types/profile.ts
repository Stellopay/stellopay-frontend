/**
 * Canonical profile domain types.
 *
 * These live in `types/` (rather than inside the API client or a component)
 * so the client, the boundary validator, and every consumer all depend on the
 * same declaration without creating import cycles.
 */

/** The editable profile fields for the signed-in user. */
export interface ProfileData {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  timezone: string;
  currency: string;
  legalEntity: string;
  billingCountry: string;
}

/** Every field name on {@link ProfileData}, in display order. */
export const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "displayName",
  "email",
  "timezone",
  "currency",
  "legalEntity",
  "billingCountry",
] as const satisfies readonly (keyof ProfileData)[];

/**
 * Where a profile came from.
 *
 * `"api"` means the value was returned by a real request against the
 * configured API base URL and validated at the boundary.
 *
 * `"placeholder"` means the backend endpoint is not available yet and the
 * value is seeded demo data. This is a first-class, type-level signal: a
 * consumer cannot accidentally treat placeholder data as real data without
 * narrowing on it.
 */
export type ProfileSource = "api" | "placeholder";

/**
 * Why the placeholder path was taken. Surfaced in the UI so a user is never
 * shown fake data without being told it is fake.
 */
export type ProfilePlaceholderReason = "api_base_url_missing";

/** A successfully loaded profile, tagged with the source it came from. */
export type ProfileResult =
  | {
      source: "api";
      profile: ProfileData;
    }
  | {
      source: "placeholder";
      profile: ProfileData;
      reason: ProfilePlaceholderReason;
    };

/** The load lifecycle a profile consumer renders. */
export type ProfileLoadStatus = "loading" | "success" | "error";

/** A profile whose every tracked field has a non-empty value. */
export function isProfileDataComplete(profile: ProfileData): boolean {
  return PROFILE_FIELDS.every((field) => profile[field].trim().length > 0);
}

/** Number of {@link ProfileData} fields that currently hold a value. */
export function countCompletedProfileDataFields(profile: ProfileData): number {
  return PROFILE_FIELDS.filter(
    (field) => profile[field].trim().length > 0,
  ).length;
}

/** Total number of tracked {@link ProfileData} fields. */
export function totalProfileDataFields(): number {
  return PROFILE_FIELDS.length;
}
