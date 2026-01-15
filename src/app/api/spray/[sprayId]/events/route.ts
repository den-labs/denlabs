import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireWallet } from "@/lib/accessGuards";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { readJsonBody } from "@/lib/userProfile";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

type SprayEventPayload = {
  type?: string;
  metadata?: Record<string, unknown> | null;
};

type RouteContext = {
  params: Promise<{ sprayId: string }> | { sprayId: string };
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const profile = await requireWallet({ locale: "en", nextPath: "/spray" });
  const { sprayId } = await params;

  if (!sprayId) {
    return NextResponse.json({ error: "Missing spray id" }, { status: 400 });
  }

  const payload = await readJsonBody<SprayEventPayload>(request);
  const eventType = payload?.type?.trim();
  if (!eventType) {
    return NextResponse.json({ error: "Missing event type" }, { status: 400 });
  }

  const metadata = payload?.metadata ?? {};

  try {
    const { data, error } = await supabaseAdmin
      .from("spray_events")
      .insert({
        spray_id: sprayId,
        event_type: eventType,
        metadata,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw error;
    }

    return NextResponse.json({
      eventId: data.id,
      sprayId: data.spray_id,
      eventType: data.event_type,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error("Failed to log spray event", { error, sprayId, profile });
    return NextResponse.json({ error: "Unable to log event" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  await requireWallet({ locale: "en", nextPath: "/spray" });
  const { sprayId } = await params;

  if (!sprayId) {
    return NextResponse.json({ error: "Missing spray id" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(limitParam)
    ? Math.max(1, Math.min(MAX_LIMIT, limitParam))
    : DEFAULT_LIMIT;

  try {
    const { data, error } = await supabaseAdmin
      .from("spray_events")
      .select("*")
      .eq("spray_id", sprayId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({ events: data ?? [] });
  } catch (error) {
    console.error("Failed to fetch spray events", error);
    return NextResponse.json(
      { error: "Unable to fetch spray events" },
      { status: 500 },
    );
  }
}
