import { useTranslations } from "next-intl";

export function LeaderboardSkeleton() {
  const skeletonItems = Array.from({ length: 5 }, (_, i) => ({
    id: `skeleton-entry-${i}`,
  }));

  return (
    <div className="space-y-3 animate-pulse">
      {skeletonItems.map((item) => (
        <div
          key={item.id}
          className="wolf-card--muted flex items-center justify-between rounded-lg border border-wolf-border-mid px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-white/10" />
            <div className="h-4 w-32 rounded bg-white/10" />
          </div>
          <div className="h-4 w-20 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardList() {
  const t = useTranslations("LeaderboardList");
  const leaderboard = t.raw("entries") as Array<{
    position: number;
    team: string;
    points: number;
  }>;

  return (
    <div className="text-wolf-foreground">
      <div className="space-y-3">
        {leaderboard.map((entry) => (
          <div
            key={entry.team}
            className="wolf-card--muted flex items-center justify-between rounded-lg border border-wolf-border-mid px-5 py-4"
          >
            <div className="flex items-center gap-3 text-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-wolf-emerald-tint text-wolf-emerald">
                #{entry.position}
              </span>
              <p className="font-medium text-white/85">{entry.team}</p>
            </div>
            <span className="text-sm text-wolf-text-subtle">
              {t("points", { count: entry.points })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LeaderboardList;
