import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export type UserRole = "Organizer" | "Player" | "Sponsor";

export type UserProfile = {
  id: string;
  name: string;
  role: UserRole | null;
  wallet: `0x${string}` | null;
  selfVerified: boolean;
  holdScore: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserPayload = {
  name: string;
  role?: UserRole | null;
};

export type UpdateUserPayload = Partial<
  Pick<UserProfile, "name" | "role" | "wallet" | "selfVerified" | "holdScore">
>;

export const USER_PROFILE_COOKIE = "denlabs-user";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function parseUserProfile(
  value: string | undefined,
): UserProfile | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as Partial<UserProfile>;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.name === "string" &&
      typeof parsed.id === "string"
    ) {
      return {
        id: parsed.id,
        name: parsed.name,
        role: (parsed.role as UserRole | null | undefined) ?? null,
        wallet: (parsed.wallet as `0x${string}` | null | undefined) ?? null,
        selfVerified: Boolean(parsed.selfVerified),
        holdScore: Number.isFinite(parsed.holdScore)
          ? (parsed.holdScore as number)
          : 0,
        createdAt:
          typeof parsed.createdAt === "string"
            ? parsed.createdAt
            : new Date().toISOString(),
        updatedAt:
          typeof parsed.updatedAt === "string"
            ? parsed.updatedAt
            : new Date().toISOString(),
      };
    }
  } catch {
    // ignore malformed cookie
  }
  return null;
}

export function getStoredUserProfile(): UserProfile | null {
  const store = cookies();
  const cookie = store.get(USER_PROFILE_COOKIE)?.value;
  return parseUserProfile(cookie);
}

export function persistUserProfile(profile: UserProfile) {
  cookies().set(USER_PROFILE_COOKIE, JSON.stringify(profile), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function readJsonBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function sanitizeName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function sanitizeRole(value: unknown): UserRole | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const normalized =
    typeof value === "string" ? (value.trim() as UserRole) : null;
  if (
    normalized === "Organizer" ||
    normalized === "Player" ||
    normalized === "Sponsor"
  ) {
    return normalized;
  }
  return null;
}

export function sanitizeWallet(
  value: unknown,
): `0x${string}` | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || !value.startsWith("0x")) {
    return null;
  }
  return value as `0x${string}`;
}
