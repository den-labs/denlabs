/**
 * x402 Client Helper
 * Handles premium requests from browser
 *
 * Flow:
 * 1. fetchWithPayment(url, price) attempts request
 * 2. If 402 → parse PAYMENT-REQUIRED header
 * 3. Trigger payment flow via facilitator
 * 4. Retry request with PAYMENT-SIGNATURE
 * 5. Return resource or throw error
 */

export interface PaymentInstructions {
  price: number;
  currency: string;
  token: string;
  recipient: string;
  endpoint: string;
  method: string;
  description: string;
  facilitator: string;
  instructions: string;
}

export interface PaymentResult {
  signature: string;
  amount: number;
  token: string;
  timestamp: number;
}

/**
 * Fetch resource with automatic payment handling
 * Throws error if payment fails or is cancelled
 */
export async function fetchWithPayment(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  // Attempt initial request
  const response = await fetch(url, options);

  // If 200 OK → return immediately
  if (response.ok) {
    return response;
  }

  // If 402 Payment Required → handle payment flow
  if (response.status === 402) {
    const paymentResult = await handlePaymentRequired(response);

    // Retry with payment signature
    const retryResponse = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "PAYMENT-SIGNATURE": paymentResult.signature,
      },
    });

    if (!retryResponse.ok) {
      throw new Error(
        `Payment verified but request failed: ${retryResponse.statusText}`,
      );
    }

    return retryResponse;
  }

  // Other errors → throw
  throw new Error(`Request failed: ${response.statusText}`);
}

/**
 * Handle 402 Payment Required response
 * Parse instructions, trigger payment, return signature
 */
export async function handlePaymentRequired(
  response: Response,
): Promise<PaymentResult> {
  // Parse PAYMENT-REQUIRED header
  const paymentHeader = response.headers.get("PAYMENT-REQUIRED");
  if (!paymentHeader) {
    throw new Error("402 response missing PAYMENT-REQUIRED header");
  }

  let instructions: PaymentInstructions;
  try {
    instructions = JSON.parse(paymentHeader);
  } catch (_error) {
    throw new Error("Invalid PAYMENT-REQUIRED header format");
  }

  // Show payment UI / confirmation
  const confirmed = await confirmPayment(instructions);
  if (!confirmed) {
    throw new Error("Payment cancelled by user");
  }

  // Call facilitator to create payment
  const paymentResult = await createPayment(instructions);

  return paymentResult;
}

/**
 * Show payment confirmation to user
 * Returns true if user confirms, false if cancelled
 */
async function confirmPayment(
  instructions: PaymentInstructions,
): Promise<boolean> {
  // In real implementation, this would show a modal/dialog
  // For MVP, use window.confirm
  const message = `
Premium Feature: ${instructions.description}

Price: $${instructions.price} ${instructions.currency}
Token: ${instructions.token.toUpperCase()}

This will be charged to your connected wallet.
Continue?
  `.trim();

  return window.confirm(message);
}

/**
 * Create payment via facilitator
 * Returns payment signature for retry
 */
async function createPayment(
  instructions: PaymentInstructions,
): Promise<PaymentResult> {
  try {
    const response = await fetch(`${instructions.facilitator}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: instructions.price,
        token: instructions.token,
        recipient: instructions.recipient,
        endpoint: instructions.endpoint,
        method: instructions.method,
        description: instructions.description,
      }),
    });

    if (!response.ok) {
      throw new Error(`Payment creation failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.signature) {
      throw new Error("Payment response missing signature");
    }

    return {
      signature: result.signature,
      amount: result.amount,
      token: result.token,
      timestamp: result.timestamp || Date.now(),
    };
  } catch (error) {
    console.error("[x402] Payment creation error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Payment creation failed",
    );
  }
}

/**
 * Download resource with payment
 * Helper for export endpoints (markdown, CSV, JSON)
 */
export async function downloadWithPayment(
  url: string,
  filename: string,
): Promise<void> {
  try {
    const response = await fetchWithPayment(url);

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("[x402] Download error:", error);
    throw error;
  }
}

/**
 * Fetch JSON with payment
 * Helper for API endpoints that return JSON
 */
export async function fetchJsonWithPayment<T>(url: string): Promise<T> {
  const response = await fetchWithPayment(url);
  return response.json();
}
