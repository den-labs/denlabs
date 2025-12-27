"use client";

import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  FlaskConical,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { FeedbackList } from "@/components/modules/labs/FeedbackList";
import { LabModeControl } from "@/components/modules/labs/LabModeControl";
import { TelemetryDashboard } from "@/components/modules/labs/TelemetryDashboard";
import { Button } from "@/components/ui/button";
import type { EventLab } from "@/lib/eventLabs";
import { getEventLab } from "@/lib/eventLabsClient";

export default function LabDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [lab, setLab] = useState<EventLab | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleCopyLink = () => {
    const publicUrl = `${window.location.origin}/lab/${slug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-wolf-emerald border-t-transparent" />
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error || "Lab not found"}
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

  const getStatusBadge = () => {
    const configs = {
      active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      paused: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      completed: "bg-white/10 text-white/60 border-white/20",
    };

    return (
      <div
        className={`rounded-full border px-3 py-1 text-sm font-medium ${configs[lab.status]}`}
      >
        {lab.status.charAt(0).toUpperCase() + lab.status.slice(1)}
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/labs"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          ← Back to Labs
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <FlaskConical
                  className="h-6 w-6 text-wolf-emerald"
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
              {getStatusBadge()}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <span>{formatDate(lab.start_date)}</span>
              {lab.end_date && (
                <>
                  <span>→</span>
                  <span>{formatDate(lab.end_date)}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/labs/${slug}/retro`}>
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <FileText className="mr-2 h-4 w-4" />
                View Retro Pack
              </Button>
            </Link>
            <Button variant="ghost" disabled>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Public Link */}
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              Public Participation Link
            </p>
            <p className="mt-1 text-xs text-white/60">
              Share this link with participants to collect feedback
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="rounded bg-white/5 px-3 py-2 text-sm text-white/80">
              {window.location.origin}/lab/{slug}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            <Link href={`/lab/${slug}`} target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Lab Mode Control */}
      <LabModeControl labSlug={slug} surfaces={lab.surfaces_to_observe} />

      {/* Surfaces */}
      {lab.surfaces_to_observe && lab.surfaces_to_observe.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white">Surfaces to Observe</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {lab.surfaces_to_observe.map((surface, index) => (
              <span
                key={index}
                className="rounded-md bg-white/5 px-2.5 py-1 text-sm text-white/70"
              >
                {surface}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Telemetry Dashboard */}
      <TelemetryDashboard labSlug={slug} />

      {/* Feedback List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Feedback</h2>
        <FeedbackList labSlug={slug} isCreator={true} />
      </div>
    </div>
  );
}
