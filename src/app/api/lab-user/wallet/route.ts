import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  type LabUserProfile,
  persistLabUserId,
  readJsonBody,
  sanitizeWallet,
  type WalletUpdatePayload,
} from "@/lib/userProfile";

function responseWithUser(user: LabUserProfile | null, init?: ResponseInit) {
  return NextResponse.json({ user }, init);
}

export async function PATCH(request: NextRequest) {
  const payload = await readJsonBody<WalletUpdatePayload>(request);
  if (!payload?.id) {
    return responseWithUser(null, {
      status: 400,
      statusText: "id is required",
    });
  }
  const sanitizedWallet = sanitizeWallet(payload.walletAddress);
  if (!sanitizedWallet) {
    return responseWithUser(null, {
      status: 400,
      statusText: "Invalid wallet address",
    });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("lab_users")
      .update({ wallet_address: sanitizedWallet })
      .eq("id", payload.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    persistLabUserId(data.id);
    return responseWithUser(data as LabUserProfile);
  } catch (error) {
    console.error("Failed to update wallet", error);
    return responseWithUser(null, { status: 500 });
  }
}
