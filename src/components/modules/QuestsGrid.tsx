import { Target } from "lucide-react";
import { useTranslations } from "next-intl";

type QuestStatus = "available" | "submitted" | "locked";

interface Quest {
  id: string;
  title: string;
  points: number;
  status: QuestStatus;
}

function questTone(status: QuestStatus) {
  if (status === "submitted") {
    return "wolf-card bg-[radial-gradient(circle_at_top_left,rgba(137,226,74,0.18),rgba(17,22,31,0.92))] border border-wolf-border-xstrong text-white/90";
  }
  if (status === "locked") {
    return "wolf-card--muted border border-wolf-border-faint text-wolf-text-subtle";
  }
  return "wolf-card border border-wolf-border-strong text-white";
}

export function QuestsGrid() {
  const t = useTranslations("QuestsGrid");
  const quests = t.raw("items") as Quest[];

  return (
    <div className="grid gap-5 text-wolf-foreground md:grid-cols-2 xl:grid-cols-4">
      {quests.map((quest) => (
        <div
          key={quest.id}
          className={`flex h-full flex-col justify-between rounded-[1.5rem] p-5 transition hover:-translate-y-1 hover:shadow-[0_25px_80px_-55px_rgba(34,40,46,0.45)] ${questTone(
            quest.status,
          )}`}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-wolf-emerald-mid text-wolf-emerald">
              <Target className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-wolf-text-subtle">
                {t("tag")}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white/90">
                {quest.title}
              </h3>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="wolf-pill border border-wolf-border-mid bg-wolf-emerald-soft text-xs uppercase tracking-[0.25em] text-wolf-emerald">
              {t("points", { count: quest.points })}
            </span>
            <button
              type="button"
              className={`rounded-[0.625rem] px-4 py-2 text-sm font-medium uppercase tracking-[0.2em] transition ${
                quest.status === "locked"
                  ? "cursor-not-allowed bg-wolf-emerald-faint text-wolf-text-subtle"
                  : quest.status === "submitted"
                    ? "bg-wolf-emerald-tint text-wolf-emerald"
                    : "bg-[linear-gradient(180deg,#c8ff64_0%,#8bea4e_55%,#3b572a_100%)] text-[#0b1407] shadow-[0_0_24px_rgba(186,255,92,0.45)] hover:shadow-[0_0_30px_rgba(186,255,92,0.55)]"
              }`}
              disabled={quest.status !== "available"}
            >
              {t(`actions.${quest.status}`)}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default QuestsGrid;
