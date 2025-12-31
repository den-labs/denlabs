"use client";

import { ArrowRight, FlaskConical, LayoutDashboard, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { fetchUserSession } from "@/lib/userClient";

export default function DemoHubPage() {
  const t = useTranslations("DemoHub");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetchUserSession()
      .then((session) => {
        if (session?.hasProfile) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Demo Mode Badge */}
      <div className="mb-8 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#baff5c]/30 bg-[#baff5c]/10 px-4 py-1.5 text-sm font-semibold text-[#baff5c]">
          <FlaskConical className="h-4 w-4" />
          {t("badge")}
        </span>
      </div>

      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mx-auto max-w-xl text-base text-white/70">
          {t("subtitle")}
        </p>
      </div>

      {/* What you'll do */}
      <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
          {t("steps.label")}
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#baff5c]/20 text-xs font-bold text-[#baff5c]">
              1
            </span>
            <p className="text-sm text-white/80">{t("steps.step1")}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#baff5c]/20 text-xs font-bold text-[#baff5c]">
              2
            </span>
            <p className="text-sm text-white/80">{t("steps.step2")}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#baff5c]/20 text-xs font-bold text-[#baff5c]">
              3
            </span>
            <p className="text-sm text-white/80">{t("steps.step3")}</p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/labs/demo/participant"
          className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#baff5c] px-8 py-4 text-base font-semibold text-[#09140a] shadow-[0_0_20px_rgba(186,255,92,0.35)] transition hover:bg-[#89e24a] hover:shadow-[0_16px_40px_rgba(186,255,92,0.45)] sm:w-auto"
        >
          <Send className="h-5 w-5" />
          {t("cta.primary")}
        </Link>

        <Link
          href={isAuthenticated ? "/dashboard" : "/access"}
          className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/10 sm:w-auto"
        >
          <LayoutDashboard className="h-5 w-5" />
          {t("cta.secondary")}
          {!isAuthenticated && (
            <span className="text-xs text-white/50">({t("cta.loginRequired")})</span>
          )}
        </Link>
      </div>

      {/* Time estimate */}
      <p className="mt-8 text-center text-sm text-white/50">
        <ArrowRight className="mr-1 inline h-3 w-3" />
        {t("timeEstimate")}
      </p>
    </div>
  );
}
