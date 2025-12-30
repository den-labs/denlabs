import { isAddress } from "ethers";

/**
 * Check if an address string looks like an ENS name
 */
export function isENSName(address: string): boolean {
  const trimmed = address.trim().toLowerCase();
  return (
    trimmed.endsWith(".eth") ||
    trimmed.endsWith(".xyz") ||
    trimmed.endsWith(".crypto") ||
    trimmed.endsWith(".nft") ||
    trimmed.includes(".")
  );
}

/**
 * Validate an Ethereum address and check if it's an ENS name
 * Returns validation result and ENS detection
 */
export function validateAddress(address: string): {
  valid: boolean;
  isENS: boolean;
  error?: string;
} {
  const trimmed = address.trim();

  if (!trimmed) {
    return { valid: false, isENS: false, error: "Address is required" };
  }

  const isENS = isENSName(trimmed);
  if (isENS) {
    return {
      valid: false,
      isENS: true,
      error:
        "ENS names are not supported. Please use a wallet address (0x...)",
    };
  }

  const valid = isAddress(trimmed);
  if (!valid) {
    return { valid: false, isENS: false, error: "Invalid address format" };
  }

  return { valid: true, isENS: false };
}
