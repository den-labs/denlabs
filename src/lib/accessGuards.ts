import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getStoredLabUserId, type LabUserProfile } from "@/lib/userProfile";

type GuardOptions = {
  locale: string;
  nextPath: string;
};

function sanitizeNextPath(nextPath: string) {
  if (!nextPath) {
    return "/lab";
  }
  const trimmed = nextPath.trim();
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.replace(/[^/A-Za-z0-9?=&._-]/g, "");
}

function buildAccessUrl({
  locale,
  nextPath,
  walletRequired,
}: GuardOptions & { walletRequired?: boolean }) {
  const params = new URLSearchParams();
  params.set("next", sanitizeNextPath(nextPath));
  if (walletRequired) {
    params.set("walletRequired", "true");
  }
  return `/${locale}/access?${params.toString()}`;
}

export async function requireProfile({
  locale,
  nextPath,
}: GuardOptions): Promise<LabUserProfile> {
  const id = getStoredLabUserId();
  if (!id) {
    redirect(buildAccessUrl({ locale, nextPath }));
  }
  const { data, error } = await supabaseAdmin
    .from("lab_users")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) {
    redirect(buildAccessUrl({ locale, nextPath }));
  }
  return data as LabUserProfile;
}

export async function requireWallet({
  locale,
  nextPath,
}: GuardOptions): Promise<LabUserProfile> {
  const profile = await requireProfile({ locale, nextPath });
  if (!profile.wallet_address) {
    redirect(buildAccessUrl({ locale, nextPath, walletRequired: true }));
  }
  return profile;
}
