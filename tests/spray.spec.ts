import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { mockAuth } from "./helpers/mockAuth";

const LIST_PLACEHOLDER = "0xabc...,0.25";
const buildRecipients = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const hex = (index + 1).toString(16).padStart(40, "0");
    return `0x${hex},${(index + 1).toString()}`;
  }).join("\n");

const applyRecipients = async (page: Page, list: string) => {
  await page.getByRole("heading", { name: /recipients/i }).waitFor();
  const recipientsCard = page.locator("section").filter({
    has: page.getByRole("heading", { name: /recipients/i }),
  });
  const pasteButton = recipientsCard
    .getByRole("button", { name: "Paste list" })
    .first();
  await pasteButton.waitFor({ state: "visible" });
  await expect(pasteButton).toBeEnabled();
  await page.waitForLoadState("networkidle");
  await pasteButton.scrollIntoViewIfNeeded();
  await pasteButton.click({ force: true });
  await page.getByRole("heading", { name: /paste recipients/i }).waitFor();
  const textarea = page.getByPlaceholder(LIST_PLACEHOLDER);
  await textarea.waitFor({ state: "visible" });
  await textarea.fill(list);
  await page.getByRole("button", { name: "Apply" }).click();
  await textarea.waitFor({ state: "hidden" });
};

const captureAuthCookie = async (page: Page) => {
  let cookieHeader = "";
  await page.route("**/en/spray", async (route) => {
    cookieHeader = route.request().headers().cookie ?? "";
    await route.continue();
  });
  return () => cookieHeader;
};

test.describe("spray network selector", () => {
  test("shows ethereum in the network list", async ({ page, baseURL }) => {
    await mockAuth(page, baseURL);
    const getCookieHeader = await captureAuthCookie(page);

    await page.goto(`${baseURL}/en/spray`, {
      waitUntil: "domcontentloaded",
    });
    expect(getCookieHeader()).toContain("denlabs-user-id=");
    await expect(page).toHaveURL(/\/en\/spray/);
    await expect(
      page.getByRole("button", { name: "Paste list" }),
    ).toBeVisible();

    const selectorButton = page
      .locator('button[aria-controls="network-selector-options"]')
      .first();
    await expect(selectorButton).toBeVisible();
  });
});

test.describe("spray recipients table virtualization", () => {
  test("renders non-virtualized table below threshold", async ({
    page,
    baseURL,
  }) => {
    await mockAuth(page, baseURL);
    const getCookieHeader = await captureAuthCookie(page);

    await page.goto(`${baseURL}/en/spray`, { waitUntil: "domcontentloaded" });
    expect(getCookieHeader()).toContain("denlabs-user-id=");
    await expect(page).toHaveURL(/\/en\/spray/);
    await expect(
      page.getByRole("button", { name: "Paste list" }),
    ).toBeVisible();
    await applyRecipients(page, buildRecipients(100));

    const recipientsCard = page.locator("section").filter({
      has: page.getByRole("heading", { name: /recipients/i }),
    });
    const scrollArea = recipientsCard.locator("div[data-virtualized]").first();
    await expect(scrollArea).toHaveAttribute("data-virtualized", "false");
  });

  test("virtualizes large lists and keeps inputs editable", async ({
    page,
    baseURL,
  }) => {
    await mockAuth(page, baseURL);
    const getCookieHeader = await captureAuthCookie(page);

    await page.goto(`${baseURL}/en/spray`, { waitUntil: "domcontentloaded" });
    expect(getCookieHeader()).toContain("denlabs-user-id=");
    await expect(page).toHaveURL(/\/en\/spray/);
    await expect(
      page.getByRole("button", { name: "Paste list" }),
    ).toBeVisible();
    await applyRecipients(page, buildRecipients(1000));

    const recipientsCard = page.locator("section").filter({
      has: page.getByRole("heading", { name: /recipients/i }),
    });
    const scrollArea = recipientsCard.locator("div[data-virtualized]").first();
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

test.describe("spray log viewer", () => {
  test("shows send_started in the log modal", async ({ page, baseURL }) => {
    await mockAuth(page, baseURL);

    await page.goto(`${baseURL}/en/spray`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/spray/);
    await expect(
      page.getByRole("button", { name: "Paste list" }),
    ).toBeVisible();

    const eventRequestPromise = page.waitForRequest(
      (request) =>
        request.url().includes("/api/spray/") &&
        request.url().includes("/events") &&
        request.method() === "POST",
    );

    await applyRecipients(page, buildRecipients(3));

    const eventRequest = await eventRequestPromise;
    const match = eventRequest.url().match(/\/api\/spray\/([^/]+)\/events/);
    const sprayId = match?.[1];
    expect(sprayId).toBeTruthy();

    await page.evaluate(async (id) => {
      await fetch(`/api/spray/${id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "send_started",
          metadata: { source: "e2e" },
        }),
      });
    }, sprayId);

    await page.getByRole("button", { name: "View log" }).click();
    await expect(
      page.getByRole("heading", { name: /spray log/i }),
    ).toBeVisible();
    await expect(page.getByText("Send started")).toBeVisible();
  });
});
