"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrustIndicator } from "@/components/ui/TrustIndicator";
import { Textarea } from "@/components/ui/textarea";
import type { CreateFeedbackPayload } from "@/lib/eventLabs";
import { createFeedback } from "@/lib/eventLabsClient";

interface FeedbackFormProps {
  labSlug: string;
  onSuccess?: () => void;
}

export function FeedbackForm({ labSlug, onSuccess }: FeedbackFormProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTrustScore, setLastTrustScore] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: CreateFeedbackPayload = {
        lab_id: "", // Server will populate this
        message: message.trim(),
        route: window.location.pathname,
        metadata: {
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
      };

      const result = await createFeedback(labSlug, payload);
      setLastTrustScore(result.trust_score);
      setMessage("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit feedback",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = 5000 - message.length;
  const isNearLimit = remainingChars < 500;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="feedback-message"
            className="text-sm font-medium text-white"
          >
            Share Your Feedback
          </label>
          <Textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what you experienced, what worked well, what could be improved..."
            rows={5}
            maxLength={5000}
            required
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">
              Your feedback helps improve the experience
            </span>
            <span className={isNearLimit ? "text-yellow-400" : "text-white/40"}>
              {remainingChars} characters remaining
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || message.trim().length === 0}
          className="w-full bg-wolf-emerald text-black hover:bg-wolf-emerald/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Feedback
            </>
          )}
        </Button>
      </form>

      {lastTrustScore && (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">
                Feedback submitted successfully!
              </p>
              <p className="text-xs text-white/60">
                Your trust score helps prioritize feedback
              </p>
            </div>
            <TrustIndicator trustScore={lastTrustScore} />
          </div>
        </div>
      )}
    </div>
  );
}
