"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const STORAGE_KEY = "denlabs-theme";
type ThemeMode = "light" | "dark";

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "dark";
}

export function ThemeToggle() {
  const t = useTranslations("ThemeToggle");
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const initial = resolveInitialTheme();
    setMode(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.warn("Unable to persist theme", error);
    }
  }, [mode]);

  const toggle = () => {
    setMode((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="relative flex items-center gap-1 rounded-lg border border-wolf-border-soft/80 bg-wolf-panel/80 px-1.5 py-1 text-xs font-semibold uppercase text-wolf-text-subtle shadow-[0_0_20px_rgba(160,83,255,0.12)] backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-[rgba(160,83,255,0.6)]"
      aria-pressed={mode === "dark"}
      aria-label="Toggle theme"
    >
      <span
        className={`flex items-center gap-1 rounded-lg px-3 py-1 transition ${
          mode === "light"
            ? "bg-wolf-neutral-soft text-white shadow-[0_0_16px_rgba(255,255,255,0.08)]"
            : "text-wolf-text-subtle"
        }`}
      >
        {t("light")}
      </span>
      <span
        className={`flex items-center gap-1 rounded-lg px-3 py-1 transition ${
          mode === "dark"
            ? "bg-[linear-gradient(135deg,rgba(160,83,255,0.85),rgba(91,45,255,0.65))] text-white shadow-[0_0_24px_rgba(160,83,255,0.45)]"
            : "text-wolf-text-subtle"
        }`}
      >
        {t("dark")}
      </span>
    </button>
  );
}

export default ThemeToggle;
