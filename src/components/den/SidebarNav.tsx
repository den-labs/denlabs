"use client";

import {
  BadgeDollarSign,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Droplets,
  FlaskConical,
  Gift,
  LayoutDashboard,
  Library,
  Scan,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { shouldExpandParent, MODULE_STATUS } from "@/config/moduleKeys";

// Product navigation items
const productNavigation = [
  { key: "eventLabs", href: "/labs", icon: FlaskConical },
  {
    key: "rewards",
    icon: Gift,
    collapsible: true,
    children: [
      { key: "sprayDisperser", href: "/spray", icon: Droplets },
      { key: "gooddollarClaim", href: "/gooddollar", icon: BadgeDollarSign },
    ],
  },
  { key: "mentorsSpace", href: "/mentors", icon: UsersRound },
] as const;

// Laboratory navigation items
const laboratoryNavigation = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
] as const;

// Library navigation items (hero modules only)
const libraryNavigation = [
  { key: "trustScoring", href: "/library/trust-scoring", icon: Scan },
  { key: "premiumAccess", href: "/library/x402", icon: Sparkles },
  { key: "agentNetwork", href: "/library/a2a", icon: Workflow },
  { key: "browseLibrary", href: "/library", icon: Library, isIndex: true },
] as const;

type StatusBadgeProps = {
  status: 'ready' | 'experimental' | 'planned' | 'external';
};

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'ready') return null;

  const config = {
    experimental: { label: '🟡 Beta', variant: 'secondary' as const },
    planned: { label: '🔵 Soon', variant: 'outline' as const },
    external: { label: '🔗', variant: 'outline' as const },
  };

  const badge = config[status];
  if (!badge) return null;

  return (
    <Badge variant={badge.variant} className="ml-auto text-[0.6rem] px-1.5 py-0">
      {badge.label}
    </Badge>
  );
}

export default function SidebarNav() {
  const t = useTranslations("SidebarNav");
  const pathname = usePathname();
  const { open, isMobile } = useSidebar();

  // Auto-expand Rewards if on Spray or GoodDollar pages
  const [rewardsExpanded, setRewardsExpanded] = useState(() =>
    shouldExpandParent(pathname || '', 'rewards')
  );

  useEffect(() => {
    if (shouldExpandParent(pathname || '', 'rewards')) {
      setRewardsExpanded(true);
    }
  }, [pathname]);

  if (isMobile) {
    return null;
  }

  const collapsed = !open && !isMobile;
  const footerCopy = t("footer.copy").replace(". ", ".\n");

  const matchesPath = (href: string) => {
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
        {/* PRODUCTO */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("sections.product.title")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {productNavigation.map((item) => {
                const ItemIcon = item.icon;

                // Collapsible item (Rewards)
                if ('collapsible' in item && item.collapsible && item.children) {
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        onClick={() => setRewardsExpanded(!rewardsExpanded)}
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
                          {t(`sections.product.${item.key}`)}
                        </span>
                        {!collapsed && (
                          <ChevronDown
                            className={cn(
                              "ml-auto h-3.5 w-3.5 transition-transform",
                              rewardsExpanded ? "rotate-180" : ""
                            )}
                          />
                        )}
                      </SidebarMenuButton>
                      {rewardsExpanded && !collapsed && (
                        <SidebarMenuSub>
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const isActive = matchesPath(child.href);
                            return (
                              <SidebarMenuSubItem key={child.key}>
                                <SidebarMenuSubButton asChild isActive={isActive}>
                                  <Link
                                    href={child.href}
                                    aria-current={isActive ? "page" : undefined}
                                    className="flex w-full items-center gap-3 pl-8"
                                  >
                                    <ChildIcon
                                      className="h-4 w-4 text-[#8bea4e]"
                                      aria-hidden
                                    />
                                    <span className="truncate text-[0.72rem]">
                                      {t(`sections.product.${child.key}`)}
                                    </span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                }

                // Regular item
                const isActive = 'href' in item && matchesPath(item.href);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={'href' in item ? item.href : '#'}
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
                          {t(`sections.product.${item.key}`)}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* LABORATORIO */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("sections.laboratory.title")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {laboratoryNavigation.map((item) => {
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
                          {t(`sections.laboratory.${item.key}`)}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* BIBLIOTECA */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("sections.library.title")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {libraryNavigation.map((item) => {
                const ItemIcon = item.icon;
                const isActive = matchesPath(item.href);
                const isIndex = 'isIndex' in item && item.isIndex;
                const status = MODULE_STATUS[item.key];

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
                          {t(`sections.library.${item.key}`)}
                        </span>
                        {!collapsed && !isIndex && status && (
                          <StatusBadge status={status} />
                        )}
                        {!collapsed && isIndex && (
                          <span className="ml-auto text-white/50">→</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
