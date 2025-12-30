/**
 * EIP-3009 Token Checker
 *
 * Detects if an ERC-20 token supports EIP-3009 (Transfer With Authorization)
 * by analyzing bytecode and detecting function selectors without relying on ABIs.
 *
 * Supports:
 * - EIP-1967 Transparent Upgradeable Proxies
 * - EIP-1167 Minimal Proxies (optional detection)
 * - Direct implementation contracts
 *
 * References:
 * - EIP-3009: https://eips.ethereum.org/EIPS/eip-3009
 * - EIP-1967: https://eips.ethereum.org/EIPS/eip-1967
 * - EIP-1167: https://eips.ethereum.org/EIPS/eip-1167
 */

import {
  type Address,
  createPublicClient,
  getAddress,
  http,
  isAddress,
  keccak256,
  toHex,
} from "viem";
import {
  avalanche,
  avalancheFuji,
  base,
  baseSepolia,
  celo,
  celoAlfajores,
  optimism,
  optimismSepolia,
} from "viem/chains";

/**
 * EIP-3009 Function Selectors
 * These are the keccak256 hashes of the function signatures
 */
export const EIP3009_SELECTORS = {
  transferWithAuthorization: "0xe3ee160e",
  receiveWithAuthorization: "0xef55bec6",
  authorizationState: "0xe94a0102",
  cancelAuthorization: "0x5a049a70",
} as const;

/**
 * Proxy Storage Slots
 * Supports both EIP-1967 and legacy Zeppelinos (used by USDC FiatTokenProxy)
 */
export const PROXY_SLOTS = {
  // EIP-1967: keccak256("eip1967.proxy.implementation") - 1
  eip1967Implementation:
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
  // EIP-1967: keccak256("eip1967.proxy.admin") - 1
  eip1967Admin:
    "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103",
  // Zeppelinos Legacy: keccak256("org.zeppelinos.proxy.implementation")
  // Used by USDC (FiatTokenProxy), Compound, and other legacy proxies
  zeppelinosImplementation: keccak256(
    toHex("org.zeppelinos.proxy.implementation"),
  ),
} as const;

/**
 * Supported chains configuration
 */
const CHAIN_CONFIG = {
  43114: avalanche,
  43113: avalancheFuji,
  8453: base,
  84532: baseSepolia,
  42220: celo,
  44787: celoAlfajores,
  10: optimism,
  11155420: optimismSepolia,
} as const;

export type SupportedChainId = keyof typeof CHAIN_CONFIG;

export interface Eip3009CheckResult {
  isEip3009Likely: boolean;
  tokenAddress: Address;
  implementationAddress?: Address;
  isProxy: boolean;
  proxyType?: "EIP-1967" | "Zeppelinos" | "EIP-1167" | "unknown";
  selectorsFound: {
    transferWithAuthorization: boolean;
    receiveWithAuthorization: boolean;
    authorizationState: boolean;
    cancelAuthorization: boolean;
  };
  targetInspected: Address;
  error?: string;
  chainId: number;
}

/**
 * Extract implementation address from EIP-1167 minimal proxy bytecode
 * EIP-1167 pattern: 0x363d3d373d3d3d363d73[20 bytes address]5af43d82803e903d91602b57fd5bf3
 */
function extractEip1167Implementation(bytecode: string): Address | null {
  // Remove 0x prefix if present
  const code = bytecode.toLowerCase().replace("0x", "");

  // EIP-1167 pattern (minimal proxy)
  const minimalProxyPrefix = "363d3d373d3d3d363d73";
  const minimalProxySuffix = "5af43d82803e903d91602b57fd5bf3";

  if (
    code.startsWith(minimalProxyPrefix) &&
    code.endsWith(minimalProxySuffix)
  ) {
    // Extract the 20-byte address (40 hex chars) after the prefix
    const addressStart = minimalProxyPrefix.length;
    const addressEnd = addressStart + 40; // 20 bytes = 40 hex chars
    const implementationHex = code.slice(addressStart, addressEnd);

    try {
      return getAddress(`0x${implementationHex}`);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Check if bytecode contains specific function selectors
 */
function hasSelector(bytecode: string, selector: string): boolean {
  const cleanBytecode = bytecode.toLowerCase().replace("0x", "");
  const cleanSelector = selector.toLowerCase().replace("0x", "");
  return cleanBytecode.includes(cleanSelector);
}

/**
 * Create a public client for the given chain
 */
function createClientForChain(chainId: SupportedChainId, rpcUrl?: string) {
  const chain = CHAIN_CONFIG[chainId];

  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

/**
 * Main EIP-3009 detection function
 *
 * @param chainId - Chain ID (43114 for Avalanche, 8453 for Base, etc.)
 * @param tokenAddress - Token contract address
 * @param rpcUrl - Optional custom RPC URL
 * @returns Detection result with EIP-3009 likelihood
 */
export async function checkEip3009(
  chainId: SupportedChainId,
  tokenAddress: string,
  rpcUrl?: string,
): Promise<Eip3009CheckResult> {
  // Validate address
  if (!isAddress(tokenAddress)) {
    return {
      isEip3009Likely: false,
      tokenAddress: tokenAddress as Address,
      isProxy: false,
      selectorsFound: {
        transferWithAuthorization: false,
        receiveWithAuthorization: false,
        authorizationState: false,
        cancelAuthorization: false,
      },
      targetInspected: tokenAddress as Address,
      error: "Invalid Ethereum address format",
      chainId,
    };
  }

  const address = getAddress(tokenAddress);
  const client = createClientForChain(chainId, rpcUrl);

  try {
    // Step 1: Get bytecode to verify it's a contract
    const bytecode = await client.getBytecode({ address });

    if (!bytecode || bytecode === "0x") {
      return {
        isEip3009Likely: false,
        tokenAddress: address,
        isProxy: false,
        selectorsFound: {
          transferWithAuthorization: false,
          receiveWithAuthorization: false,
          authorizationState: false,
          cancelAuthorization: false,
        },
        targetInspected: address,
        error: "Address is not a contract on this network",
        chainId,
      };
    }

    let implementationAddress: Address | undefined;
    let isProxy = false;
    let proxyType:
      | "EIP-1967"
      | "Zeppelinos"
      | "EIP-1167"
      | "unknown"
      | undefined;
    let targetBytecode = bytecode;
    let targetAddress = address;

    // Step 2: Detect EIP-1967 proxy
    try {
      const implSlotValue = await client.getStorageAt({
        address,
        slot: PROXY_SLOTS.eip1967Implementation as `0x${string}`,
      });

      if (implSlotValue && implSlotValue !== `0x${"0".repeat(64)}`) {
        // Extract address from storage slot (last 20 bytes)
        const implAddressHex = `0x${implSlotValue.slice(-40)}`;
        if (isAddress(implAddressHex)) {
          implementationAddress = getAddress(implAddressHex);
          isProxy = true;
          proxyType = "EIP-1967";
          targetAddress = implementationAddress;

          // Get implementation bytecode
          const implBytecode = await client.getBytecode({
            address: implementationAddress,
          });
          if (implBytecode && implBytecode !== "0x") {
            targetBytecode = implBytecode;
          }
        }
      }
    } catch (error) {
      // Not a proxy or error reading storage, continue with direct contract
      console.debug("Not an EIP-1967 proxy or error reading storage:", error);
    }

    // Step 2.5: Detect Zeppelinos legacy proxy (used by USDC FiatTokenProxy)
    if (!isProxy) {
      try {
        const zepSlotValue = await client.getStorageAt({
          address,
          slot: PROXY_SLOTS.zeppelinosImplementation as `0x${string}`,
        });

        if (zepSlotValue && zepSlotValue !== `0x${"0".repeat(64)}`) {
          // Extract address from storage slot (last 20 bytes)
          const implAddressHex = `0x${zepSlotValue.slice(-40)}`;
          if (isAddress(implAddressHex)) {
            implementationAddress = getAddress(implAddressHex);
            isProxy = true;
            proxyType = "Zeppelinos";
            targetAddress = implementationAddress;

            // Get implementation bytecode
            const implBytecode = await client.getBytecode({
              address: implementationAddress,
            });
            if (implBytecode && implBytecode !== "0x") {
              targetBytecode = implBytecode;
            }
          }
        }
      } catch (error) {
        // Not a Zeppelinos proxy or error reading storage
        console.debug(
          "Not a Zeppelinos proxy or error reading storage:",
          error,
        );
      }
    }

    // Step 3: Detect EIP-1167 minimal proxy (if not already detected as EIP-1967)
    if (!isProxy) {
      const minimalProxyImpl = extractEip1167Implementation(bytecode);
      if (minimalProxyImpl) {
        implementationAddress = minimalProxyImpl;
        isProxy = true;
        proxyType = "EIP-1167";
        targetAddress = implementationAddress;

        try {
          const implBytecode = await client.getBytecode({
            address: implementationAddress,
          });
          if (implBytecode && implBytecode !== "0x") {
            targetBytecode = implBytecode;
          }
        } catch (error) {
          console.debug(
            "Error fetching EIP-1167 implementation bytecode:",
            error,
          );
        }
      }
    }

    // Step 4: Search for EIP-3009 function selectors in target bytecode
    const selectorsFound = {
      transferWithAuthorization: hasSelector(
        targetBytecode,
        EIP3009_SELECTORS.transferWithAuthorization,
      ),
      receiveWithAuthorization: hasSelector(
        targetBytecode,
        EIP3009_SELECTORS.receiveWithAuthorization,
      ),
      authorizationState: hasSelector(
        targetBytecode,
        EIP3009_SELECTORS.authorizationState,
      ),
      cancelAuthorization: hasSelector(
        targetBytecode,
        EIP3009_SELECTORS.cancelAuthorization,
      ),
    };

    // EIP-3009 likely if it has at least one of the main functions
    const isEip3009Likely =
      selectorsFound.transferWithAuthorization ||
      selectorsFound.receiveWithAuthorization;

    return {
      isEip3009Likely,
      tokenAddress: address,
      implementationAddress,
      isProxy,
      proxyType,
      selectorsFound,
      targetInspected: targetAddress,
      chainId,
    };
  } catch (error) {
    return {
      isEip3009Likely: false,
      tokenAddress: address,
      isProxy: false,
      selectorsFound: {
        transferWithAuthorization: false,
        receiveWithAuthorization: false,
        authorizationState: false,
        cancelAuthorization: false,
      },
      targetInspected: address,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      chainId,
    };
  }
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chainId: SupportedChainId): string {
  const chain = CHAIN_CONFIG[chainId];
  return chain?.name || `Chain ${chainId}`;
}

/**
 * Get supported chain IDs
 */
export function getSupportedChainIds(): SupportedChainId[] {
  return Object.keys(CHAIN_CONFIG).map(Number) as SupportedChainId[];
}
