import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireWallet } from "@/lib/accessGuards";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { readJsonBody } from "@/lib/userProfile";

const STATUS_VALUES = new Set(["queued", "sent", "confirmed", "failed"]);

type BatchUpdatePayload = {
  status?: "queued" | "sent" | "confirmed" | "failed";
  txHash?: string | null;
  errorMessage?: string | null;
};

type RouteContext = {
  params:
    | Promise<{ sprayId: string; batchIndex: string }>
    | { sprayId: string; batchIndex: string };
};

async function ensureSprayOwner(sprayId: string, labUserId: string) {
  const { data, error } = await supabaseAdmin
    .from("sprays")
    .select("id")
    .eq("id", sprayId)
    .eq("lab_user_id", labUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const profile = await requireWallet({ locale: "en", nextPath: "/spray" });
  const { sprayId, batchIndex: batchIndexParam } = await params;

  if (!sprayId) {
    return NextResponse.json({ error: "Missing spray id" }, { status: 400 });
  }

  const batchIndex = Number(batchIndexParam);
  if (!Number.isInteger(batchIndex) || batchIndex < 0) {
    return NextResponse.json({ error: "Invalid batch index" }, { status: 400 });
  }

  const payload = await readJsonBody<BatchUpdatePayload>(request);
  const status = payload?.status;
  const txHash = payload?.txHash;
  const errorMessage = payload?.errorMessage;

  if (status && !STATUS_VALUES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (status) updatePayload.status = status;
  if (txHash !== undefined) updatePayload.tx_hash = txHash;
  if (errorMessage !== undefined) updatePayload.error_message = errorMessage;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  try {
    const hasAccess = await ensureSprayOwner(sprayId, profile.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("spray_batches")
      .update(updatePayload)
      .eq("spray_id", sprayId)
      .eq("batch_index", batchIndex)
      .select("*")
      .single();

    if (error || !data) {
      throw error;
    }

    return NextResponse.json({ batch: data });
  } catch (error) {
    console.error("Failed to update spray batch", error);
    return NextResponse.json(
      { error: "Unable to update batch" },
      { status: 500 },
    );
  }
}
