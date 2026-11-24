import { getVerificationUrl } from "./receipt";

describe("getVerificationUrl", () => {
  it("points receipts at the transaction detail route", () => {
    expect(getVerificationUrl("42")).toBe(
      `${window.location.origin}/transactions/42`,
    );
  });

  it("encodes opaque ids into one route segment", () => {
    expect(getVerificationUrl("batch/42")).toBe(
      `${window.location.origin}/transactions/batch%2F42`,
    );
  });
});
