import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  type LabUserProfile,
  persistLabUserId,
  readJsonBody,
  type SelfUpdatePayload,
} from "@/lib/userProfile";

function responseWithUser(user: LabUserProfile | null, init?: ResponseInit) {
  return NextResponse.json({ user }, init);
}

export async function PATCH(request: NextRequest) {
  const payload = await readJsonBody<SelfUpdatePayload>(request);
  if (!payload?.id) {
    return responseWithUser(null, {
      status: 400,
      statusText: "id is required",
    });
  }

  const bonus = payload.holdBonus ?? 10;

  try {
    const { data: current, error: fetchError } = await supabaseAdmin
      .from("lab_users")
      .select("hold_score")
      .eq("id", payload.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const newScore = (current?.hold_score ?? 0) + bonus;

    const { data, error } = await supabaseAdmin
      .from("lab_users")
      .update({
        self_verified: true,
        hold_score: newScore,
      })
      .eq("id", payload.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    persistLabUserId(data.id);
    return responseWithUser(data as LabUserProfile);
  } catch (error) {
    console.error("Failed to update Self state", error);
    return responseWithUser(null, { status: 500 });
  }
}
