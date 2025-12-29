"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import clsx from "clsx";
import { useCallback } from "react";
import { useWalletReset } from "@/hooks/useWalletReset";

type ResetWalletButtonProps = {
  className?: string;
  label?: string;
  onResetComplete?: () => void;
};

/**
 * Button to reset wallet connection
 * Disconnects wallet and clears all WalletConnect storage
 * Only shows when wallet is connected
 */
export default function ResetWalletButton({
  className,
  label = "Reset Connection",
  onResetComplete,
}: ResetWalletButtonProps) {
  const { isConnected } = useAppKitAccount();
  const { resetConnection, isResetting } = useWalletReset();

  const handleReset = useCallback(async () => {
    try {
      await resetConnection();
      onResetComplete?.();
    } catch (error) {
      console.error("[ResetWalletButton] Reset failed:", error);
    }
  }, [resetConnection, onResetComplete]);

  // Only show when connected
  if (!isConnected) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={isResetting}
      className={clsx(
        "inline-flex items-center justify-center rounded border border-red-500/30 px-4 py-2 text-xs font-semibold uppercase text-red-400/80 transition hover:border-red-500/60 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {isResetting ? "Resetting..." : label}
    </button>
  );
}
