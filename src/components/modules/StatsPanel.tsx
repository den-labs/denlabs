import { useTranslations } from "next-intl";

export function StatsPanel() {
  const t = useTranslations("StatsPanel");
  const stats = t.raw("metrics.items") as Array<{
    label: string;
    value: string;
    helper: string;
  }>;

  return (
    <div className="space-y-5 text-wolf-foreground">
      <div className="wolf-card rounded-[1.9rem] border border-wolf-border-strong p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold uppercase tracking-[0.2em] text-white/90">
            {t("metrics.title")}
          </h3>
          <span className="wolf-pill bg-wolf-emerald-soft text-xs uppercase tracking-[0.3em] text-wolf-emerald">
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
              className="wolf-card--muted rounded-[1.6rem] border border-wolf-border p-4 text-center shadow-[0_25px_70px_-60px_rgba(0,0,0,0.55)]"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-wolf-text-subtle">
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
