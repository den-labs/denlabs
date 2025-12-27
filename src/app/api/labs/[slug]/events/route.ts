import { type NextRequest, NextResponse } from "next/server";
import {
  type EventTrackingPayload,
  generateSessionId,
  getLabSessionId,
  getStoredLabUserId,
  persistLabSessionId,
  readJsonBody,
} from "@/lib/eventLabs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// =====================================================
// POST /api/labs/:slug/events - Track event
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const payload = await readJsonBody<EventTrackingPayload>(request);

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Validate event_type
  const validEventTypes = ["page_view", "action_click", "error_flag", "custom"];
  if (!payload.event_type || !validEventTypes.includes(payload.event_type)) {
    return NextResponse.json(
      {
        error:
          "Invalid event_type. Must be: page_view, action_click, error_flag, or custom",
      },
      { status: 400 },
    );
  }

  try {
    // Get lab ID from slug
    const { data: lab, error: labError } = await supabaseAdmin
      .from("event_labs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (labError || !lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Get or create session ID
    let sessionId = await getLabSessionId();
    if (!sessionId) {
      sessionId = generateSessionId();
      await persistLabSessionId(sessionId);
    }

    // Get current user (may be null for anonymous)
    const labUserId = await getStoredLabUserId();

    // Get user's wallet address if authenticated
    let walletAddress: string | null = null;
    if (labUserId) {
      const { data: user } = await supabaseAdmin
        .from("lab_users")
        .select("wallet_address")
        .eq("id", labUserId)
        .maybeSingle();

      if (user) {
        walletAddress = user.wallet_address;
      }
    }

    // Insert event tracking record
    const { error: eventError } = await supabaseAdmin
      .from("event_tracking")
      .insert({
        lab_id: lab.id,
        session_id: sessionId,
        event_type: payload.event_type,
        route: payload.route || null,
        metadata: payload.metadata || {},
      });

    if (eventError) {
      console.error("Failed to track event", eventError);
      return NextResponse.json(
        { error: "Failed to track event" },
        { status: 500 },
      );
    }

    // Get current event count for this session
    const { count } = await supabaseAdmin
      .from("event_tracking")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", lab.id)
      .eq("session_id", sessionId);

    // Upsert lab session to update event_count and last_seen
    await supabaseAdmin
      .from("lab_sessions")
      .upsert(
        {
          id: sessionId,
          lab_id: lab.id,
          lab_user_id: labUserId,
          wallet_address: walletAddress,
          last_seen: new Date().toISOString(),
          event_count: count || 1,
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    return new NextResponse(null, { status: 201 });
  } catch (error) {
    console.error("Unexpected error tracking event", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
