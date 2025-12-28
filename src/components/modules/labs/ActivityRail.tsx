"use client";

/**
 * Activity Rail - Mini-dashboard + Activity Feed
 * Replaces "Activity & Chat" rail
 */

import {
  AlertTriangle,
  BarChart3,
  MessageSquare,
  RefreshCw,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type {
  ActivityFeedItem,
  ActivityResponse,
  ActivitySummary,
} from "@/lib/activity";
import { getLabActivity } from "@/lib/activityClient";
import { getActiveLabSlugClient } from "@/lib/labMode";

type ActivityRailProps = {
  labSlug: string;
  surfacesCount: number;
  observing: "all" | "subset";
};

type FeedTab = "all" | "feedback" | "errors" | "ops";

export function ActivityRail({
  labSlug,
  surfacesCount,
  observing,
}: ActivityRailProps) {
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>("all");
  const [isLabModeActive, setIsLabModeActive] = useState(false);

  // Detect Lab Mode from cookie (client-side only)
  useEffect(() => {
    const activeSlug = getActiveLabSlugClient();
    setIsLabModeActive(activeSlug === labSlug);
  }, [labSlug]);

  // Fetch activity data
  const fetchActivity = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getLabActivity(labSlug, { window: "24h", limit: 30 });
      setActivity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setIsLoading(false);
    }
  }, [labSlug]);

  // Fetch on mount
  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Filter feed items based on active tab
  const filteredFeed = activity?.feed.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "feedback") return item.type === "feedback";
    if (activeTab === "errors") return item.type === "error";
    if (activeTab === "ops") {
      return (
        item.type === "feedback" &&
        (["P0", "P1"].includes(item.priority || "") ||
          ["new", "triaged"].includes(item.status))
      );
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Activity</h2>
        <button
          type="button"
          onClick={fetchActivity}
          disabled={isLoading}
          className="rounded p-1 text-white/70 hover:bg-white/10 disabled:opacity-50"
          title="Refresh activity"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Lab Mode Status */}
      <div className="flex items-center gap-2">
        <div
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            isLabModeActive
              ? "bg-wolf-emerald/20 text-wolf-emerald border border-wolf-emerald/30"
              : "bg-white/5 text-white/50 border border-white/10"
          }`}
        >
          Lab Mode {isLabModeActive ? "ON" : "OFF"}
        </div>
        {isLabModeActive && (
          <div className="text-xs text-white/60">
            {observing === "all"
              ? "Observing: all routes"
              : `Observing: ${surfacesCount} surfaces`}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && !activity && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-sm text-white/50">Loading activity...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      {activity && !error && (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {/* Mini-Dashboard */}
          <section>
            <h3 className="mb-2 text-sm font-medium text-white/70">
              Key Metrics (24h)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard
                label="Sessions"
                value={activity.summary.kpis.sessions_24h}
                icon={<TrendingUp className="h-3 w-3" />}
              />
              <MetricCard
                label="Feedback"
                value={activity.summary.kpis.feedback_24h}
                icon={<MessageSquare className="h-3 w-3" />}
              />
              <MetricCard
                label="Open"
                value={activity.summary.kpis.open_count}
                variant={
                  activity.summary.kpis.open_count > 0 ? "warning" : undefined
                }
              />
              <MetricCard
                label="P0"
                value={activity.summary.kpis.p0_count}
                variant={
                  activity.summary.kpis.p0_count > 0 ? "danger" : undefined
                }
              />
              <MetricCard
                label="P1"
                value={activity.summary.kpis.p1_count}
                variant={
                  activity.summary.kpis.p1_count > 0 ? "warning" : undefined
                }
              />
              <MetricCard
                label="Errors"
                value={activity.summary.kpis.errors_24h}
                variant={
                  activity.summary.kpis.errors_24h > 0 ? "danger" : undefined
                }
                icon={<AlertTriangle className="h-3 w-3" />}
              />
            </div>

            {/* Trust Distribution */}
            <div className="mt-2 rounded border border-white/10 bg-white/[0.03] p-2">
              <div className="mb-1 flex items-center gap-1 text-xs font-medium text-white/70">
                <Shield className="h-3 w-3" />
                Trust
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-emerald-400">
                  ✓ {activity.summary.kpis.trust.trusted}
                </span>
                <span className="text-amber-400">
                  ? {activity.summary.kpis.trust.unverified}
                </span>
                <span className="text-red-400">
                  ⚠ {activity.summary.kpis.trust.risk}
                </span>
                <span className="ml-auto text-white/50">
                  Spam: {Math.round(activity.summary.kpis.spam_rate * 100)}%
                </span>
              </div>
            </div>
          </section>

          {/* Top Items */}
          <TopSection summary={activity.summary} />

          {/* Feed Tabs */}
          <section className="flex flex-1 flex-col">
            <div className="mb-2 flex gap-1 border-b border-white/10">
              <TabButton
                active={activeTab === "all"}
                onClick={() => setActiveTab("all")}
                count={activity.feed.length}
              >
                All
              </TabButton>
              <TabButton
                active={activeTab === "feedback"}
                onClick={() => setActiveTab("feedback")}
                count={
                  activity.feed.filter((i) => i.type === "feedback").length
                }
              >
                Feedback
              </TabButton>
              <TabButton
                active={activeTab === "errors"}
                onClick={() => setActiveTab("errors")}
                count={activity.feed.filter((i) => i.type === "error").length}
              >
                Errors
              </TabButton>
              <TabButton
                active={activeTab === "ops"}
                onClick={() => setActiveTab("ops")}
                count={
                  activity.feed.filter(
                    (i) =>
                      i.type === "feedback" &&
                      (["P0", "P1"].includes(i.priority || "") ||
                        ["new", "triaged"].includes(i.status)),
                  ).length
                }
              >
                Ops
              </TabButton>
            </div>

            {/* Feed Items */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {filteredFeed && filteredFeed.length > 0 ? (
                filteredFeed.map((item) => (
                  <FeedItem key={item.id} item={item} />
                ))
              ) : (
                <div className="py-8 text-center text-sm text-white/50">
                  No activity yet
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  variant?: "danger" | "warning";
}) {
  const bgColor =
    variant === "danger"
      ? "bg-red-500/10 border-red-500/20"
      : variant === "warning"
        ? "bg-amber-500/10 border-amber-500/20"
        : "bg-white/[0.03] border-white/10";

  const textColor =
    variant === "danger"
      ? "text-red-400"
      : variant === "warning"
        ? "text-amber-400"
        : "text-white";

  return (
    <div className={`rounded border p-2 ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/60">{label}</div>
        {icon && <div className="text-white/50">{icon}</div>}
      </div>
      <div className={`text-lg font-semibold ${textColor}`}>{value}</div>
    </div>
  );
}

/**
 * Top Section (Routes, Errors, Tags)
 */
function TopSection({ summary }: { summary: ActivitySummary }) {
  const hasTopData =
    summary.top.routes_24h.length > 0 ||
    summary.top.error_routes_24h.length > 0 ||
    summary.top.tags.length > 0;

  if (!hasTopData) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-white/70">Top Items (24h)</h3>

      {/* Top Routes */}
      {summary.top.routes_24h.length > 0 && (
        <div className="rounded border border-white/10 bg-white/[0.03] p-2">
          <div className="mb-1 text-xs font-medium text-white/70">Routes</div>
          <div className="space-y-1">
            {summary.top.routes_24h.map((item) => (
              <div
                key={item.route}
                className="flex items-center justify-between text-xs"
              >
                <span className="truncate text-white/80">{item.route}</span>
                <span className="ml-2 text-white/60">{item.page_views}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Error Routes */}
      {summary.top.error_routes_24h.length > 0 && (
        <div className="rounded border border-red-500/20 bg-red-500/10 p-2">
          <div className="mb-1 text-xs font-medium text-red-400">
            Error Routes
          </div>
          <div className="space-y-1">
            {summary.top.error_routes_24h.map((item) => (
              <div
                key={item.route}
                className="flex items-center justify-between text-xs"
              >
                <span className="truncate text-red-400/80">{item.route}</span>
                <span className="ml-2 text-red-400/60">{item.errors}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Tags */}
      {summary.top.tags.length > 0 && (
        <div className="rounded border border-white/10 bg-white/[0.03] p-2">
          <div className="mb-1 text-xs font-medium text-white/70">Tags</div>
          <div className="flex flex-wrap gap-1">
            {summary.top.tags.map((item) => (
              <span
                key={item.tag}
                className="rounded bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-xs text-blue-400"
              >
                {item.tag} ({item.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Tab Button Component
 */
function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-b-2 border-wolf-emerald text-wolf-emerald"
          : "text-white/60 hover:text-white/90"
      }`}
    >
      {children} {count > 0 && `(${count})`}
    </button>
  );
}

/**
 * Feed Item Component
 */
function FeedItem({ item }: { item: ActivityFeedItem }) {
  const timeAgo = getTimeAgo(new Date(item.at));

  if (item.type === "feedback") {
    const riskColor =
      item.risk_level === "trusted"
        ? "text-emerald-400"
        : item.risk_level === "unverified"
          ? "text-amber-400"
          : "text-red-400";

    const priorityColor =
      item.priority === "P0"
        ? "bg-red-500/20 text-red-400 border border-red-500/30"
        : item.priority === "P1"
          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          : item.priority === "P2"
            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            : "bg-white/5 text-white/60 border border-white/10";

    const statusColor =
      item.status === "new"
        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
        : item.status === "triaged"
          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
          : item.status === "done"
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : "bg-white/5 text-white/60 border border-white/10";

    return (
      <div className="rounded border border-white/10 bg-white/[0.03] p-2 text-xs">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3 text-white/50" />
            <span className="font-medium text-white">
              {item.handle || "Anonymous"}
            </span>
            {item.priority && (
              <span className={`rounded px-1 py-0.5 text-xs ${priorityColor}`}>
                {item.priority}
              </span>
            )}
            <span className={`rounded px-1 py-0.5 text-xs ${statusColor}`}>
              {item.status}
            </span>
          </div>
          <span className="text-white/50">{timeAgo}</span>
        </div>
        <p className="mb-1 text-white/70">{item.message_preview}</p>
        <div className="flex items-center gap-2 text-white/50">
          {item.route && <span className="truncate">{item.route}</span>}
          <span className={`ml-auto ${riskColor}`}>
            Trust: {item.trust_score}
          </span>
        </div>
      </div>
    );
  }

  if (item.type === "error") {
    return (
      <div className="rounded border border-red-500/20 bg-red-500/10 p-2 text-xs">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <span className="font-medium text-red-400">Error</span>
            {item.is_observed_surface && (
              <span className="rounded bg-red-500/20 border border-red-500/30 px-1 py-0.5 text-xs text-red-400">
                Observed
              </span>
            )}
          </div>
          <span className="text-red-400/70">{timeAgo}</span>
        </div>
        {item.message_preview && (
          <p className="mb-1 text-red-400/80">{item.message_preview}</p>
        )}
        <div className="flex items-center gap-2 text-red-400/70">
          {item.route && <span className="truncate">{item.route}</span>}
          {item.error_code && (
            <span className="ml-auto">Code: {item.error_code}</span>
          )}
        </div>
      </div>
    );
  }

  if (item.type === "lab_mode") {
    return (
      <div className="rounded border border-blue-500/20 bg-blue-500/10 p-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3 text-blue-400" />
            <span className="font-medium text-blue-400">
              Lab Mode {item.action}
            </span>
            <span className="text-blue-400/70">({item.actor})</span>
          </div>
          <span className="text-blue-400/70">{timeAgo}</span>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Get human-readable time ago string
 */
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
