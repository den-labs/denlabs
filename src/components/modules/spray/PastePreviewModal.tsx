"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  type AmountMode,
  type DedupeStrategy,
  type ParsedRecipient,
  parseRecipients,
  type RecipientRowInput,
  validateRow,
} from "@/lib/recipients";

type PastePreviewModalProps = {
  isOpen: boolean;
  mode: AmountMode;
  tokenDecimals: number;
  title?: string;
  initialText?: string;
  onClose: () => void;
  onApply: (rows: ParsedRecipient[], replace: boolean) => void;
  onModeChange?: (mode: AmountMode) => void;
};

export function PastePreviewModal({
  isOpen,
  mode,
  tokenDecimals,
  title = "Paste recipients",
  initialText = "",
  onClose,
  onApply,
  onModeChange,
}: PastePreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(initialText);
  const [replaceMode, setReplaceMode] = useState(false);
  const [dedupeStrategy, setDedupeStrategy] =
    useState<DedupeStrategy>("keep_first");

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      setReplaceMode(false);
      setDedupeStrategy("keep_first");
    }
  }, [initialText, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const parsed = useMemo(
    () => parseRecipients(text, mode, tokenDecimals, dedupeStrategy),
    [dedupeStrategy, mode, text, tokenDecimals],
  );
  const rowInputs: RecipientRowInput[] = useMemo(
    () =>
      parsed.uniqueRecipients.map((row, index) => ({
        id: `${row.line}-${index}`,
        address: row.address,
        amount: row.amountNormalized ?? row.amount ?? "",
      })),
    [parsed.uniqueRecipients],
  );

  const validations = useMemo(() => {
    return rowInputs.map((row) => ({
      row,
      validation: validateRow(row, tokenDecimals, mode),
    }));
  }, [mode, rowInputs, tokenDecimals]);

  const summary = useMemo(() => parsed.counts, [parsed.counts]);

  const modeLabel =
    mode === "custom" ? "Mode: Custom amounts" : "Mode: Same amount";

  const applyRowsToText = (rows: ParsedRecipient[]) => {
    const lines = rows.map((row) =>
      mode === "custom" && row.amountNormalized
        ? `${row.address},${row.amountNormalized}`
        : row.address,
    );
    setText(lines.join("\n"));
  };

  const handleRemoveDuplicates = () => {
    applyRowsToText(parsed.uniqueRecipients);
  };

  const handleTrimWhitespace = () => {
    const trimmed = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");
    setText(trimmed);
  };

  const handleDropInvalid = () => {
    const validRows = parsed.lines.filter(
      (entry) =>
        !entry.issues.includes("invalid_address") &&
        !entry.issues.includes("invalid_amount") &&
        !entry.issues.includes("missing_amount"),
    );
    applyRowsToText(validRows);
  };

  const handleNormalizeDecimals = () => {
    const normalized = text
      .split(/\r?\n/)
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        const parts = trimmed.split(/[\s,]+/).filter(Boolean);
        if (parts.length < 2) return trimmed;
        const [address, amount] = parts;
        if (amount.includes(",") && !amount.includes(".")) {
          return `${address},${amount.replace(/,/g, ".")}`;
        }
        return trimmed;
      })
      .filter(Boolean)
      .join("\n");
    setText(normalized);
  };

  const hasWhitespaceChanges = useMemo(
    () =>
      text
        .split(/\r?\n/)
        .some((line) => line.trim() !== line || /\s{2,}/.test(line)),
    [text],
  );
  const canRemoveDuplicates = summary.duplicateLines > 0;
  const canDropInvalid = summary.invalid > 0 || summary.missing > 0;
  const canNormalizeDecimals = parsed.decimalNormalizedCount > 0;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <p className="text-sm text-white/60">
              Paste one recipient per line. Examples:
              <span className="ml-2 font-mono text-white/80">
                0xabc... 0.25
              </span>
              <span className="ml-2 font-mono text-white/80">
                0xabc...,0.25
              </span>
              {mode === "same" ? (
                <span className="ml-2 font-mono text-white/80">0xabc...</span>
              ) : null}
            </p>
            <div className="mt-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase text-wolf-emerald">
              {modeLabel}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 transition hover:bg-white/5 hover:text-white"
            aria-label="Close modal"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6l-12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="0xabc...,0.25"
              className="min-h-[260px] w-full rounded-xl border border-wolf-border bg-[#0f141d] px-4 py-3 text-sm text-white/80 placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none"
            />
            {parsed.ignoredAmountCount > 0 && mode === "same" ? (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                <span>
                  {parsed.ignoredAmountCount} line(s) include amounts that will
                  be ignored.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onModeChange?.("same")}
                    className="rounded-md border border-amber-300/40 px-2 py-1 text-[11px] font-semibold uppercase text-amber-200 transition hover:border-amber-200"
                  >
                    Keep same
                  </button>
                  <button
                    type="button"
                    onClick={() => onModeChange?.("custom")}
                    className="rounded-md border border-amber-300/40 px-2 py-1 text-[11px] font-semibold uppercase text-amber-100 transition hover:border-amber-200"
                  >
                    Switch to custom
                  </button>
                </div>
              </div>
            ) : null}
            {parsed.decimalNormalizedCount > 0 ? (
              <p className="text-xs text-white/60">
                {parsed.decimalNormalizedCount} amount(s) normalized from comma
                decimals.
              </p>
            ) : null}
            {parsed.issues.length > 0 ? (
              <p className="text-xs text-rose-300">
                {parsed.issues.length} line(s) are missing data and will require
                fixes.
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-wolf-border bg-[#0f141d] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Preview</h3>
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1 text-[11px] uppercase text-white/60">
                <button
                  type="button"
                  onClick={() => setReplaceMode(false)}
                  className={`rounded-md px-3 py-1 transition ${
                    !replaceMode ? "bg-wolf-neutral-soft text-white" : ""
                  }`}
                >
                  Append
                </button>
                <button
                  type="button"
                  onClick={() => setReplaceMode(true)}
                  className={`rounded-md px-3 py-1 transition ${
                    replaceMode ? "bg-wolf-neutral-soft text-white" : ""
                  }`}
                >
                  Replace
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/60">
              <span>{`Lines: ${summary.lines}`}</span>
              <span>{`Unique: ${summary.uniqueAddresses}`}</span>
              <span className="text-wolf-emerald">{`Valid unique: ${summary.validUnique}`}</span>
              <span className="text-amber-300">{`D lines: ${summary.duplicateLines}`}</span>
              <span className="text-amber-200">{`Missing: ${summary.missing}`}</span>
              <span className="text-rose-300">{`Invalid: ${summary.invalid}`}</span>
              <span className="text-white/50">{`Ignored amounts: ${parsed.ignoredAmountCount}`}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRemoveDuplicates}
                disabled={!canRemoveDuplicates}
                className="rounded-md border border-amber-400/30 px-2 py-1 text-[11px] font-semibold uppercase text-amber-200 transition hover:border-amber-300 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove duplicates
              </button>
              <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1 text-[10px] uppercase text-white/60">
                <button
                  type="button"
                  onClick={() => setDedupeStrategy("keep_first")}
                  className={`rounded px-2 py-1 transition ${
                    dedupeStrategy === "keep_first"
                      ? "bg-wolf-neutral-soft text-white"
                      : ""
                  }`}
                >
                  Keep first
                </button>
                <button
                  type="button"
                  onClick={() => setDedupeStrategy("keep_last")}
                  className={`rounded px-2 py-1 transition ${
                    dedupeStrategy === "keep_last"
                      ? "bg-wolf-neutral-soft text-white"
                      : ""
                  }`}
                >
                  Keep last
                </button>
              </div>
              <button
                type="button"
                onClick={handleTrimWhitespace}
                disabled={!hasWhitespaceChanges}
                className="rounded-md border border-wolf-border px-2 py-1 text-[11px] font-semibold uppercase text-white/70 transition hover:border-wolf-border-strong hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trim whitespace
              </button>
              <button
                type="button"
                onClick={handleDropInvalid}
                disabled={!canDropInvalid}
                className="rounded-md border border-rose-400/30 px-2 py-1 text-[11px] font-semibold uppercase text-rose-200 transition hover:border-rose-300 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Drop invalid rows
              </button>
              <button
                type="button"
                onClick={handleNormalizeDecimals}
                disabled={!canNormalizeDecimals}
                className="rounded-md border border-wolf-border px-2 py-1 text-[11px] font-semibold uppercase text-white/70 transition hover:border-wolf-border-strong hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Normalize decimals
              </button>
            </div>

            <div className="mt-4 max-h-[260px] overflow-y-auto rounded-lg border border-white/5">
              <div
                className={`grid gap-3 border-b border-white/5 bg-black/20 px-3 py-2 text-[11px] uppercase text-white/40 ${
                  mode === "custom"
                    ? "grid-cols-[minmax(0,1fr)_90px_90px]"
                    : "grid-cols-[minmax(0,1fr)_90px]"
                }`}
              >
                <span>Address</span>
                {mode === "custom" ? <span>Amount</span> : null}
                <span>Status</span>
              </div>
              {validations.length === 0 ? (
                <div className="px-3 py-6 text-xs text-white/60">
                  Paste recipients to see a preview.
                </div>
              ) : (
                validations.map(({ row, validation }) => (
                  <div
                    key={row.id}
                    className={`grid items-center gap-3 border-b border-white/5 px-3 py-2 text-xs text-white/80 ${
                      mode === "custom"
                        ? "grid-cols-[minmax(0,1fr)_90px_90px]"
                        : "grid-cols-[minmax(0,1fr)_90px]"
                    }`}
                  >
                    <span className="truncate font-mono">
                      {row.address || "—"}
                    </span>
                    {mode === "custom" ? (
                      <span className="truncate text-white/60">
                        {row.amount || "—"}
                      </span>
                    ) : null}
                    <span
                      className={
                        validation.status === "valid"
                          ? "text-wolf-emerald"
                          : validation.status === "duplicate"
                            ? "text-amber-300"
                            : validation.status === "missing_amount"
                              ? "text-amber-200"
                              : "text-rose-300"
                      }
                    >
                      {validation.status === "valid"
                        ? "Valid"
                        : validation.status === "duplicate"
                          ? "Duplicate"
                          : validation.status === "missing_amount"
                            ? "Missing"
                            : "Invalid"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setText("")}
            className="rounded-md border border-wolf-border px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-wolf-border-strong hover:text-white"
          >
            Clear
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-wolf-border px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-wolf-border-strong hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onApply(parsed.uniqueRecipients, replaceMode)}
              disabled={parsed.uniqueRecipients.length === 0}
              className="rounded-md border border-[#4ca22a] bg-[#89e24a] px-5 py-2 text-xs font-semibold uppercase text-[#09140a] transition hover:shadow-[0_12px_30px_rgba(186,255,92,0.4)] disabled:border-wolf-border disabled:bg-wolf-border disabled:text-white/40"
            >
              Apply
            </button>
          </div>
        </div>
        {replaceMode ? (
          <p className="mt-3 text-xs text-amber-200">
            Replace will overwrite your current recipients list.
          </p>
        ) : null}
        {parsed.headerIgnored ? (
          <p className="mt-2 text-xs text-white/60">
            Header row detected and ignored.
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
