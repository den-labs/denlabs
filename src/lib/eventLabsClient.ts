import type {
  CreateEventLabPayload,
  CreateFeedbackPayload,
  EventLab,
  EventTrackingPayload,
  FeedbackItem,
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
  const response = await fetch("/api/labs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create lab");
  }

  const data = await response.json();
  return data.lab;
}

export async function getEventLab(slug: string): Promise<EventLab> {
  const response = await fetch(`/api/labs/${slug}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch lab");
  }

  const data = await response.json();
  return data.lab;
}

export async function listEventLabs(creatorId?: string): Promise<EventLab[]> {
  const url = creatorId ? `/api/labs?creator_id=${creatorId}` : "/api/labs";
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to list labs");
  }

  const data = await response.json();
  return data.labs;
}

export async function updateEventLab(
  slug: string,
  payload: UpdateEventLabPayload,
): Promise<EventLab> {
  const response = await fetch(`/api/labs/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update lab");
  }

  const data = await response.json();
  return data.lab;
}

export async function deleteEventLab(slug: string): Promise<void> {
  const response = await fetch(`/api/labs/${slug}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete lab");
  }
}

// =====================================================
// FEEDBACK API CALLS
// =====================================================

export async function createFeedback(
  slug: string,
  payload: CreateFeedbackPayload,
): Promise<{ feedback: FeedbackItem; trust_score: unknown }> {
  const response = await fetch(`/api/labs/${slug}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit feedback");
  }

  return response.json();
}

export async function listFeedback(
  slug: string,
  filters?: { status?: string; priority?: string },
): Promise<{ feedback: FeedbackItem[]; is_creator: boolean }> {
  let url = `/api/labs/${slug}/feedback`;

  if (filters) {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to list feedback");
  }

  return response.json();
}

export async function updateFeedback(
  slug: string,
  id: string,
  payload: UpdateFeedbackPayload,
): Promise<FeedbackItem> {
  const response = await fetch(`/api/labs/${slug}/feedback/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update feedback");
  }

  const data = await response.json();
  return data.feedback;
}

// =====================================================
// EVENT TRACKING API CALLS
// =====================================================

export async function trackEvent(
  slug: string,
  payload: EventTrackingPayload,
): Promise<void> {
  const response = await fetch(`/api/labs/${slug}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to track event");
  }
}

// =====================================================
// RETRO PACK API CALLS
// =====================================================

export async function generateRetro(slug: string): Promise<RetroPack> {
  const response = await fetch(`/api/labs/${slug}/retro`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate retro pack");
  }

  const data = await response.json();
  return data.retro;
}

export async function exportRetroMarkdown(slug: string): Promise<string> {
  const response = await fetch(`/api/labs/${slug}/retro?format=markdown`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to export retro markdown");
  }

  return response.text();
}
