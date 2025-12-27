import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TrustScore } from "@/lib/eventLabs";

interface TrustIndicatorProps {
  trustScore: TrustScore;
  showDetails?: boolean;
}

export function TrustIndicator({
  trustScore,
  showDetails = true,
}: TrustIndicatorProps) {
  const { score, flags, risk_level } = trustScore;

  // Determine badge style based on risk level
  const getBadgeConfig = () => {
    switch (risk_level) {
      case "trusted":
        return {
          label: "Trusted",
          icon: ShieldCheck,
          className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "unverified":
        return {
          label: "Unverified",
          icon: Shield,
          className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        };
      case "risk":
        return {
          label: "Risk",
          icon: ShieldAlert,
          className: "bg-red-500/10 text-red-400 border-red-500/20",
        };
      default:
        return {
          label: "Unknown",
          icon: Shield,
          className: "bg-white/5 text-white/60 border-white/10",
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const badge = (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{config.label}</span>
      {showDetails && <span className="opacity-70">({score})</span>}
    </div>
  );

  if (!showDetails) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2 text-sm">
            <div className="font-semibold">Trust Score: {score}/100</div>
            <div className="space-y-1 text-xs text-white/70">
              {flags.has_self_verification && (
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span>Self-verified identity</span>
                </div>
              )}
              {flags.has_wallet && (
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span>Wallet connected</span>
                </div>
              )}
              {!flags.has_self_verification && !flags.has_wallet && (
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-400">○</span>
                  <span>Anonymous submission</span>
                </div>
              )}
              {flags.is_rate_limited && (
                <div className="flex items-center gap-1.5">
                  <span className="text-red-400">!</span>
                  <span>
                    Rate limited ({flags.session_feedback_count} submissions)
                  </span>
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
