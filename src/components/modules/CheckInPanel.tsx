import Image from "next/image";
import { useTranslations } from "next-intl";
import StatusPill from "@/components/ui/StatusPill";

interface CheckInPanelProps {
  qrUrl: string;
  status: "unverified" | "pending" | "verified" | "error";
}

export function CheckInPanel({ qrUrl, status }: CheckInPanelProps) {
  const t = useTranslations("CheckInPanel");
  const steps = t.raw("howItWorks.steps") as string[];

  return (
    <div className="grid gap-6 text-wolf-foreground lg:grid-cols-[360px_1fr]">
      <div className="wolf-card relative overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-x-6 top-4 h-28 rounded-[1.75rem] bg-[radial-gradient(circle_at_top,#baff5c_0%,rgba(12,16,24,0)_70%)] opacity-80" />
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-[0.08em] uppercase text-white/90">
              {t("title")}
            </h3>
            <span className="wolf-pill bg-wolf-emerald-soft text-xs uppercase tracking-[0.3em] text-wolf-emerald">
              HOWL Sync
            </span>
          </div>
          <Image
            src={qrUrl}
            alt={t("qrAlt")}
            width={256}
            height={256}
            className="mt-6 h-60 w-60 self-center rounded-[1.75rem] border border-wolf-border bg-wolf-charcoal-85 object-cover object-center p-4 shadow-[0_35px_90px_-60px_rgba(0,0,0,0.75)]"
          />
          <div className="mt-5">
            <StatusPill status={status} />
          </div>
          <button
            type="button"
            className="den-button-primary mt-5 px-6 py-3 text-sm tracking-[0.22em]"
          >
            {t("cta")}
          </button>
        </div>
      </div>
      <div className="wolf-card--muted px-8 py-7 text-wolf-foreground">
        <p className="text-sm uppercase tracking-[0.32em] text-wolf-text-subtle">
          {t("howItWorks.title")}
        </p>
        <ol className="mt-4 space-y-3 text-sm text-wolf-foreground/80">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-5 text-xs text-wolf-text-subtle">{t("footnote")}</p>
      </div>
    </div>
  );
}

export default CheckInPanel;
