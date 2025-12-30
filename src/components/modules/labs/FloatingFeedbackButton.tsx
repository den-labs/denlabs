"use client";

import { MessageSquarePlus, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getActiveLabSlugClient } from "@/lib/labMode";

export function FloatingFeedbackButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [labSlug, setLabSlug] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // Check if Lab Mode is active
  useEffect(() => {
    const activeSlug = getActiveLabSlugClient();
    setLabSlug(activeSlug);
  }, []); // Re-check on route change

  // Don't render if Lab Mode is not active
  if (!labSlug) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch(`/api/labs/${labSlug}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          route: pathname,
          step: "quick-feedback",
          event_type: "lab_mode_feedback",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setSubmitStatus("success");
      setMessage("");

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        setSubmitStatus("idle");
      }, 2000);
    } catch (_error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-wolf-emerald text-black shadow-lg hover:bg-wolf-emerald/90 focus:outline-none focus:ring-2 focus:ring-wolf-emerald focus:ring-offset-2 focus:ring-offset-black transition-transform hover:scale-110"
          aria-label="Quick Feedback"
          type="button"
        >
          <MessageSquarePlus className="h-6 w-6" />
        </button>
      )}

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] rounded-lg border border-white/10 bg-[#05090f]/95 p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Quick Feedback
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                Lab Mode: {labSlug}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Close"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="quick-feedback" className="sr-only">
                Your feedback
              </label>
              <textarea
                id="quick-feedback"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your feedback about this page..."
                rows={4}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-wolf-emerald/50 focus:outline-none focus:ring-2 focus:ring-wolf-emerald/20 resize-none"
                disabled={isSubmitting}
              />
              <p className="mt-1.5 text-xs text-white/50">Route: {pathname}</p>
            </div>

            {submitStatus === "success" && (
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                Feedback submitted successfully!
              </div>
            )}

            {submitStatus === "error" && (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                Failed to submit feedback. Please try again.
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="flex-1 bg-wolf-emerald text-black hover:bg-wolf-emerald/90 disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send Feedback"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
