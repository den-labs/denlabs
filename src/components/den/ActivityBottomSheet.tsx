"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ActivityRail } from "@/components/modules/labs/ActivityRail";
import { getActiveLabSlugClient } from "@/lib/labMode";

export default function ActivityBottomSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [labSlug, setLabSlug] = useState<string | null>(null);
  const [labData, setLabData] = useState<{
    surfacesCount: number;
    observing: "all" | "subset";
  } | null>(null);
  const pathname = usePathname();

  // Detect active lab from cookie
  useEffect(() => {
    const activeSlug = getActiveLabSlugClient();
    setLabSlug(activeSlug);

    // Fetch lab data if there's an active lab
    if (activeSlug) {
      fetch(`/api/labs/${activeSlug}`, {
        signal: AbortSignal.timeout(3000),
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch lab");
        })
        .then((data) => {
          const surfaces = (data.lab?.surfaces_to_observe as string[]) || [];
          setLabData({
            surfacesCount: surfaces.length,
            observing: surfaces.length === 0 ? "all" : "subset",
          });
        })
        .catch(() => {
          // Fallback to default
          setLabData({ surfacesCount: 0, observing: "all" });
        });
    } else {
      setLabData(null);
    }
  }, [pathname]); // Re-check on route change

  // Don't render if no active lab
  if (!labSlug || !labData) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 hidden md:block lg:right-10 lg:left-auto lg:w-[360px] lg:translate-x-0">
      <div className="pointer-events-auto mx-auto w-full max-w-md lg:mx-0">
        <div className="overflow-hidden rounded-2xl border border-wolf-border-strong bg-[#14181f]/90 shadow-[0_30px_95px_-70px_rgba(0,0,0,0.75)] backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label={isOpen ? "Collapse activity" : "Expand activity"}
              className="flex flex-1 items-center justify-between gap-3"
            >
              <span className="text-xs font-semibold uppercase text-white/70">
                Activity
              </span>
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 text-white transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <title>{isOpen ? "Collapse" : "Expand"}</title>
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
            {isOpen && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close activity panel"
                className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-wolf-border text-white/70 transition hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <title>Close</title>
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
            )}
          </div>
          {isOpen && (
            <div className="max-h-[70vh] overflow-y-auto border-t border-white/10">
              <ActivityRail
                labSlug={labSlug}
                surfacesCount={labData.surfacesCount}
                observing={labData.observing}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
