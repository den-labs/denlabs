import { expect, test } from "@playwright/test";

test.describe("spray network selector", () => {
  test("shows ethereum in the network list", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/en/spray`, {
      waitUntil: "domcontentloaded",
    });

    const selectorButton = page.locator(
      'button[aria-controls="network-selector-options"]',
    );
    await selectorButton.waitFor({ state: "visible" });
    await selectorButton.click();

    const options = page.getByRole("option", { name: /ethereum/i });
    await expect(options).toBeVisible();
  });
});
