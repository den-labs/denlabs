import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getStoredLabUserId, type LabUserProfile } from "@/lib/userProfile";

type SessionResponse =
  | {
      isAuthenticated: false;
      labUserId: null;
      walletAddress: null;
      handle: null;
      displayName: null;
      avatarUrl: null;
      hasProfile: false;
      isSelfVerified: false;
      holdScore: 0;
    }
  | {
      isAuthenticated: true;
      labUserId: string;
      walletAddress: string | null;
      handle: string | null;
      displayName: string | null;
      avatarUrl: string | null;
      hasProfile: boolean;
      isSelfVerified: boolean;
      holdScore: number;
    };

const ANONYMOUS_SESSION: SessionResponse = {
  isAuthenticated: false,
  labUserId: null,
  walletAddress: null,
  handle: null,
  displayName: null,
  avatarUrl: null,
  hasProfile: false,
  isSelfVerified: false,
  holdScore: 0,
};

export async function GET() {
  const id = await getStoredLabUserId();
  if (!id) {
    return NextResponse.json(ANONYMOUS_SESSION);
  }

  const { data, error } = await supabaseAdmin
    .from("lab_users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(ANONYMOUS_SESSION);
  }

  const profile = data as LabUserProfile;
  return NextResponse.json({
    isAuthenticated: true,
    labUserId: profile.id,
    walletAddress: profile.wallet_address,
    handle: profile.handle,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url ?? null,
    hasProfile: Boolean(profile.handle),
    isSelfVerified: Boolean(profile.self_verified),
    holdScore: Number(profile.hold_score ?? 0),
  });
}
