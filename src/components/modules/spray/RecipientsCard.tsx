"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type {
  AmountMode,
  DedupeStrategy,
  ParsedRecipient,
  RecipientRowInput,
  RecipientStatus,
} from "@/lib/recipients";
import type { SprayEventType } from "@/lib/sprayEventsClient";
import { PastePreviewModal } from "./PastePreviewModal";
import { RecipientsTable } from "./RecipientsTable";

type RecipientsCardProps = {
  rows: RecipientRowInput[];
  recipientCount: number;
  amountMode: AmountMode;
  globalAmount: string;
  tokenDecimals: number;
  issuesCount: number;
  duplicateCount: number;
  invalidCount: number;
  missingAmountCount: number;
  statusById: Record<string, RecipientStatus>;
  issuesById: Record<string, string[]>;
  onModeChange: (mode: AmountMode) => void;
  onGlobalAmountChange: (value: string) => void;
  onRowChange: (id: string, key: "address" | "amount", value: string) => void;
  onRemoveRow: (id: string) => void;
  onAddRow: () => void;
  onClearRows: () => void;
  onApplyParsedRows: (rows: ParsedRecipient[], replace: boolean) => void;
  onRemoveDuplicates: (strategy: DedupeStrategy) => void;
  onRemoveInvalidRows: () => void;
  onFillMissingAmounts: () => void;
  canFillMissing: boolean;
  fillMissingValue: string;
  onFillMissingValueChange: (value: string) => void;
  onPasteOpen?: (source: "paste" | "csv") => void;
  onEvent?: (type: SprayEventType, metadata?: Record<string, unknown>) => void;
  footer: React.ReactNode;
};

export function RecipientsCard({
  rows,
  recipientCount,
  amountMode,
  globalAmount,
  tokenDecimals,
  issuesCount,
  duplicateCount,
  invalidCount,
  missingAmountCount,
  statusById,
  issuesById,
  onModeChange,
  onGlobalAmountChange,
  onRowChange,
  onRemoveRow,
  onAddRow,
  onClearRows,
  onApplyParsedRows,
  onRemoveDuplicates,
  onRemoveInvalidRows,
  onFillMissingAmounts,
  canFillMissing,
  fillMissingValue,
  onFillMissingValueChange,
  onPasteOpen,
  onEvent,
  footer,
}: RecipientsCardProps) {
  const t = useTranslations("SprayDisperser");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dedupeStrategy, setDedupeStrategy] =
    useState<DedupeStrategy>("keep_first");
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      amountMode === "same" &&
      (dedupeStrategy === "merge_sum" || dedupeStrategy === "merge_max")
    ) {
      setDedupeStrategy("keep_first");
    }
  }, [amountMode, dedupeStrategy]);

  const openPasteModal = () => {
    onPasteOpen?.("paste");
    setPreviewText("");
    setIsPreviewOpen(true);
  };

  const openCsvModal = (text: string) => {
    onPasteOpen?.("csv");
    setPreviewText(text);
    setIsPreviewOpen(true);
  };

  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      openCsvModal(String(reader.result ?? ""));
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleDownloadTemplate = () => {
    const template = [
      "address,amount",
      "0x0000000000000000000000000000000000000001,0.5",
      "0x0000000000000000000000000000000000000002,1.25",
    ].join("\n");
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "spray-recipients-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!showOverflow) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        overflowRef.current &&
        target &&
        !overflowRef.current.contains(target)
      ) {
        setShowOverflow(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowOverflow(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showOverflow]);

  const hasRecipients = recipientCount > 0;

  return (
    <section className="wolf-card--muted flex min-h-0 flex-1 flex-col border border-wolf-border-mid p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-white">
            {`Recipients (${recipientCount})`}
          </h3>
          {issuesCount > 0 ? (
            <span className="wolf-pill bg-rose-500/10 text-rose-300">
              {`${issuesCount} issues`}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openPasteModal}
            className="rounded-md border border-wolf-border px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-wolf-border-strong hover:text-white"
          >
            Paste list
          </button>
          <div ref={overflowRef} className="relative">
            <button
              type="button"
              onClick={() => setShowOverflow((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-wolf-border text-white/70 transition hover:border-wolf-border-strong hover:text-white"
              aria-label="More actions"
              aria-expanded={showOverflow}
            >
              ⋯
            </button>
            {showOverflow ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-48 rounded-xl border border-wolf-border bg-wolf-panel p-2 text-xs text-white/80 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowOverflow(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-white/5"
                >
                  Import CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddRow();
                    setShowOverflow(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-white/5"
                >
                  + Add manual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadTemplate();
                    setShowOverflow(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-white/5"
                >
                  Download template
                </button>
                {hasRecipients ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClearRows();
                      setShowOverflow(false);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-rose-200 transition hover:bg-white/5"
                  >
                    Clear list
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {hasRecipients ? (
        <>
          {(duplicateCount > 0 ||
            invalidCount > 0 ||
            missingAmountCount > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {duplicateCount > 0 ? (
                <>
                  <span className="text-amber-200">
                    {`${duplicateCount} duplicate row(s)`}
                  </span>
                  <div className="flex flex-wrap items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1 text-[10px] uppercase text-white/60">
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
                    {amountMode === "custom" ? (
                      <button
                        type="button"
                        onClick={() => setDedupeStrategy("merge_sum")}
                        className={`rounded px-2 py-1 transition ${
                          dedupeStrategy === "merge_sum"
                            ? "bg-wolf-neutral-soft text-white"
                            : ""
                        }`}
                      >
                        Merge same address (sum)
                      </button>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveDuplicates(dedupeStrategy)}
                    className="rounded-md border border-amber-400/40 px-2 py-1 text-[11px] font-semibold uppercase text-amber-200 transition hover:border-amber-300 hover:text-amber-100"
                  >
                    Resolve duplicate rows
                  </button>
                </>
              ) : null}
              {invalidCount > 0 ? (
                <>
                  <span className="text-rose-200">{`${invalidCount} invalid`}</span>
                  <button
                    type="button"
                    onClick={onRemoveInvalidRows}
                    className="rounded-md border border-rose-400/40 px-2 py-1 text-[11px] font-semibold uppercase text-rose-200 transition hover:border-rose-300 hover:text-rose-100"
                  >
                    Remove invalid rows
                  </button>
                </>
              ) : null}
              {missingAmountCount > 0 ? (
                <>
                  <span className="text-amber-200">
                    {`${missingAmountCount} missing amounts`}
                  </span>
                  <input
                    value={fillMissingValue}
                    onChange={(event) =>
                      onFillMissingValueChange(event.target.value)
                    }
                    placeholder="Fill value"
                    className="h-7 w-28 rounded-md border border-amber-400/30 bg-wolf-panel px-2 text-[11px] text-white/80 placeholder:text-white/40 focus:border-wolf-emerald focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={onFillMissingAmounts}
                    disabled={!canFillMissing}
                    className="rounded-md border border-amber-400/40 px-2 py-1 text-[11px] font-semibold uppercase text-amber-200 transition hover:border-amber-300 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Fill missing amounts
                  </button>
                </>
              ) : null}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-wolf-border bg-wolf-panel px-1.5 py-1 text-xs font-semibold uppercase text-wolf-text-subtle">
              <button
                type="button"
                onClick={() => onModeChange("same")}
                className={`rounded-md px-3 py-1 transition ${
                  amountMode === "same"
                    ? "bg-wolf-neutral-soft text-white"
                    : "text-wolf-text-subtle"
                }`}
              >
                Same amount
              </button>
              <button
                type="button"
                onClick={() => onModeChange("custom")}
                className={`rounded-md px-3 py-1 transition ${
                  amountMode === "custom"
                    ? "bg-[linear-gradient(135deg,rgba(160,83,255,0.85),rgba(91,45,255,0.65))] text-white"
                    : "text-wolf-text-subtle"
                }`}
              >
                Custom amounts
              </button>
            </div>
            {amountMode === "same" ? (
              <div className="flex min-w-[220px] flex-1 items-center gap-2">
                <label
                  htmlFor="global-amount"
                  className="text-xs uppercase text-white/50"
                >
                  Amount per recipient
                </label>
                <input
                  id="global-amount"
                  value={globalAmount}
                  onChange={(event) => onGlobalAmountChange(event.target.value)}
                  placeholder="0.00"
                  className="flex-1 rounded-md border border-wolf-border bg-wolf-panel px-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none"
                />
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex min-h-0 flex-1">
            <RecipientsTable
              rows={rows}
              amountMode={amountMode}
              statusById={statusById}
              issuesById={issuesById}
              onRowChange={onRowChange}
              onRemoveRow={onRemoveRow}
              onAddRow={onAddRow}
              footer={footer}
            />
          </div>
        </>
      ) : (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-wolf-border px-6 py-16 text-center">
          <svg
            viewBox="0 0 24 24"
            className="h-10 w-10 text-white/20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-white/70">
              {t("empty.title")}
            </p>
            <p className="mt-1 max-w-[36ch] text-xs text-white/40">
              {t("empty.description")}
            </p>
          </div>
          <button
            type="button"
            onClick={openPasteModal}
            className="rounded-lg border border-wolf-border bg-wolf-panel px-5 py-2.5 text-xs font-semibold text-white/80 transition hover:border-wolf-border-strong hover:text-white"
          >
            Paste list
          </button>
        </div>
      )}

      <PastePreviewModal
        isOpen={isPreviewOpen}
        mode={amountMode}
        tokenDecimals={tokenDecimals}
        currentRecipientsCount={rows.length}
        initialText={previewText}
        onClose={() => setIsPreviewOpen(false)}
        onModeChange={onModeChange}
        onApply={(parsedRows, replace) => {
          onApplyParsedRows(parsedRows, replace);
          setIsPreviewOpen(false);
        }}
        onEvent={onEvent}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleCsvImport}
      />
    </section>
  );
}
