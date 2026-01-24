import { api } from "./apiClient";
import type {
  CreateEventLabPayload,
  CreateFeedbackPayload,
  EventLab,
  EventTrackingPayload,
  FeedbackItem,
  TelemetryData,
  TrustScore,
  UpdateEventLabPayload,
  UpdateFeedbackPayload,
} from "./eventLabs";
import type { RetroPack } from "./retroPack";

// =====================================================
// EVENT LAB API CALLS
// =====================================================

export async function createEventLab(
  payload: CreateEventLabPayload,
): Promise<EventLab> {
  const data = await api.post<{ lab: EventLab }>("/api/labs", payload);
  return data.lab;
}

export async function getEventLab(slug: string): Promise<EventLab> {
  const data = await api.get<{ lab: EventLab }>(`/api/labs/${slug}`);
  return data.lab;
}

export async function listEventLabs(creatorId?: string): Promise<EventLab[]> {
  const data = await api.get<{ labs: EventLab[] }>("/api/labs", {
    creator_id: creatorId,
  });
  return data.labs;
}

export async function updateEventLab(
  slug: string,
  payload: UpdateEventLabPayload,
): Promise<EventLab> {
  const data = await api.patch<{ lab: EventLab }>(`/api/labs/${slug}`, payload);
  return data.lab;
}

export async function deleteEventLab(slug: string): Promise<void> {
  await api.delete(`/api/labs/${slug}`);
}

// =====================================================
// FEEDBACK API CALLS
// =====================================================

export async function createFeedback(
  slug: string,
  payload: CreateFeedbackPayload,
): Promise<{ feedback: FeedbackItem; trust_score: TrustScore }> {
  return api.post<{ feedback: FeedbackItem; trust_score: TrustScore }>(
    `/api/labs/${slug}/feedback`,
    payload,
  );
}

export async function listFeedback(
  slug: string,
  filters?: { status?: string; priority?: string },
): Promise<{ feedback: FeedbackItem[]; is_creator: boolean }> {
  return api.get<{ feedback: FeedbackItem[]; is_creator: boolean }>(
    `/api/labs/${slug}/feedback`,
    filters,
  );
}

export async function updateFeedback(
  slug: string,
  id: string,
  payload: UpdateFeedbackPayload,
): Promise<FeedbackItem> {
  const data = await api.patch<{ feedback: FeedbackItem }>(
    `/api/labs/${slug}/feedback/${id}`,
    payload,
  );
  return data.feedback;
}

// =====================================================
// EVENT TRACKING API CALLS
// =====================================================

export async function trackEvent(
  slug: string,
  payload: EventTrackingPayload,
): Promise<void> {
  await api.post(`/api/labs/${slug}/events`, payload);
}

// =====================================================
// RETRO PACK API CALLS
// =====================================================

export async function generateRetro(slug: string): Promise<RetroPack> {
  const data = await api.get<{ retro: RetroPack }>(`/api/labs/${slug}/retro`);
  return data.retro;
}

export async function exportRetroMarkdown(slug: string): Promise<string> {
  return api.text(`/api/labs/${slug}/retro`, { format: "markdown" });
}

// =====================================================
// TELEMETRY API CALLS
// =====================================================

export async function getTelemetry(slug: string): Promise<TelemetryData> {
  const data = await api.get<{ telemetry: TelemetryData }>(
    `/api/labs/${slug}/telemetry`,
  );
  return data.telemetry;
}
