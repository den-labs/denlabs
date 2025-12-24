import { expect, test } from "@playwright/test";

const REQUIRE_CSP = process.env.REQUIRE_CSP === "true";

const routes = [
  "/",
  "/en",
  "/en/access",
  "/en/lab",
  "/en/missions",
  "/en/quests",
  "/en/checkin",
  "/en/spray",
  "/en/gooddollar",
  "/en/auth",
  "/en/taberna",
  "/en/showcase",
  "/en/voting",
  "/en/mentorship",
  "/en/stats",
  "/en/leaderboard",
  "/en/mind-games",
  "/en/settings",
  "/es",
  "/es/access",
  "/es/lab",
  "/es/missions",
  "/es/quests",
  "/es/checkin",
  "/es/spray",
  "/es/gooddollar",
  "/es/auth",
  "/es/taberna",
  "/es/showcase",
  "/es/voting",
  "/es/mentorship",
  "/es/stats",
  "/es/leaderboard",
  "/es/mind-games",
  "/es/settings",
];

const requiredHeaders = [
  ...(REQUIRE_CSP ? ["content-security-policy"] : []),
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
];

type RouteResult = {
  path: string;
  url: string;
  finalUrl: string;
  status: number | null;
  consoleErrors: string[];
  consoleWarnings: string[];
  pageErrors: string[];
  requestFailures: { url: string; errorText: string }[];
  missingHeaders: string[];
  responseHeaders: Record<string, string>;
};

const results: RouteResult[] = [];

function normalizeHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

test.describe
  .serial("denlabs routes", () => {
    for (const path of routes) {
      test(`route ${path}`, async ({ page, baseURL }) => {
        const url = `${baseURL}${path}`;
        const consoleErrors: string[] = [];
        const consoleWarnings: string[] = [];
        const pageErrors: string[] = [];
        const requestFailures: { url: string; errorText: string }[] = [];

        page.on("console", (msg) => {
          const type = msg.type();
          const text = msg.text();
          if (type === "error") {
            consoleErrors.push(text);
          } else if (type === "warning") {
            consoleWarnings.push(text);
          }
        });

        page.on("pageerror", (err) => {
          pageErrors.push(err.message);
        });

        page.on("requestfailed", (req) => {
          const failure = req.failure();
          requestFailures.push({
            url: req.url(),
            errorText: failure ? failure.errorText : "unknown",
          });
        });

        let status: number | null = null;
        let responseHeaders: Record<string, string> = {};

        try {
          const resp = await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
          if (!resp) {
            throw new Error("navigation returned null response");
          }
          console.log("HEADERS", path, resp.status(), resp.headers());
          status = resp.status();
          responseHeaders = normalizeHeaders(resp.headers());
          await page.waitForTimeout(2000);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          pageErrors.push(`navigation-error: ${message}`);
        }

        // Validate status code - must be successful (2xx) or redirect (3xx)
        if (status !== null) {
          expect(
            status,
            `Unexpected status for ${path}: ${status}`,
          ).toBeGreaterThanOrEqual(200);
          expect(
            status,
            `Unexpected status for ${path}: ${status}`,
          ).toBeLessThan(400);
        }

        const h = responseHeaders;
        expect(
          h["x-frame-options"],
          `missing x-frame-options on ${path}`,
        ).toBeTruthy();
        expect(
          h["x-content-type-options"],
          `missing x-content-type-options on ${path}`,
        ).toBeTruthy();
        expect(
          h["referrer-policy"],
          `missing referrer-policy on ${path}`,
        ).toBeTruthy();
        expect(
          h["permissions-policy"],
          `missing permissions-policy on ${path}`,
        ).toBeTruthy();

        if (REQUIRE_CSP) {
          const hasCsp = Boolean(h["content-security-policy"]);
          const hasCspRO = Boolean(h["content-security-policy-report-only"]);
          expect(hasCsp || hasCspRO, `missing CSP on ${path}`).toBeTruthy();
        }

        const missingHeaders = requiredHeaders.filter(
          (header) => !responseHeaders[header],
        );

        results.push({
          path,
          url,
          finalUrl: page.url(),
          status,
          consoleErrors,
          consoleWarnings,
          pageErrors,
          requestFailures,
          missingHeaders,
          responseHeaders,
        });
      });
    }
  });

test.afterAll(async () => {
  const outputPath = "/tmp/denlabs-route-audit.json";
  await import("node:fs").then((fs) => {
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  });
});
