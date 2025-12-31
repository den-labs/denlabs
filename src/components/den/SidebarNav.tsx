"use client";

import {
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
  Droplets,
  FileCheck,
  FlaskConical,
  Home,
  Library,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
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
import { MODULE_STATUS } from "@/config/moduleKeys";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Laboratory navigation items (LABORATORY section)
const laboratoryNavigation = [
  { key: "home", href: "/dashboard", icon: Home },
  { key: "myLabs", href: "/labs", icon: FlaskConical },
] as const;

// Tools navigation items (TOOLS section)
const toolsNavigation = [
  { key: "spray", href: "/spray", icon: Droplets },
  { key: "gooddollar", href: "/gooddollar", icon: BadgeDollarSign },
  { key: "eip3009", href: "/tools/eip3009", icon: FileCheck },
] as const;

// Library navigation items (LIBRARY section)
const libraryNavigation = [
  { key: "browse", href: "/library", icon: Library, isIndex: true },
] as const;

type StatusBadgeProps = {
  status: "ready" | "experimental" | "planned" | "external";
};

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "ready") return null;

  const config = {
    experimental: { label: "🟡 Beta", variant: "secondary" as const },
    planned: { label: "🔵 Soon", variant: "outline" as const },
    external: { label: "🔗", variant: "outline" as const },
  };

  const badge = config[status];
  if (!badge) return null;

  return (
    <Badge
      variant={badge.variant}
      className="ml-auto text-[0.6rem] px-1.5 py-0"
    >
      {badge.label}
    </Badge>
  );
}

export default function SidebarNav() {
  const t = useTranslations(); // For global sidebar.* keys
  const tNav = useTranslations("SidebarNav"); // For component-specific keys
  const pathname = usePathname();
  const { open, isMobile } = useSidebar();

  if (isMobile) {
    return null;
  }

  const collapsed = !open && !isMobile;
  const footerCopy = tNav("footer.copy").replace(". ", ".\n");

  const matchesPath = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <Sidebar collapsible="icon" aria-label={tNav("aria.navigation")}>
      <SidebarHeader>
        <Link
          href="/"
          aria-label={tNav("aria.homeLink")}
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
              alt={tNav("branding.badgeAlt")}
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
              {tNav("branding.subtitle")}
            </p>
            <h1 className="text-[0.95rem] font-semibold uppercase text-white">
              {tNav("branding.title")}
            </h1>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* LABORATORY */}
        <SidebarGroup>
          <SidebarGroupLabel>
            {t("sidebar.sections.laboratory")}
          </SidebarGroupLabel>
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
                          {t(`sidebar.laboratory.${item.key}`)}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* TOOLS */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.sections.tools")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNavigation.map((item) => {
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
                          {t(`sidebar.tools.${item.key}`)}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* LIBRARY */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.sections.library")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {libraryNavigation.map((item) => {
                const ItemIcon = item.icon;
                const isActive = matchesPath(item.href);
                const isIndex = "isIndex" in item && item.isIndex;
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
                          {t(`sidebar.library.${item.key}`)}
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
          aria-label={tNav("aria.toggle")}
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden />
          )}
          <span className="sr-only">{tNav("aria.toggle")}</span>
        </SidebarTrigger>
      </SidebarFooter>
    </Sidebar>
  );
}
