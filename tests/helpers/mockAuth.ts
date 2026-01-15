import type { Page } from "@playwright/test";

export const MOCK_LAB_USER_ID = "test-user-id";
export const MOCK_PROFILE = {
  id: MOCK_LAB_USER_ID,
  handle: "playwright",
  display_name: "Playwright User",
  role: "player",
  wallet_address: "0x00000000000000000000000000000000000000aa",
  self_verified: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

export async function mockAuth(page: Page, baseURL?: string) {
  const resolvedBaseUrl = baseURL || "http://localhost:3000";
  const origin = new URL(resolvedBaseUrl).origin;
  await page.context().addCookies([
    {
      name: "denlabs-user-id",
      value: MOCK_LAB_USER_ID,
      url: origin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.setExtraHTTPHeaders({
    cookie: `denlabs-user-id=${MOCK_LAB_USER_ID}`,
  });
}
