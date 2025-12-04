"use client";

import React, {
  cloneElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type SVGProps,
} from "react";
import { cn } from "@/lib/utils";

const DefaultHomeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...(props as Record<string, unknown>)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

const DefaultCompassIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...(props as Record<string, unknown>)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
  </svg>
);

const DefaultBellIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...(props as Record<string, unknown>)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export type NavItem = {
  id: string | number;
  icon: ReactElement;
  label?: string;
  onClick?: () => void;
};

const defaultNavItems: NavItem[] = [
  { id: "default-home", icon: <DefaultHomeIcon />, label: "Home" },
  { id: "default-explore", icon: <DefaultCompassIcon />, label: "Explore" },
  { id: "default-notifications", icon: <DefaultBellIcon />, label: "Notifications" },
];

export type LimelightNavProps = {
  items?: NavItem[];
  defaultActiveIndex?: number;
  activeIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
  limelightClassName?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
};

/**
 * An adaptive-width navigation bar with a "limelight" effect that highlights the active item.
 */
export const LimelightNav = ({
  items = defaultNavItems,
  defaultActiveIndex = 0,
  activeIndex,
  onTabChange,
  className,
  limelightClassName,
  iconContainerClassName,
  iconClassName,
}: LimelightNavProps) => {
  const [internalIndex, setInternalIndex] = useState(defaultActiveIndex);
  const [isReady, setIsReady] = useState(false);
  const navItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const limelightRef = useRef<HTMLDivElement | null>(null);
  const currentIndex = typeof activeIndex === "number" ? activeIndex : internalIndex;

  useLayoutEffect(() => {
    if (items.length === 0) return;
    const limelight = limelightRef.current;
    const activeItem = navItemRefs.current[currentIndex];

    if (limelight && activeItem) {
      const newLeft =
        activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2;
      limelight.style.left = `${newLeft}px`;
      if (!isReady) {
        setTimeout(() => setIsReady(true), 50);
      }
    }
  }, [currentIndex, isReady, items]);

  if (items.length === 0) {
    return null;
  }

  const handleItemClick = (index: number, itemOnClick?: () => void) => {
    if (typeof activeIndex !== "number") {
      setInternalIndex(index);
    }
    onTabChange?.(index);
    itemOnClick?.();
  };

  return (
    <nav
      className={cn(
        "relative inline-flex h-16 items-center rounded-2xl border border-wolf-border-soft bg-wolf-charcoal-90/80 px-2 text-white shadow-[0_25px_65px_-35px_rgba(0,0,0,0.55)] backdrop-blur",
        className,
      )}
    >
      {items.map(({ id, icon, label, onClick }, index) => (
        <button
          key={id}
          ref={(el) => {
            navItemRefs.current[index] = el;
          }}
          type="button"
          className={cn(
            "relative z-20 flex h-full flex-1 cursor-pointer items-center justify-center rounded-xl p-4",
            iconContainerClassName,
          )}
          onClick={() => handleItemClick(index, onClick)}
          aria-label={label}
        >
          {cloneElement(icon, {
            className: cn(
              "h-5 w-5 transition-opacity duration-100 ease-in-out",
              currentIndex === index ? "opacity-100" : "opacity-40",
              (icon.props as Record<string, unknown>)?.className ?? "",
              iconClassName,
            ),
          })}
        </button>
      ))}
      <div
        ref={limelightRef}
        className={cn(
          "pointer-events-none absolute top-0 z-10 h-[5px] w-11 rounded-full bg-[linear-gradient(130deg,#d6ff7c,#5de358)] shadow-[0_50px_15px_rgba(115,255,129,0.25)]",
          isReady ? "transition-[left] duration-300 ease-out" : "",
          limelightClassName,
        )}
        style={{ left: "-999px" }}
        aria-hidden
      >
        <div className="pointer-events-none absolute left-[-30%] top-[5px] h-14 w-[160%] bg-gradient-to-b from-[#d6ff7c4d] to-transparent [clip-path:polygon(5%_100%,25%_0,75%_0,95%_100%)]" />
      </div>
    </nav>
  );
};

export default LimelightNav;
