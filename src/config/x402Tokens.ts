/**
 * x402 Payment Tokens Configuration
 *
 * Allowlist of tokens that support EIP-3009 (Transfer With Authorization)
 * for gasless/authorized payments in the x402 system.
 *
 * Only tokens marked as `isEip3009Likely: true` should be used for x402 payments.
 *
 * To add a new token:
 * 1. Use the EIP-3009 Token Checker at /tools/eip3009
 * 2. Verify the token shows "EIP-3009 Likely"
 * 3. Copy the JSON result and add to this config
 */

import type { Address } from "viem";

export interface X402Token {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
  isEip3009Likely: boolean;
  /** Optional: implementation address if token is a proxy */
  implementationAddress?: Address;
  /** Icon path in /public */
  iconUrl?: string;
  /** When this token was verified */
  verifiedAt?: string;
}

export type X402TokensByChain = Record<number, X402Token[]>;

/**
 * Allowlist of EIP-3009 compatible tokens per chain
 */
export const X402_TOKENS: X402TokensByChain = {
  // Avalanche Mainnet (43114)
  43114: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
      decimals: 6,
      isEip3009Likely: true,
      implementationAddress: "0x30DFE0469803BcE76F8F62aC24b18d33D3d6FfE6",
      iconUrl: "/tokens-usdc.png",
      verifiedAt: "2025-12-29",
    },
    // Add more Avalanche tokens here after verification
  ],

  // Avalanche Fuji Testnet (43113)
  43113: [
    {
      symbol: "USDC",
      name: "USD Coin (Testnet)",
      address: "0x5425890298aed601595a70AB815c96711a31Bc65",
      decimals: 6,
      isEip3009Likely: true, // ⚠️ TESTNET - Enabled for testing. Verify at /tools/eip3009 if payment fails
      iconUrl: "/tokens-usdc.png",
      verifiedAt: "2025-12-30",
    },
  ],

  // Base Mainnet (8453)
  8453: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
      isEip3009Likely: true,
      implementationAddress: "0x2Ce6311ddAE708829bc0784C967b7d77D19FD779",
      iconUrl: "/tokens-usdc.png",
      verifiedAt: "2025-12-29",
    },
  ],

  // Base Sepolia Testnet (84532)
  84532: [
    // Add Base Sepolia tokens here after verification
  ],

  // Optimism Mainnet (10)
  10: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      decimals: 6,
      isEip3009Likely: true,
      implementationAddress: "0xdEd3b9a8DBeDC2F9CB725B55d0E686A81E6d06dC",
      iconUrl: "/tokens-usdc.png",
      verifiedAt: "2025-12-29",
    },
  ],

  // Optimism Sepolia Testnet (11155420)
  11155420: [
    // Add Optimism Sepolia tokens here after verification
  ],

  // Celo Mainnet (42220)
  42220: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
      decimals: 6,
      isEip3009Likely: true,
      implementationAddress: "0xdA06D4e3F59fE2C8ff3077A9D50D5BE5E231BEcD",
      iconUrl: "/tokens-usdc.png",
      verifiedAt: "2025-12-29",
    },
  ],

  // Celo Alfajores Testnet (44787)
  44787: [
    // Add Celo Alfajores tokens here after verification
  ],

  // Polygon Mainnet (137)
  137: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      decimals: 6,
      isEip3009Likely: true,
      iconUrl: "/tokens-usdc.png",
      verifiedAt: "2025-12-30",
    },
  ],

  // Polygon Amoy Testnet (80002)
  80002: [
    // Add Polygon Amoy tokens here after verification
  ],

  // Arbitrum Mainnet (42161)
  42161: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      decimals: 6,
      isEip3009Likely: true,
      iconUrl: "/tokens-usdc.png",
      verifiedAt: "2025-12-30",
    },
  ],

  // Arbitrum Sepolia Testnet (421614)
  421614: [
    // Add Arbitrum Sepolia tokens here after verification
  ],
};

/**
 * Get EIP-3009 compatible tokens for a specific chain
 */
export function getX402TokensForChain(chainId: number): X402Token[] {
  return X402_TOKENS[chainId] || [];
}

/**
 * Get only verified EIP-3009 tokens for a chain
 */
export function getVerifiedX402Tokens(chainId: number): X402Token[] {
  return getX402TokensForChain(chainId).filter(
    (token) => token.isEip3009Likely,
  );
}

/**
 * Find a token by symbol on a specific chain
 */
export function findX402Token(
  chainId: number,
  symbol: string,
): X402Token | undefined {
  return getX402TokensForChain(chainId).find(
    (token) => token.symbol.toLowerCase() === symbol.toLowerCase(),
  );
}

/**
 * Check if a token address is in the allowlist for a chain
 */
export function isTokenAllowed(chainId: number, address: Address): boolean {
  return getVerifiedX402Tokens(chainId).some(
    (token) => token.address.toLowerCase() === address.toLowerCase(),
  );
}

/**
 * Get default x402 token (USDC) for a chain
 */
export function getDefaultX402Token(chainId: number): X402Token | undefined {
  // Try to find USDC first
  const usdc = findX402Token(chainId, "USDC");
  if (usdc) return usdc;

  // Fallback to first verified token
  const verified = getVerifiedX402Tokens(chainId);
  return verified[0];
}
