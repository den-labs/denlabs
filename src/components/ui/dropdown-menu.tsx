"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DropdownMenu({ children }: { children: ReactNode }) {
  return <div className="relative inline-block">{children}</div>;
}

export function DropdownMenuTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function DropdownMenuContent({
  align = "end",
  children,
}: {
  align?: "start" | "center" | "end";
  children: ReactNode;
}) {
  const alignClass = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }[align];

  return (
    <div
      className={cn(
        "absolute top-full z-50 mt-2 min-w-[160px] rounded-lg border border-white/10 bg-black/95 p-1 shadow-lg",
        alignClass,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-md px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}
