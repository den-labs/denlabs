"use client";

import { useDenUser } from "@/hooks/useDenUser";
import useMissions from "@/hooks/useMissions";
import { getActiveRun, type MissionType } from "@/lib/runs";

const TYPE_LABEL: Record<MissionType, string> = {
  quest: "Quest",
  minigame: "MiniGame",
  event: "Event",
};

export default function MissionsPage() {
  const user = useDenUser();
  const run = getActiveRun();
  const walletConnected = Boolean(user.walletAddress);
  const missionsState = useMissions({
    runId: run?.id ?? "no-active-run",
    walletAddress: user.walletAddress,
  });

  if (!run) {
    return (
      <div className="rounded-xl border border-wolf-border-mid bg-[#14181f]/60 p-6 text-sm text-white/75">
        No active Lab Run yet. Come back soon.
      </div>
    );
  }

  const { getStatus, setStatus } = missionsState;

  const bannerCopy = !walletConnected
    ? "Connect your wallet to see and track your missions."
    : !user.selfVerified
      ? "You are a Viewer. Verify with Self to unlock more missions and higher HOWL rewards."
      : "You are a Member. Self-verified missions are unlocked and HOWL multipliers apply.";

  return (
    <div className="space-y-8 text-wolf-foreground">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.32em] text-wolf-text-subtle">
          Builder Home
        </p>
        <div>
          <h1 className="text-2xl font-semibold text-white/90">{run.title}</h1>
          <p className="mt-2 text-sm text-white/70">
            {run.description ??
              "Track the missions for the current Lab Run. Finish them to earn HOWL and Spray drops."}
          </p>
        </div>
      </header>

      <div className="rounded-lg border border-wolf-border-mid bg-[#0f1319]/80 p-4 text-sm text-white/80">
        {bannerCopy}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {run.missions.map((mission) => {
          const requiresSelfGate =
            walletConnected && mission.requiresSelf && !user.selfVerified;
          const missionLocked = !walletConnected || requiresSelfGate;
          const status = getStatus(mission.id);
          const isCompleted = status === "completed";
          const badgeLabel = !walletConnected
            ? "Wallet required"
            : requiresSelfGate
              ? "Self required"
              : isCompleted
                ? "Completed"
                : "Available";
          const buttonLabel = !walletConnected
            ? "Connect wallet"
            : requiresSelfGate
              ? "Verify with Self"
              : "View mission";
          const lockHint = !walletConnected
            ? "Connect your wallet to interact with missions."
            : requiresSelfGate
              ? "Verify with Self to unlock this mission."
              : undefined;

          return (
            <article
              key={mission.id}
              className="flex h-full flex-col justify-between rounded-lg border border-wolf-border-strong bg-[#14181f]/70 p-5 shadow-[0_30px_90px_-65px_rgba(5,8,10,0.85)]"
            >
              <div className="space-y-2">
                <span className="wolf-pill bg-wolf-emerald-soft text-[0.65rem] uppercase tracking-[0.3em] text-wolf-emerald">
                  {TYPE_LABEL[mission.type]}
                </span>
                <h2 className="text-lg font-semibold text-white/90">
                  {mission.title}
                </h2>
                <p className="text-sm text-white/70">{mission.description}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Base reward: {mission.baseHowl ?? "TBD"} HOWL
                </p>
                {isCompleted ? (
                  <span className="wolf-pill border border-wolf-emerald/50 bg-wolf-emerald-soft px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-wolf-emerald">
                    Completed
                  </span>
                ) : null}
                {lockHint ? (
                  <p className="text-xs text-white/55">{lockHint}</p>
                ) : null}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="wolf-pill border border-wolf-border-mid px-3 py-1 uppercase tracking-[0.28em] text-white/70">
                  {badgeLabel}
                </span>
                {missionLocked ? (
                  <button
                    type="button"
                    disabled={!walletConnected}
                    className="rounded-lg bg-[linear-gradient(180deg,#c8ff64_0%,#8bea4e_55%,#3b572a_100%)] px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-[#0b1407] shadow-[0_0_24px_rgba(186,255,92,0.45)] transition enabled:hover:shadow-[0_0_30px_rgba(186,255,92,0.6)] disabled:opacity-40 disabled:shadow-none"
                  >
                    {buttonLabel}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStatus(mission.id, "completed")}
                    disabled={isCompleted}
                    className="rounded-lg bg-[linear-gradient(180deg,#c8ff64_0%,#8bea4e_55%,#3b572a_100%)] px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-[#0b1407] shadow-[0_0_24px_rgba(186,255,92,0.45)] transition enabled:hover:shadow-[0_0_30px_rgba(186,255,92,0.6)] disabled:opacity-40 disabled:shadow-none"
                  >
                    {isCompleted ? "Completed" : "Mark as completed"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
