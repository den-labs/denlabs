"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  type AmountMode,
  type DedupeStrategy,
  type ParsedRecipient,
  parseRecipients,
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

type PreviewFilter = "all" | "issues" | "duplicates" | "invalid" | "missing";

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
  const [previewFilter, setPreviewFilter] = useState<PreviewFilter>("all");
  const [showInvalidConfirm, setShowInvalidConfirm] = useState(false);
  const [pendingFixRows, setPendingFixRows] = useState<ParsedRecipient[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      setReplaceMode(false);
      setDedupeStrategy("keep_first");
      setPreviewFilter("all");
      setShowInvalidConfirm(false);
      setPendingFixRows([]);
      setShowAdvanced(false);
    }
  }, [initialText, isOpen]);

  useEffect(() => {
    if (
      mode === "same" &&
      (dedupeStrategy === "merge_sum" || dedupeStrategy === "merge_max")
    ) {
      setDedupeStrategy("keep_first");
    }
  }, [dedupeStrategy, mode]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (mode === "same" && previewFilter === "missing") {
      setPreviewFilter("all");
    }
  }, [mode, previewFilter]);

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
  const previewRows = useMemo(
    () =>
      parsed.rows.map((row, index) => ({
        ...row,
        id: `${row.line}-${index}`,
      })),
    [parsed.rows],
  );

  const hasIssues =
    parsed.invalidRows + parsed.missingAmountRows + parsed.duplicatesExtraRows >
    0;
  const issuesCount = useMemo(
    () => previewRows.filter((row) => row.status !== "valid").length,
    [previewRows],
  );

  const filteredRows = useMemo(() => {
    let rows = previewRows;
    if (previewFilter === "issues") {
      rows = rows.filter((row) => row.status !== "valid");
    } else if (previewFilter === "duplicates") {
      rows = rows.filter((row) => row.issues.includes("duplicate"));
    } else if (previewFilter === "invalid") {
      rows = rows.filter((row) => row.status === "invalid");
    } else if (previewFilter === "missing") {
      rows = rows.filter((row) => row.status === "missing_amount");
    }

    if (previewFilter === "all" && hasIssues) {
      const statusRank: Record<string, number> = {
        invalid: 0,
        missing_amount: 1,
        duplicate: 2,
        valid: 3,
      };
      rows = [...rows].sort(
        (a, b) => (statusRank[a.status] ?? 3) - (statusRank[b.status] ?? 3),
      );
    }

    return rows;
  }, [hasIssues, previewFilter, previewRows]);

  const summary = useMemo(() => parsed.counts, [parsed.counts]);

  const modeLabel =
    mode === "custom" ? "Mode: Custom amounts" : "Mode: Same amount";

  const applyRowsToText = (rows: ParsedRecipient[]) => {
    const lines = rows.map((row) => {
      if (mode !== "custom") {
        return row.address;
      }
      const amountValue = row.amountNormalized ?? row.amount;
      return amountValue ? `${row.address},${amountValue}` : row.address;
    });
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
        !entry.issues.includes("invalid_amount"),
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

  const handleFixAutomatically = () => {
    if (parsed.invalidRows > 0) {
      setPendingFixRows(parsed.uniqueRecipients);
      setShowInvalidConfirm(true);
      return;
    }
    applyRowsToText(parsed.uniqueRecipients);
  };

  const handleConfirmFix = (dropInvalid: boolean) => {
    const nextRows = dropInvalid
      ? pendingFixRows.filter((row) => row.status !== "invalid")
      : pendingFixRows;
    applyRowsToText(nextRows);
    setPendingFixRows([]);
    setShowInvalidConfirm(false);
  };

  const hasWhitespaceChanges = useMemo(
    () =>
      text
        .split(/\r?\n/)
        .some((line) => line.trim() !== line || /\s{2,}/.test(line)),
    [text],
  );
  const canRemoveDuplicates = summary.duplicateLines > 0;
  const canDropInvalid = parsed.invalidRows > 0;
  const canNormalizeDecimals = parsed.decimalNormalizedCount > 0;
  const canApply = summary.validUnique > 0;
  const previewFilters = useMemo(() => {
    const base: Array<{ id: PreviewFilter; label: string }> = [
      { id: "all", label: "All" },
      { id: "issues", label: "Issues" },
      { id: "duplicates", label: "Duplicates" },
      { id: "invalid", label: "Invalid" },
    ];
    if (mode === "custom") {
      base.push({ id: "missing", label: "Missing amount" });
    }
    return base;
  }, [mode]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
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

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-6 pb-4">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] [@media(max-height:800px)]:grid-cols-1">
            <div className="space-y-3">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="0xabc...,0.25"
                className="min-h-[260px] w-full rounded-xl border border-wolf-border bg-[#0f141d] px-4 py-3 text-sm text-white/80 placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none"
              />
              {parsed.ignoredAmountRows > 0 && mode === "same" ? (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                  <span>You pasted amounts, but Same amount ignores them.</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onModeChange?.("same")}
                      className="rounded-md border border-amber-300/40 px-2 py-1 text-[11px] font-semibold uppercase text-amber-200 transition hover:border-amber-200"
                    >
                      Keep Same amount
                    </button>
                    <button
                      type="button"
                      onClick={() => onModeChange?.("custom")}
                      className="rounded-md border border-amber-300/40 bg-amber-200/10 px-2 py-1 text-[11px] font-semibold uppercase text-amber-100 transition hover:border-amber-200"
                    >
                      Switch to Custom amounts
                    </button>
                  </div>
                </div>
              ) : null}
              {parsed.decimalNormalizedCount > 0 ? (
                <p className="text-xs text-white/60">
                  {parsed.decimalNormalizedCount} amount(s) normalized from
                  comma decimals.
                </p>
              ) : null}
              {parsed.issues.length > 0 ? (
                <p className="text-xs text-rose-300">
                  {parsed.issues.length} line(s) are missing data and will
                  require fixes.
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-wolf-border bg-[#0f141d] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Preview</h3>
              </div>

              <div className="mt-3 grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-[11px] text-white/70">
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="radio"
                    name="replace-mode"
                    checked={!replaceMode}
                    onChange={() => setReplaceMode(false)}
                    className="mt-0.5 accent-wolf-emerald"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Append to current list
                    </div>
                    <div className="text-[11px] text-white/50">
                      Adds these recipients to what you already have.
                    </div>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="radio"
                    name="replace-mode"
                    checked={replaceMode}
                    onChange={() => setReplaceMode(true)}
                    className="mt-0.5 accent-wolf-emerald"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Replace current list
                    </div>
                    <div className="text-[11px] text-white/50">
                      Overwrites your existing recipients list.
                    </div>
                  </div>
                </label>
              </div>
              {replaceMode ? (
                <p className="mt-2 text-xs text-amber-200">
                  Replace will overwrite your current recipients list.
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/60">
                <span>{`Lines: ${parsed.linesTotal}`}</span>
                <span>{`Unique addresses: ${parsed.uniqueAddresses}`}</span>
                <button
                  type="button"
                  onClick={() => setPreviewFilter("issues")}
                  className="text-amber-200 transition hover:text-amber-100"
                >
                  {`Issues: ${issuesCount}`}
                </button>
              </div>

              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Recommended fixes
                    </p>
                    <p className="text-[11px] text-white/50">
                      Trims whitespace, normalizes decimals, ignores headers,
                      and resolves duplicates.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-md border border-white/10 bg-black/20 p-1 text-[10px] uppercase text-white/60">
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
                      onClick={handleFixAutomatically}
                      disabled={parsed.linesTotal === 0}
                      className="rounded-md border border-[#4ca22a] bg-[#89e24a] px-3 py-2 text-[11px] font-semibold uppercase text-[#09140a] transition hover:shadow-[0_12px_30px_rgba(186,255,92,0.35)] disabled:border-wolf-border disabled:bg-wolf-border disabled:text-white/40"
                    >
                      Fix automatically (recommended)
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="text-[11px] font-semibold uppercase text-white/60 transition hover:text-white"
                >
                  {showAdvanced
                    ? "Hide advanced options"
                    : "Show advanced options"}
                </button>
                {showAdvanced ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleRemoveDuplicates}
                      disabled={!canRemoveDuplicates}
                      className="rounded-md border border-amber-400/30 px-2 py-1 text-[11px] font-semibold uppercase text-amber-200 transition hover:border-amber-300 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Resolve duplicates
                    </button>
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
                      onClick={handleNormalizeDecimals}
                      disabled={!canNormalizeDecimals}
                      className="rounded-md border border-wolf-border px-2 py-1 text-[11px] font-semibold uppercase text-white/70 transition hover:border-wolf-border-strong hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Normalize decimals
                    </button>
                    <button
                      type="button"
                      onClick={handleDropInvalid}
                      disabled={!canDropInvalid}
                      className="rounded-md border border-rose-400/30 px-2 py-1 text-[11px] font-semibold uppercase text-rose-200 transition hover:border-rose-300 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Drop invalid rows
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase text-white/60">
                {previewFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setPreviewFilter(filter.id)}
                    className={`rounded-md border border-white/10 px-2 py-1 transition ${
                      previewFilter === filter.id
                        ? "border-wolf-emerald text-wolf-emerald"
                        : "text-white/60 hover:border-white/30 hover:text-white/80"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 max-h-[220px] overflow-y-auto rounded-lg border border-white/5">
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
                {previewRows.length === 0 ? (
                  <div className="px-3 py-6 text-xs text-white/60">
                    Paste recipients to see a preview.
                  </div>
                ) : filteredRows.length === 0 ? (
                  <div className="px-3 py-6 text-xs text-white/60">
                    No rows match this filter.
                  </div>
                ) : (
                  filteredRows.map((row) => (
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
                          {row.amountNormalized ?? row.amount ?? "—"}
                        </span>
                      ) : null}
                      <span
                        className={
                          row.status === "valid"
                            ? "text-wolf-emerald"
                            : row.status === "duplicate"
                              ? "text-amber-300"
                              : row.status === "missing_amount"
                                ? "text-amber-200"
                                : "text-rose-300"
                        }
                      >
                        {row.status === "valid"
                          ? "Valid"
                          : row.status === "duplicate"
                            ? "Duplicate"
                            : row.status === "missing_amount"
                              ? "Missing amount"
                              : "Invalid"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          {parsed.headerIgnored ? (
            <p className="mt-4 text-xs text-white/60">
              Header row detected and ignored.
            </p>
          ) : null}
        </div>

        <div className="sticky bottom-0 z-10 mt-auto border-t border-white/10 bg-[#0a0a0a] px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
                disabled={!canApply}
                className="rounded-md border border-[#4ca22a] bg-[#89e24a] px-5 py-2 text-xs font-semibold uppercase text-[#09140a] transition hover:shadow-[0_12px_30px_rgba(186,255,92,0.4)] disabled:border-wolf-border disabled:bg-wolf-border disabled:text-white/40"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
        {showInvalidConfirm ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#0b111a] p-4 text-white/80 shadow-2xl">
              <h4 className="text-sm font-semibold text-white">
                Drop invalid rows?
              </h4>
              <p className="mt-2 text-xs text-white/60">
                We can finish the fixes now, but removing invalid rows is
                optional.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmFix(false)}
                  className="rounded-md border border-wolf-border px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:border-wolf-border-strong hover:text-white"
                >
                  Keep invalid rows
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmFix(true)}
                  className="rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold text-rose-100 transition hover:border-rose-300"
                >
                  Drop invalid rows
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
