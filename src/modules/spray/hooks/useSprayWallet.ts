"use client";

import {
  useAppKit,
  useAppKitNetwork,
  useAppKitProvider,
} from "@reown/appkit/react";
import { BrowserProvider, type Eip1193Provider } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useDenUser } from "@/hooks/useDenUser";
import { getEthereum, normalizeChainId } from "../constants";

export function useSprayWallet() {
  const { open } = useAppKit();
  const { chainId: appKitChainId } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>("eip155");
  const { walletAddress } = useDenUser();

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signerAddress, setSignerAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    setSignerAddress(walletAddress ?? null);
  }, [walletAddress]);

  useEffect(() => {
    const normalizedChainId = normalizeChainId(appKitChainId);
    setChainId(normalizedChainId);
  }, [appKitChainId]);

  useEffect(() => {
    if (!walletProvider) {
      setProvider(null);
      return;
    }
    const _networkKey = chainId;
    void _networkKey;
    setProvider(new BrowserProvider(walletProvider));
  }, [walletProvider, chainId]);

  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) {
      return;
    }

    const handleAccountsChanged: (...args: unknown[]) => void = (...args) => {
      const [rawAccounts] = args;
      if (!Array.isArray(rawAccounts) || rawAccounts.length === 0) {
        setSignerAddress(null);
        return;
      }
      setSignerAddress(String(rawAccounts[0]));
    };

    const handleChainChanged = (newChainId: unknown) => {
      if (typeof newChainId === "string") {
        setChainId(Number.parseInt(newChainId, 16));
      }
    };

    ethereum.on?.("accountsChanged", handleAccountsChanged);
    ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleWalletState = (event: Event) => {
      const customEvent = event as CustomEvent<{
        address: string | null;
        isConnecting: boolean;
        chainId: number | null;
        provider: BrowserProvider | null;
      }>;
      if (!customEvent.detail) {
        return;
      }
      setSignerAddress(customEvent.detail.address);
      setChainId(customEvent.detail.chainId ?? null);
      setProvider(customEvent.detail.provider ?? null);
    };
    window.addEventListener(
      "wolf-wallet-state",
      handleWalletState as EventListener,
    );
    return () => {
      window.removeEventListener(
        "wolf-wallet-state",
        handleWalletState as EventListener,
      );
    };
  }, []);

  const getSignerLazy = useCallback(
    () => provider?.getSigner() ?? null,
    [provider],
  );

  const openWallet = useCallback(
    (view?: "Connect" | "Networks") => {
      open?.({ view: view ?? "Connect" });
    },
    [open],
  );

  return {
    provider,
    signerAddress,
    chainId,
    isConnected: signerAddress != null,
    getSignerLazy,
    openWallet,
    walletProvider,
  };
}
