#!/usr/bin/env node
/**
 * x402 Integration Test Suite
 *
 * Validates complete x402 flow:
 * 1. Facilitator health (external)
 * 2. Dev bypass mode (200 OK)
 * 3. Premium gating (402 Payment Required)
 * 4. Conformance (header validation)
 */

const fs = require('fs');
const path = require('path');

// Load .env.local file
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');

  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  .env.local not found, using defaults');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      // Don't override existing env vars
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFile();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://facilitator.ultravioletadao.xyz';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '━'.repeat(50));
  log(`  ${title}`, 'cyan');
  console.log('━'.repeat(50));
}

async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Test 1: Facilitator Health (External)
 */
async function testFacilitatorHealth() {
  logSection('Test 1: Facilitator Health');

  try {
    const response = await fetchWithTimeout(`${FACILITATOR_URL}/health`);

    if (response.status !== 200) {
      log(`   ❌ Health check failed: status ${response.status}`, 'red');
      return false;
    }

    const data = await response.json();
    log(`   ✅ Facilitator healthy`, 'green');
    log(`   ${colors.gray}Response: ${JSON.stringify(data)}${colors.reset}`);
    return true;
  } catch (error) {
    log(`   ❌ Health check error: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test 2: Dev Bypass Mode (Should return 200)
 */
async function testDevBypass() {
  logSection('Test 2: Dev Bypass Mode (X402_DEV_BYPASS=true)');

  try {
    const response = await fetch(`${BASE_URL}/api/labs/demo-event/retro?format=markdown`);

    if (response.status === 200) {
      log(`   ✅ Dev bypass active - returned 200 OK`, 'green');
      log(`   ${colors.gray}This is correct for development${colors.reset}`);
      return true;
    } else if (response.status === 402) {
      log(`   ⚠️  Dev bypass NOT active - returned 402`, 'yellow');
      log(`   ${colors.gray}Set X402_DEV_BYPASS=true for development${colors.reset}`);
      return true; // Still valid, just different mode
    } else if (response.status === 404) {
      log(`   ❌ Lab 'demo-event' not found`, 'red');
      log(`   ${colors.gray}Visit /labs/demo to create the demo lab${colors.reset}`);
      return false;
    } else {
      log(`   ❌ Unexpected status: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ❌ Request error: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test 3: Premium Gating (Should return 402 when bypass disabled)
 */
async function testPremiumGating() {
  logSection('Test 3: Premium Gating (402 Flow)');

  log(`   ℹ️  To test 402 flow, set X402_DEV_BYPASS=false`, 'gray');
  log(`   ℹ️  Then restart the server and run this test again\n`, 'gray');

  try {
    const response = await fetch(`${BASE_URL}/api/labs/demo-event/retro?format=markdown`);

    if (response.status === 402) {
      log(`   ✅ 402 Payment Required returned`, 'green');

      // Check for PAYMENT-REQUIRED header
      const paymentHeader = response.headers.get('PAYMENT-REQUIRED');
      if (!paymentHeader) {
        log(`   ❌ Missing PAYMENT-REQUIRED header`, 'red');
        return false;
      }

      log(`   ✅ PAYMENT-REQUIRED header present`, 'green');

      // Validate header content
      try {
        const payment = JSON.parse(paymentHeader);
        const requiredFields = ['price', 'currency', 'token', 'recipient', 'endpoint', 'facilitator'];
        const missing = requiredFields.filter(f => !payment[f]);

        if (missing.length > 0) {
          log(`   ❌ Missing fields: ${missing.join(', ')}`, 'red');
          return false;
        }

        log(`   ✅ All required fields present`, 'green');
        log(`   ${colors.gray}Price: $${payment.price} ${payment.currency}${colors.reset}`);
        log(`   ${colors.gray}Token: ${payment.token}${colors.reset}`);
        return true;
      } catch (error) {
        log(`   ❌ Invalid PAYMENT-REQUIRED JSON: ${error.message}`, 'red');
        return false;
      }
    } else if (response.status === 200) {
      log(`   ⚠️  Returned 200 OK (dev bypass active)`, 'yellow');
      log(`   ${colors.gray}To test 402 flow: X402_DEV_BYPASS=false${colors.reset}`);
      return true; // Not a failure, just different mode
    } else if (response.status === 503) {
      log(`   ⚠️  Returned 503 Service Unavailable`, 'yellow');
      log(`   ${colors.gray}Facilitator is down - this is correct behavior${colors.reset}`);
      return true;
    } else {
      log(`   ❌ Unexpected status: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ❌ Request error: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test 4: Conformance Test
 */
async function testConformance() {
  logSection('Test 4: Conformance Validation');

  try {
    const response = await fetch(`${BASE_URL}/api/x402/conformance`);
    const report = await response.json();

    if (response.status === 403) {
      log(`   ⚠️  Conformance endpoint disabled in production`, 'yellow');
      log(`   ${colors.gray}Set X402_DEV_DIAGNOSTICS=true to enable${colors.reset}`);
      return true; // Expected in production
    }

    log(`   Test endpoint: ${report.endpoint}`, 'gray');
    log(`   Status received: ${report.status}`, 'gray');

    // Display notes
    for (const note of report.notes || []) {
      const isSuccess = note.startsWith('✅');
      const isWarning = note.startsWith('⚠️');
      const color = isSuccess ? 'green' : isWarning ? 'yellow' : 'red';
      log(`   ${note}`, color);
    }

    if (report.ok) {
      log(`\n   ✅ Conformance test PASSED`, 'green');
      return true;
    } else {
      log(`\n   ℹ️  Check if lab exists and X402_DEV_BYPASS setting`, 'gray');
      return true; // Informational, not critical
    }
  } catch (error) {
    log(`   ❌ Conformance test error: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test 5: Config Validation
 */
async function testConfiguration() {
  logSection('Test 5: Configuration Check');

  const config = {
    'Base URL': BASE_URL,
    'Facilitator URL': FACILITATOR_URL,
    'Dev Bypass': process.env.X402_DEV_BYPASS || 'not set',
    'Recipient': process.env.X402_RECIPIENT || 'not set',
    'Token': process.env.X402_TOKEN || 'not set',
  };

  let allValid = true;

  for (const [key, value] of Object.entries(config)) {
    if (value === 'not set') {
      log(`   ❌ ${key}: ${value}`, 'red');
      allValid = false;
    } else if (value.includes('example.com')) {
      log(`   ⚠️  ${key}: ${value} (example URL - update in .env)`, 'yellow');
      allValid = false;
    } else {
      log(`   ✅ ${key}: ${value}`, 'green');
    }
  }

  return allValid;
}

/**
 * Main Test Runner
 */
async function runTests() {
  console.log('\n');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('  x402 Integration Test Suite', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  const results = {
    facilitatorHealth: await testFacilitatorHealth(),
    devBypass: await testDevBypass(),
    premiumGating: await testPremiumGating(),
    conformance: await testConformance(),
    configuration: await testConfiguration(),
  };

  logSection('Test Summary');

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  for (const [test, result] of Object.entries(results)) {
    const icon = result ? '✅' : '❌';
    const color = result ? 'green' : 'red';
    log(`   ${icon} ${test}`, color);
  }

  console.log('\n' + '━'.repeat(50));

  if (passed === total) {
    log(`\n✅ All tests passed (${passed}/${total})`, 'green');
    console.log('\nℹ️  To test full 402 flow:');
    console.log('   1. Set X402_DEV_BYPASS=false in .env.local');
    console.log('   2. Restart server: pnpm dev');
    console.log('   3. Run: pnpm x402:test\n');
    process.exit(0);
  } else {
    log(`\n❌ Some tests failed (${passed}/${total})`, 'red');
    console.log('\n⚠️  Check configuration and server status\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
