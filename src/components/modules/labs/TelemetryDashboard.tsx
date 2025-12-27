"use client";

import {
  AlertTriangle,
  BarChart3,
  Loader2,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { TelemetryData } from "@/lib/eventLabs";
import { getTelemetry } from "@/lib/eventLabsClient";

interface TelemetryDashboardProps {
  labSlug: string;
}

export function TelemetryDashboard({ labSlug }: TelemetryDashboardProps) {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTelemetry() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getTelemetry(labSlug);
        setTelemetry(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch telemetry");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTelemetry();
  }, [labSlug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-wolf-emerald" />
      </div>
    );
  }

  if (error || !telemetry) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error || "No telemetry data available"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Telemetry</h2>
        <p className="text-sm text-white/60">Real-time metrics</p>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Participation Card */}
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Participation</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-white/70">Total Sessions</span>
              <span className="text-2xl font-semibold text-white">
                {telemetry.participation.sessions_total}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-white/70">Last 24h</span>
              <span className="text-lg font-medium text-emerald-400">
                {telemetry.participation.sessions_last_24h}
              </span>
            </div>
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-white/70">Total Feedback</span>
                <span className="text-lg font-medium text-white">
                  {telemetry.participation.feedback_total}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xs text-white/50">Avg per session</span>
                <span className="text-sm font-medium text-white/80">
                  {telemetry.participation.feedback_per_session_avg.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quality & Trust Card */}
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Quality & Trust</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <span className="text-sm text-white/70">Trust Distribution</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-emerald-500/10 px-2 py-1.5 text-center">
                  <div className="text-lg font-semibold text-emerald-400">
                    {telemetry.quality.trust_distribution.trusted}
                  </div>
                  <div className="text-xs text-emerald-400/70">Trusted</div>
                </div>
                <div className="rounded-md bg-yellow-500/10 px-2 py-1.5 text-center">
                  <div className="text-lg font-semibold text-yellow-400">
                    {telemetry.quality.trust_distribution.unverified}
                  </div>
                  <div className="text-xs text-yellow-400/70">Unverified</div>
                </div>
                <div className="rounded-md bg-red-500/10 px-2 py-1.5 text-center">
                  <div className="text-lg font-semibold text-red-400">
                    {telemetry.quality.trust_distribution.risk}
                  </div>
                  <div className="text-xs text-red-400/70">Risk</div>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-white/70">Self-Verified</span>
                <span className="text-lg font-medium text-blue-400">
                  {telemetry.quality.self_verified_percent}%
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-sm text-white/70">Spam Rate</span>
                <span className="text-lg font-medium text-red-400">
                  {telemetry.quality.spam_rate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Funnels & Drop-offs Card */}
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Funnels</h3>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-white/70 mb-2 block">Top Routes</span>
              <div className="space-y-1.5">
                {telemetry.funnels.top_routes.slice(0, 3).map((route) => (
                  <div
                    key={route.route}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate text-white/80 font-mono text-xs">
                      {route.route}
                    </span>
                    <span className="text-white/60 ml-2">
                      {route.page_views}
                    </span>
                  </div>
                ))}
                {telemetry.funnels.top_routes.length === 0 && (
                  <p className="text-xs text-white/50">No page views yet</p>
                )}
              </div>
            </div>
            {telemetry.funnels.top_errors.length > 0 && (
              <div className="border-t border-white/10 pt-3">
                <span className="text-sm text-white/70 mb-2 block">
                  Top Errors
                </span>
                <div className="space-y-1.5">
                  {telemetry.funnels.top_errors.slice(0, 2).map((error) => (
                    <div
                      key={error.route}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate text-red-400/80 font-mono text-xs">
                        {error.route}
                      </span>
                      <span className="text-red-400/60 ml-2">
                        {error.error_count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t border-white/10 pt-3">
              <span className="text-sm text-white/70 mb-2 block">
                Surface Coverage
              </span>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-1 rounded bg-purple-500/20 px-2 py-1 text-center">
                  <div className="text-white/80">
                    {telemetry.funnels.surface_breakdown.observed}
                  </div>
                  <div className="text-xs text-white/50">Observed</div>
                </div>
                <div className="flex-1 rounded bg-white/10 px-2 py-1 text-center">
                  <div className="text-white/80">
                    {telemetry.funnels.surface_breakdown.other}
                  </div>
                  <div className="text-xs text-white/50">Other</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ops & Triage Card */}
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10">
              <BarChart3 className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Ops & Triage</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md bg-red-500/10 px-2 py-1.5 text-center">
                <div className="text-lg font-semibold text-red-400">
                  {telemetry.ops.p0_count}
                </div>
                <div className="text-xs text-red-400/70">P0</div>
              </div>
              <div className="rounded-md bg-orange-500/10 px-2 py-1.5 text-center">
                <div className="text-lg font-semibold text-orange-400">
                  {telemetry.ops.p1_count}
                </div>
                <div className="text-xs text-orange-400/70">P1</div>
              </div>
              <div className="rounded-md bg-white/10 px-2 py-1.5 text-center">
                <div className="text-lg font-semibold text-white">
                  {telemetry.ops.open_count}
                </div>
                <div className="text-xs text-white/60">Open</div>
              </div>
            </div>
            {telemetry.ops.top_tags.length > 0 && (
              <div className="border-t border-white/10 pt-3">
                <span className="text-sm text-white/70 mb-2 block">
                  Top Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {telemetry.ops.top_tags.map((tag) => (
                    <span
                      key={tag.tag}
                      className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-white/70"
                    >
                      {tag.tag}
                      <span className="text-white/50">({tag.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {telemetry.ops.open_count > 0 && (
              <div className="flex items-center gap-2 rounded-md border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <span className="text-orange-400/90">
                  {telemetry.ops.open_count} items need triage
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
