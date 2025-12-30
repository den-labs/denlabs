"use client";

import { ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { useDenUser } from "@/hooks/useDenUser";
import { Link } from "@/i18n/routing";

type VerificationBannerProps = {
  context: "spray" | "gooddollar" | "general";
  className?: string;
};

const CONTEXT_MESSAGES = {
  spray: {
    title: "Increase your spray limits",
    description:
      "Verify your identity with Self.xyz to unlock higher spray amounts and priority processing.",
  },
  gooddollar: {
    title: "Boost your claim eligibility",
    description:
      "Verify your identity to access higher GoodDollar claim limits and additional rewards.",
  },
  general: {
    title: "Verify your identity",
    description:
      "Complete verification with Self.xyz to unlock all features and increase your trust score.",
  },
};

export function VerificationBanner({
  context = "general",
  className = "",
}: VerificationBannerProps) {
  const user = useDenUser();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if user is already verified or banner was dismissed
  if (user.selfVerified || dismissed) {
    return null;
  }

  const message = CONTEXT_MESSAGES[context];

  return (
    <div
      className={`relative rounded-xl border border-[#89e24a]/30 bg-gradient-to-r from-[#89e24a]/10 to-[#56f0d5]/10 p-4 ${className}`}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 rounded-lg p-1 text-white/40 transition hover:bg-black/20 hover:text-white/70"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#89e24a]/20">
          <ShieldCheck className="h-5 w-5 text-[#89e24a]" />
        </div>

        <div className="flex-1 pr-6">
          <h4 className="font-semibold text-white">{message.title}</h4>
          <p className="mt-1 text-sm text-white/70">{message.description}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/verification"
              className="inline-flex items-center gap-2 rounded-lg border border-[#89e24a] bg-[#89e24a] px-4 py-2 text-sm font-semibold text-[#09140a] transition hover:bg-[#7acc3f]"
            >
              <ShieldCheck className="h-4 w-4" />
              Verify now
            </Link>

            <Link
              href="/verification"
              className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Learn more →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationBanner;
