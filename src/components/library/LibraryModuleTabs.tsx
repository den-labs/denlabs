"use client";

import { Book, BookOpen, FileText, Lightbulb, Shield } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export type DiátaxisTab =
  | "tutorial"
  | "demo"
  | "reference"
  | "concepts"
  | "best-practices";

const TABS = [
  { key: "tutorial" as const, label: "Tutorial", icon: BookOpen },
  { key: "demo" as const, label: "Demo", icon: Lightbulb },
  { key: "reference" as const, label: "Reference", icon: FileText },
  { key: "concepts" as const, label: "Concepts", icon: Book },
  { key: "best-practices" as const, label: "Best Practices", icon: Shield },
];

type LibraryModuleTabsProps = {
  modulePath: string;
  tutorialContent?: ReactNode;
  demoContent?: ReactNode;
  referenceContent?: ReactNode;
  conceptsContent?: ReactNode;
  bestPracticesContent?: ReactNode;
  defaultTab?: DiátaxisTab;
};

function LibraryModuleTabsContent({
  modulePath,
  tutorialContent,
  demoContent,
  referenceContent,
  conceptsContent,
  bestPracticesContent,
  defaultTab = "demo",
}: LibraryModuleTabsProps) {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as DiátaxisTab) || defaultTab;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <nav className="flex gap-1 border-b border-wolf-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          // Determine if tab has content
          const hasContent =
            (tab.key === "tutorial" && tutorialContent) ||
            (tab.key === "demo" && demoContent) ||
            (tab.key === "reference" && referenceContent) ||
            (tab.key === "concepts" && conceptsContent) ||
            (tab.key === "best-practices" && bestPracticesContent);

          if (!hasContent) return null;

          return (
            <Link
              key={tab.key}
              href={`${modulePath}?tab=${tab.key}`}
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
        {activeTab === "tutorial" && tutorialContent}
        {activeTab === "demo" && demoContent}
        {activeTab === "reference" && referenceContent}
        {activeTab === "concepts" && conceptsContent}
        {activeTab === "best-practices" && bestPracticesContent}
      </div>
    </div>
  );
}

export function LibraryModuleTabs(props: LibraryModuleTabsProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center text-white/60">
          Loading module...
        </div>
      }
    >
      <LibraryModuleTabsContent {...props} />
    </Suspense>
  );
}

// Empty state components for tabs
export function EmptyTabContent({ tabName }: { tabName: string }) {
  return (
    <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-12 text-center text-white">
      <BookOpen className="mx-auto mb-4 h-12 w-12 text-white/20" />
      <h3 className="text-lg font-semibold text-white/60">
        {tabName} Coming Soon
      </h3>
      <p className="mt-2 text-sm text-white/40">
        This section is being prepared and will be available soon.
      </p>
    </div>
  );
}
