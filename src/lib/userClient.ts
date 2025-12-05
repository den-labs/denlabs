import type {
  CreateLabUserPayload,
  LabUserProfile,
  SelfUpdatePayload,
  WalletUpdatePayload,
} from "@/lib/userProfile";

type UserResponse = {
  user: LabUserProfile | null;
  error?: string;
};

async function handleResponse(
  response: Response,
): Promise<LabUserProfile | null> {
  const data = (await response.json()) as UserResponse;
  if (!response.ok) {
    const message = data?.error ?? "Request failed";
    throw new Error(message);
  }
  return data.user ?? null;
}

export async function fetchUserProfile() {
  const response = await fetch("/api/lab-user", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  return handleResponse(response);
}

export async function saveUserProfile(payload: CreateLabUserPayload) {
  const response = await fetch("/api/lab-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateUserWallet(payload: WalletUpdatePayload) {
  const response = await fetch("/api/lab-user/wallet", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function markUserSelfVerified(payload: SelfUpdatePayload) {
  const response = await fetch("/api/lab-user/self", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}
