import { useState, useCallback } from "react";
import type { PaymentInstructions } from "@/lib/x402Client";

interface UseX402PaymentReturn {
  fetchWithPayment: (url: string, options?: RequestInit) => Promise<Response>;
  isPaymentModalOpen: boolean;
  paymentInstructions: PaymentInstructions | null;
  closePaymentModal: () => void;
}

/**
 * Hook to handle x402 payment flow
 *
 * Usage:
 * ```tsx
 * const { fetchWithPayment, isPaymentModalOpen, paymentInstructions, closePaymentModal } = useX402Payment();
 *
 * // Fetch with automatic payment handling
 * const response = await fetchWithPayment('/api/labs/demo-event/retro?format=markdown');
 * ```
 */
export function useX402Payment(): UseX402PaymentReturn {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInstructions, setPaymentInstructions] =
    useState<PaymentInstructions | null>(null);
  const [pendingRequest, setPendingRequest] = useState<{
    url: string;
    options?: RequestInit;
  } | null>(null);

  const closePaymentModal = useCallback(() => {
    setIsPaymentModalOpen(false);
    setPaymentInstructions(null);
    setPendingRequest(null);
  }, []);

  const handlePaymentComplete = useCallback(
    async (signature: string) => {
      if (!pendingRequest) return;

      // Close modal
      setIsPaymentModalOpen(false);

      // Retry request with payment signature
      const retryResponse = await fetch(pendingRequest.url, {
        ...pendingRequest.options,
        headers: {
          ...pendingRequest.options?.headers,
          "PAYMENT-SIGNATURE": signature,
        },
      });

      // Clear pending request
      setPendingRequest(null);
      setPaymentInstructions(null);

      return retryResponse;
    },
    [pendingRequest],
  );

  const fetchWithPayment = useCallback(
    async (url: string, options?: RequestInit): Promise<Response> => {
      // Initial request
      const response = await fetch(url, options);

      // If 200 OK, return immediately
      if (response.ok) {
        return response;
      }

      // If 402 Payment Required, handle payment flow
      if (response.status === 402) {
        const paymentHeader = response.headers.get("PAYMENT-REQUIRED");

        if (!paymentHeader) {
          throw new Error("402 response missing PAYMENT-REQUIRED header");
        }

        let instructions: PaymentInstructions;
        try {
          instructions = JSON.parse(paymentHeader);
        } catch {
          throw new Error("Invalid PAYMENT-REQUIRED header format");
        }

        // Store pending request for retry after payment
        setPendingRequest({ url, options });
        setPaymentInstructions(instructions);
        setIsPaymentModalOpen(true);

        // Return a promise that will be resolved by handlePaymentComplete
        return new Promise<Response>((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (!pendingRequest) {
              clearInterval(checkInterval);
              // Payment was completed, make retry request
              handlePaymentComplete("signature-from-modal")
                .then((response) => {
                  if (response) resolve(response);
                  else reject(new Error("Payment processing failed"));
                })
                .catch(reject);
            }
          }, 100);

          // Timeout after 5 minutes
          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error("Payment timeout"));
          }, 5 * 60 * 1000);
        });
      }

      // Other errors, throw
      throw new Error(`Request failed: ${response.statusText}`);
    },
    [pendingRequest, handlePaymentComplete],
  );

  return {
    fetchWithPayment,
    isPaymentModalOpen,
    paymentInstructions,
    closePaymentModal,
  };
}
