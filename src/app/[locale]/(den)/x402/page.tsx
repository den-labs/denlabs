"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface X402DemoResponse {
  status: "demo" | "active" | "inactive" | "experimental";
  message: string;
  endpoints?: Array<{
    name: string;
    url: string;
    method: string;
  }>;
}

export default function X402Page() {
  const t = useTranslations("X402");
  const [demoResult, setDemoResult] = useState<X402DemoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleTryDemo() {
    setIsLoading(true);
    setDemoResult(null);

    try {
      const response = await fetch("/api/x402/demo");
      const data: X402DemoResponse = await response.json();
      setDemoResult(data);
    } catch (_error) {
      setDemoResult({
        status: "inactive",
        message: t("errors.network"),
      });
    } finally {
      setIsLoading(false);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "active":
        return "border-wolf-emerald/40 bg-wolf-emerald/10 text-wolf-emerald";
      case "demo":
      case "experimental":
        return "border-yellow-500/40 bg-yellow-500/10 text-yellow-500";
      case "inactive":
        return "border-red-500/40 bg-red-500/10 text-red-500";
      default:
        return "border-white/10 bg-white/5 text-white/70";
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5">
            <Sparkles className="h-6 w-6 text-wolf-emerald" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-semibold text-white">{t("title")}</h1>
        </div>
        <p className="text-white/70">{t("description")}</p>
      </div>

      {/* Concept Explanation */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-xl font-semibold text-white">{t("concept.title")}</h2>
        <p className="text-sm text-white/70">{t("concept.description")}</p>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-wolf-emerald">•</span>
            <span>{t("concept.item1")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-wolf-emerald">•</span>
            <span>{t("concept.item2")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-wolf-emerald">•</span>
            <span>{t("concept.item3")}</span>
          </li>
        </ul>
      </div>

      {/* Demo Section */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-xl font-semibold text-white">{t("demo.title")}</h2>
        <p className="text-sm text-white/70">{t("demo.description")}</p>

        <button
          type="button"
          onClick={handleTryDemo}
          disabled={isLoading}
          className="w-full rounded-lg border border-[#4ca22a] bg-[#89e24a] px-6 py-3 font-semibold uppercase text-[#09140a] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(186,255,92,0.35)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isLoading ? t("demo.testing") : t("demo.tryDemo")}
        </button>

        {demoResult && (
          <div
            className={`mt-4 rounded-xl border p-4 ${getStatusColor(demoResult.status)}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold uppercase">
                  {t(`statuses.${demoResult.status}`)}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusColor(demoResult.status)}`}
                >
                  {demoResult.status}
                </span>
              </div>
              <p className="text-sm text-white/90">{demoResult.message}</p>

              {demoResult.endpoints && demoResult.endpoints.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase text-white/60">
                    {t("demo.endpoints")}
                  </p>
                  {demoResult.endpoints.map((endpoint) => (
                    <div
                      key={endpoint.url}
                      className="rounded-lg border border-white/10 bg-black/20 p-3"
                    >
                      <p className="font-mono text-xs text-white">
                        <span className="text-wolf-emerald">{endpoint.method}</span>{" "}
                        {endpoint.url}
                      </p>
                      <p className="mt-1 text-xs text-white/60">{endpoint.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Code Example */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-xl font-semibold text-white">{t("example.title")}</h2>
        <p className="text-sm text-white/70">{t("example.description")}</p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-4 text-xs text-white/80">
          {t("example.code")}
        </pre>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
        <p className="font-semibold text-white/90">{t("info.title")}</p>
        <p className="mt-2">{t("info.description")}</p>
      </div>
    </div>
  );
}
