"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { SprayEvent } from "@/lib/sprayEventsClient";

const EVENT_LABELS: Record<string, string> = {
  paste_opened: "Paste opened",
  paste_parsed: "Paste parsed",
  paste_applied: "Paste applied",
  fix_applied: "Fix applied",
  send_started: "Send started",
  send_completed: "Send completed",
  send_failed: "Send failed",
};

type SprayLogModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  events: SprayEvent[];
  isLoading: boolean;
  error?: string | null;
};

function formatEventType(value: string) {
  return (
    EVENT_LABELS[value] ||
    value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

export function SprayLogModal({
  isOpen,
  onClose,
  onRefresh,
  events,
  isLoading,
  error,
}: SprayLogModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);

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

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative flex max-h-[calc(100dvh-var(--app-header-height)-24px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-den-bg shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-white">Spray log</h2>
            <p className="text-sm text-white/60">
              Last 20 events captured in this spray session.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="rounded-md border border-wolf-border px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-wolf-border-strong hover:text-white"
              >
                Refresh
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/60 transition hover:bg-white/5 hover:text-white"
              aria-label="Close log modal"
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
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="text-sm text-white/60">Loading log…</p>
          ) : error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-white/60">No events yet.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((event) => {
                const metadata = event.metadata ?? {};
                const hasMetadata = Object.keys(metadata).length > 0;
                return (
                  <li
                    key={event.id}
                    className="rounded-xl border border-wolf-border bg-wolf-panel px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">
                        {formatEventType(event.event_type)}
                      </p>
                      <span className="text-[11px] uppercase text-white/50">
                        {formatTimestamp(event.created_at)}
                      </span>
                    </div>
                    {hasMetadata ? (
                      <details className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <summary className="cursor-pointer text-[11px] font-semibold uppercase text-white/60">
                          Metadata
                        </summary>
                        <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] text-white/70">
                          {JSON.stringify(metadata, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
