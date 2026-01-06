"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect, useMemo, useState } from "react";
import {
  getSelfVerification,
  subscribeToSelfVerification,
} from "@/lib/selfVerification";
import { fetchUserSession, type UserSession } from "@/lib/userClient";

export type DenUser = {
  walletAddress: `0x${string}` | null;
  selfVerified: boolean;
  selfDid?: string | null;
  role: string;
  roles: string[];
  isBuilder: boolean;
  isMember: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean;
  holdScore: number | null;
  handle?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  refetch: () => Promise<void>;
};

export function useDenUser(): DenUser {
  const { address } = useAppKitAccount();
  const [selfVerified, setSelfVerified] = useState(false);
  const [holdScore, setHoldScore] = useState<number | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);

  const loadSession = async () => {
    try {
      const data = await fetchUserSession();
      setSession(data);
      setHoldScore(data.holdScore ?? 0);
      // Prioritize local verification state over server state
      const localVerification = getSelfVerification();
      setSelfVerified(localVerification || data.isSelfVerified || false);
    } catch {
      setHoldScore((previous) => previous ?? null);
    }
  };

  useEffect(() => {
    setSelfVerified(getSelfVerification());
    return subscribeToSelfVerification(setSelfVerified);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchUserSession()
      .then((data) => {
        if (cancelled) return;
        setSession(data);
        setHoldScore(data.holdScore ?? 0);
        const localVerification = getSelfVerification();
        setSelfVerified(localVerification || data.isSelfVerified || false);
      })
      .catch(() => {
        if (!cancelled) {
          setHoldScore((previous) => previous ?? null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedAddress = useMemo(() => {
    if (session?.walletAddress) {
      return session.walletAddress;
    }
    if (typeof address === "string" && address.startsWith("0x")) {
      return address as `0x${string}`;
    }
    return null;
  }, [address, session?.walletAddress]);

  const isBuilder = normalizedAddress !== null;
  const isAuthenticated = session?.isAuthenticated ?? false;
  const hasProfile = session?.hasProfile ?? false;
  const roles = isBuilder ? ["BUILDER"] : [];

  return {
    walletAddress: normalizedAddress,
    selfVerified,
    selfDid: null,
    role: "player",
    roles,
    isBuilder,
    isMember: isBuilder && selfVerified,
    isAdmin: false,
    isAuthenticated,
    hasProfile,
    holdScore,
    handle: session?.handle ?? null,
    displayName: session?.displayName ?? null,
    avatarUrl: session?.avatarUrl ?? null,
    refetch: loadSession,
  };
}
