/**
 * Spray v2 — Celo Sepolia smoke test
 *
 * Runs against the LIVE deployed contract with real wallets.
 * Usage:  npx hardhat run scripts/SpraySmokeTestnet.ts --network sepolia
 */
import { ethers } from 'hardhat'

const SPRAY_ADDRESS = '0xf4f9988b7bCD93B5063a983Ae0Bb6678719AAe93'

const RECIPIENTS = [
  '0x22f6F000609d52A0b0efCD4349222cd9d70716Ba',
  '0x05eDDD99C190cd6caC615984571a309eb1888312',
]

const AMOUNT_PER_RECIPIENT = ethers.parseEther('0.01') // 0.01 CELO each

const SPRAY_ABI = [
  'function disperseNative(address[] _recipients, uint256[] _amounts) payable',
  'function disperseToken(address tokenAddress, address[] _recipients, uint256[] _amounts)',
  'function MAX_RECIPIENTS() view returns (uint256)',
  'function paused() view returns (bool)',
  'function owner() view returns (address)',
]

let passed = 0
let failed = 0

function ok(label: string) {
  passed++
  console.log(`  ✅ ${label}`)
}

function fail(label: string, reason: string) {
  failed++
  console.error(`  ❌ ${label} — ${reason}`)
}

async function main() {
  const [sender] = await ethers.getSigners()
  const provider = ethers.provider

  console.log('═══════════════════════════════════════════')
  console.log(' Spray v2 — Celo Sepolia Smoke Test')
  console.log('═══════════════════════════════════════════')
  console.log(`  Contract : ${SPRAY_ADDRESS}`)
  console.log(`  Sender   : ${sender.address}`)
  console.log(`  Recipients: ${RECIPIENTS.join(', ')}`)
  console.log()

  const spray = new ethers.Contract(SPRAY_ADDRESS, SPRAY_ABI, sender)

  // ── 1. Read-only checks ──────────────────────────────────────────
  console.log('▸ Read-only checks')

  try {
    const max = await spray.MAX_RECIPIENTS()
    if (max === 200n) ok(`MAX_RECIPIENTS = ${max}`)
    else fail('MAX_RECIPIENTS', `expected 200, got ${max}`)
  } catch (e: any) {
    fail('MAX_RECIPIENTS', e.message)
  }

  try {
    const isPaused = await spray.paused()
    if (!isPaused) ok('Contract is NOT paused')
    else fail('paused()', 'contract is paused — cannot disperse')
  } catch (e: any) {
    fail('paused()', e.message)
  }

  try {
    const owner = await spray.owner()
    if (owner === sender.address) ok(`Owner matches sender: ${owner}`)
    else ok(`Owner is ${owner} (sender is ${sender.address})`)
  } catch (e: any) {
    fail('owner()', e.message)
  }

  // ── 2. Balance preflight ─────────────────────────────────────────
  console.log('\n▸ Balance preflight')

  const senderBal = await provider.getBalance(sender.address)
  const amounts = RECIPIENTS.map(() => AMOUNT_PER_RECIPIENT)
  const totalValue = AMOUNT_PER_RECIPIENT * BigInt(RECIPIENTS.length)

  console.log(`  Sender balance   : ${ethers.formatEther(senderBal)} CELO`)
  console.log(`  Total to disperse: ${ethers.formatEther(totalValue)} CELO`)

  if (senderBal < totalValue + ethers.parseEther('0.005')) {
    fail('Balance check', 'insufficient CELO for disperse + gas')
    return printSummary()
  }
  ok('Sufficient balance')

  const beforeBalances = await Promise.all(
    RECIPIENTS.map((addr) => provider.getBalance(addr)),
  )

  for (let i = 0; i < RECIPIENTS.length; i++) {
    console.log(
      `  ${RECIPIENTS[i]} before: ${ethers.formatEther(beforeBalances[i])} CELO`,
    )
  }

  // ── 3. disperseNative ────────────────────────────────────────────
  console.log('\n▸ disperseNative')

  let txHash = ''
  try {
    const feeData = await provider.getFeeData()
    const base = feeData.lastBaseFeePerGas ?? feeData.gasPrice ?? 0n
    const gasPrice =
      base > 0n ? (base * 15n) / 10n : ethers.parseUnits('5', 'gwei')

    const tx = await spray.disperseNative(RECIPIENTS, amounts, {
      value: totalValue,
      gasPrice,
      type: 0,
    })

    console.log(`  tx hash: ${tx.hash}`)
    console.log('  waiting for confirmation...')

    const receipt = await tx.wait()
    txHash = tx.hash

    if (receipt && receipt.status === 1) {
      ok(`Confirmed in block ${receipt.blockNumber} (gas: ${receipt.gasUsed})`)
    } else {
      fail('disperseNative', `receipt status = ${receipt?.status}`)
    }
  } catch (e: any) {
    fail('disperseNative', e.message?.slice(0, 200))
    return printSummary()
  }

  // ── 4. Verify recipient balances ─────────────────────────────────
  console.log('\n▸ Balance verification')

  const afterBalances = await Promise.all(
    RECIPIENTS.map((addr) => provider.getBalance(addr)),
  )

  for (let i = 0; i < RECIPIENTS.length; i++) {
    const delta = afterBalances[i] - beforeBalances[i]
    const expected = amounts[i]
    console.log(
      `  ${RECIPIENTS[i]} after: ${ethers.formatEther(afterBalances[i])} CELO (delta: +${ethers.formatEther(delta)})`,
    )
    if (delta === expected) {
      ok(`Recipient ${i + 1} received exactly ${ethers.formatEther(expected)} CELO`)
    } else {
      fail(
        `Recipient ${i + 1}`,
        `expected +${ethers.formatEther(expected)}, got +${ethers.formatEther(delta)}`,
      )
    }
  }

  // ── 5. Contract balance should be 0 ──────────────────────────────
  console.log('\n▸ Contract balance')

  const contractBal = await provider.getBalance(SPRAY_ADDRESS)
  if (contractBal === 0n) {
    ok('Contract balance is 0 (pass-through confirmed)')
  } else {
    fail('Contract balance', `expected 0, got ${ethers.formatEther(contractBal)}`)
  }

  // ── Summary ──────────────────────────────────────────────────────
  printSummary(txHash)
}

function printSummary(txHash?: string) {
  console.log('\n═══════════════════════════════════════════')
  console.log(` ${passed} passed, ${failed} failed`)
  if (txHash) {
    console.log(
      ` Explorer: https://celo-sepolia.blockscout.com/tx/${txHash}`,
    )
  }
  console.log('═══════════════════════════════════════════')

  if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
