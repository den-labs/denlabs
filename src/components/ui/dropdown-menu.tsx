"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
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

  if (asChild && typeof children === "object" && children !== null && "props" in children) {
    const child = children as React.ReactElement;
    return (
      <div onClick={handleClick}>
        {child}
      </div>
    );
  }

  return <div onClick={handleClick}>{children}</div>;
}

export function DropdownMenuContent({
  align = "end",
  children,
}: {
  align?: "start" | "center" | "end";
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
      <div
        className="fixed inset-0 z-40"
        onClick={() => setIsOpen(false)}
      />
      <div
        className={cn(
          "absolute top-full z-50 mt-2 min-w-[160px] rounded-lg border border-white/10 bg-black/95 p-1 shadow-lg",
          alignClass,
        )}
      >
        {children}
      </div>
    </>
  );
}

export function DropdownMenuItem({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: ReactNode;
}) {
  const { setIsOpen } = useContext(DropdownContext);

  const handleClick = () => {
    onClick?.();
    setIsOpen(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full rounded-md px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}
