"use client";

import {
  BarChart3,
  ChevronDown,
  Gamepad2,
  MapPinned,
  ScanQrCode,
  Settings,
  ShieldCheck,
  Sparkles,
  SprayCan,
  SquareStack,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/routing";

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

type Variant = "desktop" | "mobile";

interface SidebarNavProps {
  variant?: Variant;
}

export function SidebarNav({ variant = "desktop" }: SidebarNavProps) {
  const t = useTranslations("SidebarNav");
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRefs = useRef<Record<string, Array<HTMLAnchorElement>>>({});
  const focusIntentRef = useRef<"first" | "last" | null>(null);
  const focusRing =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#baff5c]";

  useEffect(() => {
    const handler = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenGroup(null);
      }
    };
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenGroup(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close dropdowns whenever the route changes
  useEffect(() => {
    setOpenGroup(null);
  }, [pathname]);

  useEffect(() => {
    if (!openGroup || !containerRef.current) {
      return;
    }
    const focusable = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>("button, a"),
    ).filter((element) => !element.hasAttribute("disabled"));
    if (focusable.length === 0) {
      return;
    }
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      if (!containerRef.current?.contains(document.activeElement)) {
        focusable[0]?.focus();
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
    };
    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [openGroup]);

  useEffect(() => {
    if (!openGroup) {
      return;
    }
    if (!dropdownRefs.current[openGroup]) {
      dropdownRefs.current[openGroup] = [];
    }
    const targets = dropdownRefs.current[openGroup] ?? [];
    if (targets.length === 0) {
      return;
    }
    const target =
      focusIntentRef.current === "last"
        ? targets[targets.length - 1]
        : targets[0];
    target?.focus();
    focusIntentRef.current = null;
  }, [openGroup]);

  if (variant === "mobile") {
    return (
      <nav className="space-y-5 text-white" aria-label={t("aria.navigation")}>
        <Link
          href="/"
          aria-label={t("aria.homeLink")}
          className={`flex items-center gap-3 border border-[#2a2f36] bg-[#11131a] px-4 py-3 transition hover:border-[rgba(186,255,92,0.35)] hover:text-white ${focusRing}`}
        >
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-[#2f3440]">
            <Image
              src="/denlabs.png"
              alt={t("branding.badgeAlt")}
              fill
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#7d8794]">
              {t("branding.subtitle")}
            </p>
            <h1 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
              {t("branding.title")}
            </h1>
          </div>
        </Link>
        {navGroups.map((group) => (
          <details
            key={group.key}
            open={openGroup === group.key}
            className="group rounded-lg border border-[#22282e] bg-[rgba(17,19,24,0.58)] backdrop-blur-[12px] transition-shadow duration-150"
            onToggle={(event) => {
              const target = event.currentTarget;
              setOpenGroup(target.open ? group.key : null);
            }}
          >
            <summary
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-[rgba(20,24,29,0.8)] px-4 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#e9eef2] outline-none transition-all duration-150 [&::-webkit-details-marker]:hidden ${focusRing}`}
            >
              <span>{t(`sections.${group.key}.title`)}</span>
              <ChevronDown
                className="h-4 w-4 transition-transform duration-200 ease-out group-open:-rotate-180"
                aria-hidden
              />
            </summary>
            <div className="space-y-2 px-4 pb-4 pt-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#7d8794b3]">
                {t(`sections.${group.key}.description`)}
              </p>
              {group.items.map((item) => {
                const isActive =
                  item.href === "/auth"
                    ? pathname?.startsWith(item.href)
                    : pathname === item.href ||
                      pathname?.startsWith(`${item.href}/`);
                const ItemIcon = navItemIcons[item.key];
                return (
                  <Link
                    key={`${group.key}-${item.key}`}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`grid grid-cols-[16px_1fr] items-center gap-3 rounded-lg border border-[#2a2f36] px-3 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.18em] transition ${focusRing} ${
                      isActive
                        ? "border-[#4ca22a] bg-[#89e24a] text-[#09140a] shadow-[0_0_20px_rgba(186,255,92,0.35)]"
                        : "bg-[rgba(20,24,29,0.6)] text-[#c2c7d2] hover:border-[rgba(186,255,92,0.35)] hover:bg-[rgba(20,24,29,0.85)] hover:text-white"
                    }`}
                  >
                    <ItemIcon
                      className="h-3 w-3 text-[rgba(186,255,92,0.8)]"
                      aria-hidden
                    />
                    <span className="truncate">
                      {t(`sections.${group.key}.items.${item.key}`)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </details>
        ))}
      </nav>
    );
  }

  const showOverlay = variant === "desktop" && openGroup !== null;

  return (
    <>
      <div
        ref={containerRef}
        className="relative z-50 flex w-full flex-col gap-5 rounded-lg border border-[#2a2f36] bg-[#14181f]/70 px-5 py-4 backdrop-blur-[18px] text-white shadow-[0_40px_120px_-80px_rgba(0,0,0,0.55)] md:px-6 lg:gap-4"
      >
        <div className="flex flex-col gap-4 md:grid md:min-h-[52px] md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              aria-label={t("aria.homeLink")}
              className={`inline-flex items-center gap-4 rounded-md px-1 py-1 transition hover:text-white ${focusRing}`}
            >
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-[#2f3440] bg-[#161821]">
                <Image
                  src="/denlabs.png"
                  alt={t("branding.badgeAlt")}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col leading-snug">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[#9ba3af]">
                  {t("branding.subtitle")}
                </p>
                <h1 className="text-[0.95rem] font-semibold uppercase tracking-[0.18em] text-white">
                  {t("branding.title")}
                </h1>
              </div>
            </Link>
            <span
              className="hidden h-8 w-px bg-[rgba(255,255,255,0.08)] md:inline-block"
              aria-hidden="true"
            />
          </div>
          <nav
            aria-label={t("aria.navigation")}
            className="order-last flex w-full flex-wrap items-center justify-center gap-4 md:order-none md:flex-nowrap md:justify-center md:gap-3"
          >
            {navGroups.map((group) => {
              dropdownRefs.current[group.key] = [];
              const Icon = group.icon;
              const isOpen = openGroup === group.key;
              const sectionDescription = t(
                `sections.${group.key}.description`,
              ) as string;
              const menuId = `nav-menu-${group.key}`;
              return (
                <div
                  key={group.key}
                  className="relative basis-full md:basis-auto md:flex-none"
                >
                  <button
                    type="button"
                    className={`group relative inline-flex py-2 w-full items-center justify-center gap-2 rounded-md border border-[#2a2f36] bg-[rgba(20,24,29,0.7)] px-4 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#e9eef2] shadow-none transition-all duration-150 ease-out hover:-translate-y-[1px] hover:border-[rgba(137,226,74,0.4)] hover:bg-[rgba(20,24,29,0.82)] active:translate-y-0 active:border-[rgba(76,162,42,0.55)] md:w-auto ${focusRing} ${
                      isOpen
                        ? "border-[rgba(137,226,74,0.55)] bg-[rgba(6, 6, 7, 0.88)]"
                        : ""
                    }`}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    aria-controls={menuId}
                    onClick={() => {
                      focusIntentRef.current = "first";
                      setOpenGroup(isOpen ? null : group.key);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        focusIntentRef.current = "first";
                        setOpenGroup(group.key);
                      } else if (event.key === "ArrowUp") {
                        event.preventDefault();
                        focusIntentRef.current = "last";
                        setOpenGroup(group.key);
                      }
                    }}
                  >
                    <Icon
                      className="h-[18px] w-[18px] text-[rgba(186,255,92,0.8)] transition-transform duration-200 ease-out group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                    <span className="truncate">
                      {t(`sections.${group.key}.title`)}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-[rgba(186,255,92,0.8)] transition-transform duration-200 ease-out ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </button>
                  <div
                    id={menuId}
                    role="menu"
                    style={{ minWidth: "min(max(320px, 100%), 360px)" }}
                    className={`absolute left-1/2 top-[calc(100%+12px)] z-40 w-full -translate-x-1/2 rounded-md border border-[#22282e] bg-[rgba(16,19,22,0.9)] px-4 py-4 backdrop-blur-[18px] shadow-[0_30px_90px_-60px_rgba(0,0,0,0.65)] transition-all duration-200 ease-out ${
                      isOpen
                        ? "pointer-events-auto opacity-100 translate-y-0"
                        : "pointer-events-none opacity-0 -translate-y-3"
                    }`}
                  >
                    <p className="pb-3 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#7d8794b3]">
                      {sectionDescription}
                    </p>
                    <div className="space-y-2">
                      {group.items.map((item) => {
                        const isActive =
                          item.href === "/auth"
                            ? pathname?.startsWith(item.href)
                            : pathname === item.href ||
                              pathname?.startsWith(`${item.href}/`);
                        const ItemIcon = navItemIcons[item.key];
                        return (
                          <div key={`${group.key}-${item.key}`} role="none">
                            <Link
                              role="menuitem"
                              ref={(node) => {
                                if (!dropdownRefs.current[group.key]) {
                                  dropdownRefs.current[group.key] = [];
                                }
                                const list = dropdownRefs.current[group.key];
                                if (!node) {
                                  return;
                                }
                                if (!list.includes(node)) {
                                  list.push(node);
                                }
                              }}
                              href={item.href}
                              onKeyDown={(event) => {
                                const items =
                                  dropdownRefs.current[group.key] ?? [];
                                const index = items.indexOf(
                                  event.currentTarget,
                                );
                                if (index === -1) {
                                  return;
                                }
                                if (event.key === "ArrowDown") {
                                  event.preventDefault();
                                  items[(index + 1) % items.length]?.focus();
                                } else if (event.key === "ArrowUp") {
                                  event.preventDefault();
                                  items[
                                    (index - 1 + items.length) % items.length
                                  ]?.focus();
                                } else if (event.key === "Home") {
                                  event.preventDefault();
                                  items[0]?.focus();
                                } else if (event.key === "End") {
                                  event.preventDefault();
                                  items[items.length - 1]?.focus();
                                }
                              }}
                              className={`grid grid-cols-[16px_1fr] items-center gap-3 rounded-md border border-[#2a2f36] px-3 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.18em] transition ${focusRing} ${
                                isActive
                                  ? "border-[#4ca22a] bg-[#89e24a] text-[#09140a] shadow-[0_0_20px_rgba(186,255,92,0.35)]"
                                  : "bg-[rgba(20,24,29,0.7)] text-[#c2c7d2] hover:border-[rgba(137,226,74,0.35)] hover:bg-[rgba(20,24,29,0.88)] hover:text-white"
                              }`}
                            >
                              <ItemIcon
                                className="h-3 w-3 text-[rgba(186,255,92,0.8)]"
                                aria-hidden
                              />
                              <span className="truncate">
                                {t(`sections.${group.key}.items.${item.key}`)}
                              </span>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>
      {showOverlay ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-[rgba(11,12,16,0.15)] backdrop-blur-[4px] transition-opacity duration-150"
        />
      ) : null}
    </>
  );
}

export default SidebarNav;
