import { describe, expect, it } from "vitest";

import {
  DEFAULT_TRANSACTION_DATE_RANGE,
  DEFAULT_TRANSACTIONS_PAGE_SIZE,
} from "./transactions-config";

describe("transactions config", () => {
  it("keeps the shared page size in sync with skeleton row expectations", () => {
    expect(DEFAULT_TRANSACTIONS_PAGE_SIZE).toBe(6);
  });

  it("does not pin the default transaction range to a stale fixed window", () => {
    expect(DEFAULT_TRANSACTION_DATE_RANGE).toEqual({
      fromDate: "",
      toDate: "",
    });
  });
});
