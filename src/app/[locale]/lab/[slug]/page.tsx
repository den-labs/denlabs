"use client";

import { FlaskConical, MessageSquare } from "lucide-react";
import { use, useEffect, useState } from "react";
import { FeedbackForm } from "@/components/modules/labs/FeedbackForm";
import { FeedbackList } from "@/components/modules/labs/FeedbackList";
import type { EventLab } from "@/lib/eventLabs";
import { getEventLab } from "@/lib/eventLabsClient";
import { EventLabInstrumentationProvider } from "@/providers/EventLabInstrumentationProvider";

export default function PublicLabPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [lab, setLab] = useState<EventLab | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchLab() {
      setIsLoading(true);
      setError(null);

      try {
        const fetchedLab = await getEventLab(slug);
        setLab(fetchedLab);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch lab");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLab();
  }, [slug]);

  const handleFeedbackSubmitted = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05090f]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-wolf-emerald border-t-transparent" />
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="min-h-screen bg-[#05090f] px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error || "Lab not found"}
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isActive = lab.status === "active";
  const isPastEndDate = lab.end_date && new Date(lab.end_date) < new Date();

  return (
    <EventLabInstrumentationProvider labSlug={slug}>
      <div className="min-h-screen bg-[#05090f] px-4 py-8">
        <div className="container mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <FlaskConical
                  className="h-7 w-7 text-wolf-emerald"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-semibold text-white">
                  {lab.name}
                </h1>
                {lab.objective && (
                  <p className="mt-1 text-sm text-white/70">{lab.objective}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <span>{formatDate(lab.start_date)}</span>
              {lab.end_date && (
                <>
                  <span>→</span>
                  <span>{formatDate(lab.end_date)}</span>
                </>
              )}
              {isActive && !isPastEndDate && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-emerald-400">
                  Active
                </span>
              )}
              {isPastEndDate && (
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-white/60">
                  Completed
                </span>
              )}
            </div>
          </div>

          {/* Status Banner */}
          {!isActive && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
              This lab is currently {lab.status}. Feedback may not be actively
              monitored.
            </div>
          )}

          {isPastEndDate && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
              This lab has ended. You can still submit feedback, but responses
              may be delayed.
            </div>
          )}

          {/* Feedback Submission */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare
                className="h-5 w-5 text-wolf-emerald"
                aria-hidden="true"
              />
              <h2 className="text-xl font-semibold text-white">
                Share Your Feedback
              </h2>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <FeedbackForm
                labSlug={slug}
                onSuccess={handleFeedbackSubmitted}
              />
            </div>
          </div>

          {/* Info Card */}
          <div className="rounded-lg border border-wolf-emerald/20 bg-wolf-emerald/5 p-4">
            <h3 className="text-sm font-semibold text-white">
              Your feedback helps improve the experience
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="text-wolf-emerald">•</span>
                <span>No account required to submit feedback</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-wolf-emerald">•</span>
                <span>
                  Your submissions are trust-scored based on verification
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-wolf-emerald">•</span>
                <span>
                  You can see your own feedback plus top priority issues from
                  others
                </span>
              </li>
            </ul>
          </div>

          {/* Recent Feedback */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Recent Feedback
            </h2>
            <FeedbackList key={refreshKey} labSlug={slug} isCreator={false} />
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 pt-6 text-center text-xs text-white/40">
            Powered by{" "}
            <a
              href="/"
              className="text-wolf-emerald hover:underline"
              data-track-action="footer-link"
            >
              DenLabs Event Feedback Ops
            </a>
          </div>
        </div>
      </div>
    </EventLabInstrumentationProvider>
  );
}
