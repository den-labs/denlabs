import { ShieldCheck, ShieldQuestion, UserCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { DenMain } from "@/components/den/RailSlots";
import { requireProfile } from "@/lib/accessGuards";
import type { LabUserProfile } from "@/lib/userProfile";

const LAB_TABS = ["Overview", "Activity", "Rewards", "Signals"];

export default async function LabPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await requireProfile({ locale, nextPath: "/lab" });
  return (
    <DenMain>
      <LabMain locale={locale} profile={profile} />
    </DenMain>
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
