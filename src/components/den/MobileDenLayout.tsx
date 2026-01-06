"use client";

import { Droplets, FlaskConical, Home, Library } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useMemo } from "react";
import LimelightNav from "@/components/ui/LimelightNav";
import { usePathname, useRouter } from "@/i18n/routing";

type NavigationItemKey = "home" | "myLabs" | "spray" | "library";

type NavigationItemConfig = {
  key: NavigationItemKey;
  icon: typeof Home;
  href: string;
};

const navigationItems: NavigationItemConfig[] = [
  { key: "library", icon: Library, href: "/library" },
  { key: "spray", icon: Droplets, href: "/spray" },
  { key: "myLabs", icon: FlaskConical, href: "/labs" },
  { key: "home", icon: Home, href: "/dashboard" },
];

type MobileDenLayoutProps = {
  main: ReactNode;
};

export function MobileDenLayout({ main }: MobileDenLayoutProps) {
  const t = useTranslations();
  const tNav = useTranslations("MobileDenLayout");
  const pathname = usePathname();
  const router = useRouter();

  const getLabel = useCallback(
    (key: NavigationItemKey) => {
      const sectionMap: Record<NavigationItemKey, string> = {
        home: "sidebar.laboratory.home",
        myLabs: "sidebar.laboratory.myLabs",
        spray: "sidebar.tools.spray",
        library: "sidebar.library.browse",
      };
      return t(sectionMap[key]);
    },
    [t],
  );

  const navItems = useMemo(() => {
    return navigationItems.map(({ key, icon: Icon }) => ({
      id: key,
      icon: <Icon className="h-5 w-5" aria-hidden />,
      label: getLabel(key),
    }));
  }, [getLabel]);
  const activeKey = useMemo(() => {
    if (!pathname) {
      return "library";
    }
    const match = navigationItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
    return match?.key ?? "library";
  }, [pathname]);
  const activeIndex = navigationItems.findIndex(
    (item) => item.key === activeKey,
  );

  return (
    <>
      <div className="flex min-h-screen flex-col gap-5 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)]">
        <div className="wolf-card rounded-lg border border-wolf-border-strong p-4 shadow-[0_40px_110px_-80px_rgba(0,0,0,0.75)] backdrop-blur">
          {main}
        </div>
      </div>
      <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        <div className="pointer-events-auto w-full max-w-md">
          <LimelightNav
            items={navItems}
            activeIndex={activeIndex === -1 ? 0 : activeIndex}
            onTabChange={(index) => {
              const next = navigationItems[index];
              if (next) {
                const matchesCurrent =
                  pathname === next.href ||
                  pathname?.startsWith(`${next.href}/`);
                if (!matchesCurrent) {
                  router.push(next.href);
                }
              }
            }}
            className="w-full"
            iconContainerClassName="rounded-2xl"
            aria-label={tNav("aria.navigation")}
          />
        </div>
      </nav>
    </>
  );
}

export default MobileDenLayout;
