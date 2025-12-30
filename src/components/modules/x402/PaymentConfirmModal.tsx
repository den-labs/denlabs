"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { AlertCircle, Info, Loader2, X } from "lucide-react";

interface PaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  price: number;
  description: string;
  network?: string;
}

export function PaymentConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  price,
  description,
  network = "avalanche-fuji",
}: PaymentConfirmModalProps) {
  const { address, isConnected } = useAppKitAccount();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-black via-zinc-950 to-black p-6 shadow-2xl">
        {/* Close button */}
        {!isProcessing && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-white/50 transition hover:bg-white/5 hover:text-white/80"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {isProcessing ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-wolf-emerald" />
            <h3 className="mb-2 text-xl font-bold text-white">
              Processing Payment
            </h3>
            <p className="text-sm text-white/60">
              Please approve the signature in your wallet...
            </p>
          </div>
        ) : (
          <>
            <h2 className="mb-4 text-2xl font-bold text-white">
              Premium Feature
            </h2>

            <div className="mb-6 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-white/70">Feature</span>
                <span className="text-sm font-semibold text-white">
                  {description}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-white/70">Price</span>
                <span className="text-lg font-bold text-wolf-emerald">
                  ${price.toFixed(2)} USD
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-white/70">Payment Token</span>
                <span className="text-sm font-semibold text-white">USDC</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-white/70">Network</span>
                <span className="text-sm font-semibold text-white capitalize">
                  {network.replace("-", " ")}
                </span>
              </div>
            </div>

            <div className="mb-6 flex items-start gap-2 rounded-lg bg-blue-500/10 p-3 text-sm text-blue-300">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">x402 Gasless Payment</p>
                <p className="text-blue-200/80">
                  Sign a payment authorization. The facilitator handles on-chain
                  settlement - no gas fees for you.
                </p>
              </div>
            </div>

            {/* Wallet Connection Warning */}
            {!isConnected && (
              <div className="mb-6 flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
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
                onClick={onConfirm}
                disabled={!isConnected || !address}
                className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  isConnected && address
                    ? "bg-wolf-emerald text-black hover:bg-wolf-emerald/90"
                    : "cursor-not-allowed bg-gray-600 text-gray-400"
                }`}
              >
                {isConnected ? "Confirm & Pay" : "Connect Wallet First"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
