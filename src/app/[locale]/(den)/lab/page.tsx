import {
  Award,
  BarChart3,
  Droplets,
  Gamepad2,
  Grid3X3,
  LayoutGrid,
  Lock,
  Puzzle,
  Search,
  ShieldCheck,
  ShieldQuestion,
  Store,
  Trophy,
  UserCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { DenMain, DenRightRail } from "@/components/den/RailSlots";
import { requireProfile } from "@/lib/accessGuards";
import type { LabUserProfile } from "@/lib/userProfile";

const LAB_TABS = ["Overview", "Activity", "Rewards", "Signals"];

type MiniApp = {
  id: string;
  label: string;
  status: "LIVE" | "SOON";
  href?: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
};

const MINI_APPS: MiniApp[] = [
  {
    id: "spray",
    label: "Spray Disperser",
    status: "LIVE",
    href: "/spray",
    icon: Droplets,
    description: "Send rewards in bulk.",
  },
  {
    id: "taberna",
    label: "Taberna Mentorship",
    status: "LIVE",
    href: "/taberna",
    icon: Store,
    description: "Join live rooms.",
  },
  {
    id: "self",
    label: "Self.xyz Auth",
    status: "LIVE",
    href: "/auth",
    icon: ShieldCheck,
    description: "Verify your identity.",
  },
  {
    id: "mini-games",
    label: "Mini-Games Lab",
    status: "SOON",
    icon: Gamepad2,
    description: "Play and earn inside runs.",
  },
  {
    id: "sponsor",
    label: "Sponsor Showcase",
    status: "SOON",
    icon: Award,
    description: "Highlights for partners.",
  },
  {
    id: "extensions",
    label: "Builder Extensions",
    status: "SOON",
    icon: Puzzle,
    description: "Custom experiences.",
  },
  {
    id: "insights",
    label: "Insights",
    status: "SOON",
    icon: BarChart3,
    description: "Metrics and KPIs.",
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    status: "SOON",
    icon: Trophy,
    description: "Top builders per run.",
  },
  {
    id: "coming-soon",
    label: "More coming soon",
    status: "SOON",
    icon: Lock,
    description: "Reserved slot.",
  },
];

export default async function LabPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await requireProfile({ locale, nextPath: "/lab" });
  return (
    <>
      <DenMain>
        <LabMain locale={locale} profile={profile} />
      </DenMain>
      <DenRightRail>
        <LabRightSidebar locale={locale} />
      </DenRightRail>
    </>
  );
}

type LabMainProps = {
  locale: string;
  profile: LabUserProfile;
};

function LabMain({ locale, profile }: LabMainProps) {
  const localePrefix = `/${locale}`;
  const holdScore = Number(profile.hold_score ?? 0);
  const holdMax = 120;
  const holdProgress = Math.min(
    100,
    Math.max(0, Math.round((holdScore / holdMax) * 100)),
  );
  const stats = [
    { label: "HOWL score", value: holdScore.toString(), meta: "Out of 120" },
    { label: "Sessions", value: "3", meta: "This week" },
    { label: "Rewards", value: "2", meta: "Claimed" },
    { label: "Streak", value: "5 days", meta: "Check-ins" },
  ];
  const quests: QuestItem[] = [
    {
      id: "self",
      title: "Verify with Self (+10 HOLD)",
      description: "Boost trust and unlock gated quests.",
      href: `${localePrefix}/auth`,
      status: profile.self_verified ? "done" : "available",
      actionLabel: profile.self_verified ? "Done" : "Start",
    },
  ];
  const handle = formatHandle(profile.handle ?? profile.wallet_address ?? null);
  const displayName =
    profile.display_name ||
    formatWalletFallback(profile.wallet_address ?? null) ||
    "Den Builder";
  const liveMiniApps = MINI_APPS.filter(
    (app) => app.status === "LIVE" && app.id !== "self",
  );
  const avatarSrc = profile.avatar_url ?? "/avatar.png";

  return (
    <div className="space-y-6 text-wolf-foreground">
      <section className="wolf-card rounded-3xl border border-wolf-border p-6 text-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <ProfileAvatar
              src={avatarSrc}
              verified={Boolean(profile.self_verified)}
            />
            <div>
              <h1 className="text-2xl font-semibold">{displayName}</h1>
              <p className="text-sm text-white/70">{handle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:ml-auto">
            <StatusBadge
              icon={<UserCircle className="h-3.5 w-3.5" aria-hidden />}
              label={`ROLE: ${
                profile.role === "organizer" ? "OPERATOR" : "PLAYER"
              }`}
            />
          </div>
        </div>
      </section>
      <nav className="flex gap-1 border-b border-wolf-border">
        {LAB_TABS.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`relative px-4 py-3 text-sm font-semibold uppercase transition-colors ${
              index === 0 ? "text-white" : "text-white/50 hover:text-white"
            }`}
          >
            {tab}
            {index === 0 ? (
              <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-[#89e24a]" />
            ) : null}
          </button>
        ))}
      </nav>
      <section className="grid gap-6 lg:grid-cols-2">
        <LabStats
          holdProgress={holdProgress}
          holdScore={holdScore}
          stats={stats}
        />
        <QuestList items={quests} />
      </section>
      <section className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-5 lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Shortcuts</p>
          <LayoutGrid className="h-4 w-4 text-white/60" aria-hidden />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {liveMiniApps.map((app) => (
            <Link
              key={app.id}
              href={`${localePrefix}${app.href ?? "#"}`}
              className="rounded-xl border border-wolf-border-soft bg-wolf-panel/70 p-3 text-center text-xs text-white transition hover:bg-wolf-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89e24a]"
            >
              <app.icon className="mx-auto mb-2 h-5 w-5 text-white/60" />
              <span className="font-medium">{app.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

type ProfileAvatarProps = {
  src?: string | null;
  verified: boolean;
};

function ProfileAvatar({ src, verified }: ProfileAvatarProps) {
  const imageSrc =
    typeof src === "string" && src.trim().length > 0 ? src : "/avatar.png";
  const badgeClasses = verified
    ? "bg-[#12230f] text-[#89e24a]"
    : "bg-[#2d3240] text-white/70";
  const badgeIcon = verified ? (
    <ShieldCheck className="h-3.5 w-3.5 text-[#89e24a]" aria-hidden />
  ) : (
    <ShieldQuestion className="h-3.5 w-3.5" aria-hidden />
  );

  return (
    <div className="relative h-24 w-24 shrink-0">
      <div className="h-full w-full rounded-[32px] bg-white/95 p-1 shadow-[0_18px_50px_rgba(6,8,18,0.45)]">
        <div className="h-full w-full overflow-hidden rounded-[28px] bg-[#0f1626]">
          <Image
            src={imageSrc}
            alt="Profile avatar"
            width={160}
            height={160}
            className="h-full w-full object-cover"
            priority
          />
        </div>
      </div>
      <div
        className={`absolute -bottom-1 -right-1 rounded-full border-4 border-[#05090f] ${badgeClasses} p-1 shadow-xl`}
      >
        {badgeIcon}
      </div>
    </div>
  );
}

function StatusBadge({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-wolf-border-soft bg-wolf-neutral-soft px-3 py-1 text-[11px] font-semibold text-white">
      {icon}
      {label}
    </span>
  );
}

type LabStatsProps = {
  holdProgress: number;
  holdScore: number;
  stats: Array<{ label: string; value: string; meta: string }>;
};

function LabStats({ holdProgress, holdScore, stats }: LabStatsProps) {
  return (
    <section className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-5 text-white">
      <h2 className="text-xs font-semibold uppercase text-wolf-text-subtle">
        Stats
      </h2>
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">HOWL progress</span>
          <span className="font-semibold text-[#89e24a]">{holdScore} pts</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[#89e24a] to-[#56f0d5] transition-all"
            style={{ width: `${holdProgress}%` }}
          />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-wolf-border-soft bg-wolf-panel/70 p-4"
          >
            <p className="text-xs font-semibold uppercase text-white/55">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {stat.value}
            </p>
            <p className="text-xs text-white/60">{stat.meta}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

type QuestStatus = "available" | "locked" | "done";

type QuestItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  status: QuestStatus;
  actionLabel: string;
};

function QuestList({ items }: { items: QuestItem[] }) {
  return (
    <section className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-5 text-white">
      <h2 className="text-xs font-semibold uppercase text-wolf-text-subtle">
        Next steps / quests
      </h2>
      <div className="mt-4 space-y-3">
        {items.map((quest) => (
          <article
            key={quest.id}
            className="flex flex-col gap-3 rounded-xl border border-wolf-border-soft bg-wolf-panel/70 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-white">{quest.title}</p>
              <p className="text-xs text-white/70">{quest.description}</p>
            </div>
            <QuestAction quest={quest} />
          </article>
        ))}
      </div>
    </section>
  );
}

function QuestAction({ quest }: { quest: QuestItem }) {
  if (quest.status === "done") {
    return (
      <span className="inline-flex items-center rounded-full border border-[#56f0d5]/40 px-4 py-1.5 text-xs font-semibold uppercase text-[#56f0d5]">
        Done
      </span>
    );
  }
  if (quest.status === "locked") {
    return (
      <span className="inline-flex items-center rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold uppercase text-white/40">
        Locked
      </span>
    );
  }
  return (
    <Link
      href={quest.href}
      className="inline-flex items-center rounded-full border border-[#89e24a] px-4 py-1.5 text-xs font-semibold uppercase text-[#89e24a] transition hover:bg-[#89e24a] hover:text-[#05090f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89e24a]"
    >
      {quest.actionLabel}
    </Link>
  );
}

function LabRightSidebar({ locale }: { locale: string }) {
  const localePrefix = `/${locale}`;
  const liveApps = MINI_APPS.filter(
    (app) => app.status === "LIVE" && app.id !== "self",
  );
  return (
    <aside className="hidden flex-col gap-6 lg:flex text-wolf-foreground">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search experiments"
          className="w-full rounded-full border border-wolf-border bg-wolf-panel/80 py-2.5 pl-10 pr-14 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89e24a]"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-wolf-border bg-wolf-panel px-2 py-0.5 text-[10px] text-white/60">
          ⌘K
        </kbd>
      </div>
      <section className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-5">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Shortcuts</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-md p-1.5 text-white/60 hover:bg-white/10"
            >
              <Grid3X3 className="h-4 w-4" aria-hidden />
              <span className="sr-only">Open apps grid</span>
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {liveApps.map((app) => {
            const Icon = app.icon;
            const isLive = app.status === "LIVE";
            const href =
              isLive && app.href ? `${localePrefix}${app.href}` : null;
            const content = (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-wolf-border-soft bg-wolf-panel/60 p-3 text-center text-xs text-white transition hover:bg-wolf-panel">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wolf-neutral-soft">
                  <Icon
                    className={`h-5 w-5 ${
                      isLive ? "text-[#89e24a]" : "text-white/40"
                    }`}
                  />
                </div>
                <span className="leading-tight">{app.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isLive
                      ? "bg-[#89e24a]/20 text-[#89e24a]"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {app.status}
                </span>
              </div>
            );
            if (href) {
              return (
                <Link key={app.id} href={href}>
                  {content}
                </Link>
              );
            }
            return (
              <div key={app.id} className="cursor-not-allowed opacity-70">
                {content}
              </div>
            );
          })}
        </div>
      </section>
      <div className="mt-auto flex flex-wrap gap-2 text-[11px] text-white/50">
        <Link href="#" className="hover:text-white">
          Support
        </Link>
        <span>•</span>
        <Link href="#" className="hover:text-white">
          Privacy
        </Link>
        <span>•</span>
        <Link href="#" className="hover:text-white">
          Terms
        </Link>
      </div>
    </aside>
  );
}

function formatHandle(value: string | null) {
  if (!value) {
    return "@denbuilder";
  }
  const sanitized = value.replace(/^@/, "").replace(/\s+/g, "").toLowerCase();
  return `@${sanitized || "denbuilder"}`;
}

function formatWalletFallback(value: string | null) {
  if (!value) {
    return null;
  }
  if (value.length <= 10) {
    return value;
  }
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}
