import { useState, useCallback, useRef } from "react";
import type { PaymentInstructions } from "@/lib/x402Client";

interface UseX402PaymentReturn {
  fetchWithPayment: (url: string, options?: RequestInit) => Promise<Response>;
  isPaymentModalOpen: boolean;
  paymentInstructions: PaymentInstructions | null;
  closePaymentModal: () => void;
  handlePaymentComplete: (signature: string) => Promise<void>;
}

/**
 * Hook to handle x402 payment flow
 *
 * Usage:
 * ```tsx
 * const { fetchWithPayment, isPaymentModalOpen, paymentInstructions, closePaymentModal, handlePaymentComplete } = useX402Payment();
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

  // Store promise resolvers for async payment flow
  const paymentPromiseRef = useRef<{
    resolve: (response: Response) => void;
    reject: (error: Error) => void;
  } | null>(null);

  const closePaymentModal = useCallback(() => {
    setIsPaymentModalOpen(false);
    setPaymentInstructions(null);
    setPendingRequest(null);

    // Reject the pending promise if user cancels
    if (paymentPromiseRef.current) {
      paymentPromiseRef.current.reject(new Error("Payment cancelled by user"));
      paymentPromiseRef.current = null;
    }
  }, []);

  const handlePaymentComplete = useCallback(
    async (signature: string) => {
      if (!pendingRequest || !paymentPromiseRef.current) return;

      const { resolve, reject } = paymentPromiseRef.current;

      try {
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

        // Clear pending state
        setPendingRequest(null);
        setPaymentInstructions(null);
        paymentPromiseRef.current = null;

        // Resolve the promise with the response
        resolve(retryResponse);
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Payment failed"));
      }
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

        // Return promise that will be resolved by handlePaymentComplete callback
        return new Promise<Response>((resolve, reject) => {
          paymentPromiseRef.current = { resolve, reject };

          // Timeout after 5 minutes
          setTimeout(
            () => {
              if (paymentPromiseRef.current) {
                paymentPromiseRef.current.reject(new Error("Payment timeout"));
                paymentPromiseRef.current = null;
              }
            },
            5 * 60 * 1000,
          );
        });
      }

      // Other errors, throw
      throw new Error(`Request failed: ${response.statusText}`);
    },
    [],
  );

  return {
    fetchWithPayment,
    isPaymentModalOpen,
    paymentInstructions,
    closePaymentModal,
    handlePaymentComplete,
  };
}
