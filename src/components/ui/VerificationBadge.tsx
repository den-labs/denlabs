import clsx from "clsx";
import { ShieldCheck } from "lucide-react";

interface VerificationBadgeProps {
  className?: string;
}

export function VerificationBadge({ className }: VerificationBadgeProps) {
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2 rounded-[10px] border border-[#2a2f36] bg-[rgba(20,24,29,0.72)] px-3.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#e9eef2]",
        className,
      )}
    >
      <ShieldCheck size={14} strokeWidth={2} />
      <span className="whitespace-nowrap">Powered by Self.xyz</span>
    </div>
  );
}

export default VerificationBadge;
