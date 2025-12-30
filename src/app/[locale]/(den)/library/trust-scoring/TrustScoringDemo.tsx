"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

type ScanStatus = "idle" | "loading" | "success" | "error" | "not_implemented";

interface ScanResult {
  status: ScanStatus;
  message: string;
  data: Record<string, unknown> | null;
  input?: string;
}

export default function TrustScoringDemo() {
  const t = useTranslations("Scan8004");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  async function handleScan() {
    if (!input.trim()) {
      setResult({
        status: "error",
        message: t("errors.emptyInput"),
        data: null,
      });
      return;
    }

    setIsScanning(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/scan/8004?id=${encodeURIComponent(input.trim())}`,
      );
      const data: ScanResult = await response.json();
      setResult({ ...data, input: input.trim() });
    } catch (_error) {
      setResult({
        status: "error",
        message: t("errors.network"),
        data: null,
      });
    } finally {
      setIsScanning(false);
    }
  }

  function getStatusColor(status: ScanStatus): string {
    switch (status) {
      case "success":
        return "border-wolf-emerald/40 bg-wolf-emerald/10";
      case "error":
        return "border-red-500/40 bg-red-500/10";
      case "not_implemented":
        return "border-yellow-500/40 bg-yellow-500/10";
      default:
        return "border-white/10 bg-white/5";
    }
  }

  function getStatusIcon(status: ScanStatus) {
    switch (status) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "not_implemented":
        return "⚠";
      default:
        return "ℹ";
    }
  }

  return (
    <div className="space-y-6">
      {/* Scan Form */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="space-y-2">
          <label
            htmlFor="scan-input"
            className="text-sm font-medium text-white"
          >
            {t("form.label")}
          </label>
          <input
            id="scan-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder={t("form.placeholder")}
            className="w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 focus:border-wolf-emerald/40 focus:outline-none focus:ring-2 focus:ring-wolf-emerald/20"
          />
          <p className="text-xs text-white/50">{t("form.hint")}</p>
        </div>

        <button
          type="button"
          onClick={handleScan}
          disabled={isScanning || !input.trim()}
          className="w-full rounded-lg border border-[#4ca22a] bg-[#89e24a] px-6 py-3 font-semibold uppercase text-[#09140a] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(186,255,92,0.35)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isScanning ? t("form.scanning") : t("form.scan")}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div
          className={`space-y-4 rounded-2xl border p-6 ${getStatusColor(result.status)}`}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl" aria-hidden="true">
              {getStatusIcon(result.status)}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold uppercase text-white">
                  {t(`statuses.${result.status}`)}
                </p>
              </div>
              <p className="text-sm text-white/90">{result.message}</p>

              {result.input && (
                <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-semibold uppercase text-white/60">
                    {t("results.scanned")}
                  </p>
                  <p className="mt-1 break-all font-mono text-sm text-white">
                    {result.input}
                  </p>
                </div>
              )}

              {result.data && Object.keys(result.data).length > 0 && (
                <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-semibold uppercase text-white/60">
                    {t("results.data")}
                  </p>
                  <pre className="mt-2 overflow-x-auto text-xs text-white/80">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
        <p className="font-semibold text-white/90">{t("info.title")}</p>
        <p className="mt-2">{t("info.description")}</p>
      </div>
    </div>
  );
}
