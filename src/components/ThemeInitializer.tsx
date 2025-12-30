"use client";

import { useEffect } from "react";

const THEME_STORAGE_KEY = "denlabs-theme";

export default function ThemeInitializer() {
  useEffect(() => {
    const root = document.documentElement;
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        root.dataset.theme = stored;
        return;
      }
    } catch (error) {
      console.warn("Theme storage unavailable", error);
    }
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    root.dataset.theme = prefersDark ? "dark" : "dark";
  }, []);

  return null;
}
