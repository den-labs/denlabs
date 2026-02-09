"use client";

import { useCallback, useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  type AmountMode,
  computeTotals,
  type DedupeStrategy,
  dedupe,
  findDuplicateRowIds,
  isValidAmount,
  type RecipientRowInput,
  validateRow,
} from "@/lib/recipients";
import { createRow } from "../constants";

export function useSprayRecipients(tokenDecimals: number) {
  const [rows, setRows] = useState<RecipientRowInput[]>([]);
  const [amountMode, setAmountMode] = useState<AmountMode>("same");
  const [globalAmount, setGlobalAmount] = useState("");
  const [fillMissingValue, setFillMissingValue] = useState("");

  const sanitizeDecimalInput = useCallback((rawValue: string) => {
    const normalized = rawValue.replace(/,/g, ".");
    const filtered = normalized.replace(/[^0-9.]/g, "");
    if (!filtered) {
      return "";
    }
    const segments = filtered.split(".");
    if (segments.length <= 1) {
      return filtered;
    }
    const [integerPart, ...fractionParts] = segments;
    return `${integerPart}.${fractionParts.join("")}`;
  }, []);

  const updateRow = useCallback(
    (id: string, key: "address" | "amount", value: string) => {
      const nextValue = key === "amount" ? sanitizeDecimalInput(value) : value;
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, [key]: nextValue } : row)),
      );
    },
    [sanitizeDecimalInput],
  );

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createRow()]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const clearRows = useCallback(() => {
    setRows([]);
  }, []);

  const updateGlobalAmount = useCallback(
    (value: string) => {
      setGlobalAmount(sanitizeDecimalInput(value));
    },
    [sanitizeDecimalInput],
  );

  const updateFillMissingValue = useCallback(
    (value: string) => {
      setFillMissingValue(sanitizeDecimalInput(value));
    },
    [sanitizeDecimalInput],
  );

  const applyParsedRows = useCallback(
    (
      parsedRows: Array<{
        address: string;
        amount?: string;
        amountNormalized?: string;
      }>,
      replace: boolean,
    ) => {
      const mapped = parsedRows.map((row) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        address: row.address,
        amount: row.amount ?? "",
      }));
      setRows((prev) => (replace ? mapped : [...prev, ...mapped]));
    },
    [],
  );

  const removeDuplicates = useCallback(
    (strategy: DedupeStrategy) => {
      setRows((prev) => dedupe(prev, strategy, amountMode, tokenDecimals));
    },
    [amountMode, tokenDecimals],
  );

  const removeInvalidRows = useCallback(() => {
    setRows((prev) => {
      const duplicates = findDuplicateRowIds(prev);
      return prev.filter((row) => {
        const validation = validateRow(
          row,
          tokenDecimals,
          amountMode,
          duplicates,
        );
        return validation.status !== "invalid";
      });
    });
  }, [amountMode, tokenDecimals]);

  const fillMissingAmounts = useCallback(() => {
    const validation = isValidAmount(fillMissingValue, tokenDecimals);
    if (!validation.valid) {
      return false;
    }
    setRows((prev) =>
      prev.map((row) =>
        row.amount?.trim() ? row : { ...row, amount: validation.normalized },
      ),
    );
    return true;
  }, [fillMissingValue, tokenDecimals]);

  // Derived state
  const debouncedRows = useDebouncedValue(rows, 300);
  const debouncedGlobalAmount = useDebouncedValue(globalAmount, 300);

  const duplicateRowIds = useMemo(
    () => findDuplicateRowIds(debouncedRows),
    [debouncedRows],
  );

  const rowValidations = useMemo(
    () =>
      debouncedRows.map((row) => ({
        row,
        validation: validateRow(
          row,
          tokenDecimals,
          amountMode,
          duplicateRowIds,
        ),
      })),
    [tokenDecimals, amountMode, debouncedRows, duplicateRowIds],
  );

  const statusById = useMemo(() => {
    return Object.fromEntries(
      rowValidations.map(({ row, validation }) => [row.id, validation.status]),
    );
  }, [rowValidations]);

  const issuesById = useMemo(() => {
    return Object.fromEntries(
      rowValidations.map(({ row, validation }) => [row.id, validation.issues]),
    );
  }, [rowValidations]);

  const issuesCount = useMemo(
    () =>
      rowValidations.filter(({ validation }) => {
        if (validation.status === "valid") {
          return false;
        }
        if (amountMode === "same" && validation.status === "duplicate") {
          return false;
        }
        return true;
      }).length,
    [amountMode, rowValidations],
  );

  const duplicateCount = useMemo(
    () =>
      rowValidations.filter(
        ({ validation }) => validation.status === "duplicate",
      ).length,
    [rowValidations],
  );

  const missingAmountCount = useMemo(
    () =>
      rowValidations.filter(
        ({ validation }) => validation.status === "missing_amount",
      ).length,
    [rowValidations],
  );

  const invalidCount = useMemo(
    () =>
      rowValidations.filter(({ validation }) => validation.status === "invalid")
        .length,
    [rowValidations],
  );

  const totals = useMemo(
    () =>
      computeTotals(
        debouncedRows,
        amountMode,
        debouncedGlobalAmount,
        tokenDecimals,
        duplicateRowIds,
      ),
    [
      tokenDecimals,
      amountMode,
      debouncedGlobalAmount,
      debouncedRows,
      duplicateRowIds,
    ],
  );

  const recipientCount = useMemo(
    () => rows.filter((row) => row.address.trim() !== "").length,
    [rows],
  );

  const validRows = useMemo(
    () =>
      rowValidations
        .filter(({ validation }) => validation.status === "valid")
        .map(({ row }) => row),
    [rowValidations],
  );

  const globalAmountValidation = useMemo(
    () => isValidAmount(globalAmount, tokenDecimals),
    [tokenDecimals, globalAmount],
  );

  const fillMissingValidation = useMemo(
    () => isValidAmount(fillMissingValue, tokenDecimals),
    [tokenDecimals, fillMissingValue],
  );

  const hasBlockingIssues =
    issuesCount > 0 || (amountMode === "same" && !globalAmountValidation.valid);

  const canFillMissing = amountMode === "custom" && fillMissingValidation.valid;

  return {
    rows,
    setRows,
    amountMode,
    setAmountMode,
    globalAmount,
    updateGlobalAmount,
    fillMissingValue,
    updateFillMissingValue,
    updateRow,
    addRow,
    removeRow,
    clearRows,
    applyParsedRows,
    removeDuplicates,
    removeInvalidRows,
    fillMissingAmounts,
    // Derived
    debouncedRows,
    debouncedGlobalAmount,
    duplicateRowIds,
    statusById,
    issuesById,
    issuesCount,
    duplicateCount,
    missingAmountCount,
    invalidCount,
    totals,
    recipientCount,
    validRows,
    globalAmountValidation,
    fillMissingValidation,
    hasBlockingIssues,
    canFillMissing,
  };
}
