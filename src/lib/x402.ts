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
 * 💎 Retro markdown export ($3) - sponsor-ready format
 * 💎 Extended activity windows:
 *    - 7 days: $2
 *    - 30 days: $3
 *    - 90 days: $5
 * 💎 Feedback CSV export ($2) - bulk analysis
 * 💎 Activity JSON export ($2) - programmatic access
 *
 * FUTURE PREMIUM (Not yet implemented):
 * 🚧 AI insights ($8) - LLM-powered triage and recommendations
 * 🚧 Bulk exports ($10) - multi-lab exports
 * 🚧 Custom integrations ($5) - webhooks, Slack, GitHub
 *
 * PRINCIPLE: Premium features are NON-BLOCKING add-ons.
 * Core event operations remain free to maximize adoption.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { type NextRequest, NextResponse } from "next/server";

// Environment config
const X402_CONFIG = {
  facilitatorUrl:
    process.env.X402_FACILITATOR_URL ||
    "https://facilitator.ultravioletadao.xyz",
  recipient:
    process.env.X402_RECIPIENT || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
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

export interface PaymentRequirement {
  price: number; // USD
  endpoint: string;
  method: string;
  description: string;
}

export interface PaymentVerificationResult {
  valid: boolean;
  error?: string;
  paidAmount?: number;
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
 * Verify payment signature from request headers
 * Calls facilitator /verify endpoint to validate payment
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
    return { valid: true, paidAmount: requirement.price };
  }

  // Check for payment signature header
  const paymentSignature = req.headers.get("PAYMENT-SIGNATURE");
  if (!paymentSignature) {
    return {
      valid: false,
      error: "Missing PAYMENT-SIGNATURE header",
    };
  }

  try {
    // Call facilitator to verify payment
    const response = await fetch(`${X402_CONFIG.facilitatorUrl}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signature: paymentSignature,
        recipient: X402_CONFIG.recipient,
        expectedAmount: requirement.price,
        token: X402_CONFIG.token,
        endpoint: requirement.endpoint,
        method: requirement.method,
      }),
    });

    if (!response.ok) {
      return {
        valid: false,
        error: `Facilitator verification failed: ${response.statusText}`,
      };
    }

    const result = await response.json();

    if (result.verified) {
      return {
        valid: true,
        paidAmount: result.amount,
      };
    }

    return {
      valid: false,
      error: result.error || "Payment verification failed",
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
 * Includes PAYMENT-REQUIRED header with payment instructions
 *
 * IMPORTANT: Check facilitator health first. If down, return 503 instead of 402
 * because payment cannot be processed.
 */
export async function build402Response(
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
        retryAfter: 30, // Suggest retry after 30 seconds
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

  // Facilitator is healthy - proceed with 402 response
  const paymentInstructions = {
    price: requirement.price,
    currency: "USD",
    token: X402_CONFIG.token,
    recipient: X402_CONFIG.recipient,
    endpoint: requirement.endpoint,
    method: requirement.method,
    description: requirement.description,
    facilitator: X402_CONFIG.facilitatorUrl,
    instructions:
      "Include PAYMENT-SIGNATURE header with valid payment proof to access this resource",
  };

  const response = NextResponse.json(
    {
      error: "Payment Required",
      message: `This endpoint requires payment of $${requirement.price} USD`,
      description: requirement.description,
      payment: paymentInstructions,
    },
    { status: 402 },
  );

  // Add PAYMENT-REQUIRED header with instructions
  response.headers.set("PAYMENT-REQUIRED", JSON.stringify(paymentInstructions));

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
      return build402Response(requirement);
    }

    console.log(
      `[x402] Payment verified for ${requirement.endpoint}: $${verification.paidAmount}`,
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
 */
export const PRICING = {
  RETRO_MARKDOWN: 3,
  ACTIVITY_7D: 2,
  ACTIVITY_30D: 3,
  ACTIVITY_90D: 5,
  FEEDBACK_CSV: 2,
  ACTIVITY_JSON: 2,
  INSIGHTS_AI: 8,
  BULK_EXPORT: 10,
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
