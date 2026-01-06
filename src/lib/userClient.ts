export type UserSession = {
  isAuthenticated: boolean;
  labUserId: string | null;
  walletAddress: `0x${string}` | null;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  hasProfile: boolean;
  isSelfVerified: boolean;
  holdScore: number;
};

export type WalletLoginResponse = {
  labUserId: string;
  walletAddress: string | null;
  handle: string | null;
  hasProfile: boolean;
  isSelfVerified: boolean;
  holdScore: number;
};

type HandleResponse = {
  handle: string;
  hasProfile: boolean;
};

async function handleJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    const message = data?.error ?? "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function fetchUserSession(): Promise<UserSession> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  return handleJsonResponse<UserSession>(response);
}

export async function loginWithWallet(
  walletAddress: string,
): Promise<WalletLoginResponse> {
  const response = await fetch("/api/auth/wallet-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ walletAddress }),
  });
  return handleJsonResponse<WalletLoginResponse>(response);
}

export async function claimUserHandle(handle: string): Promise<HandleResponse> {
  const response = await fetch("/api/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ handle }),
  });
  return handleJsonResponse<HandleResponse>(response);
}

export async function markUserSelfVerified(holdBonus?: number) {
  const response = await fetch("/api/trust/self-verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: holdBonus ? JSON.stringify({ holdBonus }) : undefined,
  });
  return handleJsonResponse<{ isSelfVerified: boolean; holdScore: number }>(
    response,
  );
}
