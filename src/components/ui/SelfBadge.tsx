"use client";

import {
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface SelfBadgeProps {
  status?: "unverified" | "pending" | "verified" | "error";
  className?: string;
}

const statusTone: Record<Required<SelfBadgeProps>["status"], string> = {
  unverified: "border border-[#2a2f36] bg-transparent text-wolf-text-subtle",
  pending: "border border-[#2a2f36] bg-[rgba(20,24,29,0.72)] text-[#e9eef2]",
  verified: "border border-[#2fe68b] bg-[#2fe68b] text-[#04140c]",
  error:
    "border border-wolf-error-border bg-wolf-error-soft text-[#ffb1b1] shadow-[0_0_20px_rgba(255,122,122,0.32)] backdrop-blur-sm",
};

const statusIcon: Record<
  Required<SelfBadgeProps>["status"],
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  unverified: ShieldQuestion,
  pending: Loader2,
  verified: ShieldCheck,
  error: ShieldAlert,
};

export function SelfBadge({
  status = "unverified",
  className = "",
}: SelfBadgeProps) {
  const t = useTranslations("SelfBadge");
  const Icon = statusIcon[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-[10px] px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] transition ${statusTone[status]} ${className}`.trim()}
    >
      <Icon
        className={`h-4 w-4 ${status === "pending" ? "animate-spin" : ""}`}
        aria-hidden
      />
      {t(`statuses.${status}`)}
    </span>
  );
}

export default SelfBadge;
