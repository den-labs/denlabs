import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireWallet } from "@/lib/accessGuards";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { readJsonBody } from "@/lib/userProfile";

const STATUS_VALUES = new Set(["started", "completed", "failed"]);

type StatusUpdatePayload = {
  status?: "started" | "completed" | "failed";
};

type RouteContext = {
  params: Promise<{ sprayId: string }> | { sprayId: string };
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const profile = await requireWallet({ locale: "en", nextPath: "/spray" });
  const { sprayId } = await params;

  if (!sprayId) {
    return NextResponse.json({ error: "Missing spray id" }, { status: 400 });
  }

  const payload = await readJsonBody<StatusUpdatePayload>(request);
  const status = payload?.status;
  if (!status || !STATUS_VALUES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("sprays")
      .update({ status })
      .eq("id", sprayId)
      .eq("lab_user_id", profile.id)
      .select("*")
      .single();

    if (error || !data) {
      throw error;
    }

    return NextResponse.json({ sprayId: data.id, status: data.status });
  } catch (error) {
    console.error("Failed to update spray status", error);
    return NextResponse.json(
      { error: "Unable to update spray" },
      { status: 500 },
    );
  }
}
