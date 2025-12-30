"use client";

import { useCallback, useState } from "react";
import { useWalletClient } from "wagmi";
import { createPaymentFromWalletClient } from "uvd-x402-sdk/wagmi";
import { getNetworkFromChainId } from "@/utils/network";

interface UseX402FetchReturn {
  /**
   * Fetch with automatic x402 payment handling.
   * Uses wallet to sign payment if 402 response is received.
   */
  fetchWithPayment: (
    url: string,
    options?: RequestInit,
  ) => Promise<Response | null>;
  /** Whether a payment is currently being processed */
  isProcessing: boolean;
  /** Error message if payment failed */
  error: string | null;
  /** Clear the error state */
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

/**
 * Hook to handle x402 payment flow using uvd-x402-sdk.
 * Uses createPaymentFromWalletClient for native Wagmi integration.
 *
 * Usage:
 * ```tsx
 * const { fetchWithPayment, isProcessing, error } = useX402Fetch();
 *
 * const handleDownload = async () => {
 *   const response = await fetchWithPayment('/api/labs/demo/retro?format=markdown');
 *   if (response?.ok) {
 *     // Handle successful response
 *   }
 * };
 * ```
 */
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

        // If not 402, return the response directly
        if (initialResponse.status !== 402) {
          return initialResponse;
        }

        // Parse 402 response to get payment requirements
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

        // Get chain name from wallet
        const chainId = walletClient.chain.id;
        const chainName = getNetworkFromChainId(chainId) || requirement.network;

        // Verify wallet is on correct network
        if (chainName !== requirement.network) {
          setError(
            `Please switch to ${requirement.network}. Currently on ${chainName}.`,
          );
          return null;
        }

        // Convert atomic amount to decimal (USDC has 6 decimals)
        const amountDecimal = (
          Number(requirement.maxAmountRequired) / 1_000_000
        ).toFixed(2);

        console.log("[x402] Creating payment with uvd-x402-sdk:", {
          recipient: requirement.payTo,
          amount: amountDecimal,
          chainName,
          chainId,
        });

        // Create payment header using uvd-x402-sdk
        const paymentHeader = await createPaymentFromWalletClient(
          walletClient,
          {
            recipient: requirement.payTo,
            amount: amountDecimal,
            chainName,
          },
        );

        console.log("[x402] Payment header created, retrying request...");

        // Retry request with payment header
        const paidResponse = await fetch(url, {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            "X-PAYMENT": paymentHeader,
          },
        });

        if (paidResponse.status === 402) {
          // Payment was rejected
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

        // Handle user rejection
        if (
          err instanceof Error &&
          (err.message.includes("User rejected") ||
            err.message.includes("user rejected") ||
            err.message.includes("rejected"))
        ) {
          setError("Payment cancelled. No funds were transferred.");
          return null;
        }

        // Handle specific SDK errors
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
