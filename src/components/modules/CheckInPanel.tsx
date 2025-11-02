"use client";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import SelfAuth from "@/components/SelfAuth";
import StatusPill from "@/components/ui/StatusPill";
import {
  getSelfVerification,
  subscribeToSelfVerification,
} from "@/lib/selfVerification";

type EventStatus = "live" | "upcoming" | "closed";

type CheckInEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  status: EventStatus;
};

const MOCK_WALLET_ADDRESS = "0xa1ce5f4b28f2d9aa3cc71883d5e99a9a9b123456";

function formatAddress(address: string) {
  if (address.length <= 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function eventTone(status: EventStatus) {
  if (status === "live") {
    return "bg-[#14181f]/70";
  }
  if (status === "upcoming") {
    return "bg-[#14181f]/70";
  }
  return "bg-[#14181f]/70";
}

function statusBadgeTone(status: EventStatus) {
  if (status === "live") {
    return "bg-[#14181f]/70";
  }
  if (status === "upcoming") {
    return "bg-[#14181f]/70";
  }
  return "bg-[#14181f]/70";
}

function getRegisterClass(
  hasIdentity: boolean,
  isRegistered: boolean,
  isClosed: boolean,
) {
  if (!hasIdentity || isRegistered || isClosed) {
    return "cursor-not-allowed bg-wolf-charcoal-70 text-wolf-text-subtle";
  }
  return "bg-[linear-gradient(180deg,#c8ff64_0%,#8bea4e_55%,#3b572a_100%)] text-[#0b1407] shadow-[0_0_24px_rgba(186,255,92,0.35)] hover:shadow-[0_0_30px_rgba(186,255,92,0.45)]";
}

function getCheckInClass(
  hasIdentity: boolean,
  isRegistered: boolean,
  isLive: boolean,
  isCheckedIn: boolean,
) {
  if (!hasIdentity || !isRegistered || !isLive) {
    return "cursor-not-allowed bg-wolf-charcoal-70 text-wolf-text-subtle";
  }
  if (isCheckedIn) {
    return "bg-wolf-emerald-tint text-wolf-emerald";
  }
  return "bg-wolf-emerald-soft text-wolf-emerald hover:bg-wolf-emerald-tint hover:text-wolf-emerald";
}

export function CheckInPanel() {
  const t = useTranslations("CheckInPanel");
  const translate = (key: string, fallback: string) => {
    try {
      return t(key);
    } catch {
      return fallback;
    }
  };
  const events = useMemo(() => {
    try {
      const raw = t.raw("events.items");
      return Array.isArray(raw) ? (raw as CheckInEvent[]) : [];
    } catch {
      return [];
    }
  }, [t]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isSelfVerified, setIsSelfVerified] = useState(false);
  const [registrations, setRegistrations] = useState<Record<string, boolean>>(
    {},
  );
  const [checkIns, setCheckIns] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsSelfVerified(getSelfVerification());
    return subscribeToSelfVerification(setIsSelfVerified);
  }, []);

  const hasIdentity = isSelfVerified || Boolean(walletAddress);

  const handleConnectWallet = () => {
    if (!walletAddress) {
      setWalletAddress(MOCK_WALLET_ADDRESS);
    }
  };

  const handleDisconnectWallet = () => {
    setWalletAddress(null);
  };

  const handleRegister = (eventId: string) => {
    if (!hasIdentity) {
      return;
    }
    setRegistrations((current) => ({
      ...current,
      [eventId]: true,
    }));
  };

  const handleCheckIn = (eventId: string) => {
    if (!hasIdentity || !registrations[eventId]) {
      return;
    }
    setCheckIns((current) => ({
      ...current,
      [eventId]: true,
    }));
  };

  const checkInStatus = isSelfVerified ? "verified" : "pending";

  return (
    <div className="grid gap-6 text-wolf-foreground lg:grid-cols-[360px_1fr]">
      <div className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-x-6 top-4 h-28 rounded-lg" />
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center justify-between">

            <span className="text-xs uppercase tracking-[0.3em] text-wolf-emerald">
              HOWL Sync
            </span>
          </div>
          <p className="mt-2 text-xs text-white/70">
            {translate(
              "selfHelper",
              "Verify with Self to unlock admin access to live experiences.",
            )}
          </p>
          <div className="mt-6">
            <SelfAuth />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="bg-[#14181f]/70 rounded-lg border border-wolf-border px-7 py-6 text-white/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-wolf-text-subtle">
                {translate("wallet.title", "Wallet access")}
              </p>
              <p className="mt-2 text-sm text-white/75">
                {translate(
                  "wallet.description",
                  "Connect a wallet to receive prizes, sprays, and follow-up drops.",
                )}
              </p>
            </div>
            <span className="border border-wolf-border-mid text-xs uppercase tracking-[0.28em] text-wolf-text-subtle">
              {walletAddress
                ? translate("wallet.connectedLabel", "Wallet linked")
                : translate("wallet.connectLabel", "Wallet needed")}
            </span>
          </div>
          <p className="mt-5 text-xs text-white/60">
            {translate(
              "wallet.helper",
              "Participants can start with a wallet and add Self later for HOWL and sponsor metrics.",
            )}
          </p>
        </div>
        <div className="rounded-lg border border-wolf-border-strong py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold uppercase tracking-[0.2em] text-white/90">
                {translate("events.title", "Event roster")}
              </h3>
              <p className="mt-1 text-sm text-white/75">
                {translate(
                  "events.description",
                  "Register ahead of time and check in when doors open.",
                )}
              </p>
            </div>
          </div>
          {!hasIdentity ? (
            <div className="mt-5 rounded-lg border border-dashed border-wolf-border-mid bg-wolf-charcoal-70/40 px-4 py-3 text-xs text-white/65">
              {translate(
                "events.identityHint",
                "Connect a wallet or finish Self verification to reserve your spot.",
              )}
            </div>
          ) : null}
          {events.length > 0 ? (
            <div className="mt-6 space-y-4">
              {events.map((event) => {
                const isRegistered = Boolean(registrations[event.id]);
                const isCheckedIn = Boolean(checkIns[event.id]);
                const isLive = event.status === "live";
                const isClosed = event.status === "closed";
                const registerClass = getRegisterClass(
                  hasIdentity,
                  isRegistered,
                  isClosed,
                );
                const checkInClass = getCheckInClass(
                  hasIdentity,
                  isRegistered,
                  isLive,
                  isCheckedIn,
                );

                return (
                  <div
                    key={event.id}
                    className={`rounded-lg p-5 transition ${eventTone(event.status)}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-wolf-text-subtle">
                          {event.location}
                        </p>
                        <h4 className="mt-1 text-lg font-semibold text-white/90">
                          {event.name}
                        </h4>
                        <p className="text-sm text-white/70">{event.date}</p>
                      </div>
                      <span
                        className={`wolf-pill text-xs uppercase tracking-[0.28em] ${statusBadgeTone(
                          event.status,
                        )}`}
                      >
                        {translate(
                          `events.status.${event.status}`,
                          event.status === "live"
                            ? "Live"
                            : event.status === "upcoming"
                              ? "Upcoming"
                              : "Closed",
                        )}
                      </span>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className={`rounded-lg px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${registerClass}`}
                        onClick={() => handleRegister(event.id)}
                        disabled={!hasIdentity || isRegistered || isClosed}
                      >
                        {isRegistered
                          ? translate("events.registered", "Registered")
                          : translate("events.register", "Register")}
                      </button>
                      <button
                        type="button"
                        className={`rounded-lg px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${checkInClass}`}
                        onClick={() => handleCheckIn(event.id)}
                        disabled={!hasIdentity || !isRegistered || !isLive}
                      >
                        {isCheckedIn
                          ? translate("events.checkedIn", "Checked in")
                          : translate("events.checkIn", "Check-in now")}
                      </button>
                    </div>
                    {isCheckedIn ? (
                      <p className="mt-3 text-xs text-wolf-emerald">
                        {translate(
                          "events.checkedInHelper",
                          "You’re counted in. HOWL points and rewards are ready.",
                        )}
                      </p>
                    ) : null}
                    {!hasIdentity ? (
                      <p className="mt-3 text-xs text-wolf-text-subtle">
                        {translate(
                          "events.identityReminder",
                          "Identity required to register.",
                        )}
                      </p>
                    ) : null}
                    {hasIdentity && !isRegistered && isClosed ? (
                      <p className="mt-3 text-xs text-wolf-text-subtle">
                        {translate("events.closed", "Registration closed.")}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 text-sm text-wolf-text-subtle">
              {translate(
                "events.empty",
                "No upcoming events yet. Check back soon.",
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckInPanel;
