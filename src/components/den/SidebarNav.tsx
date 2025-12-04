"use client";

import {
  BarChart3,
  ChevronDown,
  Gamepad2,
  MapPinned,
  Menu,
  ScanQrCode,
  Settings,
  ShieldCheck,
  Sparkles,
  SprayCan,
  SquareStack,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navGroups = [
  {
    key: "essentials",
    icon: ShieldCheck,
    items: [
      { key: "auth", href: "/auth" },
      { key: "taberna", href: "/taberna" },
      { key: "checkin", href: "/checkin" },
    ],
  },
  {
    key: "lab",
    icon: Gamepad2,
    items: [
      { key: "mindGames", href: "/mind-games" },
      { key: "quests", href: "/quests" },
      { key: "showcase", href: "/showcase" },
      { key: "spray", href: "/spray" },
    ],
  },
  {
    key: "insights",
    icon: BarChart3,
    items: [
      { key: "stats", href: "/stats" },
      { key: "leaderboard", href: "/leaderboard" },
      { key: "settings", href: "/settings" },
    ],
  },
] as const;

const navItemIcons: Record<
  (typeof navGroups)[number]["items"][number]["key"],
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  auth: ShieldCheck,
  taberna: UsersRound,
  checkin: ScanQrCode,
  mindGames: Gamepad2,
  quests: MapPinned,
  showcase: SquareStack,
  spray: SprayCan,
  stats: BarChart3,
  leaderboard: Sparkles,
  settings: Settings,
};

export default function SidebarNav() {
  const t = useTranslations("SidebarNav");
  const pathname = usePathname();
  const { open, isMobile } = useSidebar();
  const collapsed = !open && !isMobile;

  return (
    <Sidebar collapsible="icon" aria-label={t("aria.navigation")}>
      <SidebarHeader>
        <Link
          href="/"
          aria-label={t("aria.homeLink")}
          className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-2 py-2 transition hover:border-white/30"
        >
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#0f141d]">
            <Image
              src="/denlabs.png"
              alt={t("branding.badgeAlt")}
              fill
              className="object-contain"
            />
          </div>
          <div
            className={cn(
              "flex flex-col leading-tight",
              collapsed ? "hidden md:flex" : "flex",
            )}
          >
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-white/65">
              {t("branding.subtitle")}
            </p>
            <h1 className="text-[0.95rem] font-semibold uppercase tracking-[0.2em] text-white">
              {t("branding.title")}
            </h1>
          </div>
        </Link>
        <SidebarTrigger
          aria-label={t("aria.toggle")}
          className="ml-2 hidden md:inline-flex"
        >
          <Menu className="h-4 w-4" aria-hidden />
          <span className="sr-only">{t("aria.toggle")}</span>
        </SidebarTrigger>
        <SidebarTrigger
          aria-label={t("aria.toggle")}
          className="ml-2 inline-flex md:hidden"
        >
          <X className="h-4 w-4" aria-hidden />
          <span className="sr-only">{t("aria.toggle")}</span>
        </SidebarTrigger>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navGroups.map((group) => {
              const Icon = group.icon;
              const collapsibleProps = collapsed
                ? { open: true, disabled: true }
                : { defaultOpen: true };
              return (
                <Collapsible key={group.key} {...collapsibleProps}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="justify-between">
                        <span className="flex items-center gap-3">
                          <Icon
                            className="h-4 w-4 text-[#8bea4e]"
                            aria-hidden
                          />
                          <span
                            className={cn(
                              "truncate text-[0.72rem]",
                              collapsed ? "hidden md:inline" : "inline",
                            )}
                          >
                            {t(`sections.${group.key}.title`)}
                          </span>
                        </span>
                        {collapsed ? null : (
                          <ChevronDown
                            className="h-3 w-3 text-white/70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
                            aria-hidden
                          />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 data-[state=closed]:hidden">
                      {collapsed ? null : (
                        <SidebarMenuSub className="space-y-1">
                          {group.items.map((item) => {
                            const isActive =
                              item.href === "/auth"
                                ? pathname?.startsWith(item.href)
                                : pathname === item.href ||
                                  pathname?.startsWith(`${item.href}/`);
                            const ItemIcon = navItemIcons[item.key];
                            return (
                              <SidebarMenuSubItem
                                key={`${group.key}-${item.key}`}
                              >
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isActive}
                                >
                                  <Link
                                    href={item.href}
                                    aria-current={
                                      isActive ? "page" : undefined
                                    }
                                    className="flex w-full items-center gap-3"
                                  >
                                    <ItemIcon
                                      className="h-4 w-4 text-[#7df95a]"
                                      aria-hidden
                                    />
                                    <span
                                      className={cn(
                                        "truncate text-[0.7rem]",
                                        collapsed ? "hidden md:block" : "block",
                                      )}
                                    >
                                      {t(
                                        `sections.${group.key}.items.${item.key}`,
                                      )}
                                    </span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{t("footer.copy")}</SidebarFooter>
    </Sidebar>
  );
}
