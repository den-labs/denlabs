"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { cn } from "@/lib/utils";

const DropdownContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({ isOpen: false, setIsOpen: () => {} });

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: ReactNode;
}) {
  const { isOpen, setIsOpen } = useContext(DropdownContext);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  if (
    asChild &&
    typeof children === "object" &&
    children !== null &&
    "props" in children
  ) {
    const child = children as React.ReactElement;
    return <div onClick={handleClick}>{child}</div>;
  }

  return <div onClick={handleClick}>{children}</div>;
}

export function DropdownMenuContent({
  align = "end",
  className,
  children,
}: {
  align?: "start" | "center" | "end";
  className?: string;
  children: ReactNode;
}) {
  const { isOpen, setIsOpen } = useContext(DropdownContext);

  const alignClass = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }[align];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      <div
        className={cn(
          "absolute top-full z-50 mt-2 min-w-[160px] rounded-lg border border-white/10 bg-black/95 p-1 shadow-lg",
          alignClass,
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}

export function DropdownMenuItem({
  onClick,
  asChild,
  className,
  children,
}: {
  onClick?: () => void;
  asChild?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const { setIsOpen } = useContext(DropdownContext);

  const handleClick = () => {
    onClick?.();
    setIsOpen(false);
  };

  if (
    asChild &&
    typeof children === "object" &&
    children !== null &&
    "props" in children
  ) {
    const child = children as React.ReactElement;
    return (
      <div onClick={handleClick} className={cn("w-full", className)}>
        {child}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full rounded-md px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 py-2 text-xs font-semibold text-white/50">
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-white/10" />;
}
