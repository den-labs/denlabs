"use client";

import { useEffect, useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  useAppKitProvider,
  useAppKitAccount,
  useAppKitNetwork,
} from "@reown/appkit/react";
import { BrowserProvider, type Eip1193Provider, parseUnits } from "ethers";
import type { PaymentInstructions } from "@/lib/x402Client";

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
  const { walletProvider } = useAppKitProvider<Eip1193Provider>("eip155");
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
      // Check if wallet is connected
      if (!isConnected || !walletProvider || !address || !chainId) {
        throw new Error(
          "Wallet not connected. Please connect your wallet first.",
        );
      }

      // Create ethers provider and signer
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      // Create EIP-712 TypedData for x402 payment
      const domain = {
        name: "x402 Payment",
        version: "1",
        chainId: chainId,
      };

      const types = {
        Payment: [
          { name: "recipient", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "token", type: "string" },
          { name: "nonce", type: "uint256" },
        ],
      };

      // USDC has 6 decimals
      const amountInTokenUnits = parseUnits(
        paymentInstructions.price.toString(),
        6,
      );

      const value = {
        recipient: paymentInstructions.recipient,
        amount: amountInTokenUnits,
        token: paymentInstructions.token,
        nonce: BigInt(Date.now()), // Use timestamp as nonce
      };

      // Sign the typed data
      const signature = await signer.signTypedData(domain, types, value);

      setStatus("success");

      // Wait a moment to show success state
      setTimeout(() => {
        onPaymentComplete(signature);
      }, 1000);
    } catch (error) {
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
                <span className="text-sm text-white/70">Token</span>
                <span className="text-sm font-semibold uppercase text-white">
                  {paymentInstructions.token}
                </span>
              </div>
            </div>

            <p className="mb-6 text-sm text-white/60">
              This will be charged to your connected wallet.
            </p>

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
                className="flex-1 rounded-lg bg-wolf-emerald px-4 py-3 text-sm font-semibold text-black transition hover:bg-wolf-emerald/90"
              >
                Confirm Payment
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
