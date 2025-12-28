import { type NextRequest, NextResponse } from "next/server";

/**
 * x402 Conformance Test Endpoint
 *
 * Tests that premium endpoints correctly:
 * 1. Return 402 Payment Required without payment headers
 * 2. Include PAYMENT-REQUIRED header with payment instructions
 * 3. Include consistent payment details in response body
 *
 * Protected by:
 * - NODE_ENV !== "production" OR
 * - X402_DEV_DIAGNOSTICS=true
 *
 * Usage:
 *   GET /api/x402/conformance
 *   GET /api/x402/conformance?endpoint=/api/labs/demo-event/retro?format=markdown
 */

// Only allow in development or when explicitly enabled
const isDiagnosticsEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.X402_DEV_DIAGNOSTICS === "true";

export async function GET(request: NextRequest) {
  // Protect against production access
  if (!isDiagnosticsEnabled) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "Conformance tests only available in development",
      },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const testEndpoint =
    searchParams.get("endpoint") ||
    "/api/labs/demo-event/retro?format=markdown";

  // Build full URL for internal fetch
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.VERCEL_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  const fullUrl = `${baseUrl}${testEndpoint}`;

  const report = {
    ok: false,
    endpoint: testEndpoint,
    status: 0,
    hasPaymentRequiredHeader: false,
    paymentRequiredContent: null as unknown,
    responseBody: null as unknown,
    notes: [] as string[],
    timestamp: new Date().toISOString(),
  };

  try {
    // Call premium endpoint WITHOUT payment headers
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        // No PAYMENT-SIGNATURE header
      },
    });

    report.status = response.status;

    // Check for 402 status
    if (response.status !== 402) {
      report.notes.push(
        `❌ Expected 402 Payment Required, got ${response.status}`,
      );
    } else {
      report.notes.push("✅ Correct 402 status code");
    }

    // Check for PAYMENT-REQUIRED header
    const paymentRequiredHeader = response.headers.get("PAYMENT-REQUIRED");
    report.hasPaymentRequiredHeader = !!paymentRequiredHeader;

    if (!paymentRequiredHeader) {
      report.notes.push("❌ Missing PAYMENT-REQUIRED header");
    } else {
      report.notes.push("✅ PAYMENT-REQUIRED header present");

      try {
        report.paymentRequiredContent = JSON.parse(paymentRequiredHeader);
        report.notes.push("✅ PAYMENT-REQUIRED header is valid JSON");

        // Validate required fields
        const required = report.paymentRequiredContent as Record<
          string,
          unknown
        >;
        const requiredFields = [
          "price",
          "currency",
          "token",
          "recipient",
          "endpoint",
          "method",
          "description",
          "facilitator",
          "instructions",
        ];

        const missingFields = requiredFields.filter(
          (field) => !required[field],
        );
        if (missingFields.length > 0) {
          report.notes.push(
            `❌ Missing fields in PAYMENT-REQUIRED: ${missingFields.join(", ")}`,
          );
        } else {
          report.notes.push("✅ All required fields present");
        }
      } catch (_error) {
        report.notes.push("❌ PAYMENT-REQUIRED header is not valid JSON");
      }
    }

    // Check response body
    const body = await response.json();
    report.responseBody = body;

    if (!body.error) {
      report.notes.push("❌ Missing 'error' field in body");
    } else if (body.error === "Payment Required") {
      report.notes.push("✅ Correct error message");
    } else {
      report.notes.push(
        `⚠️  Unexpected error message: ${body.error} (expected 'Payment Required')`,
      );
    }

    // Check for payment details in body
    if (!body.payment) {
      report.notes.push("❌ Missing 'payment' object in body");
    } else {
      report.notes.push("✅ Payment instructions in body");

      // Validate consistency between header and body
      if (
        paymentRequiredHeader &&
        report.paymentRequiredContent &&
        JSON.stringify(report.paymentRequiredContent) ===
          JSON.stringify(body.payment)
      ) {
        report.notes.push("✅ Header and body payment instructions match");
      } else {
        report.notes.push("⚠️  Header and body payment instructions differ");
      }
    }

    // Determine overall success
    report.ok =
      response.status === 402 &&
      !!paymentRequiredHeader &&
      !!body.error &&
      !!body.payment;

    if (report.ok) {
      report.notes.push("\n✅ Conformance test PASSED");
    } else {
      report.notes.push("\n❌ Conformance test FAILED");
    }
  } catch (error) {
    report.notes.push(
      `💥 Fetch error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return NextResponse.json(report);
}
