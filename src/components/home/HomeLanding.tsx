"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "@/i18n/routing";

const HOW_IT_WORKS_STEPS = [
  {
    title: "Import",
    description: "CSV/Luma → roster con wallets.",
  },
  {
    title: "Verify",
    description: "Self Gate antes de perks/premios.",
  },
  {
    title: "Pay",
    description: "Smart contract ejecuta y muestra hash/recibo.",
  },
] as const;

const MINI_GAMES = [
  {
    title: "Roulette",
    description: "Rondas custom, 1-N ganadores, auto-payout.",
    chip: "tx: 0x…e2f9",
    ctaLabel: "Open Roulette Demo",
  },
  {
    title: "Race",
    description: "Carreras animadas, pagos directos al final.",
    chip: "pool left: 42%",
    ctaLabel: "Open Race Demo",
  },
] as const;

const KPI_BADGES = [
  { value: "≥95%", label: "auto-payouts in-event" },
  { value: "≥70%", label: "play a mini-game" },
  { value: "≥90%", label: "Self before perks" },
  { value: "8/10", label: "NPS organizer" },
  { value: "≥3", label: "sponsor activations/pilot" },
  { value: "50%", label: "return ≤90d" },
] as const;

function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-6 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1012] p-8 text-white shadow-[0_24px_60px_rgba(5,8,10,0.7)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/60 transition hover:border-white/30 hover:text-white"
          type="button"
        >
          Close
        </button>
        <h2 id="modal-title" className="text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-3 text-sm text-white/80">{description}</p>
        <div className="mt-6 space-y-4 text-sm text-white/70">{children}</div>
      </div>
    </div>
  );
}

export default function HomeLanding() {
  const [isSelfGateOpen, setIsSelfGateOpen] = useState(false);
  const [isOpsPanelOpen, setIsOpsPanelOpen] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden bg-[#050809] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(160,83,255,0.32),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(60,196,134,0.28),transparent_52%)]" />
        <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-16 px-6 py-16 text-balance sm:px-10">
          <section className="flex flex-col items-center gap-8 text-center">
            {/* <p className="wolf-pill bg-white/8 text-xs font-semibold uppercase tracking-[0.32em] text-white/70">
              Events toolkit
            </p> */}
            <h1 className="max-w-[22ch] text-4xl font-semibold leading-tight sm:text-5xl">
              {`{ Den Labs }`}
            </h1>
            <p className="max-w-[46ch] text-base text-white/75">
              Verified On-Chain Event Lab
            </p>
            <Image
              src="/denlabs.png"
              alt="Den Labs logo"
              width={160}
              height={160}
              className="mx-auto h-24 w-24 sm:h-32 sm:w-32"
              priority
            />
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/auth"
                className="den-button-primary uppercase font-bold"
              >
                Ship Fast, Play Smart
              </Link>
            </div>
            <p className="text-sm font-medium text-white/60">
              1,240+ payouts • 0 disputes • 6 pilot sponsors
            </p>
            <div className="flex items-center gap-3 text-xs text-white/60">
              <button
                type="button"
                className="underline underline-offset-4 transition hover:text-white"
                onClick={() => setIsSelfGateOpen(true)}
              >
                Self Gate (Anti-Sybil)
              </button>
              <span aria-hidden="true">•</span>
              <button
                type="button"
                className="underline underline-offset-4 transition hover:text-white"
                onClick={() => setIsOpsPanelOpen(true)}
              >
                Ops Panel
              </button>
            </div>
          </section>

          <section
            id="how-it-works"
            className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center sm:grid-cols-3"
          >
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div key={step.title} className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
                  {step.title}
                </p>
                <p className="text-sm text-white/80">{step.description}</p>
              </div>
            ))}
          </section>

          <section
            id="mini-games"
            className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:grid-cols-2"
          >
            {MINI_GAMES.map((game) => (
              <article
                key={game.title}
                className="flex h-full flex-col justify-between rounded-xl border border-white/8 bg-black/30 p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.26em] text-white/60">
                    <span>{game.title}</span>
                    <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.65rem] normal-case tracking-normal text-white/70">
                      {game.chip}
                    </span>
                  </div>
                  <p className="text-sm text-white/80">{game.description}</p>
                </div>
                <button
                  type="button"
                  className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-wolf-emerald transition hover:text-white"
                >
                  {game.ctaLabel}
                </button>
              </article>
            ))}
          </section>

          <section
            id="proof"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold uppercase tracking-[0.28em] text-white/80">
                Proof & KPIs
              </h2>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMethodology((prev) => !prev)}
                  className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70 underline underline-offset-4 transition hover:text-white"
                >
                  Methodology
                </button>
                {showMethodology ? (
                  <div className="absolute right-0 top-10 z-20 w-60 rounded-xl border border-white/10 bg-black/80 p-4 text-left text-xs text-white/70 shadow-xl">
                    <p>Pilots on Base + Polygon; 90d cohort averaged.</p>
                    <p className="mt-2">
                      Organizer surveys (n=32) + on-chain receipts matched per
                      event.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {KPI_BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="flex flex-col items-start gap-1 rounded-xl border border-white/8 bg-black/30 px-5 py-4"
                >
                  <span className="text-2xl font-semibold text-white">
                    {badge.value}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section
            id="final-cta"
            className="flex flex-col items-center gap-4 rounded-2xl border border-wolf-emerald/40 bg-wolf-emerald/10 p-8 text-center"
          >
            <p className="text-2xl font-semibold text-white">
              Start in 90 seconds
            </p>
            <p className="text-sm text-white/75">
              Trigger Self Gate, load your roster, launch the prize pool.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/auth" className="den-button-primary">
                launch
              </Link>
              <button
                type="button"
                className="den-button-ghost"
                onClick={() => setIsSelfGateOpen(true)}
              >
                See Trust Rules
              </button>
            </div>
          </section>
        </main>
      </div>

      {isSelfGateOpen ? (
        <Modal
          title="Self Gate (Anti-Sybil)"
          description="Humans in, bots out—by design."
          onClose={() => setIsSelfGateOpen(false)}
        >
          <p>
            Challenge Self en cada evento; `/api/self/verify` guarda el sello y
            la UI bloquea jugar, reclamar premios o puntos premium hasta
            completar la verificación.
          </p>
          <button
            type="button"
            className="den-button-primary"
            onClick={() => setIsSelfGateOpen(false)}
          >
            Open Trust Rules
          </button>
        </Modal>
      ) : null}

      {isOpsPanelOpen ? (
        <Modal
          title="Ops Panel"
          description={"Setup <15 min. Todo en un panel."}
          onClose={() => setIsOpsPanelOpen(false)}
        >
          <p>
            Roster importado, pools configurados, roles asignados, check-in
            verificado y fallback de auditoría manual listo por si acaso.
          </p>
          <button
            type="button"
            className="den-button-primary"
            onClick={() => setIsOpsPanelOpen(false)}
          >
            Open Ops Panel
          </button>
        </Modal>
      ) : null}
    </>
  );
}
