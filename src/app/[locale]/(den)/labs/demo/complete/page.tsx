"use client";

import {
  AlertTriangle,
  ArrowRight,
  Bug,
  CheckCircle2,
  FlaskConical,
  Heart,
  LayoutDashboard,
  Lightbulb,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Tag,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";

type DemoFeedback = {
  content: string;
  type: string;
  timestamp: string;
};

type CapturedSignals = {
  tags: string[];
  priority: "Low" | "Medium" | "High";
  qualityScore: number;
  sentiment: "positive" | "neutral" | "constructive";
};

function analyzeFeedback(feedback: DemoFeedback): CapturedSignals {
  const content = feedback.content.toLowerCase();

  // Determine tags based on content and type
  const tags: string[] = [];
  if (feedback.type === "bug" || content.includes("bug") || content.includes("error") || content.includes("broken")) {
    tags.push("Bug");
  }
  if (feedback.type === "improvement" || content.includes("improve") || content.includes("better") || content.includes("could")) {
    tags.push("Feature Request");
  }
  if (feedback.type === "praise" || content.includes("love") || content.includes("great") || content.includes("awesome")) {
    tags.push("Praise");
  }
  if (content.includes("ui") || content.includes("ux") || content.includes("design") || content.includes("interface")) {
    tags.push("UX");
  }
  if (content.includes("slow") || content.includes("fast") || content.includes("performance")) {
    tags.push("Performance");
  }
  if (tags.length === 0) {
    tags.push("General");
  }

  // Determine priority
  let priority: "Low" | "Medium" | "High" = "Medium";
  if (content.includes("critical") || content.includes("urgent") || content.includes("broken") || content.includes("can't")) {
    priority = "High";
  } else if (content.includes("minor") || content.includes("small") || content.includes("nice to have")) {
    priority = "Low";
  }

  // Determine sentiment
  let sentiment: "positive" | "neutral" | "constructive" = "neutral";
  if (feedback.type === "praise" || content.includes("love") || content.includes("great") || content.includes("amazing")) {
    sentiment = "positive";
  } else if (feedback.type === "bug" || content.includes("fix") || content.includes("issue") || content.includes("problem")) {
    sentiment = "constructive";
  }

  // Calculate quality score (demo mock - based on length and structure)
  const lengthScore = Math.min(40, feedback.content.length / 5);
  const structureScore = feedback.content.includes(".") ? 20 : 10;
  const typeBonus = feedback.type !== "general" ? 15 : 0;
  const qualityScore = Math.min(100, Math.round(lengthScore + structureScore + typeBonus + 25));

  return { tags, priority, qualityScore, sentiment };
}

const PRIORITY_STYLES = {
  Low: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  Medium: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  High: "border-red-500/30 bg-red-500/10 text-red-400",
};

const SENTIMENT_ICONS = {
  positive: Heart,
  neutral: Lightbulb,
  constructive: Bug,
};

export default function DemoCompletePage() {
  const t = useTranslations("DemoComplete");
  const [feedback, setFeedback] = useState<DemoFeedback | null>(null);
  const [signals, setSignals] = useState<CapturedSignals | null>(null);
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    // Get feedback from sessionStorage
    const stored = sessionStorage.getItem("demoFeedback");
    if (stored) {
      const parsed = JSON.parse(stored) as DemoFeedback;
      setFeedback(parsed);
      setSignals(analyzeFeedback(parsed));
    }

    // Hide animation after delay
    const timer = setTimeout(() => setShowAnimation(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Fallback if no feedback stored
  if (!feedback) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <FlaskConical className="mx-auto mb-4 h-12 w-12 text-white/30" />
        <h1 className="mb-2 text-xl font-bold text-white">{t("noFeedback.title")}</h1>
        <p className="mb-6 text-sm text-white/60">{t("noFeedback.description")}</p>
        <Link
          href="/labs/demo/participant"
          className="inline-flex items-center gap-2 rounded-xl bg-[#baff5c] px-6 py-3 font-semibold text-[#09140a] transition hover:bg-[#89e24a]"
        >
          <Send className="h-5 w-5" />
          {t("noFeedback.cta")}
        </Link>
      </div>
    );
  }

  const SentimentIcon = signals ? SENTIMENT_ICONS[signals.sentiment] : Lightbulb;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Success Header */}
      <div className={`mb-8 text-center ${showAnimation ? "animate-pulse" : ""}`}>
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#baff5c]/30 bg-[#baff5c]/10">
          <CheckCircle2 className="h-8 w-8 text-[#baff5c]" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">{t("title")}</h1>
        <p className="text-white/60">{t("subtitle")}</p>
      </div>

      {/* Captured Signals Card */}
      {signals && (
        <div className="mb-8 rounded-2xl border border-[#baff5c]/20 bg-gradient-to-br from-[#baff5c]/5 to-transparent p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#baff5c]" />
            <h2 className="font-semibold text-white">{t("signals.title")}</h2>
          </div>

          <div className="space-y-4">
            {/* Tags */}
            <div className="flex items-start gap-3">
              <Tag className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/40" />
              <div>
                <p className="mb-1 text-xs text-white/50">{t("signals.tags")}</p>
                <div className="flex flex-wrap gap-2">
                  {signals.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/40" />
              <div>
                <p className="mb-1 text-xs text-white/50">{t("signals.priority")}</p>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${PRIORITY_STYLES[signals.priority]}`}
                >
                  {signals.priority}
                </span>
              </div>
            </div>

            {/* Quality Score */}
            <div className="flex items-start gap-3">
              <SentimentIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/40" />
              <div className="flex-1">
                <p className="mb-1 text-xs text-white/50">{t("signals.quality")}</p>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#baff5c] to-[#2fe68b] transition-all duration-1000"
                      style={{ width: `${signals.qualityScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-[#baff5c]">
                    {signals.qualityScore}/100
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* What This Means */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-3 font-semibold text-white">{t("meaning.title")}</h3>
        <p className="text-sm leading-relaxed text-white/70">
          {t("meaning.description")}
        </p>
      </div>

      {/* Next Steps */}
      <div className="mb-6">
        <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-white/50">
          {t("nextSteps.title")}
        </h3>

        <div className="space-y-3">
          {/* Primary: See Host Dashboard */}
          <Link
            href="/access"
            className="flex items-center justify-between rounded-xl border border-[#baff5c]/30 bg-[#baff5c]/10 p-4 transition hover:border-[#baff5c]/50 hover:bg-[#baff5c]/20"
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-5 w-5 text-[#baff5c]" />
              <div>
                <p className="font-medium text-white">{t("nextSteps.dashboard.title")}</p>
                <p className="text-xs text-white/60">{t("nextSteps.dashboard.description")}</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-[#baff5c]" />
          </Link>

          {/* Secondary: Create Your Lab */}
          <Link
            href="/access"
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="flex items-center gap-3">
              <Plus className="h-5 w-5 text-white/60" />
              <div>
                <p className="font-medium text-white">{t("nextSteps.create.title")}</p>
                <p className="text-xs text-white/60">{t("nextSteps.create.description")}</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-white/40" />
          </Link>

          {/* Tertiary: Submit Another */}
          <Link
            href="/labs/demo/participant"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent p-3 text-sm text-white/60 transition hover:border-white/20 hover:text-white/80"
          >
            <RefreshCw className="h-4 w-4" />
            {t("nextSteps.another")}
          </Link>
        </div>
      </div>

      {/* Back to Demo Hub */}
      <p className="text-center">
        <Link href="/labs/demo" className="text-sm text-white/50 hover:text-white/70">
          {t("backToDemo")}
        </Link>
      </p>
    </div>
  );
}
