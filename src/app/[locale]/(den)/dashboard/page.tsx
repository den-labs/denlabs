"use client";

import {
  AlertTriangle,
  BarChart3,
  LayoutDashboard,
  Trophy,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Component, type ReactNode, Suspense } from "react";
import { useDenUser } from "@/hooks/useDenUser";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Import components from old /lab page
import LabOverview from "./LabOverview";

// Error Boundary for Dashboard
type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class DashboardErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
          <div className="rounded-full bg-red-500/10 p-4">
            <AlertTriangle className="h-12 w-12 text-red-400" aria-hidden />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">
              Something went wrong
            </h2>
            <p className="text-sm text-white/60">
              The dashboard encountered an error. Please try again.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-lg bg-wolf-emerald px-6 py-2 text-sm font-semibold text-black transition hover:bg-wolf-emerald/90"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

type Tab = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const TABS: Tab[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "insights", label: "Insights", icon: BarChart3, adminOnly: true },
  { key: "leaderboard", label: "Leaderboard", icon: Trophy },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const user = useDenUser();
  const activeTab = searchParams.get("tab") || "overview";

  const isAdmin = user.role === "organizer";

  // Filter tabs based on role
  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <nav className="flex gap-1 border-b border-wolf-border">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <Link
              key={tab.key}
              href={`/dashboard?tab=${tab.key}`}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-semibold uppercase transition-colors",
                isActive ? "text-white" : "text-white/50 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-[#89e24a]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && <LabOverview />}
        {activeTab === "insights" && isAdmin && <InsightsTab />}
        {activeTab === "leaderboard" && <LeaderboardTab />}
      </div>
    </div>
  );
}

function InsightsTab() {
  return (
    <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-8 text-center text-white">
      <BarChart3 className="mx-auto mb-4 h-12 w-12 text-white/40" />
      <h3 className="text-xl font-semibold">Insights Dashboard</h3>
      <p className="mt-2 text-sm text-white/60">
        Analytics and engagement metrics across events.
      </p>
      <p className="mt-4 text-xs text-white/40">
        Coming soon - Stats, payouts, and retention analytics.
      </p>
    </div>
  );
}

function LeaderboardTab() {
  const mockEntries = [
    { position: 1, team: "Lunares", points: 1480 },
    { position: 2, team: "Pack Builders", points: 1340 },
    { position: 3, team: "Cosmic Wolves", points: 1295 },
    { position: 4, team: "Nebula Pack", points: 1102 },
  ];

  return (
    <div className="space-y-4">
      <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-6">
        <h3 className="text-sm font-semibold uppercase text-wolf-text-subtle">
          Leaderboard
        </h3>
        <p className="mt-1 text-xs text-white/60">
          Weekly ranking across the pack
        </p>
      </div>

      <div className="space-y-2">
        {mockEntries.map((entry) => (
          <div
            key={entry.position}
            className="wolf-card--muted flex items-center justify-between rounded-xl border border-wolf-border-soft p-4 text-white"
          >
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full font-semibold",
                  entry.position === 1 && "bg-[#ffd700]/20 text-[#ffd700]",
                  entry.position === 2 && "bg-[#c0c0c0]/20 text-[#c0c0c0]",
                  entry.position === 3 && "bg-[#cd7f32]/20 text-[#cd7f32]",
                  entry.position > 3 && "bg-white/10 text-white/60",
                )}
              >
                {entry.position}
              </span>
              <span className="font-medium">{entry.team}</span>
            </div>
            <span className="text-sm text-[#89e24a]">{entry.points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center text-white/60">
            Loading dashboard...
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </DashboardErrorBoundary>
  );
}
