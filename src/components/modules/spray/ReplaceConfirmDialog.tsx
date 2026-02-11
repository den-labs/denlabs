"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type ReplaceConfirmDialogProps = {
  isOpen: boolean;
  existingCount: number;
  incomingCount: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ReplaceConfirmDialog({
  isOpen,
  existingCount,
  incomingCount,
  onConfirm,
  onCancel,
}: ReplaceConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        onCancel();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-den-bg p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-white">
          Replace existing recipients?
        </h3>
        <p className="mt-2 text-sm text-white/60">
          {`This will replace ${existingCount} existing recipient${existingCount !== 1 ? "s" : ""} with ${incomingCount} new recipient${incomingCount !== 1 ? "s" : ""}. This action cannot be undone.`}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-wolf-border px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-wolf-border-strong hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md border border-rose-400/60 bg-rose-500/20 px-4 py-2 text-xs font-semibold uppercase text-rose-200 transition hover:bg-rose-500/30"
          >
            Replace
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
