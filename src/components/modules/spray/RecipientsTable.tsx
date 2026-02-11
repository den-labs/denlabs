"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AmountMode,
  RecipientRowInput,
  RecipientStatus,
} from "@/lib/recipients";

type RecipientsTableProps = {
  rows: RecipientRowInput[];
  amountMode: AmountMode;
  statusById: Record<string, RecipientStatus>;
  issuesById: Record<string, string[]>;
  onRowChange: (id: string, key: "address" | "amount", value: string) => void;
  onRemoveRow: (id: string) => void;
  onAddRow?: () => void;
  footer?: React.ReactNode;
};

type RecipientFilter = "all" | "issues" | "duplicates" | "invalid" | "missing";
type DensityMode = "comfort" | "compact";

const OVERSCAN = 6;
export const RECIPIENTS_VIRTUALIZE_THRESHOLD = 150;

function statusTone(status: RecipientStatus) {
  switch (status) {
    case "valid":
      return "text-wolf-emerald";
    case "duplicate":
      return "text-amber-300";
    case "missing_amount":
      return "text-amber-200";
    default:
      return "text-rose-300";
  }
}

function statusLabel(status: RecipientStatus) {
  switch (status) {
    case "valid":
      return "Valid";
    case "duplicate":
      return "Duplicate row";
    case "missing_amount":
      return "Missing amount";
    default:
      return "Invalid";
  }
}

export function RecipientsTable({
  rows,
  amountMode,
  statusById,
  issuesById,
  onRowChange,
  onRemoveRow,
  onAddRow,
  footer,
}: RecipientsTableProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const filterInitRef = useRef(false);
  const [filter, setFilter] = useState<RecipientFilter>("all");
  const [density, setDensity] = useState<DensityMode>("comfort");
  const footerOffset = footer ? 96 : 0;
  const ROW_HEIGHT = density === "compact" ? 36 : 44;

  const hasIssues = useMemo(
    () =>
      rows.some((row) => {
        const status = statusById[row.id];
        return status && status !== "valid";
      }),
    [rows, statusById],
  );

  useEffect(() => {
    if (!filterInitRef.current && hasIssues) {
      setFilter("issues");
      filterInitRef.current = true;
    }
  }, [hasIssues]);

  useEffect(() => {
    if (amountMode === "same" && filter === "missing") {
      setFilter("all");
    }
  }, [amountMode, filter]);

  const filteredRows = useMemo(() => {
    if (filter === "all") {
      return rows;
    }
    return rows.filter((row) => {
      const status = statusById[row.id] ?? "invalid";
      if (filter === "issues") {
        return status !== "valid";
      }
      if (filter === "duplicates") {
        return status === "duplicate";
      }
      if (filter === "invalid") {
        return status === "invalid";
      }
      if (filter === "missing") {
        return status === "missing_amount";
      }
      return true;
    });
  }, [filter, rows, statusById]);

  const filterOptions = useMemo(() => {
    const base: Array<{ id: RecipientFilter; label: string }> = [
      { id: "all", label: "All" },
      { id: "issues", label: "Issues" },
      { id: "duplicates", label: "Duplicate rows" },
      { id: "invalid", label: "Invalid" },
    ];
    if (amountMode === "custom") {
      base.push({ id: "missing", label: "Missing amount" });
    }
    return base;
  }, [amountMode]);

  const useVirtual = filteredRows.length > RECIPIENTS_VIRTUALIZE_THRESHOLD;
  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  useEffect(() => {
    if (!useVirtual) {
      return;
    }
    if (ROW_HEIGHT > 0) {
      rowVirtualizer.measure();
    }
  }, [ROW_HEIGHT, rowVirtualizer, useVirtual]);

  const gridTemplate =
    amountMode === "custom"
      ? "grid-cols-[minmax(120px,1fr)_80px_36px] sm:grid-cols-[minmax(220px,1fr)_120px_110px_44px]"
      : "grid-cols-[minmax(120px,1fr)_36px] sm:grid-cols-[minmax(220px,1fr)_110px_44px]";
  const rowTextSize = density === "compact" ? "text-xs" : "text-sm";
  const rowPadding = density === "compact" ? "py-1.5" : "py-2";
  const inputHeight = density === "compact" ? "h-8 text-xs" : "h-9 text-sm";

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-wolf-border bg-den-bg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-wolf-border px-4 py-2 text-[11px] uppercase text-white/60">
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={`rounded-md border border-white/10 px-2 py-1 transition ${
                filter === option.id
                  ? "border-wolf-emerald text-wolf-emerald"
                  : "text-white/60 hover:border-white/30 hover:text-white/80"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 p-1">
          {(["comfort", "compact"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDensity(option)}
              className={`rounded px-2 py-1 text-[10px] uppercase transition ${
                density === option
                  ? "bg-wolf-neutral-soft text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {option === "comfort" ? "Comfort" : "Compact"}
            </button>
          ))}
        </div>
      </div>
      <div
        className={`grid ${gridTemplate} items-center gap-3 border-b border-wolf-border px-4 py-2 text-[11px] uppercase text-white/40`}
      >
        <span>Address</span>
        {amountMode === "custom" ? (
          <span className="text-right">Amount</span>
        ) : null}
        <span className="hidden sm:inline">Status</span>
        <span className="text-right">Actions</span>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
        data-virtualized={useVirtual ? "true" : "false"}
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-sm text-white/60">
            <p>No recipients yet. Paste a list or add a row to get started.</p>
            {onAddRow ? (
              <button
                type="button"
                onClick={onAddRow}
                className="rounded-md border border-wolf-border px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-wolf-border-strong hover:text-white"
              >
                Add recipient
              </button>
            ) : null}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-white/60">
            <p>No recipients match this filter.</p>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="rounded-md border border-wolf-border px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-wolf-border-strong hover:text-white"
            >
              Clear filter
            </button>
          </div>
        ) : useVirtual ? (
          <div
            className="relative"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              paddingBottom: footerOffset,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = filteredRows[virtualRow.index];
              const status = statusById[row.id] ?? "invalid";
              const issues = issuesById[row.id] ?? [];
              const addressClass =
                issues.includes("invalid_address") || status === "invalid"
                  ? "border-rose-400/60 text-rose-100"
                  : "border-wolf-border text-white/80";
              const amountClass =
                issues.includes("missing_amount") ||
                issues.includes("invalid_amount")
                  ? "border-rose-400/60 text-rose-100"
                  : "border-wolf-border text-white/80";
              return (
                <div
                  key={row.id}
                  className={`absolute left-0 right-0 grid ${gridTemplate} items-center gap-3 border-b border-white/5 px-4 ${rowPadding} ${rowTextSize}`}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                    height: ROW_HEIGHT,
                  }}
                >
                  <input
                    value={row.address}
                    onChange={(event) =>
                      onRowChange(row.id, "address", event.target.value)
                    }
                    placeholder="0x..."
                    title={row.address}
                    className={`w-full truncate rounded-md border bg-wolf-panel px-3 placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none ${inputHeight} ${addressClass}`}
                  />
                  {amountMode === "custom" ? (
                    <input
                      value={row.amount ?? ""}
                      onChange={(event) =>
                        onRowChange(row.id, "amount", event.target.value)
                      }
                      placeholder="0.00"
                      className={`w-full rounded-md border bg-wolf-panel px-3 text-right placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none ${inputHeight} ${amountClass}`}
                    />
                  ) : null}
                  <span
                    className={`hidden text-xs font-semibold sm:inline ${statusTone(status)}`}
                  >
                    {statusLabel(status)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveRow(row.id)}
                    className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-white/60 transition hover:border-wolf-border hover:text-white"
                    aria-label="Remove recipient"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 7h12M10 7V5h4v2m-7 0v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative" style={{ paddingBottom: footerOffset }}>
            {filteredRows.map((row) => {
              const status = statusById[row.id] ?? "invalid";
              const issues = issuesById[row.id] ?? [];
              const addressClass =
                issues.includes("invalid_address") || status === "invalid"
                  ? "border-rose-400/60 text-rose-100"
                  : "border-wolf-border text-white/80";
              const amountClass =
                issues.includes("missing_amount") ||
                issues.includes("invalid_amount")
                  ? "border-rose-400/60 text-rose-100"
                  : "border-wolf-border text-white/80";
              return (
                <div
                  key={row.id}
                  className={`grid ${gridTemplate} items-center gap-3 border-b border-white/5 px-4 ${rowPadding} ${rowTextSize}`}
                  style={{ height: ROW_HEIGHT }}
                >
                  <input
                    value={row.address}
                    onChange={(event) =>
                      onRowChange(row.id, "address", event.target.value)
                    }
                    placeholder="0x..."
                    title={row.address}
                    className={`w-full truncate rounded-md border bg-wolf-panel px-3 placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none ${inputHeight} ${addressClass}`}
                  />
                  {amountMode === "custom" ? (
                    <input
                      value={row.amount ?? ""}
                      onChange={(event) =>
                        onRowChange(row.id, "amount", event.target.value)
                      }
                      placeholder="0.00"
                      className={`w-full rounded-md border bg-wolf-panel px-3 text-right placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none ${inputHeight} ${amountClass}`}
                    />
                  ) : null}
                  <span
                    className={`hidden text-xs font-semibold sm:inline ${statusTone(status)}`}
                  >
                    {statusLabel(status)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveRow(row.id)}
                    className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-white/60 transition hover:border-wolf-border hover:text-white"
                    aria-label="Remove recipient"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 7h12M10 7V5h4v2m-7 0v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {footer ? (
          <div className="sticky bottom-0 z-10 border-t border-wolf-border bg-den-bg shadow-[0_-10px_24px_rgba(2,6,12,0.75)]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
