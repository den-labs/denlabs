"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MissionStatus } from "@/lib/runs";

const STORAGE_PREFIX = "denlabs:missions";
const DEFAULT_STATUS: MissionStatus = "available";

type MissionStatusMap = Record<string, MissionStatus>;

const memoryCache = new Map<string, MissionStatusMap>();

function isMissionStatus(value: unknown): value is MissionStatus {
  return (
    value === "locked" ||
    value === "available" ||
    value === "in_progress" ||
    value === "completed" ||
    value === "eligible_for_reward"
  );
}

function normalizeWallet(walletAddress?: string | null) {
  if (typeof walletAddress === "string" && walletAddress.trim().length > 0) {
    return walletAddress.toLowerCase();
  }
  return null;
}

function getStorageKey(
  runId: string,
  walletAddress?: string | null,
): string | null {
  const normalized = normalizeWallet(walletAddress);
  if (!normalized) return null;
  return `${STORAGE_PREFIX}:${runId}:${normalized}`;
}

function readStatuses(key: string | null): MissionStatusMap {
  if (!key) return {};
  if (memoryCache.has(key)) {
    return memoryCache.get(key) ?? {};
  }

  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};

    const safeEntries: MissionStatusMap = {};
    for (const [missionId, status] of Object.entries(parsed)) {
      if (typeof missionId !== "string") continue;
      if (isMissionStatus(status)) {
        safeEntries[missionId] = status;
      }
    }

    memoryCache.set(key, safeEntries);
    return safeEntries;
  } catch (error) {
    console.warn("Unable to read mission progress", error);
    return {};
  }
}

function writeStatuses(key: string | null, map: MissionStatusMap) {
  if (!key) return;
  memoryCache.set(key, map);
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch (error) {
    console.warn("Unable to persist mission progress", error);
  }
}

export type UseMissionsOptions = {
  runId: string;
  walletAddress?: string | null;
};

export type UseMissionsResult = {
  getStatus: (missionId: string) => MissionStatus;
  setStatus: (missionId: string, status: MissionStatus) => void;
};

export function useMissions({
  runId,
  walletAddress,
}: UseMissionsOptions): UseMissionsResult {
  const storageKey = useMemo(
    () => getStorageKey(runId, walletAddress),
    [runId, walletAddress],
  );
  const [statusMap, setStatusMap] = useState<MissionStatusMap>(() =>
    readStatuses(storageKey),
  );

  useEffect(() => {
    if (!storageKey) {
      setStatusMap({});
      return;
    }
    setStatusMap(readStatuses(storageKey));
  }, [storageKey]);

  const getStatus = useCallback(
    (missionId: string): MissionStatus => {
      return statusMap[missionId] ?? DEFAULT_STATUS;
    },
    [statusMap],
  );

  const setStatus = useCallback(
    (missionId: string, status: MissionStatus) => {
      setStatusMap((previous) => {
        const current = previous[missionId];
        if (current === status) return previous;
        if (!storageKey) return previous;
        const next = { ...previous, [missionId]: status };
        writeStatuses(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  return { getStatus, setStatus };
}

export default useMissions;
