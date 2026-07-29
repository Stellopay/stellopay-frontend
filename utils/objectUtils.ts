/**
 * Shallow-compares two flat, plain-value records (strings, numbers,
 * booleans). Used to detect whether a settings section's live draft state
 * has diverged from its last-saved snapshot, without pulling in a deep-equal
 * dependency for objects that are never more than one level deep.
 *
 * Not suitable for nested objects/arrays — those compare by reference and
 * will report unequal even when structurally identical.
 */
export function isShallowEqual<T extends object>(a: T, b: T): boolean {
  if (a === b) return true;

  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const aKeys = Object.keys(aRecord);
  const bKeys = Object.keys(bRecord);
  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => Object.is(aRecord[key], bRecord[key]));
}
