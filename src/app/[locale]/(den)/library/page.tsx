"use client";

import {
  Gamepad2,
  Puzzle,
  Scan,
  ScanQrCode,
  Search,
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
  },
  {
    key: "premiumAccess",
    title: "Premium Access (x402)",
    description: "HTTP 402 Payment Required implementation",
    href: "/library/x402",
    icon: Sparkles,
    status: MODULE_STATUS.premiumAccess,
    category: "Monetization",
  },
  {
    key: "agentNetwork",
    title: "Agent Network (A2A)",
    description: "Agent-to-agent capability discovery",
    href: "/library/a2a",
    icon: Workflow,
    status: MODULE_STATUS.agentNetwork,
    category: "Infrastructure",
  },
  {
    key: "gamesLab",
    title: "Games Lab",
    description: "Interactive game engines and mechanics",
    href: "/library/games",
    icon: Gamepad2,
    status: MODULE_STATUS.gamesLab,
    category: "Engagement",
  },
  {
    key: "questsEngine",
    title: "Quests Engine",
    description: "Mission and reward systems for builders",
    href: "/library/quests",
    icon: Puzzle,
    status: MODULE_STATUS.questsEngine,
    category: "Engagement",
  },
  {
    key: "attendanceTools",
    title: "Attendance Tools",
    description: "Event check-in and tracking utilities",
    href: "/library/attendance",
    icon: ScanQrCode,
    status: MODULE_STATUS.attendanceTools,
    category: "Events",
  },
  {
    key: "votingSystem",
    title: "Voting System",
    description: "On-chain and off-chain voting mechanisms",
    href: "/library/voting",
    icon: Vote,
    status: MODULE_STATUS.votingSystem,
    category: "Governance",
  },
  {
    key: "sponsorToolkit",
    title: "Sponsor Toolkit",
    description: "Integration tools for event sponsors",
    href: "/library/sponsors",
    icon: Store,
    status: MODULE_STATUS.sponsorToolkit,
    category: "Monetization",
  },
];

const STATUS_CONFIG = {
  ready: { label: "🟢 Ready", color: "text-green-500" },
  experimental: { label: "🟡 Experimental", color: "text-yellow-500" },
  planned: { label: "🔵 Planned", color: "text-blue-500" },
  external: { label: "🔗 External", color: "text-gray-500" },
};

export default function LibraryIndexPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ModuleStatus | "all">("all");

  const filtered = LIBRARY_MODULES.filter((module) => {
    const matchesSearch =
      search === "" ||
      module.title.toLowerCase().includes(search.toLowerCase()) ||
      module.description.toLowerCase().includes(search.toLowerCase()) ||
      module.category.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "all" || module.status === filter;

    return matchesSearch && matchesFilter;
  });

  const categories = Array.from(
    new Set(LIBRARY_MODULES.map((m) => m.category)),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Browse Library</h2>
        <p className="mt-1 text-sm text-white/60">
          Explore modules, integrations, and experimental features
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-wolf-border bg-wolf-panel/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89e24a]"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-medium transition",
              filter === "all"
                ? "border-[#89e24a] bg-[#89e24a]/10 text-[#89e24a]"
                : "border-wolf-border bg-wolf-panel text-white/70 hover:text-white",
            )}
          >
            All
          </button>
          {(Object.keys(STATUS_CONFIG) as ModuleStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition",
                filter === status
                  ? "border-[#89e24a] bg-[#89e24a]/10 text-[#89e24a]"
                  : "border-wolf-border bg-wolf-panel text-white/70 hover:text-white",
              )}
            >
              {STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Module Grid */}
      {categories.map((category) => {
        const categoryModules = filtered.filter((m) => m.category === category);
        if (categoryModules.length === 0) return null;

        return (
          <div key={category} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-wolf-text-subtle">
              {category}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryModules.map((module) => {
                const Icon = module.icon;
                const statusConfig = STATUS_CONFIG[module.status];

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
                      <span
                        className={cn(
                          "text-xs font-medium",
                          statusConfig.color,
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <h4 className="mt-4 font-semibold text-white">
                      {module.title}
                    </h4>
                    <p className="mt-1 text-sm text-white/60">
                      {module.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-12 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-white/20" />
          <h3 className="text-lg font-semibold text-white/60">
            No modules found
          </h3>
          <p className="mt-2 text-sm text-white/40">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
