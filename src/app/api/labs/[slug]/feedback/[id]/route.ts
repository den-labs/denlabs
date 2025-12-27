import { type NextRequest, NextResponse } from "next/server";
import {
  type FeedbackItem,
  readJsonBody,
  sanitizeFeedbackStatus,
  sanitizePriority,
  sanitizeTags,
  type UpdateFeedbackPayload,
} from "@/lib/eventLabs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// =====================================================
// PATCH /api/labs/:slug/feedback/:id - Update feedback item (triage)
// =====================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;
  const payload = await readJsonBody<UpdateFeedbackPayload>(request);

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    // Verify lab exists and get lab_id
    const { data: lab, error: labError } = await supabaseAdmin
      .from("event_labs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (labError || !lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Verify feedback item exists and belongs to this lab
    const { data: existingFeedback, error: fetchError } = await supabaseAdmin
      .from("feedback_items")
      .select("lab_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Failed to fetch feedback item", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch feedback" },
        { status: 500 },
      );
    }

    if (!existingFeedback) {
      return NextResponse.json(
        { error: "Feedback item not found" },
        { status: 404 },
      );
    }

    if (existingFeedback.lab_id !== lab.id) {
      return NextResponse.json(
        { error: "Feedback does not belong to this lab" },
        { status: 400 },
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (payload.status !== undefined) {
      updates.status = sanitizeFeedbackStatus(payload.status);
    }

    if (payload.tags !== undefined) {
      updates.tags = sanitizeTags(payload.tags);
    }

    if (payload.priority !== undefined) {
      const priority = sanitizePriority(payload.priority);
      updates.priority = priority; // null is valid (clears priority)
    }

    // Update feedback item
    const { data, error } = await supabaseAdmin
      .from("feedback_items")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Failed to update feedback", error);
      return NextResponse.json(
        { error: "Failed to update feedback" },
        { status: 500 },
      );
    }

    return NextResponse.json({ feedback: data as FeedbackItem });
  } catch (error) {
    console.error("Unexpected error updating feedback", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
