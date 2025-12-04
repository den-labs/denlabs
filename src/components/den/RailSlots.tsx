"use client";

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

type RailSlotName = "right";
type LayoutVariant = "desktop" | "mobile";

type RailSlotTargets = Record<RailSlotName, HTMLElement | null>;
type RailSlotActiveMap = Record<RailSlotName, boolean>;

type RailSlotsContextValue = {
  targets: RailSlotTargets;
  setTarget: (slot: RailSlotName, node: HTMLElement | null) => void;
  setActive: (slot: RailSlotName, isActive: boolean) => void;
  active: RailSlotActiveMap;
};

const RailSlotsContext = createContext<RailSlotsContextValue | null>(null);
const LayoutVariantContext = createContext<LayoutVariant>("desktop");

export function DenRailSlotsProvider({ children }: PropsWithChildren) {
  const [targets, setTargets] = useState<RailSlotTargets>({
    right: null,
  });
  const [active, setActiveState] = useState<RailSlotActiveMap>({
    right: false,
  });

  const setTarget = useCallback((slot: RailSlotName, node: HTMLElement | null) => {
    setTargets((prev) => {
      if (prev[slot] === node) {
        return prev;
      }
      return { ...prev, [slot]: node };
    });
  }, []);

  const setActive = useCallback((slot: RailSlotName, isActive: boolean) => {
    setActiveState((prev) => {
      if (prev[slot] === isActive) {
        return prev;
      }
      return { ...prev, [slot]: isActive };
    });
  }, []);

  const value = useMemo(
    () => ({
      targets,
      setTarget,
      setActive,
      active,
    }),
    [targets, setTarget, setActive, active],
  );

  return (
    <RailSlotsContext.Provider value={value}>
      {children}
    </RailSlotsContext.Provider>
  );
}

function useRailSlotsContext() {
  const context = useContext(RailSlotsContext);
  if (!context) {
    throw new Error("Den rail slots provider missing");
  }
  return context;
}

export function useRailSlotTarget(slot: RailSlotName) {
  const { setTarget } = useRailSlotsContext();
  return useCallback(
    (node: HTMLElement | null) => {
      setTarget(slot, node);
    },
    [setTarget, slot],
  );
}

export function useRailSlotActive(slot: RailSlotName) {
  const { active } = useRailSlotsContext();
  return active[slot];
}

type LayoutVariantProviderProps = PropsWithChildren<{
  variant: LayoutVariant;
}>;

export function DenLayoutVariantProvider({
  variant,
  children,
}: LayoutVariantProviderProps) {
  return (
    <LayoutVariantContext.Provider value={variant}>
      {children}
    </LayoutVariantContext.Provider>
  );
}

function useLayoutVariant() {
  return useContext(LayoutVariantContext);
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = () => {
      setIsDesktop(mediaQuery.matches);
    };
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isDesktop;
}

function createRailPortalSlot(slot: RailSlotName) {
  return function RailPortalSlot({ children }: PropsWithChildren) {
    const { targets, setActive } = useRailSlotsContext();
    const variant = useLayoutVariant();
    const isDesktopViewport = useIsDesktop();
    const shouldPortal = variant === "desktop" && isDesktopViewport;
    useEffect(() => {
      if (variant !== "desktop") {
        return;
      }
      setActive(slot, shouldPortal);
      return () => setActive(slot, false);
    }, [setActive, slot, shouldPortal, variant]);
    const target = targets[slot];
    if (!target || !shouldPortal) {
      return <>{children}</>;
    }
    return createPortal(children, target);
  };
}

export function DenMain({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export const DenRightRail = createRailPortalSlot("right");
