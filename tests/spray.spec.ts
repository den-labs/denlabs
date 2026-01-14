import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const LIST_PLACEHOLDER = "0xabc...,0.25";
const TEST_WALLET = "0x00000000000000000000000000000000000000aa";

const extractCookieValue = (setCookie: string, name: string) => {
  const chunks = setCookie.split(/\n|,/);
  for (const chunk of chunks) {
    const match = new RegExp(`${name}=([^;]+)`).exec(chunk);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
};

const ensureAccess = async (page: Page, baseURL: string) => {
  const resolvedBaseUrl = baseURL || "http://localhost:3000";
  const response = await page.request.post(
    `${resolvedBaseUrl}/api/auth/wallet-login`,
    {
      data: { walletAddress: TEST_WALLET },
    },
  );
  if (!response.ok()) {
    return false;
  }
  const setCookie = response.headers()["set-cookie"];
  if (!setCookie) {
    return false;
  }
  const cookieValue = extractCookieValue(setCookie, "denlabs-user-id");
  if (!cookieValue) {
    return false;
  }
  await page.context().addCookies([
    {
      name: "denlabs-user-id",
      value: cookieValue,
      url: resolvedBaseUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  return true;
};

const buildRecipients = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const hex = (index + 1).toString(16).padStart(40, "0");
    return `0x${hex},${(index + 1).toString()}`;
  }).join("\n");

const applyRecipients = async (page: Page, list: string) => {
  await page.getByRole("button", { name: "Paste list" }).first().click();
  const textarea = page.getByPlaceholder(LIST_PLACEHOLDER);
  await textarea.waitFor({ state: "visible" });
  await textarea.fill(list);
  await page.getByRole("button", { name: "Apply" }).click();
  await textarea.waitFor({ state: "hidden" });
};

test.describe("spray network selector", () => {
  test("shows ethereum in the network list", async ({ page, baseURL }) => {
    const hasAccess = await ensureAccess(page, baseURL);
    test.skip(!hasAccess, "requires wallet-login API and Supabase access");

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

test.describe("spray recipients table virtualization", () => {
  test("renders non-virtualized table below threshold", async ({
    page,
    baseURL,
  }) => {
    const hasAccess = await ensureAccess(page, baseURL);
    test.skip(!hasAccess, "requires wallet-login API and Supabase access");

    await page.goto(`${baseURL}/en/spray`, { waitUntil: "domcontentloaded" });
    await applyRecipients(page, buildRecipients(100));

    const scrollArea = page.locator("div[data-virtualized]");
    await expect(scrollArea).toHaveAttribute("data-virtualized", "false");
  });

  test("virtualizes large lists and keeps inputs editable", async ({
    page,
    baseURL,
  }) => {
    const hasAccess = await ensureAccess(page, baseURL);
    test.skip(!hasAccess, "requires wallet-login API and Supabase access");

    await page.goto(`${baseURL}/en/spray`, { waitUntil: "domcontentloaded" });
    await applyRecipients(page, buildRecipients(1000));

    const scrollArea = page.locator("div[data-virtualized]");
    await expect(scrollArea).toHaveAttribute("data-virtualized", "true");

    const amountInput = page.getByPlaceholder("0.00").first();
    await amountInput.fill("9.99");
    await expect(amountInput).toHaveValue("9.99");

    await scrollArea.evaluate((element) => {
      element.scrollTop = 400;
    });
    await expect
      .poll(async () => scrollArea.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);
  });
});
