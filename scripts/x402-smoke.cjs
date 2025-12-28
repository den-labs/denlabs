#!/usr/bin/env node

/**
 * x402 Facilitator Smoke Test
 * Verifies UVDAO facilitator health, supported networks, and verify endpoint
 *
 * Exit codes:
 * 0 - All checks passed
 * 1 - One or more checks failed
 */

const FACILITATOR_URL = "https://facilitator.ultravioletadao.xyz";
const TIMEOUT_MS = 5000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function checkHealth() {
  console.log("🔍 Checking facilitator health...");

  try {
    const response = await fetchWithTimeout(`${FACILITATOR_URL}/health`);

    if (response.status !== 200) {
      console.error(`   ❌ Health check failed: status ${response.status}`);
      return false;
    }

    const data = await response.json();
    console.log(`   ✅ Facilitator healthy`);
    console.log(`   Response: ${JSON.stringify(data)}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Health check error: ${error.message}`);
    return false;
  }
}

async function checkSupported() {
  console.log("\n🔍 Checking supported networks...");

  try {
    const response = await fetchWithTimeout(`${FACILITATOR_URL}/supported`);

    if (!response.ok) {
      console.error(`   ❌ Supported check failed: status ${response.status}`);
      return false;
    }

    const data = await response.json();
    const networkCount = Array.isArray(data) ? data.length : Object.keys(data).length;
    console.log(`   ✅ Supported networks count: ${networkCount}`);

    if (networkCount > 0) {
      const preview = Array.isArray(data)
        ? data.slice(0, 3).join(", ")
        : Object.keys(data).slice(0, 3).join(", ");
      console.log(`   Networks (preview): ${preview}${networkCount > 3 ? "..." : ""}`);
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Supported check error: ${error.message}`);
    return false;
  }
}

async function checkVerify() {
  console.log("\n🔍 Checking verify endpoint schema...");

  try {
    const response = await fetchWithTimeout(`${FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // Empty payload to check schema response
    });

    // Verify endpoint should exist (404 = not found = bad)
    if (response.status === 404) {
      console.error("   ❌ Verify endpoint not found (404)");
      return false;
    }

    const data = await response.json();
    console.log(`   ✅ Verify endpoint present (status ${response.status})`);

    // Check if response has expected error structure (for empty payload)
    if (data.error || data.message) {
      console.log(`   Schema validation: ${data.error || data.message}`);
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Verify check error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  x402 Facilitator Smoke Test`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Facilitator: ${FACILITATOR_URL}`);
  console.log(`Timeout: ${TIMEOUT_MS}ms\n`);

  const results = {
    health: await checkHealth(),
    supported: await checkSupported(),
    verify: await checkVerify(),
  };

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Summary");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Health:    ${results.health ? "✅ OK" : "❌ FAIL"}`);
  console.log(`Supported: ${results.supported ? "✅ OK" : "❌ FAIL"}`);
  console.log(`Verify:    ${results.verify ? "✅ OK" : "❌ FAIL"}`);

  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    console.log("\n✅ All checks passed - Facilitator OK\n");
    process.exit(0);
  } else {
    console.log("\n❌ Some checks failed - Review output above\n");
    process.exit(1);
  }
}

main().catch(error => {
  console.error("\n💥 Unexpected error:", error);
  process.exit(1);
});
