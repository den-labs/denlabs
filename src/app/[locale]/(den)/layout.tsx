"use client";

import type { ReactNode } from "react";
import ActivityBottomSheet from "@/components/den/ActivityBottomSheet";
import ActivityRail from "@/components/den/ActivityRail";
import MobileDenLayout from "@/components/den/MobileDenLayout";
import {
  DenLayoutVariantProvider,
  DenRailSlotsProvider,
  useRailSlotActive,
  useRailSlotTarget,
} from "@/components/den/RailSlots";
import SidebarNav from "@/components/den/SidebarNav";
import StatusStrip from "@/components/den/StatusStrip";
import TopBar from "@/components/den/TopBar";

export default function DenLayout({ children }: { children: ReactNode }) {
  const desktopChildren = (
    <DenLayoutVariantProvider variant="desktop">
      {children}
    </DenLayoutVariantProvider>
  );
  const mobileChildren = (
    <DenLayoutVariantProvider variant="mobile">
      {children}
    </DenLayoutVariantProvider>
  );

  return (
    <DenRailSlotsProvider>
      <div className="wolf-neon-backdrop text-wolf-foreground">
        <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-2 sm:px-6">
          <DesktopLayout>{desktopChildren}</DesktopLayout>
          <ActivityBottomSheet />
          <MobileLayout>{mobileChildren}</MobileLayout>
        </div>
      </div>
    </DenRailSlotsProvider>
  );
}

function DesktopLayout({ children }: { children: ReactNode }) {
  const attachLeft = useRailSlotTarget("left");
  const attachRight = useRailSlotTarget("right");
  const leftActive = useRailSlotActive("left");
  const rightActive = useRailSlotActive("right");
  const leftPlaceholder = (
    <div className="flex h-full flex-col justify-center rounded-lg border border-dashed border-wolf-border-soft bg-wolf-charcoal-80/40 px-4 py-6 text-center text-[11px] font-semibold uppercase tracking-[0.4em] text-white/40">
      Verified On-Chain Event Lab
    </div>
  );
  const rightPlaceholder = (
    <div className="flex h-full flex-col justify-center rounded-lg border border-dashed border-wolf-border-soft bg-wolf-charcoal-80/40 px-4 py-6 text-center text-[11px] font-semibold uppercase tracking-[0.4em] text-white/40">
      Right Rail
    </div>
  );

  return (
    <div className="hidden md:flex md:flex-col md:gap-4 lg:gap-4">
      <SidebarNav />
      <StatusStrip className="justify-end" />
      <main className="rounded-lg border border-wolf-border-strong bg-[#14181f]/70 p-6 shadow-[0_40px_110px_-80px_rgba(0,0,0,0.75)]">
        <TopBar />
        <section className="mt-6 grid grid-cols-[220px_minmax(0,1fr)_260px] gap-6">
          <div ref={attachLeft}>{leftActive ? null : leftPlaceholder}</div>
          <div className="min-w-0">{children}</div>
          <div ref={attachRight}>{rightActive ? null : rightPlaceholder}</div>
        </section>
      </main>
    </div>
  );
}

function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="md:hidden">
      <MobileDenLayout
        main={
          <>
            <TopBar />
            <StatusStrip className="mt-4 justify-end" />
            <section className="mt-6 space-y-6">{children}</section>
          </>
        }
        menu={<SidebarNav variant="mobile" />}
        activity={<ActivityRail />}
      />
    </div>
  );
}
