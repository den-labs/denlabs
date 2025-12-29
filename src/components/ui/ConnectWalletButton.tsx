"use client";

import {
  useAppKit,
  useAppKitAccount,
  useAppKitState,
} from "@reown/appkit/react";
import clsx from "clsx";
import { type ReactNode, useCallback, useRef, useState } from "react";

type ConnectWalletButtonProps = {
  className?: string;
  connectLabel?: ReactNode;
  connectedLabel?: ReactNode;
  disabled?: boolean;
};

export default function ConnectWalletButton({
  className,
  connectLabel = "Connect wallet",
  connectedLabel = "Change wallet",
  disabled = false,
}: ConnectWalletButtonProps) {
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();
  const { loading } = useAppKitState();
  const [isOpening, setIsOpening] = useState(false);
  const openRequestRef = useRef<Promise<unknown> | null>(null);

  const handleClick = useCallback(async () => {
    // Prevent multiple concurrent connection attempts
    if (disabled || isOpening || openRequestRef.current) {
      console.log("[ConnectWalletButton] Request blocked:", {
        disabled,
        isOpening,
        hasPendingRequest: !!openRequestRef.current,
      });
      return;
    }

    if (typeof open !== "function") {
      console.warn("[ConnectWalletButton] AppKit modal is not available.");
      return;
    }

    try {
      setIsOpening(true);
      console.log("[ConnectWalletButton] Opening wallet modal...");

      // Store the promise to prevent concurrent requests
      const openPromise = open();
      openRequestRef.current = openPromise;

      await openPromise;

      console.log("[ConnectWalletButton] Modal opened successfully");
    } catch (error) {
      console.error("[ConnectWalletButton] Failed to open modal:", error);
    } finally {
      setIsOpening(false);
      openRequestRef.current = null;
    }
  }, [disabled, isOpening, open]);

  const isButtonDisabled = disabled || isOpening || loading;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isButtonDisabled}
      className={clsx(
        "inline-flex items-center justify-center rounded border border-white/30 px-4 py-2 text-xs font-semibold uppercase text-white/80 transition hover:border-white/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {isOpening || loading
        ? "Connecting..."
        : isConnected
          ? connectedLabel
          : connectLabel}
    </button>
  );
}
