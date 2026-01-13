import { formatUnits, parseUnits } from "ethers";

export type AmountMode = "same" | "custom";

export type ParsedRecipient = {
  address: string;
  amount?: string;
  line: number;
  raw: string;
  addressNorm: string;
  amountNormalized?: string;
  issues: string[];
  status: RecipientStatus;
  reason?: string;
};

export type RecipientParseIssue = {
  line: number;
  raw: string;
  type: "invalid_format" | "missing_amount";
};

export type ParsedLine = ParsedRecipient;

export type DedupeStrategy =
  | "keep_first"
  | "keep_last"
  | "merge_sum"
  | "merge_max";

export type ParseRecipientsResult = {
  lines: ParsedLine[];
  rows: ParsedLine[];
  uniqueRecipients: ParsedRecipient[];
  issues: RecipientParseIssue[];
  ignoredAmountCount: number;
  ignoredAmountRows: number;
  headerIgnored: boolean;
  decimalNormalizedCount: number;
  linesTotal: number;
  uniqueAddresses: number;
  duplicatesExtraRows: number;
  invalidRows: number;
  missingAmountRows: number;
  counts: {
    lines: number;
    uniqueAddresses: number;
    validUnique: number;
    duplicateLines: number;
    missing: number;
    invalid: number;
  };
};

export type RecipientStatus =
  | "valid"
  | "invalid"
  | "duplicate"
  | "missing_amount";

export type RecipientValidation = {
  status: RecipientStatus;
  issues: string[];
  normalizedAddress: string | null;
};

export type RecipientRowInput = {
  id: string;
  address: string;
  amount?: string;
};

export type RecipientTotals = {
  total: number;
  validCount: number;
  totalCount: number;
};

export function normalizeRecipientAddress(address: string) {
  const trimmed = address.trim();
  return trimmed ? trimmed.toLowerCase() : "";
}

function parseLineParts(line: string) {
  const trimmed = line.trim();
  if (!trimmed) {
    return { address: "", amount: undefined };
  }

  const commaIndex = trimmed.indexOf(",");
  if (commaIndex >= 0) {
    const address = trimmed.slice(0, commaIndex).trim();
    const amount = trimmed.slice(commaIndex + 1).trim();
    return { address, amount: amount || undefined };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { address: parts[0] ?? "", amount: undefined };
  }
  const [address, ...rest] = parts;
  const amount = rest.join(" ").trim();
  return { address: address ?? "", amount: amount || undefined };
}

function isHeaderRow(address: string, amount?: string) {
  const addressLower = address.toLowerCase();
  const amountLower = (amount ?? "").toLowerCase();
  return addressLower.includes("address") && amountLower.includes("amount");
}

function normalizeAmount(value: string) {
  if (!value) {
    return { normalized: value, changed: false };
  }
  const trimmed = value.trim();
  if (trimmed.includes(",") && !trimmed.includes(".")) {
    return { normalized: trimmed.replace(/,/g, "."), changed: true };
  }
  return { normalized: trimmed, changed: trimmed !== value };
}

function isValidRecipientAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

function resolveStatus(issues: string[]): RecipientStatus {
  if (issues.includes("invalid_address") || issues.includes("invalid_amount")) {
    return "invalid";
  }
  if (issues.includes("missing_amount")) {
    return "missing_amount";
  }
  if (issues.includes("duplicate")) {
    return "duplicate";
  }
  return "valid";
}

function buildUniqueRecipients(
  lines: ParsedLine[],
  strategy: DedupeStrategy,
  mode: AmountMode,
  tokenDecimals: number,
) {
  const byAddress = new Map<string, ParsedRecipient>();
  const uniqueRecipients: ParsedRecipient[] = [];
  const validAddressLines = lines.filter((line) =>
    isValidRecipientAddress(line.addressNorm),
  ).length;

  lines.forEach((line) => {
    if (!line.addressNorm) {
      uniqueRecipients.push(line);
      return;
    }
    if (!byAddress.has(line.addressNorm)) {
      byAddress.set(line.addressNorm, line);
      uniqueRecipients.push(line);
      return;
    }

    const existing = byAddress.get(line.addressNorm);
    if (!existing) {
      return;
    }

    const replaceExisting = () => {
      const index = uniqueRecipients.indexOf(existing);
      if (index >= 0) {
        uniqueRecipients[index] = line;
      }
      byAddress.set(line.addressNorm, line);
    };

    if (strategy === "keep_last") {
      replaceExisting();
      return;
    }

    if (strategy === "merge_sum" || strategy === "merge_max") {
      if (mode !== "custom") {
        return;
      }

      const existingAmount = existing.amountNormalized ?? existing.amount ?? "";
      const nextAmount = line.amountNormalized ?? line.amount ?? "";
      const existingValidation = isValidAmount(existingAmount, tokenDecimals);
      const nextValidation = isValidAmount(nextAmount, tokenDecimals);
      if (!existingValidation.valid && nextValidation.valid) {
        const merged = {
          ...existing,
          amount: nextAmount,
          amountNormalized: nextValidation.normalized,
        };
        byAddress.set(line.addressNorm, merged);
        const index = uniqueRecipients.indexOf(existing);
        if (index >= 0) {
          uniqueRecipients[index] = merged;
        }
        return;
      }
      if (!existingValidation.valid || !nextValidation.valid) {
        return;
      }

      try {
        const existingUnits = parseUnits(
          existingValidation.normalized,
          tokenDecimals,
        );
        const nextUnits = parseUnits(nextValidation.normalized, tokenDecimals);
        const mergedUnits =
          strategy === "merge_sum"
            ? existingUnits + nextUnits
            : existingUnits >= nextUnits
              ? existingUnits
              : nextUnits;
        const mergedAmount = formatUnits(mergedUnits, tokenDecimals);
        const merged = {
          ...existing,
          amount: mergedAmount,
          amountNormalized: mergedAmount,
        };
        byAddress.set(line.addressNorm, merged);
        const index = uniqueRecipients.indexOf(existing);
        if (index >= 0) {
          uniqueRecipients[index] = merged;
        }
      } catch {
        return;
      }
    }
  });

  return {
    uniqueRecipients,
    uniqueAddresses: byAddress.size,
    duplicateLines:
      validAddressLines > 0 ? validAddressLines - byAddress.size : 0,
  };
}

export function parseRecipients(
  text: string,
  mode: AmountMode,
  tokenDecimals: number,
  strategy: DedupeStrategy = "keep_first",
): ParseRecipientsResult {
  const lines: ParsedRecipient[] = [];
  const issues: RecipientParseIssue[] = [];
  let ignoredAmountCount = 0;
  let headerIgnored = false;
  let decimalNormalizedCount = 0;

  const linesRaw = text.split(/\r?\n/);
  const firstDataIndex = linesRaw.findIndex((line) => line.trim() !== "");
  linesRaw.forEach((rawLine, index) => {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      return;
    }
    const { address, amount } = parseLineParts(trimmed);

    if (index === firstDataIndex && isHeaderRow(address, amount)) {
      headerIgnored = true;
      return;
    }

    if (!address) {
      issues.push({
        line: index + 1,
        raw: rawLine,
        type: "invalid_format",
      });
      return;
    }

    if (mode === "custom" && !amount) {
      issues.push({
        line: index + 1,
        raw: rawLine,
        type: "missing_amount",
      });
    }

    const amountNormalization = normalizeAmount(amount ?? "");
    if (amountNormalization.changed) {
      decimalNormalizedCount += 1;
    }

    if (mode === "same" && amount) {
      ignoredAmountCount += 1;
    }

    const addressNorm = normalizeRecipientAddress(address);
    const issuesList: string[] = [];
    if (!isValidRecipientAddress(addressNorm)) {
      issuesList.push("invalid_address");
    }
    if (mode === "custom") {
      if (!amount) {
        issuesList.push("missing_amount");
      } else {
        const amountValidation = isValidAmount(
          amountNormalization.normalized,
          tokenDecimals,
        );
        if (!amountValidation.valid) {
          issuesList.push("invalid_amount");
        }
      }
    }
    if (amountNormalization.changed) {
      issuesList.push("decimal_normalized");
    }
    if (mode === "same" && amount) {
      issuesList.push("ignored_amount");
    }

    const status = resolveStatus(issuesList);

    lines.push({
      address,
      amount: mode === "custom" ? amount : undefined,
      amountNormalized:
        mode === "custom" ? amountNormalization.normalized : undefined,
      line: index + 1,
      raw: rawLine,
      addressNorm,
      issues: issuesList,
      status,
      reason: issuesList[0],
    });
  });

  const duplicateAddresses = new Set<string>();
  const addressCounts = new Map<string, number>();
  lines.forEach((entry) => {
    if (!isValidRecipientAddress(entry.addressNorm)) {
      return;
    }
    const nextCount = (addressCounts.get(entry.addressNorm) ?? 0) + 1;
    addressCounts.set(entry.addressNorm, nextCount);
    if (nextCount > 1) {
      duplicateAddresses.add(entry.addressNorm);
    }
  });

  const rows = lines.map((entry) => {
    if (!duplicateAddresses.has(entry.addressNorm)) {
      return entry;
    }
    const issuesList = entry.issues.includes("duplicate")
      ? entry.issues
      : [...entry.issues, "duplicate"];
    return {
      ...entry,
      issues: issuesList,
      status: resolveStatus(issuesList),
      reason: issuesList[0],
    };
  });

  const { uniqueRecipients, uniqueAddresses, duplicateLines } =
    buildUniqueRecipients(rows, strategy, mode, tokenDecimals);

  const enrichedUnique = uniqueRecipients.map((entry) => {
    const issuesList: string[] = [];
    if (!isValidRecipientAddress(entry.addressNorm)) {
      issuesList.push("invalid_address");
    }
    if (mode === "custom") {
      const normalizedAmount = entry.amountNormalized ?? entry.amount ?? "";
      if (!normalizedAmount) {
        issuesList.push("missing_amount");
      } else {
        const amountValidation = isValidAmount(normalizedAmount, tokenDecimals);
        if (!amountValidation.valid) {
          issuesList.push("invalid_amount");
        }
      }
    }
    if (mode === "same" && entry.amount) {
      issuesList.push("ignored_amount");
    }

    const status = resolveStatus(issuesList);

    return {
      ...entry,
      issues: issuesList,
      status,
      reason: issuesList[0],
    };
  });

  const validUnique = enrichedUnique.filter((entry) => {
    if (!isValidRecipientAddress(entry.addressNorm)) {
      return false;
    }
    if (mode === "custom") {
      const normalizedAmount = entry.amountNormalized ?? entry.amount ?? "";
      return isValidAmount(normalizedAmount, tokenDecimals).valid;
    }
    return true;
  }).length;

  const invalidCount = rows.filter(
    (entry) =>
      entry.issues.includes("invalid_address") ||
      entry.issues.includes("invalid_amount"),
  ).length;
  const missingCount = rows.filter((entry) =>
    entry.issues.includes("missing_amount"),
  ).length;

  return {
    lines: rows,
    rows,
    uniqueRecipients: enrichedUnique,
    issues,
    ignoredAmountCount,
    ignoredAmountRows: ignoredAmountCount,
    headerIgnored,
    decimalNormalizedCount,
    linesTotal: rows.length,
    uniqueAddresses,
    duplicatesExtraRows: duplicateLines,
    invalidRows: invalidCount,
    missingAmountRows: missingCount,
    counts: {
      lines: lines.length,
      uniqueAddresses,
      validUnique,
      duplicateLines,
      missing: missingCount,
      invalid: invalidCount,
    },
  };
}

export function isValidAmount(value: string, decimals: number) {
  const normalized = value.trim().replace(/,/g, ".");
  if (!normalized) {
    return { valid: false, normalized, reason: "missing" as const };
  }
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return { valid: false, normalized, reason: "format" as const };
  }
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return { valid: false, normalized, reason: "value" as const };
  }
  const [, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) {
    return { valid: false, normalized, reason: "decimals" as const };
  }
  return { valid: true, normalized };
}

export function findDuplicateAddresses(rows: RecipientRowInput[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  rows.forEach((row) => {
    const normalized = normalizeRecipientAddress(row.address);
    if (!normalized) {
      return;
    }
    if (seen.has(normalized)) {
      duplicates.add(normalized);
      return;
    }
    seen.add(normalized);
  });
  return duplicates;
}

export function validateRow(
  row: RecipientRowInput,
  tokenDecimals: number,
  mode: AmountMode,
  duplicates?: Set<string>,
): RecipientValidation {
  const issues: string[] = [];
  const normalized = normalizeRecipientAddress(row.address);
  const hasValidAddress =
    Boolean(normalized) && isValidRecipientAddress(normalized);

  if (!hasValidAddress) {
    issues.push("invalid_address");
  }

  if (mode === "custom") {
    if (!row.amount || row.amount.trim() === "") {
      issues.push("missing_amount");
    } else {
      const amountValidation = isValidAmount(row.amount, tokenDecimals);
      if (!amountValidation.valid) {
        issues.push("invalid_amount");
      }
    }
  }

  if (hasValidAddress && duplicates?.has(normalized)) {
    issues.push("duplicate");
  }

  let status: RecipientStatus = "valid";
  if (issues.includes("invalid_address") || issues.includes("invalid_amount")) {
    status = "invalid";
  } else if (issues.includes("missing_amount")) {
    status = "missing_amount";
  } else if (issues.includes("duplicate")) {
    status = "duplicate";
  }

  return { status, issues, normalizedAddress: normalized || null };
}

export function computeTotals(
  rows: RecipientRowInput[],
  mode: AmountMode,
  globalAmount: string,
  tokenDecimals: number,
  duplicates?: Set<string>,
): RecipientTotals {
  let total = 0;
  let validCount = 0;

  const globalAmountValidation =
    mode === "same" ? isValidAmount(globalAmount, tokenDecimals) : null;

  rows.forEach((row) => {
    const validation = validateRow(row, tokenDecimals, mode, duplicates);
    if (validation.status !== "valid") {
      return;
    }

    let amountValue = 0;
    if (mode === "same") {
      if (!globalAmountValidation?.valid) {
        return;
      }
      amountValue = Number(globalAmountValidation.normalized);
    } else {
      const parsed = isValidAmount(row.amount ?? "", tokenDecimals);
      if (!parsed.valid) {
        return;
      }
      amountValue = Number(parsed.normalized);
    }

    if (Number.isFinite(amountValue)) {
      total += amountValue;
      validCount += 1;
    }
  });

  return { total, validCount, totalCount: rows.length };
}

export function dedupe(
  rows: RecipientRowInput[],
  strategy: DedupeStrategy = "keep_first",
  mode: AmountMode = "same",
  tokenDecimals = 18,
) {
  const byAddress = new Map<string, RecipientRowInput>();
  const result: RecipientRowInput[] = [];

  rows.forEach((row) => {
    const normalized = normalizeRecipientAddress(row.address);
    if (!normalized) {
      result.push(row);
      return;
    }
    const existing = byAddress.get(normalized);
    if (!existing) {
      byAddress.set(normalized, row);
      result.push(row);
      return;
    }

    if (strategy === "keep_last") {
      const index = result.indexOf(existing);
      if (index >= 0) {
        result[index] = row;
      }
      byAddress.set(normalized, row);
      return;
    }

    if (strategy === "merge_sum" || strategy === "merge_max") {
      if (mode !== "custom") {
        return;
      }
      const existingAmount = existing.amount ?? "";
      const nextAmount = row.amount ?? "";
      const existingValidation = isValidAmount(existingAmount, tokenDecimals);
      const nextValidation = isValidAmount(nextAmount, tokenDecimals);
      if (!existingValidation.valid && nextValidation.valid) {
        const merged = { ...existing, amount: nextValidation.normalized };
        byAddress.set(normalized, merged);
        const index = result.indexOf(existing);
        if (index >= 0) {
          result[index] = merged;
        }
        return;
      }
      if (!existingValidation.valid || !nextValidation.valid) {
        return;
      }
      try {
        const existingUnits = parseUnits(
          existingValidation.normalized,
          tokenDecimals,
        );
        const nextUnits = parseUnits(nextValidation.normalized, tokenDecimals);
        const mergedUnits =
          strategy === "merge_sum"
            ? existingUnits + nextUnits
            : existingUnits >= nextUnits
              ? existingUnits
              : nextUnits;
        const mergedAmount = formatUnits(mergedUnits, tokenDecimals);
        const merged = { ...existing, amount: mergedAmount };
        byAddress.set(normalized, merged);
        const index = result.indexOf(existing);
        if (index >= 0) {
          result[index] = merged;
        }
      } catch {
        return;
      }
    }
  });

  return result;
}
