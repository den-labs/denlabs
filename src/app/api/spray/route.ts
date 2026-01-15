import { NextResponse } from "next/server";
import { requireWallet } from "@/lib/accessGuards";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  const profile = await requireWallet({ locale: "en", nextPath: "/spray" });

  try {
    const { data, error } = await supabaseAdmin
      .from("sprays")
      .insert({
        lab_user_id: profile.id,
        wallet_address: profile.wallet_address,
        status: "draft",
      })
      .select("*")
      .single();

    if (error || !data) {
      throw error;
    }

    return NextResponse.json({
      sprayId: data.id,
      status: data.status,
    });
  } catch (error) {
    console.error("Failed to create spray draft", error);
    return NextResponse.json(
      { error: "Unable to create spray" },
      { status: 500 },
    );
  }
}
