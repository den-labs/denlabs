import { useTranslations } from "next-intl";
import { requireProfile } from "@/lib/accessGuards";

export default async function LabPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await requireProfile({ locale, nextPath: "/lab" });
  const t = useTranslations("LabPage");

  return (
    <div className="space-y-6 text-wolf-foreground">
      <section className="rounded-2xl border border-wolf-border bg-[#151b24]/80 px-6 py-8 shadow-[0_35px_105px_-75px_rgba(0,0,0,0.75)]">
        <p className="text-xs uppercase tracking-[0.32em] text-white/60">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {t("title", { name: profile.name })}
        </h1>
        <p className="mt-3 text-base text-white/70">{t("subtitle")}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/80">
          <span className="text-xs uppercase tracking-[0.32em] text-white/50">
            {t("next.label")}
          </span>
          <span className="font-semibold text-white">{t("next.value")}</span>
        </div>
      </section>
    </div>
  );
}
