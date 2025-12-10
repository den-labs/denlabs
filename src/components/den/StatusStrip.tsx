"use client";

import {
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitState,
} from "@reown/appkit/react";
import { BrowserProvider, type Eip1193Provider, JsonRpcProvider } from "ethers";
import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";
import ConnectWalletButton from "@/components/ui/ConnectWalletButton";
import HowlBadge from "@/components/ui/HowlBadge";
import SelfBadge from "@/components/ui/SelfBadge";
import { useDenUser } from "@/hooks/useDenUser";

type StatusStripProps = {
  className?: string;
};

type WalletBroadcastDetail = {
  address: string | null;
  isConnecting: boolean;
  chainId: number | null;
  provider: BrowserProvider | null;
};

const broadcastWalletState = (detail: WalletBroadcastDetail) => {
  if (typeof window === "undefined") {
    return;
  }
  const dispatch = () => {
    window.dispatchEvent(
      new CustomEvent<WalletBroadcastDetail>("wolf-wallet-state", { detail }),
    );
  };
  if (typeof queueMicrotask === "function") {
    queueMicrotask(dispatch);
    return;
  }
  window.setTimeout(dispatch, 0);
};

export function StatusStrip({ className = "" }: StatusStripProps) {
  const tSpray = useTranslations("SprayDisperser");
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [ensName, setEnsName] = useState<string | null>(null);
  const ensProviderRef = useRef<JsonRpcProvider | null>(null);
  const { caipNetwork, chainId } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>("eip155");
  const { loading } = useAppKitState();
  const user = useDenUser();
  const walletAddress = user.walletAddress;
  const isSelfVerified = user.selfVerified;
  const isConnected = user.isBuilder;
  const holdScore = user.holdScore;

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

  const normalizeChainId = (
    value: number | string | undefined,
  ): number | null => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string" && value.length > 0) {
      if (value.startsWith("eip155:")) {
        const [, raw] = value.split(":");
        const parsed = Number.parseInt(raw ?? "", 10);
        return Number.isNaN(parsed) ? null : parsed;
      }
      if (value.startsWith("0x")) {
        const parsed = Number.parseInt(value, 16);
        return Number.isNaN(parsed) ? null : parsed;
      }
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  const normalizedChainId = normalizeChainId(chainId);

  useEffect(() => {
    if (!walletProvider || !isConnected) {
      setProvider(null);
      return;
    }
    const nextProvider = new BrowserProvider(walletProvider);
    setProvider(nextProvider);
  }, [walletProvider, isConnected]);

  useEffect(() => {
    broadcastWalletState({
      address: walletAddress ?? null,
      isConnecting: loading,
      chainId: normalizedChainId,
      provider,
    });
  }, [walletAddress, loading, normalizedChainId, provider]);

  useEffect(() => {
    if (!walletAddress) {
      setEnsName(null);
      return;
    }
    const rpcUrl =
      process.env.NEXT_PUBLIC_MAINNET_RPC ??
      "https://eth-mainnet.g.alchemy.com/v2/UJxU4hYOPrrKdoCaO6f6p";
    if (!ensProviderRef.current) {
      ensProviderRef.current = new JsonRpcProvider(rpcUrl);
    }
    let cancelled = false;
    ensProviderRef.current
      .lookupAddress(walletAddress)
      .then((name) => {
        if (!cancelled) {
          setEnsName(name ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEnsName(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

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

  const walletButtonLabel: ReactNode = loading
    ? "Connecting..."
    : translateSpray("actions.connect", "Connect Wallet");

  const connectedChainName = caipNetwork?.name ?? "Wallet";
  const walletIcon = (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-white/10">
      <Wallet className="h-3.5 w-3.5 text-white/80" aria-hidden />
    </span>
  );

  const connectedWalletButtonLabel: ReactNode =
    walletAddress != null ? (
      <span className="flex items-center gap-2">
        {walletIcon}
        <span>{ensName ?? formatAddress(walletAddress)}</span>
      </span>
    ) : (
      translateSpray("actions.connected", "Wallet Connected", {
        address: walletAddress != null ? formatAddress(walletAddress) : "—",
        network: connectedChainName,
      })
    );

  return (
    <div
      className={`flex flex-wrap items-center gap-2 md:gap-4 bg-[#14181f]/70 rounded-lg p-2 ${className}`}
    >
      <div className="order-1 flex w-full items-center gap-2 sm:order-2 sm:w-auto">
        <ConnectWalletButton
          className="inline-flex w-full items-center justify-center gap-3 rounded-md border px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.18em] transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          connectLabel={walletButtonLabel}
          connectedLabel={connectedWalletButtonLabel}
          disabled={loading}
        />
      </div>
      <div className="order-2 w-full sm:order-1 sm:w-auto">
        <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-3">
          <HowlBadge
            score={holdScore}
            className="w-full justify-center sm:w-auto sm:justify-start"
          />
          <SelfBadge
            status={isSelfVerified ? "verified" : "unverified"}
            className="w-full justify-center sm:w-auto sm:justify-start"
          />
          {socialLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-wolf-border bg-wolf-charcoal-70 text-wolf-foreground transition hover:border-wolf-border-xstrong hover:text-wolf-emerald sm:w-9"
              aria-label={link.label}
              title={link.label}
            >
              {link.icon}
              <span className="sr-only">{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatusStrip;
