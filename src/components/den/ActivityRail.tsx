import { useTranslations } from "next-intl";
import { MiniChat } from "@/components/ui/MiniChat";
import { NotificationItem } from "@/components/ui/NotificationItem";

export function ActivityRail() {
  const t = useTranslations("ActivityRail");
  const feedItems = t.raw("feed") as Array<{
    title: string;
    description: string;
    timestamp: string;
    accent: "cyan" | "violet" | "neutral";
  }>;
  const recentItems = t.raw("recent") as Array<{
    title: string;
    timestamp: string;
  }>;

  return (
    <div className="flex h-full flex-col gap-4 text-wolf-foreground">
      <section className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">
            {t("sections.activity.title")}
          </p>
          <span className="text-[11px] uppercase tracking-[0.3em] text-wolf-text-subtle">
            {t("sections.activity.label")}
          </span>
        </div>
        <div className="space-y-3">
          {feedItems.map((item) => (
            <NotificationItem key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">
            {t("sections.recent.title")}
          </p>
          <span className="text-[11px] uppercase tracking-[0.3em] text-wolf-text-subtle">
            {t("sections.recent.label")}
          </span>
        </div>
        <ul className="space-y-2 text-sm text-white/75">
          {recentItems.map((item) => (
            <li
              key={item.title}
              className="flex items-center justify-between rounded-lg border border-wolf-border-faint bg-wolf-charcoal-60 px-4 py-3"
            >
              <span>{item.title}</span>
              <span className="text-xs text-wolf-text-subtle">
                {item.timestamp}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="p-5">
        <MiniChat />
      </div>
    </div>
  );
}

export default ActivityRail;
