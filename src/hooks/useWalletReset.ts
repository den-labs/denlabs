"use client";

import { useDisconnect } from "@reown/appkit/react";
import { useCallback, useState } from "react";

/**
 * Hook to reset wallet connection state
 * Performs disconnect + clears WalletConnect storage
 */
export function useWalletReset() {
  const { disconnect } = useDisconnect();
  const [isResetting, setIsResetting] = useState(false);

  const resetConnection = useCallback(async () => {
    if (isResetting) {
      console.log("[useWalletReset] Reset already in progress");
      return;
    }

    try {
      setIsResetting(true);
      console.log("[useWalletReset] Starting connection reset...");

      // Step 1: Disconnect from current wallet
      if (typeof disconnect === "function") {
        await disconnect();
        console.log("[useWalletReset] Disconnected from wallet");
      }

      // Step 2: Clear WalletConnect storage
      // AppKit/WalletConnect stores data in localStorage with specific keys
      const walletConnectKeys = [
        "wc@2:client:0.3//proposal",
        "wc@2:client:0.3//session",
        "wc@2:core:0.3//expirer",
        "wc@2:core:0.3//history",
        "wc@2:core:0.3//keychain",
        "wc@2:core:0.3//messages",
        "wc@2:core:0.3//pairing",
        "wc@2:core:0.3//subscription",
        "wc@2:ethereum_provider:/chainId",
        "wc@2:ethereum_provider:/namespace",
        "wc@2:ethereum_provider:/optionalNamespaces",
        "wc@2:ethereum_provider:/rpcMap",
        "wc@2:ethereum_provider:/sessionProperties",
        "-walletlink:https://www.walletlink.org:session:id",
        "-walletlink:https://www.walletlink.org:session:secret",
        "-walletlink:https://www.walletlink.org:session:linked",
        "WALLETCONNECT_DEEPLINK_CHOICE",
      ];

      // Also clear any keys that start with common WalletConnect prefixes
      const allKeys = Object.keys(localStorage);
      const keysToRemove = allKeys.filter(
        (key) =>
          walletConnectKeys.includes(key) ||
          key.startsWith("wc@2:") ||
          key.startsWith("wagmi.") ||
          key.includes("walletconnect") ||
          key.includes("reown"),
      );

      keysToRemove.forEach((key) => {
        try {
          localStorage.removeItem(key);
          console.log(`[useWalletReset] Removed storage key: ${key}`);
        } catch (error) {
          console.error(`[useWalletReset] Failed to remove key ${key}:`, error);
        }
      });

      console.log(
        `[useWalletReset] Reset complete. Cleared ${keysToRemove.length} storage keys`,
      );

      // Optional: Reload page to ensure clean state
      // Uncomment if needed:
      // window.location.reload();
    } catch (error) {
      console.error("[useWalletReset] Failed to reset connection:", error);
      throw error;
    } finally {
      setIsResetting(false);
    }
  }, [disconnect, isResetting]);

  return {
    resetConnection,
    isResetting,
  };
}
