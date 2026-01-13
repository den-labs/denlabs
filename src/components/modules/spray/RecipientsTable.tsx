"use client";

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

const ROW_HEIGHT = 44;
const OVERSCAN = 6;

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
      return "Duplicate";
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
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const useVirtual = rows.length > 100;
  const footerOffset = footer ? 96 : 0;

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const updateHeight = () => setContainerHeight(node.clientHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { startIndex, endIndex, offsetY, totalHeight } = useMemo(() => {
    if (!useVirtual || containerHeight === 0) {
      return {
        startIndex: 0,
        endIndex: rows.length,
        offsetY: 0,
        totalHeight: rows.length * ROW_HEIGHT,
      };
    }
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const end = Math.min(
      rows.length,
      Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN,
    );
    return {
      startIndex: start,
      endIndex: end,
      offsetY: start * ROW_HEIGHT,
      totalHeight: rows.length * ROW_HEIGHT,
    };
  }, [containerHeight, rows.length, scrollTop, useVirtual]);

  const visibleRows = useVirtual ? rows.slice(startIndex, endIndex) : rows;

  const gridTemplate =
    amountMode === "custom"
      ? "grid-cols-[minmax(0,1fr)_140px_110px_44px]"
      : "grid-cols-[minmax(0,1fr)_110px_44px]";

  return (
    <div className="rounded-2xl border border-wolf-border bg-[#0b111a]">
      <div
        className={`grid ${gridTemplate} items-center gap-3 border-b border-wolf-border px-4 py-2 text-[11px] uppercase text-white/40`}
      >
        <span>Address</span>
        {amountMode === "custom" ? <span>Amount</span> : null}
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[420px] overflow-y-auto"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
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
        ) : (
          <div
            className="relative"
            style={
              useVirtual
                ? { height: `${totalHeight}px`, paddingBottom: footerOffset }
                : { paddingBottom: footerOffset }
            }
          >
            <div
              style={
                useVirtual
                  ? { transform: `translateY(${offsetY}px)` }
                  : undefined
              }
            >
              {visibleRows.map((row) => {
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
                    className={`grid ${gridTemplate} items-center gap-3 border-b border-white/5 px-4 py-2 text-sm`}
                    style={{ height: ROW_HEIGHT }}
                  >
                    <input
                      value={row.address}
                      onChange={(event) =>
                        onRowChange(row.id, "address", event.target.value)
                      }
                      placeholder="0x..."
                      className={`h-9 w-full rounded-md border bg-wolf-panel px-3 text-sm placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none ${addressClass}`}
                    />
                    {amountMode === "custom" ? (
                      <input
                        value={row.amount ?? ""}
                        onChange={(event) =>
                          onRowChange(row.id, "amount", event.target.value)
                        }
                        placeholder="0.00"
                        className={`h-9 w-full rounded-md border bg-wolf-panel px-3 text-sm placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none ${amountClass}`}
                      />
                    ) : null}
                    <span
                      className={`text-xs font-semibold ${statusTone(status)}`}
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
          </div>
        )}

        {footer ? <div className="sticky bottom-0 z-10">{footer}</div> : null}
      </div>
    </div>
  );
}
