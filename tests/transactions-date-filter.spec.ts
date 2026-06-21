import { expect, test, type Page } from "@playwright/test";

const TRANSACTIONS_URL = "/transactions";

async function selectApril122023(page: Page, triggerName: RegExp) {
  await page.getByRole("button", { name: triggerName }).click();

  const previousMonth = page.getByLabel(/previous month/i);
  for (let i = 0; i < 40; i += 1) {
    if (await page.getByText(/April 2023/i).isVisible().catch(() => false)) {
      break;
    }
    await previousMonth.click();
  }

  await expect(page.getByText(/April 2023/i)).toBeVisible();
  await page.getByRole("button", { name: /12/ }).first().click();
}

async function visibleTransactionDates(page: Page) {
  return page
    .locator("tbody time")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("datetime") ?? node.textContent ?? ""),
    );
}

test.describe("Transactions date range filter", () => {
  test("filters rows to a selected date range and clears back to all rows", async ({
    page,
  }) => {
    await page.goto(TRANSACTIONS_URL);

    await expect(page.getByText("All Transactions")).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(6);

    await selectApril122023(page, /start date/i);
    await selectApril122023(page, /end date/i);

    await expect(page.getByText("(2 filtered)")).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(2);
    await expect
      .poll(() => visibleTransactionDates(page))
      .toEqual(["2023-04-12", "2023-04-12"]);

    await page.getByRole("button", { name: /clear date range/i }).click();

    await expect(page.getByText("(2 filtered)")).not.toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(6);
  });
});
