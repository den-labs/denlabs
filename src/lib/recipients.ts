import { isAddress } from "ethers";

export type AmountMode = "same" | "custom";

export type ParsedRecipient = {
  address: string;
  amount?: string;
  line: number;
  raw: string;
  addressNorm: string;
  amountNormalized?: string;
  issues: string[];
};

export type RecipientParseIssue = {
  line: number;
  raw: string;
  type: "invalid_format" | "missing_amount";
};

export type ParsedLine = ParsedRecipient;

export type DedupeStrategy = "keep_first" | "keep_last";

export type ParseRecipientsResult = {
  lines: ParsedLine[];
  uniqueRecipients: ParsedRecipient[];
  issues: RecipientParseIssue[];
  ignoredAmountCount: number;
  headerIgnored: boolean;
  decimalNormalizedCount: number;
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
  const match = line.match(/^[^,\s]+/);
  const address = match ? match[0] : "";
  const rest = line.slice(address.length).trim();
  if (!rest) {
    return { address, amount: undefined };
  }
  const amount = rest.replace(/^[,\s]+/, "");
  return { address, amount: amount || undefined };
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
  if (value.includes(",") && !value.includes(".")) {
    return { normalized: value.replace(/,/g, "."), changed: true };
  }
  return { normalized: value, changed: false };
}

function buildUniqueRecipients(lines: ParsedLine[], strategy: DedupeStrategy) {
  const byAddress = new Map<string, ParsedRecipient>();
  const uniqueRecipients: ParsedRecipient[] = [];
  const validAddressLines = lines.filter((line) => line.addressNorm).length;

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
    if (strategy === "keep_last") {
      const existing = byAddress.get(line.addressNorm);
      if (existing) {
        const index = uniqueRecipients.indexOf(existing);
        if (index >= 0) {
          uniqueRecipients[index] = line;
        }
      }
      byAddress.set(line.addressNorm, line);
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
    if (!isAddress(addressNorm)) {
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

    lines.push({
      address,
      amount: mode === "custom" ? amount : undefined,
      amountNormalized:
        mode === "custom" ? amountNormalization.normalized : undefined,
      line: index + 1,
      raw: rawLine,
      addressNorm,
      issues: issuesList,
    });
  });

  const { uniqueRecipients, uniqueAddresses, duplicateLines } =
    buildUniqueRecipients(lines, strategy);
  const validUnique = uniqueRecipients.filter((entry) => {
    if (!isAddress(entry.addressNorm)) {
      return false;
    }
    if (mode === "custom") {
      const normalizedAmount = entry.amountNormalized ?? entry.amount ?? "";
      return isValidAmount(normalizedAmount, tokenDecimals).valid;
    }
    return true;
  }).length;

  const invalidCount = lines.filter(
    (entry) =>
      entry.issues.includes("invalid_address") ||
      entry.issues.includes("invalid_amount"),
  ).length;
  const missingCount = lines.filter((entry) =>
    entry.issues.includes("missing_amount"),
  ).length;

  return {
    lines,
    uniqueRecipients,
    issues,
    ignoredAmountCount,
    headerIgnored,
    decimalNormalizedCount,
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
  const hasValidAddress = Boolean(normalized) && isAddress(normalized);

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

export function dedupe(rows: RecipientRowInput[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const normalized = normalizeRecipientAddress(row.address);
    if (!normalized) {
      return true;
    }
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}
