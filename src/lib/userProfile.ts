import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export type UserRole = "player" | "organizer" | "sponsor";

export type LabUserProfile = {
  id: string;
  handle: string | null;
  display_name: string;
  role: UserRole;
  wallet_address: string | null;
  self_verified: boolean;
  hold_score: number;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateLabUserPayload = {
  id?: string;
  handle?: string;
  name?: string;
  role?: UserRole;
};

export type WalletUpdatePayload = {
  id?: string;
  walletAddress: string;
};

export type SelfUpdatePayload = {
  id: string;
  holdBonus?: number;
};

export const LAB_USER_COOKIE = "denlabs-user-id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function getStoredLabUserId(): Promise<string | null> {
  const store = await cookies();
  const id = store.get(LAB_USER_COOKIE)?.value;
  return id ?? null;
}

export async function persistLabUserId(id: string) {
  const store = await cookies();
  store.set(LAB_USER_COOKIE, id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearLabUserId() {
  const store = await cookies();
  store.delete(LAB_USER_COOKIE);
}

export async function readJsonBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

const HANDLE_REGEX = /^[A-Za-z0-9_.-]{3,32}$/;

export function sanitizeHandle(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed.length) {
    return null;
  }
  return HANDLE_REGEX.test(trimmed) ? trimmed : null;
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

export function buildDisplayNameFromWallet(
  value: `0x${string}` | string | null | undefined,
): string {
  if (typeof value !== "string" || value.length === 0) {
    return "Den Builder";
  }
  if (value.length <= 12) {
    return value;
  }
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}
