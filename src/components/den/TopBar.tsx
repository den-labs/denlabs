"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";

type ModuleKey =
  | "profile"
  | "quests"
  | "checkin"
  | "mentorship"
  | "showcase"
  | "voting"
  | "stats"
  | "leaderboard"
  | "settings"
  | "mindGames"
  | "auth"
  | "spray";

const moduleKeys: Record<string, ModuleKey> = {
  "/lab": "profile",
  "/quests": "quests",
  "/checkin": "checkin",
  "/mentorship": "mentorship",
  "/showcase": "showcase",
  "/voting": "voting",
  "/stats": "stats",
  "/leaderboard": "leaderboard",
  "/settings": "settings",
  "/mind-games": "mindGames",
  "/spray": "spray",
  "/auth": "auth",
};

export function TopBar() {
  const t = useTranslations("TopBar");
  const pathname = usePathname();
  const activeKey = Object.keys(moduleKeys).find(
    (path) => pathname === path || pathname?.startsWith(`${path}/`),
  );
  const meta = activeKey
    ? {
        title: t(`modules.${moduleKeys[activeKey]}.title`),
        description: t(`modules.${moduleKeys[activeKey]}.description`),
      }
    : {
        title: t("fallback.title"),
        description: t("fallback.description"),
      };

  return (
    <div className="flex w-full flex-col gap-4 text-wolf-foreground">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-wolf-border bg-wolf-charcoal-60 text-xs text-wolf-foreground transition hover:border-wolf-border-xstrong"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <div className="text-left">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">{meta.title}</h1>
          </div>
          <p className="text-sm text-wolf-text-subtle">{meta.description}</p>
        </div>
      </div>
    </div>
  );
}

export default TopBar;
