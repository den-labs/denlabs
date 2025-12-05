import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { requireProfile } from "@/lib/accessGuards";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireProfile({ locale, nextPath: "/settings" });
  const t = useTranslations("SettingsPage");
  const privacyItems = t.raw("privacy.items") as Array<{
    label: string;
    status: string;
    tone: "cyan" | "violet" | "neutral";
  }>;

  const toneClass: Record<(typeof privacyItems)[number]["tone"], string> = {
    cyan: "border border-wolf-border-xstrong bg-wolf-emerald-tint text-wolf-emerald",
    violet:
      "border border-wolf-violet-border bg-wolf-violet-soft text-wolf-violet-accent",
    neutral:
      "border border-wolf-neutral-border bg-wolf-neutral-soft text-white/70",
  };

  return (
    <div className="space-y-6 text-wolf-foreground">
      <section className="wolf-card--muted rounded-lg border border-wolf-border p-6">
        <h3 className="text-lg font-semibold text-white">
          {t("appearance.title")}
        </h3>
        <p className="mt-2 text-sm text-white/70">
          {t("appearance.description")}
        </p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
        <br />
        <h3 className="text-lg font-semibold text-white">
          {t("language.title")}
        </h3>
        <p className="mt-2 text-sm text-white/70">
          {t("language.description")}
        </p>
        <LanguageSwitcher className="mt-3" />
        <br />
        <h3 className="text-lg font-semibold text-white">
          {t("privacy.title")}
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-white/75">
          {privacyItems.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between rounded-lg bg-wolf-charcoal-60 px-4 py-3"
            >
              <span>{item.label}</span>
              <span
                className={`rounded-lg px-3 py-1 text-xs ${toneClass[item.tone]}`}
              >
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
