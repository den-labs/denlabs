"use client";

import { BrowserProvider } from "ethers";
import { useTranslations } from "next-intl";
import { type ComponentProps, useEffect, useState } from "react";
import HowlBadge from "@/components/ui/HowlBadge";
import SelfBadge from "@/components/ui/SelfBadge";
import {
  getSelfVerification,
  subscribeToSelfVerification,
} from "@/lib/selfVerification";

declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
      on?: (event: string, listener: (...args: unknown[]) => void) => void;
      removeListener?: (
        event: string,
        listener: (...args: unknown[]) => void,
      ) => void;
    };
  }
}

type StatusStripProps = {
  level?: ComponentProps<typeof HowlBadge>["level"];
  className?: string;
};

type WalletBroadcastDetail = {
  address: string | null;
  isConnecting: boolean;
  chainId: number | null;
  provider: BrowserProvider | null;
};

const CELO_CHAIN_ID = 42220;

const broadcastWalletState = (detail: WalletBroadcastDetail) => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<WalletBroadcastDetail>("wolf-wallet-state", { detail }),
  );
};

export function StatusStrip({
  level = "Lobo",
  className = "",
}: StatusStripProps) {
  const tSpray = useTranslations("SprayDisperser");
  const [isSelfVerified, setIsSelfVerified] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [walletState, setWalletState] = useState<
    Omit<WalletBroadcastDetail, "provider">
  >({
    address: null,
    isConnecting: false,
    chainId: null,
  });

  const socialLinks = [
    {
      href: "https://github.com/wolfcito/wolf-den",
      label: "GitHub",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          role="img"
          aria-hidden="true"
        >
          <path
            d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.6.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.3-3.4-1.3-.4-1-.9-1.3-.9-1.3-.7-.5.1-.5.1-.5.8.1 1.3.9 1.3.9.7 1.2 1.9.9 2.4.7.1-.5.3-.9.5-1.1-2.2-.3-4.5-1.2-4.5-5.2 0-1.1.4-2 1-2.7-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.7 1 .8-.2 1.6-.3 2.5-.3.9 0 1.7.1 2.5.3 1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.5.7.7 1 1.6 1 2.7 0 4-2.3 4.9-4.5 5.2.3.2.6.7.6 1.4v2.1c0 .3.2.6.7.5 3.9-1.3 6.8-5.1 6.8-9.6C22 6.6 17.5 2 12 2Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      href: "https://x.com/AKAwolfcito",
      label: "X",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          role="img"
          aria-hidden="true"
        >
          <path
            d="M4.5 3h3.1l4 5.7L15.3 3H19l-5.3 7.3L20 21h-3.1l-4.4-6.3-4.4 6.3H4l6.3-8.7L4.5 3Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setIsSelfVerified(getSelfVerification());
    return subscribeToSelfVerification(setIsSelfVerified);
  }, []);

  const translateSpray = (
    key: string,
    fallback: string,
    values?: Record<string, string | number>,
  ) => {
    try {
      return values ? tSpray(key, values) : tSpray(key);
    } catch {
      return fallback;
    }
  };

  const formatAddress = (address: string) =>
    address.length <= 10
      ? address
      : `${address.slice(0, 6)}...${address.slice(-4)}`;

  const handleWalletConnect = async () => {
    if (walletState.isConnecting) {
      return;
    }
    if (typeof window === "undefined" || !window.ethereum) {
      return;
    }
    setWalletState((prev) => {
      const next = { ...prev, isConnecting: true };
      broadcastWalletState({ ...next, provider });
      return next;
    });
    try {
      const nextProvider = new BrowserProvider(window.ethereum);
      await nextProvider.send("eth_requestAccounts", []);
      const signer = await nextProvider.getSigner();
      const address = await signer.getAddress();
      const network = await nextProvider.getNetwork();
      setProvider(nextProvider);
      setWalletState({
        address,
        isConnecting: false,
        chainId: Number(network.chainId),
      });
      broadcastWalletState({
        address,
        isConnecting: false,
        chainId: Number(network.chainId),
        provider: nextProvider,
      });
    } catch {
      setProvider(null);
      setWalletState({
        address: null,
        isConnecting: false,
        chainId: null,
      });
      broadcastWalletState({
        address: null,
        isConnecting: false,
        chainId: null,
        provider: null,
      });
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      return;
    }
    let mounted = true;

    const syncExisting = async () => {
      try {
        const { ethereum } = window;
        if (!ethereum?.request) {
          return;
        }
        const accounts = (await ethereum.request({
          method: "eth_accounts",
        })) as string[] | undefined;
        if (!mounted || !accounts || accounts.length === 0) {
          return;
        }
        const nextProvider = new BrowserProvider(ethereum);
        const network = await nextProvider.getNetwork();
        setProvider(nextProvider);
        setWalletState({
          address: accounts[0],
          isConnecting: false,
          chainId: Number(network.chainId),
        });
        broadcastWalletState({
          address: accounts[0],
          isConnecting: false,
          chainId: Number(network.chainId),
          provider: nextProvider,
        });
      } catch {
        // ignore
      }
    };

    void syncExisting();

    const handleAccountsChanged = async (accounts: unknown) => {
      if (!Array.isArray(accounts) || accounts.length === 0) {
        setProvider(null);
        setWalletState({
          address: null,
          isConnecting: false,
          chainId: null,
        });
        broadcastWalletState({
          address: null,
          isConnecting: false,
          chainId: null,
          provider: null,
        });
        return;
      }
      const { ethereum } = window;
      if (!ethereum) {
        return;
      }
      const nextProvider = new BrowserProvider(ethereum);
      const network = await nextProvider.getNetwork();
      setProvider(nextProvider);
      setWalletState({
        address: String(accounts[0]),
        isConnecting: false,
        chainId: Number(network.chainId),
      });
      broadcastWalletState({
        address: String(accounts[0]),
        isConnecting: false,
        chainId: Number(network.chainId),
        provider: nextProvider,
      });
    };

    const handleChainChanged = (newChainId: unknown) => {
      if (typeof newChainId === "string") {
        const parsed = Number.parseInt(newChainId, 16);
        setWalletState((prev) => {
          const next = {
            ...prev,
            chainId: Number.isNaN(parsed) ? prev.chainId : parsed,
          };
          broadcastWalletState({ ...next, provider });
          return next;
        });
      }
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      mounted = false;
      window.ethereum?.removeListener?.(
        "accountsChanged",
        handleAccountsChanged,
      );
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [provider]);

  useEffect(() => {
    return () => {
      broadcastWalletState({
        address: null,
        isConnecting: false,
        chainId: null,
        provider: null,
      });
    };
  }, []);

  const isCeloReady = walletState.chainId === CELO_CHAIN_ID;

  const walletButtonLabel = walletState.isConnecting
    ? "Connecting..."
    : walletState.address
      ? translateSpray(
          "actions.connected",
          `Connected: ${formatAddress(walletState.address)}`,
          { address: formatAddress(walletState.address) },
        )
      : translateSpray("actions.connect", "Connect Wallet");

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        <HowlBadge level={level} />
        <SelfBadge status={isSelfVerified ? "verified" : "pending"} />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleWalletConnect}
          disabled={walletState.isConnecting}
          className="inline-flex items-center justify-center rounded-full border border-wolf-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-wolf-foreground transition hover:border-wolf-border-xstrong hover:text-wolf-emerald disabled:cursor-not-allowed disabled:opacity-60"
        >
          {walletButtonLabel}
        </button>
        {walletState.address ? (
          <span
            className={`wolf-pill text-xs uppercase tracking-[0.26em] ${
              isCeloReady
                ? "bg-wolf-emerald-soft text-wolf-emerald"
                : "bg-wolf-charcoal-70 text-wolf-text-subtle"
            }`}
          >
            {isCeloReady
              ? translateSpray("network.ready", "Celo mainnet detected")
              : translateSpray("network.switch", "Switch to Celo mainnet")}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {socialLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-wolf-border bg-wolf-charcoal-70 text-wolf-foreground transition hover:border-wolf-border-xstrong hover:text-wolf-emerald"
            aria-label={link.label}
            title={link.label}
          >
            {link.icon}
            <span className="sr-only">{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default StatusStrip;
