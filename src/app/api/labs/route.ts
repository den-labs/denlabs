import { type NextRequest, NextResponse } from "next/server";
import {
  type CreateEventLabPayload,
  type EventLab,
  generateSlug,
  getStoredLabUserId,
  readJsonBody,
  sanitizeLabName,
  sanitizeSurfaces,
} from "@/lib/eventLabs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// =====================================================
// GET /api/labs - List all labs
// =====================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get("creator_id");

  try {
    let query = supabaseAdmin
      .from("event_labs")
      .select("*")
      .order("created_at", { ascending: false });

    // Optional filter by creator
    if (creatorId) {
      query = query.eq("creator_id", creatorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch labs", error);
      return NextResponse.json(
        { error: "Failed to fetch labs" },
        { status: 500 },
      );
    }

    return NextResponse.json({ labs: (data ?? []) as EventLab[] });
  } catch (error) {
    console.error("Unexpected error fetching labs", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// =====================================================
// POST /api/labs - Create new lab
// =====================================================

export async function POST(request: NextRequest) {
  const payload = await readJsonBody<CreateEventLabPayload>(request);

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Validate required fields
  const name = sanitizeLabName(payload.name);
  if (!name) {
    return NextResponse.json(
      { error: "Lab name is required (3-255 characters)" },
      { status: 400 },
    );
  }

  if (!payload.start_date) {
    return NextResponse.json(
      { error: "Start date is required" },
      { status: 400 },
    );
  }

  // Generate slug if not provided
  const slug = payload.slug?.trim() || generateSlug(name);

  // Sanitize optional fields
  const surfaces = sanitizeSurfaces(payload.surfaces_to_observe);

  // Get creator from session
  const creatorId = await getStoredLabUserId();

  try {
    // Insert lab
    const { data, error } = await supabaseAdmin
      .from("event_labs")
      .insert({
        slug,
        name,
        objective: payload.objective?.trim() || null,
        surfaces_to_observe: surfaces,
        start_date: payload.start_date,
        end_date: payload.end_date || null,
        creator_id: creatorId,
      })
      .select("*")
      .single();

    if (error) {
      // Handle duplicate slug
      if (error.code === "23505" && error.message.includes("slug")) {
        return NextResponse.json(
          {
            error:
              "Lab slug already exists. Please choose a different name or slug.",
          },
          { status: 409 },
        );
      }

      console.error("Failed to create lab", error);
      return NextResponse.json(
        { error: "Failed to create lab" },
        { status: 500 },
      );
    }

    return NextResponse.json({ lab: data as EventLab }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error creating lab", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
