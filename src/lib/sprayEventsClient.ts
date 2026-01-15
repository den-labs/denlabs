export type SprayEventType =
  | "paste_opened"
  | "paste_parsed"
  | "paste_applied"
  | "fix_applied"
  | "send_started"
  | "send_completed"
  | "send_failed";

export type SprayEvent = {
  id: string;
  spray_id: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

let cachedSprayId: string | null = null;
let pendingCreate: Promise<string | null> | null = null;

export function getCachedSprayId() {
  return cachedSprayId;
}

export function setCachedSprayId(value: string | null) {
  cachedSprayId = value;
}

async function createSprayDraft(): Promise<string | null> {
  try {
    const response = await fetch("/api/spray", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const sprayId =
      typeof data?.sprayId === "string"
        ? data.sprayId
        : typeof data?.spray_id === "string"
          ? data.spray_id
          : null;

    if (sprayId) {
      cachedSprayId = sprayId;
    }

    return sprayId;
  } catch (error) {
    console.warn("Failed to create spray draft", error);
    return null;
  }
}

export async function ensureSprayId(): Promise<string | null> {
  if (cachedSprayId) {
    return cachedSprayId;
  }

  if (pendingCreate) {
    return pendingCreate;
  }

  pendingCreate = createSprayDraft().finally(() => {
    pendingCreate = null;
  });

  return pendingCreate;
}

export async function logEvent(
  type: SprayEventType,
  metadata?: Record<string, unknown>,
) {
  try {
    const sprayId = await ensureSprayId();
    if (!sprayId) {
      return;
    }

    await fetch(`/api/spray/${sprayId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        metadata: metadata ?? {},
      }),
    });
  } catch (error) {
    console.warn("Failed to log spray event", error);
  }
}
