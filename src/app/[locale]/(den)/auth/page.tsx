import { useTranslations } from "next-intl";
import SelfAuth from "@/components/SelfAuth";
import { requireWallet } from "@/lib/accessGuards";

export default async function AuthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  requireWallet({ locale, nextPath: "/auth" });
  const t = useTranslations("AuthPage");
  const tips = t.raw("tips") as string[];

  return (
    <div className="space-y-8 text-wolf-foreground">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
        <SelfAuth />
        <div className="wolf-card--muted px-6 py-6 text-sm text-white/75">
          <p className="text-xs uppercase tracking-[0.32em] text-wolf-text-subtle">
            {t("tipsTitle")}
          </p>
          <ul className="mt-3 space-y-2">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
