import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireWallet } from "@/lib/accessGuards";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { readJsonBody } from "@/lib/userProfile";

const STATUS_VALUES = new Set(["queued", "sent", "confirmed", "failed"]);

type BatchPayload = {
  batchIndex?: number;
  batchSize?: number;
  recipientsCount?: number;
  status?: "queued" | "sent" | "confirmed" | "failed";
  txHash?: string | null;
  errorMessage?: string | null;
};

type RouteContext = {
  params: Promise<{ sprayId: string }> | { sprayId: string };
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

export async function GET(_: NextRequest, { params }: RouteContext) {
  const profile = await requireWallet({ locale: "en", nextPath: "/spray" });
  const { sprayId } = await params;

  if (!sprayId) {
    return NextResponse.json({ error: "Missing spray id" }, { status: 400 });
  }

  try {
    const hasAccess = await ensureSprayOwner(sprayId, profile.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("spray_batches")
      .select("*")
      .eq("spray_id", sprayId)
      .order("batch_index", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ batches: data ?? [] });
  } catch (error) {
    console.error("Failed to fetch spray batches", error);
    return NextResponse.json(
      { error: "Unable to fetch batches" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const profile = await requireWallet({ locale: "en", nextPath: "/spray" });
  const { sprayId } = await params;

  if (!sprayId) {
    return NextResponse.json({ error: "Missing spray id" }, { status: 400 });
  }

  const payload = await readJsonBody<BatchPayload>(request);
  const batchIndex = Number(payload?.batchIndex);
  const recipientsCount = Number(payload?.recipientsCount);
  const batchSizeValue = payload?.batchSize;
  const batchSize = Number.isInteger(batchSizeValue)
    ? Number(batchSizeValue)
    : 200;
  const status = payload?.status ?? "queued";
  const txHash = payload?.txHash ?? null;
  const errorMessage = payload?.errorMessage ?? null;

  if (!Number.isInteger(batchIndex) || batchIndex < 0) {
    return NextResponse.json({ error: "Invalid batch index" }, { status: 400 });
  }

  if (!Number.isInteger(recipientsCount) || recipientsCount < 0) {
    return NextResponse.json(
      { error: "Invalid recipients count" },
      { status: 400 },
    );
  }

  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    return NextResponse.json({ error: "Invalid batch size" }, { status: 400 });
  }

  if (!STATUS_VALUES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const hasAccess = await ensureSprayOwner(sprayId, profile.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("spray_batches")
      .upsert(
        {
          spray_id: sprayId,
          batch_index: batchIndex,
          batch_size: batchSize,
          recipients_count: recipientsCount,
          status,
          tx_hash: txHash,
          error_message: errorMessage,
        },
        { onConflict: "spray_id,batch_index" },
      )
      .select("*")
      .single();

    if (error || !data) {
      throw error;
    }

    return NextResponse.json({ batch: data });
  } catch (error) {
    console.error("Failed to upsert spray batch", error);
    return NextResponse.json(
      { error: "Unable to save batch" },
      { status: 500 },
    );
  }
}
