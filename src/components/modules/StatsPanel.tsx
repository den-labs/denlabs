import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";

function StatsPanelEmpty() {
  const t = useTranslations("StatsPanel");

  return (
    <div className="space-y-5 text-wolf-foreground">
      <div className="wolf-card rounded-lg border border-wolf-border-strong p-6">
        <div className="wolf-card--muted flex flex-col items-center justify-center rounded-lg border border-wolf-border-mid px-6 py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-wolf-emerald-tint">
            <BarChart3 className="h-8 w-8 text-wolf-emerald" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-white/85">
            {t("empty.title")}
          </h3>
          <p className="mb-4 max-w-sm text-sm text-wolf-text-subtle">
            {t("empty.description")}
          </p>
          <p className="text-sm font-medium text-wolf-emerald">
            {t("empty.cta")}
          </p>
        </div>
      </div>
    </div>
  );
}

export function StatsPanelSkeleton() {
  const skeletonItems = Array.from({ length: 3 }, (_, i) => ({
    id: `skeleton-stat-${i}`,
  }));

  return (
    <div className="space-y-5 text-wolf-foreground">
      <div className="wolf-card rounded-lg border border-wolf-border-strong p-6">
        <div className="animate-pulse space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="h-6 w-32 rounded bg-white/10" />
            <div className="h-5 w-20 rounded-full bg-white/10" />
          </div>
          <div className="h-4 w-full max-w-md rounded bg-white/10" />

          {/* Stats Grid Skeleton */}
          <div className="grid gap-4 sm:grid-cols-3">
            {skeletonItems.map((item) => (
              <div
                key={item.id}
                className="wolf-card--muted rounded-lg border border-wolf-border p-4 text-center shadow-[0_25px_70px_-60px_rgba(0,0,0,0.55)]"
              >
                <div className="h-3 w-16 rounded bg-white/10 mx-auto" />
                <div className="mt-2 h-8 w-20 rounded bg-white/10 mx-auto" />
                <div className="mt-2 h-3 w-24 rounded bg-white/10 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatsPanel() {
  const t = useTranslations("StatsPanel");
  const stats = t.raw("metrics.items") as Array<{
    label: string;
    value: string;
    helper: string;
  }>;

  if (stats.length === 0) {
    return <StatsPanelEmpty />;
  }

  return (
    <div className="space-y-5 text-wolf-foreground">
      <div className="wolf-card rounded-lg border border-wolf-border-strong p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold uppercase text-white/90">
            {t("metrics.title")}
          </h3>
          <span className="wolf-pill bg-wolf-emerald-soft text-xs uppercase text-wolf-emerald">
            HOWL Pulse
          </span>
        </div>
        <p className="mt-2 text-sm text-wolf-text-subtle">
          {t("metrics.description")}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.label}
              className="wolf-card--muted rounded-lg border border-wolf-border p-4 text-center shadow-[0_25px_70px_-60px_rgba(0,0,0,0.55)]"
            >
              <p className="text-xs uppercase text-wolf-text-subtle">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-white/90">
                {item.value}
              </p>
              <p className="text-xs text-wolf-text-subtle">{item.helper}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;
