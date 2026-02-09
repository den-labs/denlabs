"use client";

import { useCallback, useEffect, useState } from "react";
import type { SprayEvent, SprayEventType } from "@/lib/sprayEventsClient";
import {
  ensureSprayId,
  getCachedSprayId,
  logEvent,
  setCachedSprayId,
} from "@/lib/sprayEventsClient";

export function useSprayTelemetry() {
  const [sprayId, setSprayId] = useState<string | null>(() =>
    getCachedSprayId(),
  );
  const [sprayLogOpen, setSprayLogOpen] = useState(false);
  const [sprayEvents, setSprayEvents] = useState<SprayEvent[]>([]);
  const [sprayEventsLoading, setSprayEventsLoading] = useState(false);
  const [sprayEventsError, setSprayEventsError] = useState<string | null>(null);
  useEffect(() => {
    setCachedSprayId(sprayId);
  }, [sprayId]);

  const ensureSprayDraft = useCallback(async () => {
    if (sprayId) {
      return sprayId;
    }
    const createdId = await ensureSprayId();
    if (createdId) {
      setSprayId(createdId);
      setCachedSprayId(createdId);
    }
    return createdId;
  }, [sprayId]);

  const logSprayEvent = useCallback(
    (type: SprayEventType, metadata?: Record<string, unknown>) => {
      void (async () => {
        const activeId = await ensureSprayDraft();
        if (!activeId) return;
        void logEvent(type, metadata);
      })();
    },
    [ensureSprayDraft],
  );

  const handlePasteOpen = useCallback(
    (source: "paste" | "csv") => {
      void (async () => {
        const activeId = await ensureSprayDraft();
        if (!activeId) return;
        void logEvent("paste_opened", { source });
      })();
    },
    [ensureSprayDraft],
  );

  const updateSprayStatus = useCallback(
    (status: "started" | "completed" | "failed") => {
      void (async () => {
        const activeId = await ensureSprayDraft();
        if (!activeId) return;
        try {
          await fetch(`/api/spray/${activeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
        } catch (statusError) {
          console.warn("Failed to update spray status", statusError);
        }
      })();
    },
    [ensureSprayDraft],
  );

  const fetchSprayEvents = useCallback(async () => {
    if (!sprayId) {
      setSprayEvents([]);
      return;
    }
    setSprayEventsLoading(true);
    setSprayEventsError(null);
    try {
      const response = await fetch(`/api/spray/${sprayId}/events?limit=20`);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || "Failed to fetch spray events");
      }
      const data = await response.json();
      setSprayEvents((data?.events as SprayEvent[]) ?? []);
    } catch (eventsError) {
      console.error("Failed to fetch spray events", eventsError);
      setSprayEventsError("Unable to load spray log.");
    } finally {
      setSprayEventsLoading(false);
    }
  }, [sprayId]);

  useEffect(() => {
    if (!sprayLogOpen) return;
    void fetchSprayEvents();
  }, [fetchSprayEvents, sprayLogOpen]);

  return {
    sprayId,
    sprayLogOpen,
    setSprayLogOpen,
    sprayEvents,
    sprayEventsLoading,
    sprayEventsError,
    logSprayEvent,
    handlePasteOpen,
    updateSprayStatus,
    fetchSprayEvents,
  };
}
