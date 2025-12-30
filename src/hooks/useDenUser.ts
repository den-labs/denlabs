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
  holdScore: number | null;
  handle?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export function useDenUser(): DenUser {
  const { address } = useAppKitAccount();
  const [selfVerified, setSelfVerified] = useState(false);
  const [holdScore, setHoldScore] = useState<number | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    setSelfVerified(getSelfVerification());
    return subscribeToSelfVerification(setSelfVerified);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchUserSession()
      .then((data) => {
        if (cancelled) {
          return;
        }
        setSession(data);
        setHoldScore(data.holdScore ?? 0);
        // Only update selfVerified from session if sessionStorage doesn't have a value
        // This prioritizes the local verification state over the server state
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
    holdScore,
    handle: session?.handle ?? null,
    displayName: null,
    avatarUrl: null,
  };
}
