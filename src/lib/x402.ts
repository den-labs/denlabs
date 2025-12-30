/**
 * x402 Premium Payment Layer
 * Implements HTTP 402 Payment Required for premium endpoints
 *
 * Flow:
 * 1. Client requests premium endpoint
 * 2. Server checks PAYMENT-SIGNATURE header
 * 3a. If valid payment → return resource (200)
 * 3b. If no payment → return 402 with PAYMENT-REQUIRED instructions
 *
 * Stateless: No DB writes, verification via facilitator
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PREMIUM POLICY (What's FREE vs PREMIUM)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * FREE TIER (Adoption & Real-time Event Operations):
 * ✅ Create unlimited labs
 * ✅ Submit unlimited feedback
 * ✅ 24h activity window (real-time ops)
 * ✅ JSON preview (UI display)
 * ✅ Event tracking
 * ✅ Basic retro pack (JSON)
 *
 * PREMIUM TIER (Value-add, Non-blocking Exports & Extended Data):
 * 💎 Retro markdown export ($0.03) - sponsor-ready format
 * 💎 Extended activity windows:
 *    - 7 days: $0.02
 *    - 30 days: $0.03
 *    - 90 days: $0.05
 * 💎 Feedback CSV export ($0.02) - bulk analysis
 * 💎 Activity JSON export ($0.02) - programmatic access
 *
 * FUTURE PREMIUM (Not yet implemented):
 * 🚧 AI insights ($0.08) - LLM-powered triage and recommendations
 * 🚧 Bulk exports ($0.10) - multi-lab exports
 * 🚧 Custom integrations ($0.05) - webhooks, Slack, GitHub
 *
 * PRINCIPLE: Premium features are NON-BLOCKING add-ons.
 * Core event operations remain free to maximize adoption.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  FacilitatorClient,
  extractPaymentFromHeaders,
  type PaymentRequirements,
} from "uvd-x402-sdk/backend";
import { getDefaultX402Token } from "@/config/x402Tokens";
import {
  CHAIN_ID_TO_NETWORK,
  getDefaultChainId,
  getNetworkFromChainId,
  normalizeNetwork,
} from "@/utils/network";

// Environment config
const X402_CONFIG = {
  facilitatorUrl:
    process.env.X402_FACILITATOR_URL ||
    "https://facilitator.ultravioletadao.xyz",
  recipient:
    process.env.X402_RECIPIENT || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", // ⚠️ CONFIGURE: Set your payment recipient address in .env.local
  maxPrice: Number.parseInt(process.env.X402_MAX_PRICE || "10", 10),
  token: process.env.X402_TOKEN || "usdc",
  devBypass: process.env.X402_DEV_BYPASS === "true",
  enableHealthcheck: process.env.X402_ENABLE_HEALTHCHECK !== "false", // Default true
  healthcheckTimeout: Number.parseInt(
    process.env.X402_HEALTHCHECK_TIMEOUT || "2000",
    10,
  ),
} as const;

// Cache facilitator health status (TTL: 30 seconds)
let facilitatorHealthCache: { healthy: boolean; timestamp: number } | null =
  null;
const HEALTH_CACHE_TTL = 30000; // 30 seconds

// Cache facilitator supported networks (TTL: 5 minutes)
let facilitatorSupportedNetworks: Set<string> | null = null;
let facilitatorSupportedFetchedAt = 0;
const SUPPORTED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Resolve x402 network configuration from request
 * Priority: query param (chainId or network) > default
 */
export function resolveX402Network(req: NextRequest): {
  chainId: number;
  chainName: string;
  tokenAddress: string;
} {
  const url = new URL(req.url);
  const defaultChainId = getDefaultChainId();

  // Try chainId query param first
  const chainIdParam = url.searchParams.get("chainId");
  if (chainIdParam) {
    const chainId = parseInt(chainIdParam, 10);
    if (CHAIN_ID_TO_NETWORK[chainId]) {
      const chainName = getNetworkFromChainId(chainId) || "avalanche-fuji";
      const token = getDefaultX402Token(chainId);
      return {
        chainId,
        chainName,
        tokenAddress:
          token?.address || "0x5425890298aed601595a70AB815c96711a31Bc65",
      };
    }
  }

  // Try network query param
  const networkParam = url.searchParams.get("network");
  if (networkParam) {
    const normalized = normalizeNetwork(networkParam);
    if (normalized) {
      // Find chainId for this network
      const entry = Object.entries(CHAIN_ID_TO_NETWORK).find(
        ([, name]) => name === normalized,
      );
      if (entry) {
        const chainId = parseInt(entry[0], 10);
        const token = getDefaultX402Token(chainId);
        return {
          chainId,
          chainName: normalized,
          tokenAddress:
            token?.address || "0x5425890298aed601595a70AB815c96711a31Bc65",
        };
      }
    }
  }

  // Default fallback
  const defaultNetwork =
    getNetworkFromChainId(defaultChainId) || "avalanche-fuji";
  const defaultToken = getDefaultX402Token(defaultChainId);
  return {
    chainId: defaultChainId,
    chainName: defaultNetwork,
    tokenAddress:
      defaultToken?.address || "0x5425890298aed601595a70AB815c96711a31Bc65",
  };
}

/**
 * Get networks supported by the facilitator
 * Caches result for 5 minutes
 */
export async function getFacilitatorSupportedNetworks(): Promise<Set<string>> {
  const now = Date.now();

  // Use cache if valid
  if (
    facilitatorSupportedNetworks &&
    now - facilitatorSupportedFetchedAt < SUPPORTED_CACHE_TTL
  ) {
    return facilitatorSupportedNetworks;
  }

  try {
    const response = await fetch(`${X402_CONFIG.facilitatorUrl}/supported`, {
      signal: AbortSignal.timeout(X402_CONFIG.healthcheckTimeout),
    });

    if (!response.ok) {
      console.warn("[x402] Facilitator /supported returned", response.status);
      return facilitatorSupportedNetworks || new Set();
    }

    const data = await response.json();
    const networks = new Set<string>();

    for (const kind of data.kinds ?? []) {
      const normalized = normalizeNetwork(kind.network);
      if (normalized) networks.add(normalized);
    }

    console.info("[x402] Facilitator supports:", [...networks].join(", "));
    facilitatorSupportedNetworks = networks;
    facilitatorSupportedFetchedAt = now;

    return networks;
  } catch (error) {
    console.warn(
      "[x402] Failed to fetch facilitator supported networks:",
      error,
    );
    return facilitatorSupportedNetworks || new Set();
  }
}

/**
 * Check if a network is supported by the facilitator
 */
export async function isNetworkSupported(network: string): Promise<boolean> {
  const supported = await getFacilitatorSupportedNetworks();
  // If we couldn't fetch supported networks, assume all are supported
  return supported.size === 0 || supported.has(network);
}

export interface PaymentRequirement {
  price: number; // USD
  endpoint: string;
  method: string;
  description: string;
  chainId: number;
  tokenAddress: string;
  chainName: string; // e.g., "avalanche-fuji", "base", "celo"
  mimeType?: string;
}

export interface PaymentVerificationResult {
  valid: boolean;
  error?: string;
  payer?: string;
}

/**
 * Check facilitator health with caching
 * Returns true if healthy, false if down
 */
async function checkFacilitatorHealth(): Promise<boolean> {
  // Skip health check if disabled
  if (!X402_CONFIG.enableHealthcheck) {
    return true;
  }

  // Check cache first
  if (facilitatorHealthCache) {
    const age = Date.now() - facilitatorHealthCache.timestamp;
    if (age < HEALTH_CACHE_TTL) {
      return facilitatorHealthCache.healthy;
    }
  }

  // Perform health check with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      X402_CONFIG.healthcheckTimeout,
    );

    const response = await fetch(`${X402_CONFIG.facilitatorUrl}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const healthy = response.status === 200;

    // Update cache
    facilitatorHealthCache = {
      healthy,
      timestamp: Date.now(),
    };

    return healthy;
  } catch (error) {
    console.error("[x402] Facilitator health check failed:", error);

    // Cache as unhealthy
    facilitatorHealthCache = {
      healthy: false,
      timestamp: Date.now(),
    };

    return false;
  }
}

/**
 * Create facilitator client instance
 */
function createFacilitatorClient(): FacilitatorClient {
  return new FacilitatorClient({
    baseUrl: X402_CONFIG.facilitatorUrl,
    timeout: 30000,
  });
}

/**
 * Verify payment from request headers using the facilitator
 * Uses uvd-x402-sdk to validate payment payload
 */
export async function verifyPayment(
  req: NextRequest,
  requirement: PaymentRequirement,
): Promise<PaymentVerificationResult> {
  // DEV MODE: Bypass payment in local development
  if (X402_CONFIG.devBypass) {
    console.log(
      `[x402 DEV] Bypassing payment verification for ${requirement.endpoint}`,
    );
    return { valid: true };
  }

  try {
    // Extract payment header from request (checks both X-PAYMENT and PAYMENT-SIGNATURE)
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const paymentHeader = extractPaymentFromHeaders(headers);
    if (!paymentHeader) {
      return {
        valid: false,
        error:
          "Missing or invalid payment header (X-PAYMENT or PAYMENT-SIGNATURE)",
      };
    }

    console.log("[x402] Payment header received:", paymentHeader);

    // Build payment requirements manually (SDK doesn't have Avalanche Fuji config)
    // Calculate amount in atomic units (e.g., 0.03 USD = 30000 USDC with 6 decimals)
    const atomicAmount = Math.floor(requirement.price * 1_000_000).toString();

    const paymentRequirements: PaymentRequirements = {
      scheme: "exact" as const,
      network: requirement.chainName, // "avalanche-fuji" is supported by facilitator
      maxAmountRequired: atomicAmount,
      resource: `${req.nextUrl.origin}${requirement.endpoint}`,
      description: requirement.description,
      mimeType: requirement.mimeType || "application/json",
      payTo: X402_CONFIG.recipient,
      maxTimeoutSeconds: 300,
      asset: requirement.tokenAddress, // USDC contract address
    };

    console.log("[x402] Verifying payment with facilitator:", {
      resource: paymentRequirements.resource,
      amount: paymentRequirements.maxAmountRequired,
      network: paymentRequirements.network,
    });

    // Verify AND settle with facilitator using SDK
    // IMPORTANT: Use verifyAndSettle (not verify) to execute on-chain transfer
    const facilitator = createFacilitatorClient();
    const settleResult = await facilitator.verifyAndSettle(
      paymentHeader,
      paymentRequirements,
    );

    if (!settleResult.verified || !settleResult.settled) {
      console.warn(
        "[x402] Payment verification/settlement failed:",
        settleResult.error,
      );
      return {
        valid: false,
        error: settleResult.error || "Payment verification failed",
      };
    }

    console.log("[x402] Payment verified and settled successfully!", {
      transactionHash: settleResult.transactionHash,
      settled: settleResult.settled,
    });

    return {
      valid: true,
    };
  } catch (error) {
    console.error("[x402] Payment verification error:", error);
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : "Unknown verification error",
    };
  }
}

/**
 * Build 402 Payment Required response
 * Returns structured payment requirements for the client
 *
 * IMPORTANT: Check facilitator health first. If down, return 503 instead of 402
 * because payment cannot be processed.
 */
export async function build402Response(
  req: NextRequest,
  requirement: PaymentRequirement,
): Promise<NextResponse> {
  // Check facilitator health before requiring payment
  const facilitatorHealthy = await checkFacilitatorHealth();

  if (!facilitatorHealthy) {
    // Facilitator is down - return 503 Service Unavailable
    console.warn(
      "[x402] Facilitator unavailable, returning 503 instead of 402",
    );

    return NextResponse.json(
      {
        error: "Service Unavailable",
        message:
          "Payment facilitator is currently unavailable. Please retry in a few moments.",
        retryAfter: 30,
        facilitator: X402_CONFIG.facilitatorUrl,
      },
      {
        status: 503,
        headers: {
          "Retry-After": "30",
        },
      },
    );
  }

  // Build payment requirements in x402 format
  // x402-fetch expects: { x402Version, accepts: [PaymentRequirements] }
  const atomicAmount = Math.floor(requirement.price * 1_000_000).toString();

  const paymentRequirements: PaymentRequirements = {
    scheme: "exact" as const,
    network: requirement.chainName, // "avalanche-fuji" is supported by facilitator
    maxAmountRequired: atomicAmount,
    resource: `${req.nextUrl.origin}${requirement.endpoint}`,
    description: requirement.description,
    mimeType: requirement.mimeType || "application/json",
    payTo: X402_CONFIG.recipient,
    maxTimeoutSeconds: 300,
    asset: requirement.tokenAddress,
  };

  // x402 standard response format (required by x402-fetch)
  const response = NextResponse.json(
    {
      x402Version: 1,
      accepts: [paymentRequirements],
      // Additional info for UI display
      error: "Payment Required",
      message: `This endpoint requires payment of $${requirement.price} USD`,
      description: requirement.description,
    },
    { status: 402 },
  );

  return response;
}

/**
 * Middleware wrapper for premium endpoints
 * Handles payment verification and 402 responses automatically
 *
 * Usage:
 * export const GET = withX402(handler, {
 *   price: 3,
 *   endpoint: "/api/labs/[slug]/retro",
 *   method: "GET",
 *   description: "Export retro pack as markdown"
 * });
 */
export function withX402<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
  requirement: PaymentRequirement,
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    // Verify payment
    const verification = await verifyPayment(req, requirement);

    if (!verification.valid) {
      console.log(
        `[x402] Payment required for ${requirement.endpoint}: ${verification.error}`,
      );
      return build402Response(req, requirement);
    }

    console.log(
      `[x402] Payment verified for ${requirement.endpoint}`,
      verification.payer ? `from payer: ${verification.payer}` : "",
    );

    // Payment valid - execute handler
    return handler(req, ...args);
  };
}

/**
 * Check if request should be gated (helper for conditional gating)
 * Use when endpoint has both free and premium variants
 */
export function shouldGate(_req: NextRequest, condition: boolean): boolean {
  // Never gate in dev bypass mode
  if (X402_CONFIG.devBypass) {
    return false;
  }

  return condition;
}

/**
 * Get pricing for an endpoint (for UI display)
 * Prices in USD (will be converted to token amounts by facilitator)
 */
export const PRICING = {
  RETRO_MARKDOWN: 0.03, // $0.03 (3 cents)
  ACTIVITY_7D: 0.02, // $0.02 (2 cents)
  ACTIVITY_30D: 0.03, // $0.03 (3 cents)
  ACTIVITY_90D: 0.05, // $0.05 (5 cents)
  FEEDBACK_CSV: 0.02, // $0.02 (2 cents)
  ACTIVITY_JSON: 0.02, // $0.02 (2 cents)
  INSIGHTS_AI: 0.08, // $0.08 (8 cents)
  BULK_EXPORT: 0.1, // $0.10 (10 cents)
} as const;

/**
 * Get payment config (for client-side)
 */
export function getPaymentConfig() {
  return {
    facilitatorUrl: X402_CONFIG.facilitatorUrl,
    recipient: X402_CONFIG.recipient,
    token: X402_CONFIG.token,
    devBypass: X402_CONFIG.devBypass,
  };
}
