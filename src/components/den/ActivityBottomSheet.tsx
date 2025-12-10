"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import ActivityRail from "@/components/den/ActivityRail";

export default function ActivityBottomSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("ActivityRail");
  const sheetTitle = t("sheet.title");
  const expandLabel = t("sheet.expand");
  const collapseLabel = t("sheet.collapse");
  const closeLabel = t("sheet.close");

  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 hidden md:block lg:right-10 lg:left-auto lg:w-[360px] lg:translate-x-0">
      <div className="pointer-events-auto mx-auto w-full max-w-md lg:mx-0">
        <div className="overflow-hidden rounded-2xl border border-wolf-border-strong bg-[#14181f]/90 shadow-[0_30px_95px_-70px_rgba(0,0,0,0.75)] backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={toggle}
              aria-label={isOpen ? collapseLabel : expandLabel}
              className="flex flex-1 items-center justify-between gap-3"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                {sheetTitle}
              </span>
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 text-white transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path
                  d="M6 14l6-6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
            {isOpen ? (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={closeLabel}
                className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-wolf-border text-white/70 transition hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </button>
            ) : null}
          </div>
          {isOpen ? (
            <div className="max-h-[70vh] overflow-y-auto border-t border-white/10">
              <ActivityRail />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
