type StickyFooterProps = {
  recipientCount: number;
  totalLabel: string;
  allowanceLabel: string;
  feeLabel?: string;
  ctaLabel: string;
  ctaDisabled: boolean;
  ctaReason?: string | null;
  onPrimaryAction: () => void;
  isLoading?: boolean;
};

export function StickyFooter({
  recipientCount,
  totalLabel,
  allowanceLabel,
  feeLabel,
  ctaLabel,
  ctaDisabled,
  ctaReason,
  onPrimaryAction,
  isLoading,
}: StickyFooterProps) {
  return (
    <div className="border-t border-wolf-border bg-[#0a0f17]/95 px-4 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/70">
        <div className="flex flex-wrap items-center gap-4">
          <span>{`Wallets: ${recipientCount}`}</span>
          <span>{totalLabel}</span>
          {feeLabel ? <span>{feeLabel}</span> : null}
          <span>{allowanceLabel}</span>
        </div>
        <button
          type="button"
          onClick={onPrimaryAction}
          disabled={ctaDisabled}
          className="inline-flex items-center gap-2 rounded-xl border border-[#4ca22a] bg-[#89e24a] px-5 py-2 text-[0.75rem] font-semibold uppercase text-[#09140a] shadow-[0_0_20px_rgba(186,255,92,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(186,255,92,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#baff5c] disabled:translate-y-0 disabled:border-wolf-border disabled:bg-wolf-border disabled:text-white/40 disabled:shadow-none"
        >
          {isLoading ? (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
              />
            </svg>
          ) : null}
          <span>{ctaLabel}</span>
        </button>
      </div>
      {ctaDisabled && ctaReason ? (
        <p className="mt-2 text-[11px] uppercase text-rose-300">{ctaReason}</p>
      ) : null}
    </div>
  );
}
