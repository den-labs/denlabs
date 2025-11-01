import { Check, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

type DemoStatus = "open" | "locked";

export function VotingList() {
  const t = useTranslations("VotingList");
  const demos = t.raw("demos") as Array<{
    id: string;
    name: string;
    team: string;
    status: DemoStatus;
  }>;

  return (
    <div className="space-y-6 text-wolf-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold uppercase tracking-[0.2em] text-white/90">
          {t("title")}
        </h3>
        <span className="wolf-pill bg-wolf-emerald-soft text-xs uppercase tracking-[0.26em] text-wolf-emerald">
          Demo Day
        </span>
      </div>
      <div className="space-y-3">
        {demos.map((demo) => {
          const Icon = demo.status === "open" ? Check : Lock;
          return (
            <div
              key={demo.id}
              className="wolf-card flex flex-wrap items-center justify-between gap-4 rounded-[1.9rem] border border-wolf-border-strong px-5 py-4"
            >
              <div>
                <p className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-wolf-text-subtle">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-wolf-emerald-tint text-wolf-emerald">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  {demo.team}
                </p>
                <p className="mt-2 text-lg font-semibold text-white/90">
                  {demo.name}
                </p>
              </div>
              <button
                type="button"
                className={`rounded-xl px-4 py-2 text-sm font-medium transition
                  ${
                    demo.status === "open"
                      ? "rounded-full bg-[linear-gradient(180deg,#c8ff64_0%,#8bea4e_55%,#3b572a_100%)] text-[#0b1407] shadow-[0_0_24px_rgba(186,255,92,0.45)] hover:shadow-[0_0_30px_rgba(186,255,92,0.55)]"
                      : "rounded-full bg-wolf-emerald-soft text-wolf-text-subtle"
                  }
                `}
                disabled={demo.status !== "open"}
              >
                {t(`actions.${demo.status}`)}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-wolf-text-subtle">{t("footnote")}</p>
    </div>
  );
}

export default VotingList;
