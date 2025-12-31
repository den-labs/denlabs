"use client";

import {
  Gamepad2,
  Lock,
  Puzzle,
  Scan,
  ScanQrCode,
  Shield,
  Sparkles,
  Store,
  Vote,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import type { ModuleStatus } from "@/config/moduleKeys";
import { MODULE_STATUS } from "@/config/moduleKeys";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LibraryModule = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  status: ModuleStatus;
  category: string;
  available: boolean;
};

const LIBRARY_MODULES: LibraryModule[] = [
  {
    key: "trustScoring",
    title: "Trust Scoring (8004)",
    description: "Address reputation and trust scoring system",
    href: "/library/trust-scoring",
    icon: Scan,
    status: MODULE_STATUS.trustScoring,
    category: "Infrastructure",
    available: true,
  },
  {
    key: "agentNetwork",
    title: "Agent Network (A2A)",
    description: "Agent-to-agent capability discovery",
    href: "/library/a2a",
    icon: Workflow,
    status: MODULE_STATUS.agentNetwork,
    category: "Infrastructure",
    available: true,
  },
  {
    key: "premiumAccess",
    title: "Premium Access (x402)",
    description: "HTTP 402 Payment Required implementation",
    href: "/library/x402",
    icon: Sparkles,
    status: MODULE_STATUS.premiumAccess,
    category: "Monetization",
    available: true,
  },
  {
    key: "eip3009Checker",
    title: "EIP-3009 Token Checker",
    description: "Detect EIP-3009 support for gasless transfers",
    href: "/tools/eip3009",
    icon: Shield,
    status: MODULE_STATUS.eip3009Checker ?? "experimental",
    category: "Tools",
    available: true,
  },
  {
    key: "gamesLab",
    title: "Games Lab",
    description: "Interactive game engines and mechanics",
    href: "/library/games",
    icon: Gamepad2,
    status: MODULE_STATUS.gamesLab,
    category: "Engagement",
    available: false,
  },
  {
    key: "questsEngine",
    title: "Quests Engine",
    description: "Mission and reward systems for builders",
    href: "/library/quests",
    icon: Puzzle,
    status: MODULE_STATUS.questsEngine,
    category: "Engagement",
    available: false,
  },
  {
    key: "attendanceTools",
    title: "Attendance Tools",
    description: "Event check-in and tracking utilities",
    href: "/library/attendance",
    icon: ScanQrCode,
    status: MODULE_STATUS.attendanceTools,
    category: "Events",
    available: false,
  },
  {
    key: "votingSystem",
    title: "Voting System",
    description: "On-chain and off-chain voting mechanisms",
    href: "/library/voting",
    icon: Vote,
    status: MODULE_STATUS.votingSystem,
    category: "Governance",
    available: false,
  },
  {
    key: "sponsorToolkit",
    title: "Sponsor Toolkit",
    description: "Integration tools for event sponsors",
    href: "/library/sponsors",
    icon: Store,
    status: MODULE_STATUS.sponsorToolkit,
    category: "Monetization",
    available: false,
  },
];

const categories = Array.from(new Set(LIBRARY_MODULES.map((m) => m.category)));

export default function LibraryIndexPage() {
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");

  const filtered = LIBRARY_MODULES.filter((module) => {
    return categoryFilter === "all" || module.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Browse Library</h2>
        <p className="mt-1 text-sm text-white/60">
          Explore modules, integrations, and experimental features
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            categoryFilter === "all"
              ? "bg-[#89e24a] text-black"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setCategoryFilter(category)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              categoryFilter === category
                ? "bg-[#89e24a] text-black"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Module Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((module) => {
          const Icon = module.icon;

          // Unavailable modules: grayscale, no link
          if (!module.available) {
            return (
              <div
                key={module.key}
                className="wolf-card--muted cursor-not-allowed rounded-2xl border border-wolf-border-mid p-5 opacity-60 grayscale"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-wolf-neutral-soft">
                    <Lock className="h-6 w-6 text-white/40" />
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/50">
                    {module.category}
                  </span>
                </div>
                <h4 className="mt-4 font-semibold text-white/50">
                  {module.title}
                </h4>
                <p className="mt-1 text-sm text-white/30">
                  {module.description}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-white/40">
                  <Lock className="h-3 w-3" />
                  Coming Soon
                </div>
              </div>
            );
          }

          // Available modules: full color, with link
          return (
            <Link
              key={module.key}
              href={module.href}
              className="group wolf-card--muted rounded-2xl border border-wolf-border-mid p-5 text-white transition hover:border-wolf-border-strong hover:bg-wolf-panel"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-wolf-neutral-soft transition group-hover:bg-[#89e24a]/10">
                  <Icon className="h-6 w-6 text-[#89e24a]" />
                </div>
                <span className="rounded-full bg-[#89e24a]/10 px-2.5 py-0.5 text-xs font-medium text-[#89e24a]">
                  {module.category}
                </span>
              </div>
              <h4 className="mt-4 font-semibold text-white">{module.title}</h4>
              <p className="mt-1 text-sm text-white/60">{module.description}</p>
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-12 text-center">
          <h3 className="text-lg font-semibold text-white/60">
            No modules found
          </h3>
          <p className="mt-2 text-sm text-white/40">
            Try selecting a different category
          </p>
        </div>
      )}
    </div>
  );
}
