"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import clsx from "clsx";
import { type ReactNode, useCallback } from "react";

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

  const handleClick = useCallback(() => {
    if (disabled) {
      return;
    }
    if (typeof open === "function") {
      open();
    } else {
      console.warn("AppKit modal is not available.");
    }
  }, [disabled, open]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center rounded border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/80 transition hover:border-white/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {isConnected ? connectedLabel : connectLabel}
    </button>
  );
}
