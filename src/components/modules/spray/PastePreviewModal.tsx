"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  type AmountMode,
  applyFixes,
  type DedupeStrategy,
  type ParsedRecipient,
  parseRecipients,
} from "@/lib/recipients";
import type { SprayEventType } from "@/lib/sprayEventsClient";
import { ReplaceConfirmDialog } from "./ReplaceConfirmDialog";

type PastePreviewModalProps = {
  isOpen: boolean;
  mode: AmountMode;
  tokenDecimals: number;
  currentRecipientsCount: number;
  title?: string;
  initialText?: string;
  onClose: () => void;
  onApply: (rows: ParsedRecipient[], replace: boolean) => void;
  onModeChange?: (mode: AmountMode) => void;
  onEvent?: (type: SprayEventType, metadata?: Record<string, unknown>) => void;
};

type PreviewFilter = "all" | "issues";

export function PastePreviewModal({
  isOpen,
  mode,
  tokenDecimals,
  currentRecipientsCount,
  title = "Paste recipients",
  initialText = "",
  onClose,
  onApply,
  onModeChange,
  onEvent,
}: PastePreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(initialText);
  const [replaceMode, setReplaceMode] = useState(false);
  const [dedupeStrategy, setDedupeStrategy] =
    useState<DedupeStrategy>("keep_last");
  const [previewFilter, setPreviewFilter] = useState<PreviewFilter>("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dropInvalid, setDropInvalid] = useState(false);
  const [normalizeDecimals, setNormalizeDecimals] = useState(true);
  const [mergeSameAddress, setMergeSameAddress] = useState(false);
  const [modalMode, setModalMode] = useState<AmountMode>(mode);
  const [preferSameAmount, setPreferSameAmount] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const pendingApplyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      setReplaceMode(false);
      setDedupeStrategy("keep_last");
      setPreviewFilter("all");
      setShowAdvanced(false);
      setDropInvalid(false);
      setNormalizeDecimals(true);
      setMergeSameAddress(false);
      setModalMode(mode);
      setPreferSameAmount(false);
      setShowDetails(false);
      setShowReplaceConfirm(false);
      pendingApplyRef.current = null;
    }
  }, [initialText, isOpen, mode]);

  useEffect(() => {
    if (
      modalMode === "same" &&
      (dedupeStrategy === "merge_sum" || dedupeStrategy === "merge_max")
    ) {
      setDedupeStrategy("keep_last");
    }
  }, [dedupeStrategy, modalMode]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

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
    () => parseRecipients(text, modalMode, tokenDecimals),
    [modalMode, text, tokenDecimals],
  );

  const issuesCount = useMemo(
    () => parsed.rows.filter((row) => row.status !== "valid").length,
    [parsed.rows],
  );
  const hasIssues = issuesCount > 0;

  const filteredRows = useMemo(() => {
    let rows = parsed.rows;
    if (previewFilter === "issues") {
      rows = rows.filter((row) => row.status !== "valid");
    }

    return rows;
  }, [previewFilter, parsed.rows]);

  const modeLabel =
    modalMode === "custom" ? "Using Custom amounts" : "Using Same amount";
  const canApplyAsIs = parsed.rows.length > 0;
  const canApplyFixes = parsed.rows.some(
    (row) => row.status === "valid" || row.status === "duplicate",
  );
  const hasDetectedAmounts = parsed.detectedAmountRows > 0;

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "same" && hasDetectedAmounts && !preferSameAmount) {
      setModalMode("custom");
    }
  }, [hasDetectedAmounts, isOpen, mode, preferSameAmount]);

  const applyWithMode = (rows: ParsedRecipient[]) => {
    if (modalMode !== mode) {
      onModeChange?.(modalMode);
    }
    onApply(rows, replaceMode);
  };

  const logPasteApplied = (rows: ParsedRecipient[], fixesApplied: boolean) => {
    onEvent?.("paste_applied", {
      rowsApplied: rows.length,
      replaceMode,
      mode: modalMode,
      fixesApplied,
      linesTotal: parsed.linesTotal,
      uniqueAddresses: parsed.uniqueAddresses,
      issuesTotal: parsed.issuesSummary.total,
      invalidRows: parsed.invalidRows,
      duplicateRows: parsed.duplicateRows,
      missingAmountRows: parsed.missingAmountRows,
      detectedAmountRows: parsed.detectedAmountRows,
      headerIgnored: parsed.headerIgnored,
    });
  };

  const requireReplaceConfirm = replaceMode && currentRecipientsCount > 0;

  const executeApplyAsIs = () => {
    logPasteApplied(parsed.rows, false);
    applyWithMode(parsed.rows);
  };

  const executeFixAndApply = () => {
    const fixedRows = applyFixes(parsed.rows, {
      mode: modalMode,
      tokenDecimals,
      dedupeStrategy,
      mergeSameAddressSum: mergeSameAddress,
      trimWhitespace: true,
      normalizeDecimals,
      dropInvalid,
    });
    onEvent?.("fix_applied", {
      rowsApplied: fixedRows.length,
      replaceMode,
      mode: modalMode,
      dedupeStrategy,
      dropInvalid,
      normalizeDecimals,
      mergeSameAddress,
    });
    logPasteApplied(fixedRows, true);
    applyWithMode(fixedRows);
  };

  const maybeConfirmThenApply = (applyFn: () => void) => {
    if (requireReplaceConfirm) {
      pendingApplyRef.current = applyFn;
      setShowReplaceConfirm(true);
      return;
    }
    applyFn();
  };

  const handleApplyAsIs = () => maybeConfirmThenApply(executeApplyAsIs);
  const handleFixAndApply = () => maybeConfirmThenApply(executeFixAndApply);

  const handleReplaceConfirm = () => {
    setShowReplaceConfirm(false);
    pendingApplyRef.current?.();
    pendingApplyRef.current = null;
  };

  const handleReplaceCancel = () => {
    setShowReplaceConfirm(false);
    pendingApplyRef.current = null;
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-den-bg shadow-2xl"
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
              {modalMode === "same" ? (
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
          <div className="grid min-h-0 gap-6 lg:grid-cols-[1.1fr_1fr] [@media(max-height:800px)]:grid-cols-1">
            <div className="space-y-3">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="0xabc...,0.25"
                className="min-h-[260px] w-full rounded-xl border border-wolf-border bg-wolf-panel px-4 py-3 text-sm text-white/80 placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none"
              />
              {mode === "same" && hasDetectedAmounts ? (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                  <span>
                    {modalMode === "custom"
                      ? "Detected amounts in pasted list — using Custom amounts."
                      : "Amounts detected — Same amount will ignore them."}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode =
                        modalMode === "custom" ? "same" : "custom";
                      setPreferSameAmount(nextMode === "same");
                      setModalMode(nextMode);
                    }}
                    className="rounded-md border border-amber-300/40 px-2 py-1 text-[11px] font-semibold uppercase text-amber-100 transition hover:border-amber-200"
                  >
                    {modalMode === "custom"
                      ? "Use Same amount instead"
                      : "Use Custom amounts"}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-col rounded-xl border border-wolf-border bg-wolf-panel p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Preview</h3>
                <button
                  type="button"
                  onClick={() => setShowDetails((prev) => !prev)}
                  className="text-[11px] font-semibold uppercase text-white/60 transition hover:text-white"
                >
                  {showDetails ? "Hide details" : "Show details"}
                </button>
              </div>

              {currentRecipientsCount > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-[11px] text-white/70">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="replace-mode"
                      checked={!replaceMode}
                      onChange={() => setReplaceMode(false)}
                      className="accent-wolf-emerald"
                    />
                    <span className="text-xs font-semibold text-white">
                      Append
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="replace-mode"
                      checked={replaceMode}
                      onChange={() => setReplaceMode(true)}
                      className="accent-wolf-emerald"
                    />
                    <span className="text-xs font-semibold text-white">
                      Replace
                    </span>
                  </label>
                </div>
              ) : (
                <p className="mt-3 text-xs text-white/50">
                  This will add recipients to the list.
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/60">
                <span>{`Lines: ${parsed.linesTotal}`}</span>
                <span>{`Issues: ${issuesCount}`}</span>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="text-[11px] font-semibold uppercase text-white/60 transition hover:text-white"
                >
                  {showAdvanced ? "Hide advanced" : "Advanced (optional)"}
                </button>
                {showAdvanced ? (
                  <div className="mt-3 space-y-2 text-xs text-white/70">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={dropInvalid}
                        onChange={(event) =>
                          setDropInvalid(event.target.checked)
                        }
                        className="accent-wolf-emerald"
                      />
                      <span>Drop invalid rows</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={normalizeDecimals}
                        onChange={(event) =>
                          setNormalizeDecimals(event.target.checked)
                        }
                        className="accent-wolf-emerald"
                      />
                      <span>
                        Normalize decimals
                        {parsed.decimalNormalizedCount > 0
                          ? ` (${parsed.decimalNormalizedCount})`
                          : ""}
                      </span>
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] uppercase text-white/50">
                        Duplicate rows
                      </span>
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
                    </div>
                    {modalMode === "custom" ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={mergeSameAddress}
                          onChange={(event) =>
                            setMergeSameAddress(event.target.checked)
                          }
                          className="accent-wolf-emerald"
                        />
                        <span>Merge same address (sum amounts)</span>
                      </label>
                    ) : null}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={previewFilter === "issues"}
                        onChange={(event) =>
                          setPreviewFilter(
                            event.target.checked ? "issues" : "all",
                          )
                        }
                        className="accent-wolf-emerald"
                      />
                      <span>Show only issues</span>
                    </label>
                  </div>
                ) : null}
              </div>

              {showDetails ? (
                <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/5">
                  <div
                    className={`grid gap-3 border-b border-white/5 bg-black/20 px-3 py-2 text-[11px] uppercase text-white/40 ${
                      modalMode === "custom"
                        ? "grid-cols-[minmax(0,1fr)_90px_90px]"
                        : "grid-cols-[minmax(0,1fr)_90px]"
                    }`}
                  >
                    <span>Address</span>
                    {modalMode === "custom" ? <span>Amount</span> : null}
                    <span>Status</span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto">
                    {parsed.rows.length === 0 ? (
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
                            modalMode === "custom"
                              ? "grid-cols-[minmax(0,1fr)_90px_90px]"
                              : "grid-cols-[minmax(0,1fr)_90px]"
                          }`}
                        >
                          <span className="truncate font-mono">
                            {row.address || "—"}
                          </span>
                          {modalMode === "custom" ? (
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
                                ? "Duplicate row"
                                : row.status === "missing_amount"
                                  ? "Missing amount"
                                  : "Invalid"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          {parsed.headerIgnored ? (
            <p className="mt-4 text-xs text-white/60">
              Header row detected and ignored.
            </p>
          ) : null}
        </div>

        <div className="sticky bottom-0 z-10 mt-auto border-t border-white/10 bg-den-bg px-6 py-4">
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
              {hasIssues ? (
                <button
                  type="button"
                  onClick={handleApplyAsIs}
                  disabled={!canApplyAsIs}
                  className="rounded-md border border-wolf-border px-4 py-2 text-xs font-semibold uppercase text-white/70 transition hover:border-wolf-border-strong hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Apply as-is
                </button>
              ) : null}
              <button
                type="button"
                onClick={hasIssues ? handleFixAndApply : handleApplyAsIs}
                disabled={hasIssues ? !canApplyFixes : !canApplyAsIs}
                className="rounded-md border border-den-lime-dark bg-den-lime-deep px-5 py-2 text-xs font-semibold uppercase text-den-bg transition hover:shadow-[0_12px_30px_rgba(186,255,92,0.4)] disabled:border-wolf-border disabled:bg-wolf-border disabled:text-white/40"
              >
                {hasIssues ? "Fix & Apply (recommended)" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <ReplaceConfirmDialog
        isOpen={showReplaceConfirm}
        existingCount={currentRecipientsCount}
        incomingCount={parsed.rows.length}
        onConfirm={handleReplaceConfirm}
        onCancel={handleReplaceCancel}
      />
    </div>,
    document.body,
  );
}
