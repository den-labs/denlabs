/**
 * Activity API - Single endpoint for Activity Rail
 * GET /api/labs/:slug/activity?window=24h&limit=30
 * FREE: 24h window, JSON response (UI)
 * PREMIUM: Extended windows (7d: $2, 30d: $3, 90d: $5), JSON export ($2)
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  type ActivityFeedItem,
  type ActivityResponse,
  type ActivitySummary,
  clampLimit,
  clampWindow,
  riskLevelFromTrust,
  truncateMessage,
} from "@/lib/activity";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  PRICING,
  build402Response,
  shouldGate,
  verifyPayment,
} from "@/lib/x402";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * GET /api/labs/:slug/activity
 * Returns summary metrics + activity feed
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);

  // Parse query params
  const window_hours = clampWindow(searchParams.get("window") || undefined);
  const limit = clampLimit(searchParams.get("limit") || undefined);
  const exportFormat = searchParams.get("export");

  // Check if premium gating required
  const requiresPayment = window_hours > 24 || exportFormat === "json";

  if (shouldGate(request, requiresPayment)) {
    // Determine pricing based on window or export type
    let price: number = PRICING.ACTIVITY_JSON; // Default for export
    let description = "Export activity data as JSON";

    if (window_hours > 24) {
      if (window_hours <= 168) {
        // 7 days
        price = PRICING.ACTIVITY_7D;
        description = "Access 7-day activity window";
      } else if (window_hours <= 720) {
        // 30 days
        price = PRICING.ACTIVITY_30D;
        description = "Access 30-day activity window";
      } else {
        // 90 days
        price = PRICING.ACTIVITY_90D;
        description = "Access 90-day activity window";
      }
    }

    const verification = await verifyPayment(request, {
      price,
      endpoint: `/api/labs/${slug}/activity`,
      method: "GET",
      description,
    });

    if (!verification.valid) {
      return await build402Response({
        price,
        endpoint: `/api/labs/${slug}/activity?window=${window_hours}h${exportFormat ? `&export=${exportFormat}` : ""}`,
        method: "GET",
        description,
      });
    }
  }

  // Verify lab exists
  const { data: lab, error: labError } = await supabaseAdmin
    .from("event_labs")
    .select("id, surfaces_to_observe")
    .eq("slug", slug)
    .single();

  if (labError || !lab) {
    return NextResponse.json({ error: "Lab not found" }, { status: 404 });
  }

  const labId = lab.id;
  const surfaces = (lab.surfaces_to_observe as string[]) || [];

  // Calculate time window
  const since = new Date(
    Date.now() - window_hours * 60 * 60 * 1000,
  ).toISOString();

  // Fetch all data in parallel
  const [
    kpis,
    topRoutes,
    topErrorRoutes,
    topTags,
    feedbackItems,
    errorEvents,
    lastEventAt,
  ] = await Promise.all([
    getKPIs(labId, since),
    getTopRoutes(labId, since, 3),
    getTopErrorRoutes(labId, since, 3),
    getTopTags(labId, since, 5),
    getFeedbackItems(labId, since, Math.ceil(limit / 2)),
    getErrorEvents(labId, since, Math.floor(limit / 2)),
    getLastEventTime(labId, since),
  ]);

  // Build summary
  const summary: ActivitySummary = {
    window_hours,
    last_event_at: lastEventAt,
    lab_mode: {
      active: false, // Server cannot determine cookie state
      observing: surfaces.length === 0 ? "all" : "subset",
      surfaces_count: surfaces.length,
    },
    kpis,
    top: {
      routes_24h: topRoutes,
      error_routes_24h: topErrorRoutes,
      tags: topTags,
    },
  };

  // Merge and sort feed items
  const feed: ActivityFeedItem[] = [...feedbackItems, ...errorEvents]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);

  const response: ActivityResponse = { summary, feed };

  // Handle JSON export (PREMIUM)
  if (exportFormat === "json") {
    const jsonString = JSON.stringify(response, null, 2);
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="activity-${slug}-${Date.now()}.json"`,
      },
    });
  }

  // Default: JSON response for UI (FREE)
  return NextResponse.json(response);
}

/**
 * Calculate all KPIs for the given time window
 */
async function getKPIs(labId: string, since: string) {
  // Sessions in window
  const { data: sessionData } = await supabaseAdmin
    .from("lab_sessions")
    .select("id")
    .eq("lab_id", labId)
    .gte("first_seen", since);

  const sessions_24h = sessionData?.length || 0;

  // Feedback in window
  const { data: feedbackData } = await supabaseAdmin
    .from("feedback_items")
    .select("id, trust_score, status, priority")
    .eq("lab_id", labId)
    .gte("created_at", since);

  const feedback_24h = feedbackData?.length || 0;

  // Open count (all time, not just window)
  const { data: openData } = await supabaseAdmin
    .from("feedback_items")
    .select("id")
    .eq("lab_id", labId)
    .in("status", ["new", "triaged"]);

  const open_count = openData?.length || 0;

  // P0/P1 counts (all time)
  const { data: p0Data } = await supabaseAdmin
    .from("feedback_items")
    .select("id")
    .eq("lab_id", labId)
    .eq("priority", "P0");

  const p0_count = p0Data?.length || 0;

  const { data: p1Data } = await supabaseAdmin
    .from("feedback_items")
    .select("id")
    .eq("lab_id", labId)
    .eq("priority", "P1");

  const p1_count = p1Data?.length || 0;

  // Errors in window
  const { data: errorData } = await supabaseAdmin
    .from("event_tracking")
    .select("id")
    .eq("lab_id", labId)
    .eq("event_type", "error_flag")
    .gte("created_at", since);

  const errors_24h = errorData?.length || 0;

  // Trust distribution (window)
  const trust = {
    trusted: 0,
    unverified: 0,
    risk: 0,
  };

  for (const item of feedbackData || []) {
    const score = item.trust_score || 50;
    if (score >= 80) trust.trusted++;
    else if (score >= 40) trust.unverified++;
    else trust.risk++;
  }

  // Spam rate (window)
  const spamCount =
    feedbackData?.filter((item) => item.status === "spam").length || 0;
  const spam_rate = feedback_24h > 0 ? spamCount / feedback_24h : 0;

  return {
    sessions_24h,
    feedback_24h,
    open_count,
    p0_count,
    p1_count,
    errors_24h,
    trust,
    spam_rate,
  };
}

/**
 * Get top routes by page views
 */
async function getTopRoutes(
  labId: string,
  since: string,
  limit: number,
): Promise<Array<{ route: string; page_views: number }>> {
  const { data } = await supabaseAdmin
    .from("event_tracking")
    .select("route")
    .eq("lab_id", labId)
    .eq("event_type", "page_view")
    .gte("created_at", since)
    .not("route", "is", null);

  if (!data || data.length === 0) return [];

  // Count routes
  const routeCounts = new Map<string, number>();
  for (const item of data) {
    const route = item.route as string;
    routeCounts.set(route, (routeCounts.get(route) || 0) + 1);
  }

  // Sort and limit
  return Array.from(routeCounts.entries())
    .map(([route, page_views]) => ({ route, page_views }))
    .sort((a, b) => b.page_views - a.page_views)
    .slice(0, limit);
}

/**
 * Get top routes by error count
 */
async function getTopErrorRoutes(
  labId: string,
  since: string,
  limit: number,
): Promise<Array<{ route: string; errors: number }>> {
  const { data } = await supabaseAdmin
    .from("event_tracking")
    .select("route")
    .eq("lab_id", labId)
    .eq("event_type", "error_flag")
    .gte("created_at", since)
    .not("route", "is", null);

  if (!data || data.length === 0) return [];

  // Count routes
  const routeCounts = new Map<string, number>();
  for (const item of data) {
    const route = item.route as string;
    routeCounts.set(route, (routeCounts.get(route) || 0) + 1);
  }

  // Sort and limit
  return Array.from(routeCounts.entries())
    .map(([route, errors]) => ({ route, errors }))
    .sort((a, b) => b.errors - a.errors)
    .slice(0, limit);
}

/**
 * Get top tags from feedback
 */
async function getTopTags(
  labId: string,
  since: string,
  limit: number,
): Promise<Array<{ tag: string; count: number }>> {
  const { data } = await supabaseAdmin
    .from("feedback_items")
    .select("tags")
    .eq("lab_id", labId)
    .gte("created_at", since);

  if (!data || data.length === 0) return [];

  // Flatten tags and count
  const tagCounts = new Map<string, number>();
  for (const item of data) {
    const tags = (item.tags as string[]) || [];
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  // Sort and limit
  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get feedback items for feed
 */
async function getFeedbackItems(
  labId: string,
  since: string,
  limit: number,
): Promise<ActivityFeedItem[]> {
  const { data } = await supabaseAdmin
    .from("feedback_items")
    .select(
      "id, created_at, message, route, trust_score, priority, status, handle",
    )
    .eq("lab_id", labId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((item) => ({
    type: "feedback" as const,
    id: item.id,
    at: item.created_at,
    message_preview: truncateMessage(item.message, 150),
    route: item.route,
    trust_score: item.trust_score || 50,
    risk_level: riskLevelFromTrust(item.trust_score || 50),
    priority: item.priority as "P0" | "P1" | "P2" | "P3" | null,
    status: item.status as "new" | "triaged" | "done" | "spam",
    handle: item.handle,
  }));
}

/**
 * Get error events for feed
 */
async function getErrorEvents(
  labId: string,
  since: string,
  limit: number,
): Promise<ActivityFeedItem[]> {
  const { data } = await supabaseAdmin
    .from("event_tracking")
    .select("id, created_at, route, metadata")
    .eq("lab_id", labId)
    .eq("event_type", "error_flag")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((item) => {
    const metadata = (item.metadata as Record<string, unknown>) || {};
    const surface_label = (metadata.surface_label as string) || null;
    const is_observed_surface =
      (metadata.is_observed_surface as boolean) || false;
    const error_code = (metadata.error_code as string) || null;
    const message_preview = (metadata.message as string) || null;

    return {
      type: "error" as const,
      id: item.id,
      at: item.created_at,
      route: item.route,
      surface_label,
      is_observed_surface,
      error_code,
      message_preview: message_preview
        ? truncateMessage(message_preview, 100)
        : null,
    };
  });
}

/**
 * Get last event timestamp in window
 */
async function getLastEventTime(
  labId: string,
  since: string,
): Promise<string | null> {
  // Get latest feedback
  const { data: feedbackData } = await supabaseAdmin
    .from("feedback_items")
    .select("created_at")
    .eq("lab_id", labId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get latest event
  const { data: eventData } = await supabaseAdmin
    .from("event_tracking")
    .select("created_at")
    .eq("lab_id", labId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const times = [feedbackData?.created_at, eventData?.created_at].filter(
    Boolean,
  );

  if (times.length === 0) return null;

  return times.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}
