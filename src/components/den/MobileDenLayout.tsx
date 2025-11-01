"use client";

import { Home, LayoutGrid, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname } from "@/i18n/routing";

type MobilePanelKey = "main" | "menu" | "activity";

type NavigationItem = {
  key: MobilePanelKey;
  icon: typeof Home;
};

const navigationItems: NavigationItem[] = [
  { key: "main", icon: Home },
  { key: "menu", icon: LayoutGrid },
  { key: "activity", icon: Sparkles },
];

type MobileDenLayoutProps = {
  main: ReactNode;
  menu: ReactNode;
  activity: ReactNode;
};

export function MobileDenLayout({
  main,
  menu,
  activity,
}: MobileDenLayoutProps) {
  const t = useTranslations("MobileDenLayout");
  const pathname = usePathname();
  const [activePanel, setActivePanel] = useState<MobilePanelKey>("main");

  useEffect(() => {
    if (!pathname) {
      return;
    }
    setActivePanel("main");
  }, [pathname]);

  const renderPanel = useMemo(() => {
    if (activePanel === "menu") {
      return <div className="max-h-[65vh] overflow-y-auto pr-1">{menu}</div>;
    }

    if (activePanel === "activity") {
      return <div className="space-y-4">{activity}</div>;
    }

    return main;
  }, [activity, main, menu, activePanel]);

  return (
    <>
      <div className="flex min-h-screen flex-col gap-5 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)]">
        <div className="wolf-card rounded-[2.2rem] border border-wolf-border-strong p-4 shadow-[0_40px_110px_-80px_rgba(0,0,0,0.75)] backdrop-blur">
          {renderPanel}
        </div>
      </div>
      <nav
        aria-label={t("aria.navigation")}
        className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
      >
        <div className="pointer-events-auto w-full max-w-md">
          <div className="wolf-card flex items-center justify-around gap-1 rounded-full border border-wolf-border-soft bg-wolf-charcoal-80/90 px-3 py-2 shadow-[0_25px_65px_-35px_rgba(0,0,0,0.55)] backdrop-blur">
            {navigationItems.map(({ key, icon: Icon }) => {
              const isActive = key === activePanel;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivePanel(key)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
                    isActive
                      ? "text-white"
                      : "text-wolf-text-subtle hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                      isActive
                        ? "border-wolf-border-xstrong bg-[linear-gradient(180deg,#c8ff64_0%,#8bea4e_55%,#3b572a_100%)] text-[#0b1407] shadow-[0_0_28px_rgba(186,255,92,0.45)]"
                        : "border-transparent bg-wolf-charcoal-60 text-wolf-emerald"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-[0.65rem] font-semibold">
                    {t(`tabs.${key}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

export default MobileDenLayout;
