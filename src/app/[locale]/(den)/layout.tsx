"use client";

import type { ReactNode } from "react";
import ActivityBottomSheet from "@/components/den/ActivityBottomSheet";
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
import WalletMenu from "@/components/den/WalletMenu";
import { FloatingFeedbackButton } from "@/components/modules/labs/FloatingFeedbackButton";
import { SidebarProvider } from "@/components/ui/sidebar";
import { EventLabInstrumentationProvider } from "@/providers/EventLabInstrumentationProvider";

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
    <EventLabInstrumentationProvider labSlug={null}>
      <SidebarProvider>
        <DenRailSlotsProvider>
          <div className="bg-sidebar text-sidebar-foreground">
            <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-4 px-4 py-4 md:flex-row">
              <SidebarNav />
              <div className="flex w-full flex-col gap-4">
                <DesktopLayout>{desktopChildren}</DesktopLayout>
                <ActivityBottomSheet />
                <MobileLayout>{mobileChildren}</MobileLayout>
              </div>
            </div>
          </div>
          {/* Floating Feedback Button (only visible when Lab Mode is active) */}
          <FloatingFeedbackButton />
        </DenRailSlotsProvider>
      </SidebarProvider>
    </EventLabInstrumentationProvider>
  );
}

function DesktopLayout({ children }: { children: ReactNode }) {
  const attachRight = useRailSlotTarget("right");
  const rightActive = useRailSlotActive("right");

  return (
    <div className="hidden md:flex md:flex-1 md:flex-col">
      <div className="rounded-2xl border border-[#232a36] bg-[#05090f]/95 p-6 text-white shadow-[0_45px_120px_-80px_rgba(7,11,20,0.85)] backdrop-blur-xl">
        <section className="space-y-6">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-6">
            <div className="min-w-0 flex-1">
              <TopBar />
            </div>
            <div className="hidden md:flex lg:hidden items-center gap-2">
              <WalletMenu />
              <StatusStrip variant="icons-only" className="justify-end" />
            </div>
            <div className="hidden lg:flex lg:justify-self-end items-center gap-3">
              <StatusStrip className="justify-end" />
              <WalletMenu />
            </div>
          </header>
          <div
            className={`grid gap-6 ${
              rightActive
                ? "lg:grid-cols-[minmax(0,1fr)_300px]"
                : "lg:grid-cols-1"
            }`}
          >
            <div className="min-w-0">{children}</div>
            {rightActive && (
              <div ref={attachRight} className="hidden lg:block" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="md:hidden">
      <MobileDenLayout
        main={
          <>
            <header className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <TopBar />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <WalletMenu />
                <StatusStrip variant="wallet-only" className="shrink-0" />
              </div>
            </header>
            <section className="mt-6 space-y-6">{children}</section>
          </>
        }
      />
    </div>
  );
}
