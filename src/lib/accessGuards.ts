import { redirect } from "next/navigation";
import { getStoredUserProfile, type UserProfile } from "@/lib/userProfile";

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

export function requireProfile({
  locale,
  nextPath,
}: GuardOptions): UserProfile {
  const profile = getStoredUserProfile();
  if (!profile) {
    redirect(buildAccessUrl({ locale, nextPath }));
  }
  return profile;
}

export function requireWallet({ locale, nextPath }: GuardOptions): UserProfile {
  const profile = requireProfile({ locale, nextPath });
  if (!profile.wallet) {
    redirect(buildAccessUrl({ locale, nextPath, walletRequired: true }));
  }
  return profile;
}
