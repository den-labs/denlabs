import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computeTotals,
  dedupe,
  findDuplicateAddresses,
  parseRecipients,
  validateRow,
} from "../src/lib/recipients.ts";

test("parseRecipients supports separators and header detection", () => {
  const input = [
    "address,amount",
    "0x0000000000000000000000000000000000000001,1.5",
    "0x0000000000000000000000000000000000000002 2.5",
    "0x0000000000000000000000000000000000000003\t3.5",
  ].join("\n");
  const result = parseRecipients(input, "custom", 18);
  assert.equal(result.headerIgnored, true);
  assert.equal(result.linesTotal, 3);
  assert.equal(result.uniqueAddresses, 3);
});

test("same amount mode counts valid unique and ignored amounts", () => {
  const input = [
    "0x0000000000000000000000000000000000000001 1.0",
    "0x0000000000000000000000000000000000000001 2.0",
    "0x0000000000000000000000000000000000000002",
  ].join("\n");
  const result = parseRecipients(input, "same", 18);
  assert.equal(result.ignoredAmountRows, 2);
  assert.equal(result.uniqueAddresses, 2);
  assert.equal(result.counts.validUnique, 2);
  assert.equal(result.duplicatesExtraRows, 1);
});

test("custom mode normalizes comma decimals", () => {
  const input = "0x0000000000000000000000000000000000000001,1,25";
  const result = parseRecipients(input, "custom", 18);
  assert.equal(result.decimalNormalizedCount, 1);
  assert.equal(result.uniqueRecipients[0].amountNormalized, "1.25");
});

test("custom mode counts missing and invalid amounts", () => {
  const input = [
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002,0",
  ].join("\n");
  const result = parseRecipients(input, "custom", 18);
  assert.equal(result.missingAmountRows, 1);
  assert.equal(result.invalidRows, 1);
});

test("parseRecipients counts invalid address rows", () => {
  const input = [
    "0x0000000000000000000000000000000000000001,1",
    "badaddress,2",
  ].join("\n");
  const result = parseRecipients(input, "custom", 18);
  assert.equal(result.invalidRows, 1);
});

test("parseRecipients dedupe strategies keep first and keep last", () => {
  const input = [
    "0x0000000000000000000000000000000000000001,1",
    "0x0000000000000000000000000000000000000001,2",
  ].join("\n");
  const keepFirst = parseRecipients(input, "custom", 18, "keep_first");
  assert.equal(keepFirst.uniqueRecipients[0].amountNormalized, "1");

  const keepLast = parseRecipients(input, "custom", 18, "keep_last");
  assert.equal(keepLast.uniqueRecipients[0].amountNormalized, "2");
});

test("parseRecipients dedupe strategies merge sum and merge max", () => {
  const input = [
    "0x0000000000000000000000000000000000000001,1.25",
    "0x0000000000000000000000000000000000000001,2.75",
  ].join("\n");
  const mergeSum = parseRecipients(input, "custom", 18, "merge_sum");
  assert.equal(Number(mergeSum.uniqueRecipients[0].amountNormalized), 4);

  const mergeMax = parseRecipients(input, "custom", 18, "merge_max");
  assert.equal(mergeMax.uniqueRecipients[0].amountNormalized, "2.75");
});

test("validateRow flags invalid address and missing amount", () => {
  const invalid = validateRow(
    { id: "1", address: "bad", amount: "" },
    18,
    "custom",
  );
  assert.equal(invalid.status, "invalid");

  const missingAmount = validateRow(
    { id: "2", address: "0x0000000000000000000000000000000000000001" },
    18,
    "custom",
  );
  assert.equal(missingAmount.status, "missing_amount");
});

test("computeTotals sums valid rows for same and custom modes", () => {
  const rows = [
    {
      id: "1",
      address: "0x0000000000000000000000000000000000000001",
      amount: "1",
    },
    {
      id: "2",
      address: "0x0000000000000000000000000000000000000002",
      amount: "2",
    },
  ];
  const duplicates = findDuplicateAddresses(rows);
  const customTotals = computeTotals(rows, "custom", "", 18, duplicates);
  assert.equal(customTotals.total, 3);

  const sameTotals = computeTotals(rows, "same", "0.5", 18, duplicates);
  assert.equal(sameTotals.total, 1);
});

test("dedupe removes duplicate addresses preserving order", () => {
  const rows = [
    { id: "1", address: "0x0000000000000000000000000000000000000001" },
    { id: "2", address: "0x0000000000000000000000000000000000000001" },
    { id: "3", address: "0x0000000000000000000000000000000000000002" },
  ];
  const unique = dedupe(rows);
  assert.equal(unique.length, 2);
  assert.equal(unique[0].id, "1");
  assert.equal(unique[1].id, "3");
});
