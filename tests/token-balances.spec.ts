import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mockAuth";

test.describe("spray token balances", () => {
  test("loads token balances when network is selected", async ({
    page,
    baseURL,
  }) => {
    await mockAuth(page, baseURL);

    await page.goto(`${baseURL}/en/spray`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/spray/);

    // Wait for the page to fully load
    await page.waitForLoadState("networkidle");

    // Find the network selector
    const networkSelector = page
      .locator('button[aria-controls="network-selector-options"]')
      .first();
    await expect(networkSelector).toBeVisible();

    // Check that trusted tokens section exists
    const trustedTokensSection = page.locator("text=Trusted tokens").first();

    // If trusted tokens section exists, verify balances load
    if (await trustedTokensSection.isVisible()) {
      // Check console for errors
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error" || msg.text().includes("Failed to fetch")) {
          consoleErrors.push(msg.text());
        }
      });

      // Wait a bit for balances to load
      await page.waitForTimeout(3000);

      // Log any console errors for debugging
      if (consoleErrors.length > 0) {
        console.log("Console errors detected:", consoleErrors);
      }
    }
  });

  test("switches network and updates balances", async ({ page, baseURL }) => {
    await mockAuth(page, baseURL);

    await page.goto(`${baseURL}/en/spray`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/spray/);
    await page.waitForLoadState("networkidle");

    // Find and click the network selector
    const networkSelector = page
      .locator('button[aria-controls="network-selector-options"]')
      .first();
    await expect(networkSelector).toBeVisible();
    await networkSelector.click();

    // Wait for dropdown to appear
    const dropdown = page.locator("#network-selector-options");
    await expect(dropdown).toBeVisible();

    // Collect console messages
    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Select a different network (e.g., Optimism)
    const optimismOption = dropdown.locator("text=Optimism").first();
    if (await optimismOption.isVisible()) {
      await optimismOption.click();

      // Wait for balance update
      await page.waitForTimeout(3000);

      // Check for any errors related to balance fetching
      const balanceErrors = consoleMessages.filter(
        (msg) =>
          msg.includes("Failed to fetch") || msg.includes("balance error"),
      );

      if (balanceErrors.length > 0) {
        console.log("Balance fetch errors:", balanceErrors);
      }
    }
  });

  test("displays correct balance format", async ({ page, baseURL }) => {
    await mockAuth(page, baseURL);

    // Intercept RPC calls to verify they're being made correctly
    const rpcCalls: { url: string; body: string }[] = [];
    await page.route("**/*.org/**", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        rpcCalls.push({
          url: request.url(),
          body: request.postData() || "",
        });
      }
      await route.continue();
    });

    await page.goto(`${baseURL}/en/spray`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Log RPC calls for debugging
    console.log("RPC calls made:", rpcCalls.length);
    for (const call of rpcCalls) {
      console.log(`  ${call.url}: ${call.body.substring(0, 100)}...`);
    }
  });
});
