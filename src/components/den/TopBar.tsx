"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { HowlBadge } from "@/components/ui/HowlBadge";
import { SelfBadge } from "@/components/ui/SelfBadge";
import { Link, usePathname } from "@/i18n/routing";
import {
  getSelfVerification,
  subscribeToSelfVerification,
} from "@/lib/selfVerification";

type ModuleKey =
  | "quests"
  | "checkin"
  | "mentorship"
  | "showcase"
  | "voting"
  | "stats"
  | "leaderboard"
  | "settings"
  | "mindGames"
  | "auth";

const moduleKeys: Record<string, ModuleKey> = {
  "/quests": "quests",
  "/checkin": "checkin",
  "/mentorship": "mentorship",
  "/showcase": "showcase",
  "/voting": "voting",
  "/stats": "stats",
  "/leaderboard": "leaderboard",
  "/settings": "settings",
  "/mind-games": "mindGames",
  "/auth": "auth",
};

export function TopBar() {
  const t = useTranslations("TopBar");
  const pathname = usePathname();
  const [isSelfVerified, setIsSelfVerified] = useState(false);
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setIsSelfVerified(getSelfVerification());
    return subscribeToSelfVerification(setIsSelfVerified);
  }, []);

  return (
    <header className="flex flex-col justify-between gap-4 text-wolf-foreground">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-wolf-border bg-wolf-charcoal-60 text-xs text-wolf-foreground transition hover:border-wolf-border-xstrong"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-white">{meta.title}</h1>
            </div>
            <p className="text-sm text-wolf-text-subtle">{meta.description}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-wolf-foreground">
        <HowlBadge level="Lobo" />
        <SelfBadge status={isSelfVerified ? "verified" : "pending"} />
      </div>
    </header>
  );
}

export default TopBar;
