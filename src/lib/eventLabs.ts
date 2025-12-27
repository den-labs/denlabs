import { cookies } from "next/headers";

// Re-export utilities from userProfile for convenience
export { getStoredLabUserId, readJsonBody } from "./userProfile";

// =====================================================
// EVENT LAB TYPES
// =====================================================

export type EventLabStatus = "active" | "paused" | "completed";

export type EventLab = {
  id: string;
  slug: string;
  name: string;
  objective: string | null;
  surfaces_to_observe: string[];
  start_date: string;
  end_date: string | null;
  status: EventLabStatus;
  creator_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CreateEventLabPayload = {
  name: string;
  objective?: string;
  surfaces_to_observe?: string[];
  start_date: string;
  end_date?: string;
  slug?: string; // Auto-generated if not provided
};

export type UpdateEventLabPayload = Partial<CreateEventLabPayload> & {
  status?: EventLabStatus;
};

// =====================================================
// FEEDBACK ITEM TYPES
// =====================================================

export type FeedbackStatus = "new" | "triaged" | "done" | "spam";
export type FeedbackPriority = "P0" | "P1" | "P2" | "P3";

export type FeedbackItem = {
  id: string;
  lab_id: string;
  message: string;
  lab_user_id: string | null;
  session_id: string | null;
  wallet_address: string | null;
  handle: string | null;
  trust_score: number;
  trust_flags: Record<string, unknown>;
  is_self_verified: boolean;
  has_wallet: boolean;
  route: string | null;
  step: string | null;
  event_type: string | null;
  status: FeedbackStatus;
  tags: string[];
  priority: FeedbackPriority | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CreateFeedbackPayload = {
  lab_id: string;
  message: string;
  route?: string;
  step?: string;
  event_type?: string;
  metadata?: Record<string, unknown>;
};

export type UpdateFeedbackPayload = {
  status?: FeedbackStatus;
  tags?: string[];
  priority?: FeedbackPriority | null;
};

// =====================================================
// EVENT TRACKING TYPES
// =====================================================

export type EventType = "page_view" | "action_click" | "error_flag" | "custom";

export type EventTrackingPayload = {
  lab_id: string;
  event_type: EventType;
  route?: string;
  metadata?: Record<string, unknown>;
};

// =====================================================
// TRUST SCORE TYPES
// =====================================================

export type TrustScore = {
  score: number; // 0-100
  flags: {
    has_self_verification: boolean;
    has_wallet: boolean;
    is_rate_limited: boolean;
    session_feedback_count: number;
  };
  risk_level: "trusted" | "unverified" | "risk";
};

// =====================================================
// SESSION MANAGEMENT
// =====================================================

export const LAB_SESSION_COOKIE = "denlabs-lab-session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

export async function getLabSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(LAB_SESSION_COOKIE)?.value ?? null;
}

export async function persistLabSessionId(sessionId: string) {
  const store = await cookies();
  store.set(LAB_SESSION_COOKIE, sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
  });
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 64);
}

export function sanitizeLabName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 3 || trimmed.length > 255) return null;
  return trimmed;
}

export function sanitizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tag) => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 10); // Max 10 tags
}

export function sanitizePriority(value: unknown): FeedbackPriority | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (
    normalized === "P0" ||
    normalized === "P1" ||
    normalized === "P2" ||
    normalized === "P3"
  ) {
    return normalized as FeedbackPriority;
  }
  return null;
}

export function sanitizeFeedbackStatus(value: unknown): FeedbackStatus {
  if (typeof value !== "string") return "new";
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "new" ||
    normalized === "triaged" ||
    normalized === "done" ||
    normalized === "spam"
  ) {
    return normalized as FeedbackStatus;
  }
  return "new";
}

export function sanitizeSurfaces(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((surface) => typeof surface === "string")
    .map((surface) => surface.trim())
    .filter((surface) => surface.length > 0)
    .slice(0, 20); // Max 20 surfaces
}

// =====================================================
// TELEMETRY TYPES
// =====================================================

export type TelemetryData = {
  participation: ParticipationMetrics;
  quality: QualityMetrics;
  funnels: FunnelMetrics;
  ops: OpsMetrics;
};

export type ParticipationMetrics = {
  sessions_total: number;
  sessions_last_24h: number;
  feedback_total: number;
  feedback_per_session_avg: number;
};

export type QualityMetrics = {
  trust_distribution: {
    trusted: number; // 80-100
    unverified: number; // 40-79
    risk: number; // 0-39
  };
  self_verified_percent: number;
  spam_rate: number;
};

export type FunnelMetrics = {
  top_routes: Array<{
    route: string;
    page_views: number;
  }>;
  top_errors: Array<{
    route: string;
    error_count: number;
  }>;
  surface_breakdown: {
    observed: number;
    other: number;
  };
};

export type OpsMetrics = {
  p0_count: number;
  p1_count: number;
  open_count: number;
  top_tags: Array<{
    tag: string;
    count: number;
  }>;
};
