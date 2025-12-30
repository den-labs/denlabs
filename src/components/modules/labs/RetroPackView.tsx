"use client";

import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";
import { PaymentConfirmModal } from "@/components/modules/x402/PaymentConfirmModal";
import { Button } from "@/components/ui/button";
import { TrustIndicator } from "@/components/ui/TrustIndicator";
import { useX402Fetch } from "@/hooks/useX402Fetch";
import type { RetroPack } from "@/lib/retroPack";
import { PRICING } from "@/lib/x402";

interface RetroPackViewProps {
  labSlug: string;
  retro: RetroPack;
}

type PendingAction = "download" | "copy" | null;

export function RetroPackView({ labSlug, retro }: RetroPackViewProps) {
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const { fetchWithPayment, isProcessing, error, clearError } = useX402Fetch();

  const handleOpenModal = (action: PendingAction) => {
    clearError();
    setPendingAction(action);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPendingAction(null);
  };

  const handleConfirmPayment = async () => {
    const response = await fetchWithPayment(
      `/api/labs/${labSlug}/retro?format=markdown`,
    );

    if (!response) {
      return;
    }

    // Check if payment was successful (not a 402 response)
    if (!response.ok) {
      if (response.status === 402) {
        try {
          const errorData = await response.json();
          console.error("[x402] Payment not completed:", errorData);
        } catch {
          // Ignore JSON parse errors
        }
      }
      return;
    }

    try {
      const markdown = await response.text();

      if (pendingAction === "download") {
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `retro-${labSlug}-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (pendingAction === "copy") {
        await navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }

      handleCloseModal();
    } catch (err) {
      console.error("Failed to process metrics", err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P0":
        return "text-red-400";
      case "P1":
        return "text-orange-400";
      case "P2":
        return "text-yellow-400";
      default:
        return "text-white/60";
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-300">
                Payment Error
              </p>
              <p className="mt-1 text-sm text-red-200">{error}</p>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-red-400 hover:text-red-300"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header with Export */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-white">
            Retro Pack: {retro.lab.name}
          </h2>
          {retro.lab.objective && (
            <p className="text-sm text-white/70">{retro.lab.objective}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenModal("copy")}
            disabled={isProcessing}
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
          <Button
            onClick={() => handleOpenModal("download")}
            disabled={isProcessing}
            className="bg-wolf-emerald text-black hover:bg-wolf-emerald/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Metrics
          </Button>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      <PaymentConfirmModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPayment}
        isProcessing={isProcessing}
        price={PRICING.RETRO_MARKDOWN}
        description="Export Retro Pack Metrics"
      />

      {/* Summary Stats */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-sm text-white/60">Total Feedback</p>
            <p className="text-2xl font-semibold text-white">
              {retro.summary.total_feedback}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-white/60">By Status</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(retro.summary.by_status).map(
                ([status, count]) => (
                  <span key={status} className="text-white/80">
                    {status}: {count}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-white/60">By Priority</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(retro.summary.by_priority).map(
                ([priority, count]) => (
                  <span key={priority} className={getPriorityColor(priority)}>
                    {priority}: {count}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-white/60">Trust Distribution</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-emerald-400">
                Trusted: {retro.summary.trust_distribution.trusted}
              </span>
              <span className="text-yellow-400">
                Unverified: {retro.summary.trust_distribution.unverified}
              </span>
              <span className="text-red-400">
                Risk: {retro.summary.trust_distribution.risk}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Issues */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
          Top Issues by Priority
        </h3>

        {["p0", "p1", "p2"].map((priority) => {
          const issues =
            retro.top_issues[priority as keyof typeof retro.top_issues];
          if (!issues || issues.length === 0) return null;

          return (
            <div
              key={priority}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
            >
              <h4
                className={`mb-3 text-sm font-semibold uppercase ${getPriorityColor(priority.toUpperCase())}`}
              >
                {priority.toUpperCase()} Issues ({issues.length})
              </h4>
              <div className="space-y-3">
                {issues.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-white/90">{item.message}</p>
                      <TrustIndicator
                        trustScore={{
                          score: item.trust_score,
                          flags: item.trust_flags as any,
                          risk_level:
                            item.trust_score >= 80
                              ? "trusted"
                              : item.trust_score >= 40
                                ? "unverified"
                                : "risk",
                        }}
                        showDetails={false}
                      />
                    </div>
                    {item.route && (
                      <p className="mt-2 text-xs text-white/50">
                        Route: {item.route}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drop-off Points */}
      {retro.dropoff_points && retro.dropoff_points.length > 0 && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <TrendingDown
              className="h-5 w-5 text-yellow-400"
              aria-hidden="true"
            />
            Drop-off Points
          </h3>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="space-y-2">
              {retro.dropoff_points.map((point, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md bg-white/[0.02] px-3 py-2"
                >
                  <span className="text-sm text-white/80">{point.route}</span>
                  <span className="text-sm font-medium text-yellow-400">
                    {point.error_count} errors
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {retro.recommendations && retro.recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Actionable Recommendations
          </h3>
          <div className="rounded-lg border border-wolf-emerald/20 bg-wolf-emerald/5 p-4">
            <ul className="space-y-2">
              {retro.recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-white/90"
                >
                  <span className="text-wolf-emerald">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
