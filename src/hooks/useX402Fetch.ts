"use client";

import { useCallback, useState } from "react";
import { getChainByName } from "uvd-x402-sdk";
import { createPaymentFromWalletClient } from "uvd-x402-sdk/wagmi";
import { toHex, type WalletClient } from "viem";
import { useWalletClient } from "wagmi";
import { getNetworkFromChainId } from "@/utils/network";

interface UseX402FetchReturn {
  fetchWithPayment: (
    url: string,
    options?: RequestInit,
  ) => Promise<Response | null>;
  isProcessing: boolean;
  error: string | null;
  clearError: () => void;
}

interface PaymentRequirements {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
}

interface X402Response {
  x402Version: number;
  accepts: PaymentRequirements[];
  error?: string;
  message?: string;
}

// EIP-3009 domain and types for USDC
const getEIP3009Types = () => ({
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
});

// USDC domain separators vary by chain
const getUSDCDomain = (chainId: number, tokenAddress: string) => {
  // Domain names for different USDC deployments
  const domainNames: Record<number, string> = {
    43113: "USD Coin", // Avalanche Fuji
    84532: "USD Coin", // Base Sepolia
    80002: "USD Coin", // Polygon Amoy
  };

  return {
    name: domainNames[chainId] || "USD Coin",
    version: "2",
    chainId: BigInt(chainId),
    verifyingContract: tokenAddress as `0x${string}`,
  };
};

/**
 * Create EIP-3009 payment header manually for testnets not supported by SDK
 */
async function createTestnetPaymentHeader(
  walletClient: WalletClient,
  recipient: string,
  amount: string,
  chainId: number,
  tokenAddress: string,
  network: string,
): Promise<string> {
  // Get address from wallet client account
  const account = walletClient.account;
  if (!account) {
    throw new Error("Wallet account not available");
  }
  const address = account.address;

  // Convert amount to atomic units (6 decimals for USDC)
  const amountAtomic = BigInt(Math.floor(parseFloat(amount) * 1_000_000));

  // Generate timestamps
  const now = Math.floor(Date.now() / 1000);
  const validAfter = BigInt(now - 60); // Valid from 1 minute ago
  const validBefore = BigInt(now + 900); // Valid for 15 minutes

  // Generate random nonce
  const nonceBytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = toHex(nonceBytes);

  const domain = getUSDCDomain(chainId, tokenAddress);
  const types = getEIP3009Types();

  const message = {
    from: address,
    to: recipient as `0x${string}`,
    value: amountAtomic,
    validAfter,
    validBefore,
    nonce: nonce as `0x${string}`,
  };

  console.log("[x402] Signing EIP-3009 authorization:", {
    domain,
    message,
    chainId,
  });

  // Sign the typed data
  const signature = await walletClient.signTypedData({
    account,
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message,
  });

  // Build x402 payment header
  const payload = {
    x402Version: 1,
    scheme: "exact",
    network,
    payload: {
      signature,
      authorization: {
        from: address,
        to: recipient,
        value: amountAtomic.toString(),
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce,
      },
    },
  };

  return btoa(JSON.stringify(payload));
}

/**
 * Check if SDK supports this chain
 */
function isChainSupportedBySDK(chainName: string): boolean {
  try {
    const config = getChainByName(chainName);
    return config !== undefined && config !== null;
  } catch {
    return false;
  }
}

export function useX402Fetch(): UseX402FetchReturn {
  const { data: walletClient } = useWalletClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchWithPayment = useCallback(
    async (url: string, options?: RequestInit): Promise<Response | null> => {
      setIsProcessing(true);
      setError(null);

      try {
        if (!walletClient) {
          throw new Error(
            "Wallet not connected. Please connect your wallet first.",
          );
        }

        if (!walletClient.chain) {
          throw new Error(
            "Wallet chain not detected. Please ensure your wallet is connected to a supported network.",
          );
        }

        const fetchOptions: RequestInit = {
          method: "GET",
          ...options,
        };

        // First request - check if payment required
        console.log("[x402] Making initial request to:", url);
        const initialResponse = await fetch(url, fetchOptions);

        if (initialResponse.status !== 402) {
          return initialResponse;
        }

        // Parse 402 response
        let x402Data: X402Response;
        try {
          x402Data = await initialResponse.json();
          console.log("[x402] Received 402 response:", x402Data);
        } catch {
          setError("Invalid payment response from server");
          return null;
        }

        if (!x402Data.accepts || x402Data.accepts.length === 0) {
          setError("No payment options available");
          return null;
        }

        const requirement = x402Data.accepts[0];
        console.log("[x402] Payment requirement:", requirement);

        const chainId = walletClient.chain.id;
        const chainName = getNetworkFromChainId(chainId) || requirement.network;

        // Verify wallet is on correct network
        if (chainName !== requirement.network) {
          setError(
            `Please switch to ${requirement.network}. Currently on ${chainName}.`,
          );
          return null;
        }

        // Convert atomic amount to decimal
        const amountDecimal = (
          Number(requirement.maxAmountRequired) / 1_000_000
        ).toFixed(2);

        let paymentHeader: string;

        // Check if SDK supports this chain
        if (isChainSupportedBySDK(chainName)) {
          console.log("[x402] Using uvd-x402-sdk for:", chainName);
          paymentHeader = await createPaymentFromWalletClient(walletClient, {
            recipient: requirement.payTo,
            amount: amountDecimal,
            chainName,
          });
        } else {
          // Use manual EIP-3009 signing for testnets
          console.log("[x402] Using manual EIP-3009 signing for:", chainName);
          paymentHeader = await createTestnetPaymentHeader(
            walletClient as WalletClient,
            requirement.payTo,
            amountDecimal,
            chainId,
            requirement.asset,
            chainName,
          );
        }

        console.log("[x402] Payment header created, retrying request...");

        // Retry with payment header
        const paidResponse = await fetch(url, {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            "X-PAYMENT": paymentHeader,
          },
        });

        if (paidResponse.status === 402) {
          try {
            const errorData = await paidResponse.clone().json();
            console.error("[x402] Payment rejected:", errorData);
            setError(
              "Payment was rejected. Please check your balance and try again.",
            );
          } catch {
            setError("Payment was rejected by the server.");
          }
        }

        return paidResponse;
      } catch (err) {
        console.error("[x402] Payment error:", err);

        if (
          err instanceof Error &&
          (err.message.includes("User rejected") ||
            err.message.includes("user rejected") ||
            err.message.includes("rejected"))
        ) {
          setError("Payment cancelled. No funds were transferred.");
          return null;
        }

        if (err instanceof Error) {
          if (err.message.includes("INSUFFICIENT_BALANCE")) {
            setError("Insufficient USDC balance for this payment.");
            return null;
          }
          if (err.message.includes("CHAIN_NOT_SUPPORTED")) {
            setError("This network is not supported for payments.");
            return null;
          }
        }

        setError(err instanceof Error ? err.message : "Payment failed");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [walletClient],
  );

  return {
    fetchWithPayment,
    isProcessing,
    error,
    clearError,
  };
}
