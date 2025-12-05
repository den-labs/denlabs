import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserProfile,
} from "@/lib/userProfile";

type UserResponse = {
  user: UserProfile | null;
  error?: string;
};

async function handleResponse(response: Response): Promise<UserProfile | null> {
  const data = (await response.json()) as UserResponse;
  if (!response.ok) {
    const message = data?.error ?? "Request failed";
    throw new Error(message);
  }
  return data.user ?? null;
}

export async function fetchUserProfile() {
  const response = await fetch("/api/user", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  return handleResponse(response);
}

export async function createUserProfile(payload: CreateUserPayload) {
  const response = await fetch("/api/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateUserProfile(payload: UpdateUserPayload) {
  const response = await fetch("/api/user", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}
