import { isAddress } from "ethers";
import { type NextRequest, NextResponse } from "next/server";
import {
  type CreateUserPayload,
  getStoredUserProfile,
  persistUserProfile,
  readJsonBody,
  sanitizeName,
  sanitizeRole,
  sanitizeWallet,
  type UpdateUserPayload,
  type UserProfile,
} from "@/lib/userProfile";

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export async function GET() {
  const user = getStoredUserProfile();
  return jsonResponse({ user });
}

export async function POST(request: NextRequest) {
  const payload = await readJsonBody<CreateUserPayload>(request);
  const name = sanitizeName(payload?.name);
  if (!name) {
    return jsonResponse({ error: "Name is required" }, { status: 400 });
  }
  const role = sanitizeRole(payload?.role);
  const existing = getStoredUserProfile();
  const timestamp = new Date().toISOString();

  const user: UserProfile = existing
    ? {
        ...existing,
        name,
        role,
        updatedAt: timestamp,
      }
    : {
        id: crypto.randomUUID(),
        name,
        role,
        wallet: null,
        selfVerified: false,
        holdScore: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

  persistUserProfile(user);
  return jsonResponse({ user });
}

export async function PATCH(request: NextRequest) {
  const payload = await readJsonBody<UpdateUserPayload>(request);
  const existing = getStoredUserProfile();
  if (!existing) {
    return jsonResponse({ error: "Profile not found" }, { status: 404 });
  }
  if (!payload || typeof payload !== "object") {
    return jsonResponse({ error: "Invalid payload" }, { status: 400 });
  }

  const nextProfile: UserProfile = { ...existing };

  if ("name" in payload) {
    const sanitized = sanitizeName(payload.name);
    if (!sanitized) {
      return jsonResponse({ error: "Name is required" }, { status: 400 });
    }
    nextProfile.name = sanitized;
  }

  if ("role" in payload) {
    nextProfile.role = sanitizeRole(payload.role);
  }

  if ("wallet" in payload) {
    const sanitizedWallet = sanitizeWallet(payload.wallet);
    if (sanitizedWallet && !isAddress(sanitizedWallet)) {
      return jsonResponse({ error: "Invalid wallet address" }, { status: 400 });
    }
    nextProfile.wallet = sanitizedWallet ?? null;
  }

  if ("selfVerified" in payload) {
    nextProfile.selfVerified = Boolean(payload.selfVerified);
  }

  if ("holdScore" in payload) {
    const holdScore =
      typeof payload.holdScore === "number" &&
      Number.isFinite(payload.holdScore)
        ? payload.holdScore
        : existing.holdScore;
    nextProfile.holdScore = holdScore;
  }

  nextProfile.updatedAt = new Date().toISOString();
  persistUserProfile(nextProfile);

  return jsonResponse({ user: nextProfile });
}
