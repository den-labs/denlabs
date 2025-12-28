/**
 * Activity Rail - Types and Helpers
 * Single-endpoint activity feed for Event Labs
 */

export type ActivitySummary = {
  window_hours: number;
  last_event_at: string | null;
  lab_mode: {
    active: boolean; // Always false server-side (client overrides with cookie)
    observing: "all" | "subset";
    surfaces_count: number; // 0 => all
  };
  kpis: {
    sessions_24h: number;
    feedback_24h: number;
    open_count: number; // new + triaged
    p0_count: number;
    p1_count: number;
    errors_24h: number; // error_flag
    trust: { trusted: number; unverified: number; risk: number };
    spam_rate: number; // 0..1
  };
  top: {
    routes_24h: Array<{ route: string; page_views: number }>; // top 3
    error_routes_24h: Array<{ route: string; errors: number }>; // top 3
    tags: Array<{ tag: string; count: number }>; // top 5
  };
};

export type ActivityFeedItem =
  | {
      type: "feedback";
      id: string;
      at: string;
      message_preview: string; // 120-200 chars
      route: string | null;
      trust_score: number;
      risk_level: "trusted" | "unverified" | "risk";
      priority: "P0" | "P1" | "P2" | "P3" | null;
      status: "new" | "triaged" | "done" | "spam";
      handle: string | null;
    }
  | {
      type: "error";
      id: string;
      at: string;
      route: string | null;
      surface_label: string | null;
      is_observed_surface: boolean;
      error_code: string | null; // metadata.error_code if exists
      message_preview: string | null; // metadata.message or similar if exists
    }
  | {
      type: "lab_mode";
      id: string;
      at: string;
      action: "started" | "stopped";
      actor: "creator" | "system";
    };

export type ActivityResponse = {
  summary: ActivitySummary;
  feed: ActivityFeedItem[];
};

/**
 * Convert trust score (0-100) to risk level
 */
export function riskLevelFromTrust(
  score: number,
): "trusted" | "unverified" | "risk" {
  if (score >= 80) return "trusted";
  if (score >= 40) return "unverified";
  return "risk";
}

/**
 * Parse and clamp window parameter
 * FREE: 24h, 48h, 72h
 * PREMIUM: 168h (7d), 720h (30d), 2160h (90d)
 */
export function clampWindow(windowStr?: string): number {
  if (!windowStr) return 24;

  const match = windowStr.match(/^(\d+)h?$/);
  if (!match) return 24;

  const hours = Number.parseInt(match[1], 10);

  // Free tier: 24h, 48h, 72h
  if (hours === 24 || hours === 48 || hours === 72) return hours;

  // Premium tiers
  if (hours === 168) return 168; // 7 days ($2)
  if (hours === 720) return 720; // 30 days ($3)
  if (hours === 2160) return 2160; // 90 days ($5)

  // Invalid value - clamp to nearest valid tier
  if (hours < 24) return 24;
  if (hours > 2160) return 2160;

  // For other values, find closest valid tier
  if (hours <= 72) return 72;
  if (hours <= 168) return 168;
  if (hours <= 720) return 720;
  return 2160;
}

/**
 * Parse and clamp limit parameter between 10 and 100
 */
export function clampLimit(limitStr?: string): number {
  if (!limitStr) return 30;

  const limit = Number.parseInt(limitStr, 10);
  if (Number.isNaN(limit)) return 30;

  return Math.max(10, Math.min(100, limit));
}

/**
 * Truncate message to specified length with ellipsis
 */
export function truncateMessage(message: string, maxLength = 150): string {
  if (message.length <= maxLength) return message;
  return `${message.slice(0, maxLength)}...`;
}
