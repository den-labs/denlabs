"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
    </div>
  );
}

export function TooltipTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: ReactNode;
}) {
  return <div className="inline-flex">{children}</div>;
}

export function TooltipContent({
  side = "top",
  className,
  children,
}: {
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  children: ReactNode;
}) {
  const sideStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className={cn(
        "absolute z-50 rounded-lg border border-white/10 bg-black/95 px-3 py-2 text-sm text-white shadow-lg",
        sideStyles[side],
        className,
      )}
    >
      {children}
    </div>
  );
}
