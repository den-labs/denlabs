import { formatUnits, parseUnits } from "ethers";

export type AmountMode = "same" | "custom";

export type ParsedRecipient = {
  id: string;
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
  rows: ParsedLine[];
  issues: RecipientParseIssue[];
  headerIgnored: boolean;
  decimalNormalizedCount: number;
  linesTotal: number;
  uniqueAddresses: number;
  duplicateRows: number;
  invalidRows: number;
  missingAmountRows: number;
  detectedAmountRows: number;
  issuesSummary: {
    total: number;
    invalid: number;
    missing: number;
    duplicate: number;
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
  total: string;
  validCount: number;
  totalCount: number;
};

export type RecipientFixesConfig = {
  mode: AmountMode;
  tokenDecimals: number;
  dedupeStrategy: DedupeStrategy;
  mergeSameAddressSum: boolean;
  trimWhitespace: boolean;
  normalizeDecimals: boolean;
  dropInvalid: boolean;
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

function buildRecipientIssues(
  row: Pick<ParsedRecipient, "address" | "amount">,
  mode: AmountMode,
  tokenDecimals: number,
  duplicateRowIds?: Set<string>,
  rowId?: string,
) {
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

  if (mode === "same" && row.amount) {
    issues.push("ignored_amount");
  }

  if (rowId && duplicateRowIds?.has(rowId)) {
    issues.push("duplicate");
  }

  return {
    issues,
    status: resolveStatus(issues),
    normalizedAddress: normalized || null,
  };
}

function buildDuplicateRowKey(
  row: Pick<ParsedRecipient, "address" | "amount" | "amountNormalized">,
  mode: AmountMode,
) {
  const normalizedAddress = normalizeRecipientAddress(row.address);
  if (!normalizedAddress || !isValidRecipientAddress(normalizedAddress)) {
    return null;
  }
  if (mode === "custom") {
    const amountValue = row.amountNormalized ?? row.amount ?? "";
    const normalizedAmount = normalizeAmount(amountValue).normalized;
    return `${normalizedAddress}::${normalizedAmount}`;
  }
  return normalizedAddress;
}

function findDuplicateRowIdsFromParsed(
  rows: ParsedRecipient[],
  mode: AmountMode,
) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  rows.forEach((row) => {
    const key = buildDuplicateRowKey(row, mode);
    if (!key) {
      return;
    }
    if (seen.has(key)) {
      duplicates.add(row.id);
      return;
    }
    seen.add(key);
  });

  return duplicates;
}

function dedupeParsedRecipients(
  rows: ParsedRecipient[],
  strategy: DedupeStrategy,
  mode: AmountMode,
  tokenDecimals: number,
) {
  const byKey = new Map<string, ParsedRecipient>();
  const result: ParsedRecipient[] = [];

  rows.forEach((row) => {
    const key = buildDuplicateRowKey(row, mode);
    if (!key) {
      result.push(row);
      return;
    }
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, row);
      result.push(row);
      return;
    }

    if (strategy === "keep_first") {
      return;
    }

    if (strategy === "keep_last") {
      const index = result.indexOf(existing);
      if (index >= 0) {
        result[index] = row;
      }
      byKey.set(key, row);
      return;
    }

    if (strategy === "merge_sum" || strategy === "merge_max") {
      if (mode !== "custom") {
        return;
      }
      const existingAmount = existing.amountNormalized ?? existing.amount ?? "";
      const nextAmount = row.amountNormalized ?? row.amount ?? "";
      const existingValidation = isValidAmount(existingAmount, tokenDecimals);
      const nextValidation = isValidAmount(nextAmount, tokenDecimals);
      if (!existingValidation.valid && nextValidation.valid) {
        const merged = {
          ...existing,
          amount: nextAmount,
          amountNormalized: nextValidation.normalized,
        };
        byKey.set(key, merged);
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
        const merged = {
          ...existing,
          amount: mergedAmount,
          amountNormalized: mergedAmount,
        };
        byKey.set(key, merged);
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

function mergeSameAddressSum(
  rows: ParsedRecipient[],
  tokenDecimals: number,
  mode: AmountMode,
) {
  if (mode !== "custom") {
    return rows;
  }
  const byAddress = new Map<string, ParsedRecipient>();
  const totals = new Map<string, bigint>();
  const ordered: string[] = [];

  rows.forEach((row) => {
    const normalized = normalizeRecipientAddress(row.address);
    if (!normalized || !isValidRecipientAddress(normalized)) {
      ordered.push(row.id);
      byAddress.set(row.id, row);
      return;
    }

    if (!byAddress.has(normalized)) {
      byAddress.set(normalized, row);
      ordered.push(normalized);
    }

    const amountValue = row.amountNormalized ?? row.amount ?? "";
    const validation = isValidAmount(amountValue, tokenDecimals);
    if (!validation.valid) {
      return;
    }
    const existing = totals.get(normalized) ?? BigInt(0);
    try {
      const units = parseUnits(validation.normalized, tokenDecimals);
      totals.set(normalized, existing + units);
    } catch {
      return;
    }
  });

  return ordered
    .map((key) => {
      const row = byAddress.get(key);
      if (!row) {
        return null;
      }
      if (!totals.has(key)) {
        return row;
      }
      const summed = formatUnits(totals.get(key) ?? BigInt(0), tokenDecimals);
      return {
        ...row,
        amount: summed,
        amountNormalized: summed,
      };
    })
    .filter((row): row is ParsedRecipient => Boolean(row));
}

export function parseRecipients(
  text: string,
  mode: AmountMode,
  tokenDecimals: number,
): ParseRecipientsResult {
  const lines: ParsedRecipient[] = [];
  const issues: RecipientParseIssue[] = [];
  let headerIgnored = false;
  let decimalNormalizedCount = 0;
  let detectedAmountRows = 0;

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

    if (amount) {
      detectedAmountRows += 1;
    }

    const amountNormalization = normalizeAmount(amount ?? "");
    if (amountNormalization.changed) {
      decimalNormalizedCount += 1;
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
      id:
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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

  const duplicateRowIds = findDuplicateRowIdsFromParsed(lines, mode);
  const addressCounts = new Map<string, number>();
  lines.forEach((entry) => {
    if (!isValidRecipientAddress(entry.addressNorm)) {
      return;
    }
    addressCounts.set(
      entry.addressNorm,
      (addressCounts.get(entry.addressNorm) ?? 0) + 1,
    );
  });

  const rows = lines.map((entry) => {
    if (!duplicateRowIds.has(entry.id)) {
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

  const invalidCount = rows.filter(
    (entry) =>
      entry.issues.includes("invalid_address") ||
      entry.issues.includes("invalid_amount"),
  ).length;
  const missingCount = rows.filter((entry) =>
    entry.issues.includes("missing_amount"),
  ).length;
  const duplicateCount = rows.filter((entry) =>
    entry.issues.includes("duplicate"),
  ).length;

  return {
    rows,
    issues,
    headerIgnored,
    decimalNormalizedCount,
    linesTotal: rows.length,
    uniqueAddresses: addressCounts.size,
    duplicateRows: duplicateCount,
    invalidRows: invalidCount,
    missingAmountRows: missingCount,
    detectedAmountRows,
    issuesSummary: {
      total: rows.filter((entry) => entry.status !== "valid").length,
      invalid: invalidCount,
      missing: missingCount,
      duplicate: duplicateCount,
    },
  };
}

export function applyFixes(
  rows: ParsedRecipient[],
  config: RecipientFixesConfig,
) {
  const trimmedRows = rows.map((row) => {
    const address = config.trimWhitespace ? row.address.trim() : row.address;
    const amountValue = row.amount ?? "";
    const amount = config.trimWhitespace ? amountValue.trim() : amountValue;
    const normalized = config.normalizeDecimals
      ? normalizeAmount(amount).normalized
      : amount;
    return {
      ...row,
      address,
      amount:
        row.amount == null
          ? undefined
          : config.normalizeDecimals
            ? normalized
            : amount,
      amountNormalized:
        row.amount == null
          ? undefined
          : config.normalizeDecimals
            ? normalized
            : undefined,
    };
  });

  const dedupedRows = dedupeParsedRecipients(
    trimmedRows,
    config.dedupeStrategy,
    config.mode,
    config.tokenDecimals,
  );

  const mergedRows = config.mergeSameAddressSum
    ? mergeSameAddressSum(dedupedRows, config.tokenDecimals, config.mode)
    : dedupedRows;

  const duplicateRowIds = findDuplicateRowIds(
    mergedRows.map((row) => ({
      id: row.id,
      address: row.address,
      amount: row.amount,
    })),
  );

  const validatedRows = mergedRows.map((row) => {
    const { issues, status, normalizedAddress } = buildRecipientIssues(
      { address: row.address, amount: row.amount },
      config.mode,
      config.tokenDecimals,
      duplicateRowIds,
      row.id,
    );
    return {
      ...row,
      addressNorm: normalizedAddress ?? "",
      issues,
      status,
      reason: issues[0],
    };
  });

  const filteredRows = config.dropInvalid
    ? validatedRows.filter((row) => row.status !== "invalid")
    : validatedRows;

  return filteredRows;
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

export function findDuplicateRowIds(rows: RecipientRowInput[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  rows.forEach((row) => {
    const normalized = normalizeRecipientAddress(row.address);
    if (!normalized || !isValidRecipientAddress(normalized)) {
      return;
    }
    const amountValue = row.amount ?? "";
    const key = `${normalized}::${normalizeAmount(amountValue).normalized}`;
    if (seen.has(key)) {
      duplicates.add(row.id);
      return;
    }
    seen.add(key);
  });
  return duplicates;
}

export function validateRow(
  row: RecipientRowInput,
  tokenDecimals: number,
  mode: AmountMode,
  duplicateRowIds?: Set<string>,
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

  if (duplicateRowIds?.has(row.id)) {
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
  let totalBigInt = BigInt(0);
  let validCount = 0;

  const globalAmountValidation =
    mode === "same" ? isValidAmount(globalAmount, tokenDecimals) : null;

  rows.forEach((row) => {
    const validation = validateRow(row, tokenDecimals, mode, duplicates);
    if (validation.status !== "valid") {
      return;
    }

    if (mode === "same") {
      if (!globalAmountValidation?.valid) {
        return;
      }
      try {
        totalBigInt += parseUnits(
          globalAmountValidation.normalized,
          tokenDecimals,
        );
        validCount += 1;
      } catch {
        return;
      }
    } else {
      const parsed = isValidAmount(row.amount ?? "", tokenDecimals);
      if (!parsed.valid) {
        return;
      }
      try {
        totalBigInt += parseUnits(parsed.normalized, tokenDecimals);
        validCount += 1;
      } catch {
        return;
      }
    }
  });

  return {
    total: formatUnits(totalBigInt, tokenDecimals),
    validCount,
    totalCount: rows.length,
  };
}

export function dedupe(
  rows: RecipientRowInput[],
  strategy: DedupeStrategy = "keep_first",
  mode: AmountMode = "same",
  tokenDecimals = 18,
) {
  const byKey = new Map<string, RecipientRowInput>();
  const result: RecipientRowInput[] = [];

  rows.forEach((row) => {
    const normalized = normalizeRecipientAddress(row.address);
    if (!normalized || !isValidRecipientAddress(normalized)) {
      result.push(row);
      return;
    }
    const amountValue = mode === "custom" ? (row.amount ?? "") : "";
    const key =
      strategy === "merge_sum" || strategy === "merge_max"
        ? normalized
        : `${normalized}::${normalizeAmount(amountValue).normalized}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, row);
      result.push(row);
      return;
    }

    if (strategy === "keep_last") {
      const index = result.indexOf(existing);
      if (index >= 0) {
        result[index] = row;
      }
      byKey.set(key, row);
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
        byKey.set(key, merged);
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
        byKey.set(key, merged);
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
