/**
 * Network normalization utilities for x402 multi-chain support
 * Based on x402-bruma implementation with extensions for denlabs
 */

export type NetworkString = string;

const sanitize = (value: string) =>
  value.trim().toLowerCase().replace(/\s+|_/g, "-");

/**
 * Normalize network name to canonical format
 * Supports multiple aliases for each network
 */
export const normalizeNetwork = (
  value: string | null | undefined,
): NetworkString | null => {
  if (!value) {
    return null;
  }
  const t = sanitize(value);

  // Avalanche
  if (
    [
      "43113",
      "fuji",
      "avax-fuji",
      "avalanche-fuji",
      "avalanche-fuji-testnet",
      "avalanche-testnet",
    ].includes(t)
  ) {
    return "avalanche-fuji";
  }
  if (
    ["43114", "avax", "c-chain", "avalanche", "avalanche-mainnet"].includes(t)
  ) {
    return "avalanche";
  }

  // Base
  if (["base", "8453"].includes(t)) {
    return "base";
  }
  if (["base-sepolia", "84532", "base-testnet"].includes(t)) {
    return "base-sepolia";
  }

  // Polygon
  if (["polygon", "137", "matic"].includes(t)) {
    return "polygon";
  }
  if (["polygon-amoy", "80002", "amoy"].includes(t)) {
    return "polygon-amoy";
  }

  // Celo
  if (["celo", "42220"].includes(t)) {
    return "celo";
  }
  if (["celo-sepolia", "44787", "alfajores"].includes(t)) {
    return "celo-sepolia";
  }

  // Optimism
  if (["optimism", "10", "op"].includes(t)) {
    return "optimism";
  }
  if (["optimism-sepolia", "11155420"].includes(t)) {
    return "optimism-sepolia";
  }

  // Arbitrum
  if (["arbitrum", "42161", "arb"].includes(t)) {
    return "arbitrum";
  }
  if (["arbitrum-sepolia", "421614"].includes(t)) {
    return "arbitrum-sepolia";
  }

  // Unichain
  if (["unichain"].includes(t)) {
    return "unichain";
  }
  if (["unichain-sepolia"].includes(t)) {
    return "unichain-sepolia";
  }

  // Abstract
  if (["abstract-testnet"].includes(t)) {
    return "abstract-testnet";
  }
  if (["abstract"].includes(t)) {
    return "abstract";
  }

  // Solana
  if (["solana", "mainnet-beta"].includes(t)) {
    return "solana";
  }
  if (["solana-devnet", "devnet"].includes(t)) {
    return "solana-devnet";
  }

  // Ethereum
  if (["ethereum", "1", "eth", "mainnet"].includes(t)) {
    return "ethereum";
  }
  if (["ethereum-sepolia", "11155111", "sepolia"].includes(t)) {
    return "ethereum-sepolia";
  }

  // Misc networks
  if (
    [
      "hyperevm",
      "hyperevm-testnet",
      "iotex",
      "peaq",
      "sei",
      "sei-testnet",
    ].includes(t)
  ) {
    return t;
  }

  return null;
};

/**
 * Mapping from chainId to canonical network name
 */
export const CHAIN_ID_TO_NETWORK: Record<number, NetworkString> = {
  // Mainnets
  1: "ethereum",
  10: "optimism",
  137: "polygon",
  8453: "base",
  42161: "arbitrum",
  42220: "celo",
  43114: "avalanche",

  // Testnets
  43113: "avalanche-fuji",
  84532: "base-sepolia",
  80002: "polygon-amoy",
  44787: "celo-sepolia",
  11155420: "optimism-sepolia",
  421614: "arbitrum-sepolia",
  11155111: "ethereum-sepolia",
};

/**
 * Get network name from chainId
 */
export const getNetworkFromChainId = (
  chainId: number,
): NetworkString | null => {
  return CHAIN_ID_TO_NETWORK[chainId] || null;
};

/**
 * Get chainId from network name
 */
export const getChainIdFromNetwork = (
  network: NetworkString,
): number | null => {
  const entry = Object.entries(CHAIN_ID_TO_NETWORK).find(
    ([, name]) => name === network,
  );
  return entry ? parseInt(entry[0], 10) : null;
};

/**
 * Check if a chainId is a testnet
 */
export const isTestnet = (chainId: number): boolean => {
  const testnets = [43113, 84532, 80002, 44787, 11155420, 421614, 11155111];
  return testnets.includes(chainId);
};

/**
 * Get default chainId for development/production
 */
export const getDefaultChainId = (): number => {
  const envChainId = process.env.X402_DEFAULT_CHAIN_ID;
  if (envChainId) {
    return parseInt(envChainId, 10);
  }
  // Default to Avalanche Fuji for development
  return process.env.NODE_ENV === "production" ? 43114 : 43113;
};
