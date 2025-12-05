import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export type UserRole = "player" | "organizer" | "sponsor";

export type LabUserProfile = {
  id: string;
  name: string;
  role: UserRole;
  wallet_address: string | null;
  self_verified: boolean;
  hold_score: number;
  created_at: string;
  updated_at: string;
};

export type CreateLabUserPayload = {
  id?: string;
  name: string;
  role?: UserRole;
};

export type WalletUpdatePayload = {
  id: string;
  walletAddress: string;
};

export type SelfUpdatePayload = {
  id: string;
  holdBonus?: number;
};

export const LAB_USER_COOKIE = "denlabs-user-id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function getStoredLabUserId(): string | null {
  const id = cookies().get(LAB_USER_COOKIE)?.value;
  return id ?? null;
}

export function persistLabUserId(id: string) {
  cookies().set(LAB_USER_COOKIE, id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearLabUserId() {
  cookies().delete(LAB_USER_COOKIE);
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

export function sanitizeRole(value: unknown): UserRole {
  if (typeof value !== "string") {
    return "player";
  }
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "player" ||
    normalized === "organizer" ||
    normalized === "sponsor"
  ) {
    return normalized;
  }
  return "player";
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
