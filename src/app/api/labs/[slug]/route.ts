import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  type EventLab,
  type UpdateEventLabPayload,
  getStoredLabUserId,
  readJsonBody,
  sanitizeLabName,
  sanitizeSurfaces,
} from "@/lib/eventLabs";

// =====================================================
// GET /api/labs/:slug - Get lab by slug
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const { data, error } = await supabaseAdmin
      .from("event_labs")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch lab", error);
      return NextResponse.json(
        { error: "Failed to fetch lab" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    return NextResponse.json({ lab: data as EventLab });
  } catch (error) {
    console.error("Unexpected error fetching lab", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// =====================================================
// PATCH /api/labs/:slug - Update lab (creator only)
// =====================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const payload = await readJsonBody<UpdateEventLabPayload>(request);

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Get current user
  const currentUserId = await getStoredLabUserId();
  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify creator ownership
    const { data: existingLab, error: fetchError } = await supabaseAdmin
      .from("event_labs")
      .select("creator_id")
      .eq("slug", slug)
      .maybeSingle();

    if (fetchError) {
      console.error("Failed to verify lab ownership", fetchError);
      return NextResponse.json(
        { error: "Failed to verify ownership" },
        { status: 500 },
      );
    }

    if (!existingLab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    if (existingLab.creator_id !== currentUserId) {
      return NextResponse.json(
        { error: "Forbidden: Only lab creator can update" },
        { status: 403 },
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (payload.name) {
      const name = sanitizeLabName(payload.name);
      if (!name) {
        return NextResponse.json(
          { error: "Invalid lab name (3-255 characters)" },
          { status: 400 },
        );
      }
      updates.name = name;
    }

    if (payload.objective !== undefined) {
      updates.objective = payload.objective?.trim() || null;
    }

    if (payload.surfaces_to_observe !== undefined) {
      updates.surfaces_to_observe = sanitizeSurfaces(
        payload.surfaces_to_observe,
      );
    }

    if (payload.start_date) {
      updates.start_date = payload.start_date;
    }

    if (payload.end_date !== undefined) {
      updates.end_date = payload.end_date || null;
    }

    if (payload.status) {
      updates.status = payload.status;
    }

    // Update lab
    const { data, error } = await supabaseAdmin
      .from("event_labs")
      .update(updates)
      .eq("slug", slug)
      .select("*")
      .single();

    if (error) {
      console.error("Failed to update lab", error);
      return NextResponse.json(
        { error: "Failed to update lab" },
        { status: 500 },
      );
    }

    return NextResponse.json({ lab: data as EventLab });
  } catch (error) {
    console.error("Unexpected error updating lab", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// =====================================================
// DELETE /api/labs/:slug - Delete lab (creator only)
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Get current user
  const currentUserId = await getStoredLabUserId();
  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify creator ownership
    const { data: existingLab, error: fetchError } = await supabaseAdmin
      .from("event_labs")
      .select("creator_id")
      .eq("slug", slug)
      .maybeSingle();

    if (fetchError) {
      console.error("Failed to verify lab ownership", fetchError);
      return NextResponse.json(
        { error: "Failed to verify ownership" },
        { status: 500 },
      );
    }

    if (!existingLab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    if (existingLab.creator_id !== currentUserId) {
      return NextResponse.json(
        { error: "Forbidden: Only lab creator can delete" },
        { status: 403 },
      );
    }

    // Delete lab (cascade will delete related feedback, events, sessions)
    const { error } = await supabaseAdmin
      .from("event_labs")
      .delete()
      .eq("slug", slug);

    if (error) {
      console.error("Failed to delete lab", error);
      return NextResponse.json(
        { error: "Failed to delete lab" },
        { status: 500 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Unexpected error deleting lab", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
