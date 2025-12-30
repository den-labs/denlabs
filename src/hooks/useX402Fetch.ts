"use client";

import { useCallback, useState } from "react";
import { useWalletClient } from "wagmi";
import { type Signer, wrapFetchWithPayment } from "x402-fetch";

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

/**
 * Hook to handle x402 payment flow using x402-fetch library.
 * This is the recommended approach as it supports all networks including Avalanche Fuji.
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

        // Wrap fetch with payment handling using x402-fetch
        const wrappedFetch = wrapFetchWithPayment(
          fetch,
          walletClient as unknown as Signer,
        );

        // Make the request - x402-fetch handles 402 automatically
        const response = await wrappedFetch(url, options);

        return response;
      } catch (err) {
        console.error("[x402] Payment error:", err);

        // Handle user rejection
        if (
          err instanceof Error &&
          (err.message.includes("User rejected") ||
            err.message.includes("user rejected"))
        ) {
          setError("Payment cancelled. No funds were transferred.");
          return null;
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
