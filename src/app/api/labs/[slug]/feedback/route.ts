import { type NextRequest, NextResponse } from "next/server";
import {
  type CreateFeedbackPayload,
  type FeedbackItem,
  generateSessionId,
  getLabSessionId,
  getStoredLabUserId,
  persistLabSessionId,
  readJsonBody,
} from "@/lib/eventLabs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { calculateTrustScore } from "@/lib/trustScoring";
import {
  PRICING,
  build402Response,
  shouldGate,
  verifyPayment,
} from "@/lib/x402";

// =====================================================
// GET /api/labs/:slug/feedback - List feedback (hybrid visibility)
// FREE: JSON response (UI)
// PREMIUM: CSV export - $2 (creator-only)
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const exportFormat = searchParams.get("export");

  try {
    // Get lab ID from slug
    const { data: lab, error: labError } = await supabaseAdmin
      .from("event_labs")
      .select("id, creator_id")
      .eq("slug", slug)
      .maybeSingle();

    if (labError || !lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Get current user and session
    const currentUserId = await getStoredLabUserId();
    const sessionId = await getLabSessionId();

    // Check if user is creator
    const isCreator = currentUserId === lab.creator_id;

    // Check if premium gating required (CSV export, creator-only)
    if (shouldGate(request, exportFormat === "csv")) {
      // Only creators can export CSV
      if (!isCreator) {
        return NextResponse.json(
          { error: "Only lab creators can export feedback as CSV" },
          { status: 403 },
        );
      }

      const verification = await verifyPayment(request, {
        price: PRICING.FEEDBACK_CSV,
        endpoint: `/api/labs/${slug}/feedback`,
        method: "GET",
        description: "Export all feedback as CSV for analysis",
      });

      if (!verification.valid) {
        return await build402Response({
          price: PRICING.FEEDBACK_CSV,
          endpoint: `/api/labs/${slug}/feedback?export=csv`,
          method: "GET",
          description: "Export all feedback as CSV for analysis",
        });
      }
    }

    let feedbackData: FeedbackItem[] = [];

    if (isCreator) {
      // Creator sees ALL feedback with optional filters
      let query = supabaseAdmin
        .from("feedback_items")
        .select("*")
        .eq("lab_id", lab.id)
        .order("created_at", { ascending: false });

      // Apply filters
      const status = searchParams.get("status");
      if (status) query = query.eq("status", status);

      const priority = searchParams.get("priority");
      if (priority) query = query.eq("priority", priority);

      const { data, error } = await query;

      if (error) {
        console.error("Failed to fetch feedback", error);
        return NextResponse.json(
          { error: "Failed to fetch feedback" },
          { status: 500 },
        );
      }

      feedbackData = (data ?? []) as FeedbackItem[];
    } else {
      // Participant/Anonymous: own feedback + top P0/P1 issues
      const feedbackSets: FeedbackItem[] = [];

      // Get user's own feedback if they have a session
      if (sessionId) {
        const { data: ownFeedback } = await supabaseAdmin
          .from("feedback_items")
          .select("*")
          .eq("lab_id", lab.id)
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false });

        if (ownFeedback) {
          feedbackSets.push(...(ownFeedback as FeedbackItem[]));
        }
      }

      // Get top P0 issues
      const { data: p0Issues } = await supabaseAdmin
        .from("feedback_items")
        .select("*")
        .eq("lab_id", lab.id)
        .eq("priority", "P0")
        .order("created_at", { ascending: false })
        .limit(5);

      if (p0Issues) {
        feedbackSets.push(...(p0Issues as FeedbackItem[]));
      }

      // Get top P1 issues
      const { data: p1Issues } = await supabaseAdmin
        .from("feedback_items")
        .select("*")
        .eq("lab_id", lab.id)
        .eq("priority", "P1")
        .order("created_at", { ascending: false })
        .limit(5);

      if (p1Issues) {
        feedbackSets.push(...(p1Issues as FeedbackItem[]));
      }

      // Deduplicate by id
      const seen = new Set<string>();
      feedbackData = feedbackSets.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      // Sort by created_at descending
      feedbackData.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    // Handle CSV export (PREMIUM, creator-only)
    if (exportFormat === "csv") {
      const csv = generateFeedbackCSV(feedbackData);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="feedback-${slug}-${Date.now()}.csv"`,
        },
      });
    }

    // Default: JSON response (FREE)
    return NextResponse.json({
      feedback: feedbackData,
      is_creator: isCreator,
    });
  } catch (error) {
    console.error("Unexpected error fetching feedback", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Generate CSV from feedback items
 */
function generateFeedbackCSV(items: FeedbackItem[]): string {
  // CSV header
  const headers = [
    "ID",
    "Created At",
    "Message",
    "Handle",
    "Wallet Address",
    "Route",
    "Step",
    "Event Type",
    "Trust Score",
    "Priority",
    "Status",
    "Tags",
  ];

  // CSV rows
  const rows = items.map((item) => [
    item.id,
    item.created_at,
    `"${(item.message || "").replace(/"/g, '""')}"`, // Escape quotes
    item.handle || "",
    item.wallet_address || "",
    item.route || "",
    item.step || "",
    item.event_type || "",
    item.trust_score?.toString() || "50",
    item.priority || "",
    item.status || "new",
    `"${(item.tags || []).join(", ")}"`,
  ]);

  // Combine header and rows
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

// =====================================================
// POST /api/labs/:slug/feedback - Submit feedback with trust scoring
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const payload = await readJsonBody<CreateFeedbackPayload>(request);

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Validate message
  if (!payload.message || payload.message.trim().length === 0) {
    return NextResponse.json(
      { error: "Feedback message is required" },
      { status: 400 },
    );
  }

  if (payload.message.trim().length > 5000) {
    return NextResponse.json(
      { error: "Feedback message too long (max 5000 characters)" },
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

    // Get user details if authenticated
    let walletAddress: string | null = null;
    let handle: string | null = null;

    if (labUserId) {
      const { data: user } = await supabaseAdmin
        .from("lab_users")
        .select("wallet_address, handle")
        .eq("id", labUserId)
        .maybeSingle();

      if (user) {
        walletAddress = user.wallet_address;
        handle = user.handle;
      }
    }

    // Calculate trust score
    const trustScore = await calculateTrustScore({
      labId: lab.id,
      sessionId,
      labUserId,
    });

    // Insert feedback item
    const { data: feedbackItem, error: insertError } = await supabaseAdmin
      .from("feedback_items")
      .insert({
        lab_id: lab.id,
        message: payload.message.trim(),
        lab_user_id: labUserId,
        session_id: sessionId,
        wallet_address: walletAddress,
        handle,
        trust_score: trustScore.score,
        trust_flags: trustScore.flags,
        is_self_verified: trustScore.flags.has_self_verification,
        has_wallet: trustScore.flags.has_wallet,
        route: payload.route || null,
        step: payload.step || null,
        event_type: payload.event_type || null,
        metadata: payload.metadata || {},
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Failed to create feedback", insertError);
      return NextResponse.json(
        { error: "Failed to create feedback" },
        { status: 500 },
      );
    }

    // Upsert lab session to increment feedback_count
    await supabaseAdmin
      .from("lab_sessions")
      .upsert(
        {
          id: sessionId,
          lab_id: lab.id,
          lab_user_id: labUserId,
          wallet_address: walletAddress,
          last_seen: new Date().toISOString(),
          feedback_count: (trustScore.flags.session_feedback_count || 0) + 1,
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    return NextResponse.json(
      {
        feedback: feedbackItem as FeedbackItem,
        trust_score: trustScore,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected error creating feedback", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
