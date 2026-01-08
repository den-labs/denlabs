"use client";

import { Flag, MapPin, MoreVertical, Tag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrustIndicator } from "@/components/ui/TrustIndicator";
import type {
  FeedbackItem as FeedbackItemType,
  FeedbackPriority,
  FeedbackStatus,
  TrustScore,
} from "@/lib/eventLabs";
import { updateFeedback } from "@/lib/eventLabsClient";

interface FeedbackItemProps {
  feedback: FeedbackItemType;
  labSlug: string;
  isCreator?: boolean;
  onUpdate?: () => void;
}

export function FeedbackItemSkeleton() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="space-y-3 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-3 w-20 bg-white/10 rounded" />
          </div>
          <div className="h-6 w-6 bg-white/10 rounded-full" />
        </div>

        {/* Message Skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-5/6 bg-white/10 rounded" />
          <div className="h-4 w-4/6 bg-white/10 rounded" />
        </div>

        {/* Metadata Skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-3 w-16 bg-white/10 rounded" />
          <div className="h-3 w-20 bg-white/10 rounded" />
        </div>

        {/* Tags Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-12 bg-white/10 rounded-full" />
          <div className="h-5 w-16 bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function FeedbackItem({
  feedback,
  labSlug,
  isCreator = false,
  onUpdate,
}: FeedbackItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUpdateStatus = async (status: FeedbackStatus) => {
    setIsUpdating(true);
    try {
      await updateFeedback(labSlug, feedback.id, { status });
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update feedback", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePriority = async (priority: FeedbackPriority | null) => {
    setIsUpdating(true);
    try {
      await updateFeedback(labSlug, feedback.id, { priority });
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update priority", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityConfig = (priority: FeedbackPriority | null) => {
    switch (priority) {
      case "P0":
        return {
          label: "P0",
          className: "bg-red-500/10 text-red-400 border-red-500/20",
        };
      case "P1":
        return {
          label: "P1",
          className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        };
      case "P2":
        return {
          label: "P2",
          className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        };
      case "P3":
        return {
          label: "P3",
          className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };
      default:
        return null;
    }
  };

  const getStatusConfig = (status: FeedbackStatus) => {
    switch (status) {
      case "new":
        return { label: "New", className: "text-emerald-400" };
      case "triaged":
        return { label: "Triaged", className: "text-blue-400" };
      case "done":
        return { label: "Done", className: "text-white/60" };
      case "spam":
        return { label: "Spam", className: "text-red-400" };
      default:
        return { label: status, className: "text-white/40" };
    }
  };

  const priorityConfig = feedback.priority
    ? getPriorityConfig(feedback.priority)
    : null;
  const statusConfig = getStatusConfig(feedback.status);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {feedback.handle || "Anonymous"}
            </span>
            <span className="text-xs text-white/40">
              {formatDate(feedback.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrustIndicator
              trustScore={{
                score: feedback.trust_score,
                flags: feedback.trust_flags as TrustScore["flags"],
                risk_level:
                  feedback.trust_score >= 80
                    ? "trusted"
                    : feedback.trust_score >= 40
                      ? "unverified"
                      : "risk",
              }}
            />
            {isCreator && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={isUpdating}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleUpdateStatus("triaged")}
                  >
                    Mark as Triaged
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdateStatus("done")}>
                    Mark as Done
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdateStatus("spam")}>
                    Mark as Spam
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdatePriority("P0")}>
                    Set Priority: P0
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdatePriority("P1")}>
                    Set Priority: P1
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdatePriority("P2")}>
                    Set Priority: P2
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-white/90 whitespace-pre-wrap">
          {feedback.message}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
          {feedback.route && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              <span>{feedback.route}</span>
            </div>
          )}
          {feedback.event_type && (
            <div className="flex items-center gap-1">
              <Flag className="h-3 w-3" aria-hidden="true" />
              <span>{feedback.event_type}</span>
            </div>
          )}
        </div>

        {/* Tags and Status */}
        <div className="flex flex-wrap items-center gap-2">
          {priorityConfig && (
            <div
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${priorityConfig.className}`}
            >
              {priorityConfig.label}
            </div>
          )}
          <div className={`text-xs font-medium ${statusConfig.className}`}>
            {statusConfig.label}
          </div>
          {feedback.tags &&
            feedback.tags.length > 0 &&
            feedback.tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/60"
              >
                <Tag className="h-3 w-3" aria-hidden="true" />
                <span>{tag}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
