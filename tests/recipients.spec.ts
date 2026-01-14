import { expect, test } from "@playwright/test";
import { applyFixes, parseRecipients } from "../src/lib/recipients";

test("same address with different amounts stays separate on apply-as-is", () => {
  const input = [
    "0x0000000000000000000000000000000000000001,1.25",
    "0x0000000000000000000000000000000000000001,2.50",
  ].join("\n");

  const parsed = parseRecipients(input, "custom", 18);
  expect(parsed.rows).toHaveLength(2);
  expect(parsed.rows.filter((row) => row.status === "duplicate")).toHaveLength(
    0,
  );
});

test("exact duplicate rows can be resolved by fixes", () => {
  const input = [
    "0x0000000000000000000000000000000000000001,1.25",
    "0x0000000000000000000000000000000000000001,1.25",
  ].join("\n");

  const parsed = parseRecipients(input, "custom", 18);
  const fixed = applyFixes(parsed.rows, {
    mode: "custom",
    tokenDecimals: 18,
    dedupeStrategy: "keep_first",
    mergeSameAddressSum: false,
    trimWhitespace: true,
    normalizeDecimals: true,
    dropInvalid: false,
  });

  expect(fixed).toHaveLength(1);
});
