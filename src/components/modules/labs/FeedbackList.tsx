"use client";

import { Filter, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FeedbackItem as FeedbackItemType } from "@/lib/eventLabs";
import { listFeedback } from "@/lib/eventLabsClient";
import { FeedbackItem } from "./FeedbackItem";

interface FeedbackListProps {
  labSlug: string;
  isCreator?: boolean;
}

export function FeedbackList({
  labSlug,
  isCreator = false,
}: FeedbackListProps) {
  const [feedback, setFeedback] = useState<FeedbackItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
  });

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listFeedback(
        labSlug,
        filters.status !== "all" || filters.priority !== "all"
          ? {
              status: filters.status !== "all" ? filters.status : undefined,
              priority:
                filters.priority !== "all" ? filters.priority : undefined,
            }
          : undefined,
      );
      setFeedback(result.feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch feedback");
    } finally {
      setIsLoading(false);
    }
  }, [labSlug, filters.status, filters.priority]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-wolf-emerald" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {isCreator && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Filter className="h-4 w-4" aria-hidden="true" />
            <span>Filters:</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger className="w-full sm:w-[160px] bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="triaged">Triaged</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority}
                onValueChange={(value) =>
                  setFilters({ ...filters, priority: value })
                }
              >
                <SelectTrigger className="w-full sm:w-[160px] bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="P0">P0 (Critical)</SelectItem>
                  <SelectItem value="P1">P1 (High)</SelectItem>
                  <SelectItem value="P2">P2 (Medium)</SelectItem>
                  <SelectItem value="P3">P3 (Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(filters.status !== "all" || filters.priority !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ status: "all", priority: "all" })}
                className="w-full sm:w-auto text-white/60 hover:text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Feedback Count */}
      <div className="text-sm text-white/60">
        {feedback.length === 0 ? (
          <p>No feedback yet</p>
        ) : (
          <p>
            {feedback.length} {feedback.length === 1 ? "item" : "items"}
            {!isCreator && " (your submissions + top issues)"}
          </p>
        )}
      </div>

      {/* Feedback Items */}
      {feedback.length > 0 ? (
        <div className="space-y-3">
          {feedback.map((item) => (
            <FeedbackItem
              key={item.id}
              feedback={item}
              labSlug={labSlug}
              isCreator={isCreator}
              onUpdate={fetchFeedback}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
          <p className="text-sm text-white/60">
            {isCreator
              ? "No feedback submissions yet. Share the lab link with participants to start collecting feedback."
              : "No feedback to display. Be the first to share your experience!"}
          </p>
        </div>
      )}
    </div>
  );
}
