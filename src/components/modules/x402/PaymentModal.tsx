"use client";

import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { AlertCircle, CheckCircle2, Info, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { EVMProvider } from "uvd-x402-sdk/evm";
import { getChainById } from "uvd-x402-sdk";
import type { PaymentInstructions } from "@/lib/x402Client";
import { validateAddress } from "@/lib/addressValidation";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentInstructions: PaymentInstructions;
  onPaymentComplete: (signature: string) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  paymentInstructions,
  onPaymentComplete,
}: PaymentModalProps) {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const [status, setStatus] = useState<
    "confirming" | "processing" | "success" | "error"
  >("confirming");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStatus("confirming");
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleConfirmPayment = async () => {
    setStatus("processing");
    setErrorMessage(null);

    try {
      // Validate recipient address
      const recipientValidation = validateAddress(
        paymentInstructions.recipient,
      );
      if (!recipientValidation.valid) {
        throw new Error(
          recipientValidation.error ||
            "Invalid recipient address in payment instructions",
        );
      }

      // Check wallet connection
      if (!isConnected || !address || !chainId) {
        throw new Error(
          "Wallet not connected. Please connect your wallet first.",
        );
      }

      // Get chain configuration from SDK
      const chainIdNum =
        typeof chainId === "number" ? chainId : Number(chainId);
      const chainConfig = getChainById(chainIdNum);

      if (!chainConfig) {
        throw new Error(`Chain ${chainIdNum} not supported by x402 SDK`);
      }

      console.log("[Payment] Using chain:", {
        id: chainConfig.chainId,
        name: chainConfig.name,
        displayName: chainConfig.displayName,
      });

      // Create EVM provider from SDK
      const evmProvider = new EVMProvider();

      // Check if wallet is available
      if (!evmProvider.isAvailable()) {
        throw new Error("EVM wallet not available");
      }

      // Connect to wallet
      await evmProvider.connect(chainConfig.name);

      // Prepare payment info
      const paymentInfo = {
        recipient: paymentInstructions.recipient,
        amount: paymentInstructions.price.toString(),
        tokenType: "usdc" as const,
      };

      console.log("[Payment] Signing payment:", paymentInfo);

      // Sign payment (creates EIP-712 signature without executing on-chain)
      const paymentPayload = await evmProvider.signPayment(
        paymentInfo,
        chainConfig,
      );

      // Encode as X-PAYMENT header
      const xPaymentHeader = evmProvider.encodePaymentHeader(
        paymentPayload,
        chainConfig,
        1, // x402 version 1
      );

      console.log("[Payment] Payment signed successfully");

      setStatus("success");

      // Pass the X-PAYMENT header value to the callback
      // The x402Client will use this header when making the request
      setTimeout(() => {
        onPaymentComplete(xPaymentHeader);
      }, 1000);
    } catch (error) {
      console.error("[Payment] Error:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Payment failed",
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-black via-zinc-950 to-black p-6 shadow-2xl">
        {/* Close button */}
        {status === "confirming" && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-white/50 transition hover:bg-white/5 hover:text-white/80"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Content based on status */}
        {status === "confirming" && (
          <>
            <h2 className="mb-4 text-2xl font-bold text-white">
              Premium Feature
            </h2>

            <div className="mb-6 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-white/70">Feature</span>
                <span className="text-sm font-semibold text-white">
                  {paymentInstructions.description}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-white/70">Price</span>
                <span className="text-lg font-bold text-wolf-emerald">
                  ${paymentInstructions.price.toFixed(2)} USD
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-white/70">Payment Token</span>
                <span className="text-sm font-semibold text-white">USDC</span>
              </div>
            </div>

            <div className="mb-6 flex items-start gap-2 rounded-lg bg-blue-500/10 p-3 text-sm text-blue-300">
              <Info className="h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-semibold">x402 Gasless Payment</p>
                <p className="text-blue-200/80">
                  Sign payment authorization. The facilitator will execute
                  on-chain - no gas fees for you.
                </p>
              </div>
            </div>

            {/* Wallet Connection Warning */}
            {!isConnected && (
              <div className="mb-6 flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Wallet Required</p>
                  <p className="text-yellow-200/80">
                    Please connect your wallet to proceed with payment.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={!isConnected || !address}
                className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  isConnected && address
                    ? "bg-wolf-emerald text-black hover:bg-wolf-emerald/90"
                    : "cursor-not-allowed bg-gray-600 text-gray-400"
                }`}
              >
                {isConnected ? "Sign Payment" : "Connect Wallet First"}
              </button>
            </div>
          </>
        )}

        {status === "processing" && (
          <div className="flex flex-col items-center py-8 text-center">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-wolf-emerald" />
            <h3 className="mb-2 text-xl font-bold text-white">
              Processing Payment
            </h3>
            <p className="text-sm text-white/60">
              Creating payment transaction...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-wolf-emerald" />
            <h3 className="mb-2 text-xl font-bold text-white">
              Payment Successful!
            </h3>
            <p className="text-sm text-white/60">Accessing your content...</p>
          </div>
        )}

        {status === "error" && (
          <>
            <div className="mb-6 flex flex-col items-center text-center">
              <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
              <h3 className="mb-2 text-xl font-bold text-white">
                Payment Failed
              </h3>
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setStatus("confirming")}
                className="flex-1 rounded-lg bg-wolf-emerald px-4 py-3 text-sm font-semibold text-black transition hover:bg-wolf-emerald/90"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
