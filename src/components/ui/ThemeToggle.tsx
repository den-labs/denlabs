"use client";

import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const t = useTranslations("ThemeToggle");

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-wolf-border-soft/80 bg-wolf-panel/80 px-1.5 py-1 text-xs font-semibold uppercase shadow-[0_0_20px_rgba(160,83,255,0.12)] backdrop-blur-md">
      <span className="flex items-center gap-1 rounded-lg px-3 py-1 bg-[linear-gradient(135deg,rgba(160,83,255,0.85),rgba(91,45,255,0.65))] text-white shadow-[0_0_24px_rgba(160,83,255,0.45)]">
        {t("dark")}
      </span>
    </div>
  );
}

export default ThemeToggle;
