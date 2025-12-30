"use client";

import { useAppKit } from "@reown/appkit/react";
import { JsonRpcProvider } from "ethers";
import {
  Check,
  Copy,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDenUser } from "@/hooks/useDenUser";
import { Link } from "@/i18n/routing";

export function WalletMenu() {
  const t = useTranslations();
  const user = useDenUser();
  const { open } = useAppKit();
  const [copied, setCopied] = useState(false);
  const [ensName, setEnsName] = useState<string | null>(null);
  const ensProviderRef = useRef<JsonRpcProvider | null>(null);

  const walletAddress = user.walletAddress;
  const isVerified = user.selfVerified;
  const isConnected = user.isBuilder;

  // ENS resolution
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

  const formatAddress = (address: string) =>
    address.length <= 10
      ? address
      : `${address.slice(0, 6)}...${address.slice(-4)}`;

  const copyAddress = async () => {
    if (!walletAddress) return;

    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const handleDisconnect = () => {
    open({ view: "Account" });
  };

  if (!isConnected || !walletAddress) {
    return null;
  }

  // Display name: ENS if available, otherwise truncated address
  const displayName = ensName ?? formatAddress(walletAddress);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-xl border-white/10 bg-white/5 px-3 py-2 text-white transition hover:border-white/30 hover:bg-white/10"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-white/10">
            <Wallet className="h-3.5 w-3.5 text-[#8bea4e]" aria-hidden />
          </span>
          <span className="text-sm font-medium">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 rounded-xl border border-white/10 bg-gradient-to-br from-[#0a0e14] via-[#0d1219] to-[#0a0e14] p-2 shadow-2xl"
      >
        {/* Address with copy */}
        <div className="rounded-lg bg-white/5 px-3 py-2 mb-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-white/70">
              {formatAddress(walletAddress)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-white/10"
              onClick={copyAddress}
            >
              {copied ? (
                <Check className="h-3 w-3 text-[#8bea4e]" />
              ) : (
                <Copy className="h-3 w-3 text-white/60" />
              )}
              <span className="sr-only">
                {copied ? "Copied!" : "Copy address"}
              </span>
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          asChild
          className="rounded-lg px-3 py-2.5 hover:bg-white/5"
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-3 cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4 text-[#8bea4e]" />
            <span className="text-[0.8rem]">
              {t("sidebar.laboratory.dashboard")}
            </span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="rounded-lg px-3 py-2.5 hover:bg-white/5"
        >
          <Link
            href="/verification"
            className="flex items-center gap-3 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4 text-[#8bea4e]" />
            <span className="text-[0.8rem]">
              {t("sidebar.account.verification")}
            </span>
            {!isVerified && (
              <Badge
                variant="outline"
                className="ml-auto h-5 border-yellow-500/30 bg-yellow-500/10 px-1.5 text-[0.6rem] text-yellow-400"
              >
                ⚠️
              </Badge>
            )}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="rounded-lg px-3 py-2.5 hover:bg-white/5"
        >
          <Link
            href="/settings"
            className="flex items-center gap-3 cursor-pointer"
          >
            <Settings className="h-4 w-4 text-[#8bea4e]" />
            <span className="text-[0.8rem]">
              {t("sidebar.account.settings")}
            </span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDisconnect}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-white/5"
        >
          <LogOut className="h-4 w-4 text-[#8bea4e]" />
          <span className="text-[0.8rem]">Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default WalletMenu;
