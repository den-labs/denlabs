"use client";

import {
  ArrowRight,
  FlaskConical,
  ShieldCheck,
  ShieldQuestion,
  UserCircle,
} from "lucide-react";
import Image from "next/image";
import { type ReactNode, useEffect, useState } from "react";
import { useDenUser } from "@/hooks/useDenUser";
import { Link as NextLink } from "@/i18n/routing";
import type { EventLab } from "@/lib/eventLabs";
import { listEventLabs } from "@/lib/eventLabsClient";

export default function LabOverview() {
  const user = useDenUser();
  const [labs, setLabs] = useState<EventLab[]>([]);
  const [labsLoading, setLabsLoading] = useState(true);

  useEffect(() => {
    async function fetchLabs() {
      try {
        const fetchedLabs = await listEventLabs();
        setLabs(fetchedLabs);
      } catch {
        // Ignore error, just show empty state
      } finally {
        setLabsLoading(false);
      }
    }
    fetchLabs();
  }, []);

  const hasLabs = labs.length > 0;
  const holdScore = Number(user.holdScore ?? 0);
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

  const quests = [
    {
      id: "self",
      title: "Verify with Self (+10 HOLD)",
      description: "Boost trust and unlock gated quests.",
      href: `/verification`,
      status: user.selfVerified ? ("done" as const) : ("available" as const),
      actionLabel: user.selfVerified ? "Done" : "Start",
    },
  ];

  const handle = formatHandle(user.handle ?? user.walletAddress ?? null);
  const displayName =
    user.displayName ||
    formatWalletFallback(user.walletAddress ?? null) ||
    "Den Builder";
  const avatarSrc = user.avatarUrl ?? "/avatar.png";

  return (
    <div className="space-y-6 text-wolf-foreground">
      {/* Labs CTA Card */}
      {!labsLoading && (
        <section className="wolf-card rounded-2xl border border-wolf-border bg-gradient-to-r from-[#89e24a]/10 to-transparent p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#89e24a]/30 bg-[#89e24a]/10">
                <FlaskConical className="h-6 w-6 text-[#89e24a]" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {hasLabs ? "My Labs" : "Get Started"}
                </h2>
                <p className="text-sm text-white/70">
                  {hasLabs
                    ? `You have ${labs.length} lab${labs.length > 1 ? "s" : ""} — continue managing feedback.`
                    : "Create your first lab to start collecting feedback."}
                </p>
              </div>
            </div>
            <NextLink
              href={hasLabs ? "/labs" : "/labs/create"}
              className="inline-flex items-center gap-2 rounded-full bg-[#89e24a] px-5 py-2.5 text-sm font-semibold text-[#05090f] transition hover:bg-[#7ad93e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89e24a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05090f]"
            >
              {hasLabs ? "Continue to My Labs" : "Create your first Lab"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </NextLink>
          </div>
        </section>
      )}

      <section className="wolf-card rounded-3xl border border-wolf-border p-6 text-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <ProfileAvatar
              src={avatarSrc}
              verified={Boolean(user.selfVerified)}
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
                user.role === "organizer" ? "OPERATOR" : "PLAYER"
              }`}
            />
          </div>
        </div>
      </section>

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

function ProfileAvatar({
  src,
  verified,
}: {
  src?: string | null;
  verified: boolean;
}) {
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

function LabStats({
  holdProgress,
  holdScore,
  stats,
}: {
  holdProgress: number;
  holdScore: number;
  stats: Array<{ label: string; value: string; meta: string }>;
}) {
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
    <NextLink
      href={quest.href}
      className="inline-flex items-center rounded-full border border-[#89e24a] px-4 py-1.5 text-xs font-semibold uppercase text-[#89e24a] transition hover:bg-[#89e24a] hover:text-[#05090f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89e24a]"
    >
      {quest.actionLabel}
    </NextLink>
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
