"use client";

import {
  BadgeDollarSign,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Droplets,
  FlaskConical,
  Gamepad2,
  Lock,
  Puzzle,
  Scan,
  ScanQrCode,
  ShieldCheck,
  Sparkles,
  SquareStack,
  Trophy,
  UsersRound,
  Workflow,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const labNavigation = [
  { key: "eventLabs", href: "/labs", icon: FlaskConical },
  { key: "labHome", href: "/lab", icon: FlaskConical },
  { key: "trustIdentity", href: "/auth", icon: ShieldCheck },
  { key: "spray", href: "/spray", icon: Droplets },
  { key: "gooddollar", href: "/gooddollar", icon: BadgeDollarSign },
  { key: "taberna", href: "/taberna", icon: UsersRound },
] as const;

const feedbackExperimentsNavigation = [
  { key: "scan8004", href: "/scan-8004", icon: Scan },
  { key: "x402", href: "/x402", icon: Sparkles },
  { key: "a2a", href: "/a2a", icon: Workflow },
] as const;

const experimentsNavigation = [
  { key: "checkin", icon: ScanQrCode },
  { key: "miniGames", icon: Gamepad2 },
  { key: "sponsor", icon: SquareStack },
  { key: "builderExtensions", icon: Puzzle },
  { key: "insights", icon: BarChart3 },
  { key: "leaderboard", icon: Trophy },
] as const;

// Temporary flag to hide experiments navigation until the module is ready.
const SHOW_EXPERIMENTS = false;

export default function SidebarNav() {
  const t = useTranslations("SidebarNav");
  const pathname = usePathname();
  const { open, isMobile } = useSidebar();

  if (isMobile) {
    return null;
  }

  const collapsed = !open && !isMobile;
  const footerCopy = t("footer.copy").replace(". ", ".\n");
  const matchesPath = (href: string) => {
    if (href === "/auth") {
      return pathname?.startsWith("/auth");
    }
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <Sidebar collapsible="icon" aria-label={t("aria.navigation")}>
      <SidebarHeader>
        <Link
          href="/"
          aria-label={t("aria.homeLink")}
          className={cn(
            "flex flex-1 items-center gap-3 rounded-xl px-2 py-2 transition",
            collapsed
              ? "h-11 w-11 justify-center gap-0 rounded-lg border-none bg-transparent px-0 py-0 hover:border-transparent"
              : "border border-white/10 bg-white/5 hover:border-white/30",
          )}
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
              collapsed ? "hidden" : "flex",
            )}
          >
            <p className="text-[0.62rem] font-semibold uppercase text-white/65">
              {t("branding.subtitle")}
            </p>
            <h1 className="text-[0.95rem] font-semibold uppercase text-white">
              {t("branding.title")}
            </h1>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sections.lab.title")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {labNavigation.map((item) => {
                const ItemIcon = item.icon;
                const isActive = matchesPath(item.href);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className="flex w-full items-center gap-3"
                      >
                        <ItemIcon
                          className="h-4 w-4 text-[#8bea4e]"
                          aria-hidden
                        />
                        <span
                          className={cn(
                            "truncate text-[0.72rem]",
                            collapsed ? "hidden" : "inline",
                          )}
                        >
                          {t(`sections.lab.items.${item.key}`)}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>
            {t("sections.feedbackExperiments.title")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {feedbackExperimentsNavigation.map((item) => {
                const ItemIcon = item.icon;
                const isActive = matchesPath(item.href);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className="flex w-full items-center gap-3"
                      >
                        <ItemIcon
                          className="h-4 w-4 text-[#8bea4e]"
                          aria-hidden
                        />
                        <span
                          className={cn(
                            "truncate text-[0.72rem]",
                            collapsed ? "hidden" : "inline",
                          )}
                        >
                          {t(`sections.feedbackExperiments.items.${item.key}`)}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {SHOW_EXPERIMENTS ? (
          <SidebarGroup>
            <SidebarGroupLabel
              className={cn("justify-between", collapsed ? "hidden" : "flex")}
            >
              <span>{t("sections.experiments.title")}</span>
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[0.6rem] text-white/70">
                {t("sections.experiments.badge")}
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {experimentsNavigation.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        type="button"
                        disabled
                        className="cursor-not-allowed text-white/50"
                      >
                        <ItemIcon className="h-4 w-4" aria-hidden />
                        <span
                          className={cn(
                            "truncate text-[0.7rem]",
                            collapsed ? "hidden" : "inline",
                          )}
                        >
                          {t(`sections.experiments.items.${item.key}`)}
                        </span>
                        <Lock className="ml-auto h-3.5 w-3.5" aria-hidden />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter className="flex items-center gap-3">
        {collapsed ? null : (
          <span className="whitespace-pre-line text-[0.62rem] uppercase">
            {footerCopy}
          </span>
        )}
        <SidebarTrigger
          aria-label={t("aria.toggle")}
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden />
          )}
          <span className="sr-only">{t("aria.toggle")}</span>
        </SidebarTrigger>
      </SidebarFooter>
    </Sidebar>
  );
}
