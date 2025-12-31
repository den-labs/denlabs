"use client";

import {
  Bug,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Heart,
  HelpCircle,
  Lightbulb,
  Loader2,
  PenLine,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/routing";

const QUICK_PROMPTS = [
  { id: "bug", icon: Bug, labelKey: "prompts.bug" },
  { id: "improvement", icon: Lightbulb, labelKey: "prompts.improvement" },
  { id: "praise", icon: Heart, labelKey: "prompts.praise" },
] as const;

const CHAR_LIMIT = 2000;

export default function DemoParticipantPage() {
  const t = useTranslations("DemoParticipant");
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePromptClick = (promptId: string) => {
    if (selectedPrompt === promptId) {
      setSelectedPrompt(null);
      setFeedback("");
    } else {
      setSelectedPrompt(promptId);
      const promptText = t(`prompts.${promptId}Placeholder`);
      setFeedback(promptText);
    }
  };

  const handleSubmit = async () => {
    if (!feedback.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Simulate processing time for better UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Store feedback in sessionStorage for the complete page
    const demoFeedback = {
      content: feedback,
      type: selectedPrompt || "general",
      timestamp: new Date().toISOString(),
    };
    sessionStorage.setItem("demoFeedback", JSON.stringify(demoFeedback));

    // Navigate to complete page
    router.push("/labs/demo/complete");
  };

  const charsRemaining = CHAR_LIMIT - feedback.length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-white/50">
        <Link href="/labs/demo" className="hover:text-white/70">
          {t("breadcrumb.demo")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-white/70">{t("breadcrumb.participant")}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#baff5c]/30 bg-[#baff5c]/10">
            <FlaskConical className="h-5 w-5 text-[#baff5c]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t("title")}</h1>
            <p className="text-sm text-white/50">{t("sandbox")}</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#baff5c] text-xs font-bold text-black">
            <PenLine className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-medium text-white">{t("stepper.write")}</span>
        </div>
        <div className="h-px w-8 bg-white/20" />
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs font-medium text-white/50">
            <Send className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm text-white/50">{t("stepper.submit")}</span>
        </div>
        <div className="h-px w-8 bg-white/20" />
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs font-medium text-white/50">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm text-white/50">{t("stepper.results")}</span>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
        {/* Quick Prompts */}
        <div className="mb-4">
          <p className="mb-3 text-sm text-white/60">{t("quickPrompts")}</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => {
              const Icon = prompt.icon;
              const isSelected = selectedPrompt === prompt.id;
              return (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => handlePromptClick(prompt.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "border border-[#baff5c]/50 bg-[#baff5c]/20 text-[#baff5c]"
                      : "border border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(prompt.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea */}
        <div className="mb-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value.slice(0, CHAR_LIMIT))}
            placeholder={t("placeholder")}
            rows={5}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#baff5c]/50 focus:outline-none focus:ring-1 focus:ring-[#baff5c]/50"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-white/40">
            <span>{t("helper")}</span>
            <span
              className={charsRemaining < 100 ? "text-yellow-400" : ""}
            >
              {charsRemaining} {t("charsRemaining")}
            </span>
          </div>
        </div>

        {/* Trust scoring note - lightweight */}
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
          <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/40" />
          <p className="text-xs text-white/50">
            {t("trustNote")}{" "}
            <button
              type="button"
              className="text-white/60 underline decoration-dotted underline-offset-2 hover:text-white/80"
            >
              {t("learnMore")}
            </button>
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!feedback.trim() || isSubmitting}
          className="w-full rounded-xl bg-[#baff5c] px-6 py-4 font-semibold text-[#09140a] transition hover:bg-[#89e24a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("submitting")}
            </span>
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <Send className="h-5 w-5" />
              {t("submitButton")}
            </span>
          )}
        </button>
      </div>

      {/* Back link */}
      <p className="mt-6 text-center">
        <Link
          href="/labs/demo"
          className="text-sm text-white/50 hover:text-white/70"
        >
          {t("backToDemo")}
        </Link>
      </p>
    </div>
  );
}
