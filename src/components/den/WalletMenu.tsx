"use client";

import {
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Wallet,
  Copy,
  Check,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useDenUser } from "@/hooks/useDenUser";
import { cn } from "@/lib/utils";

export function WalletMenu() {
  const t = useTranslations();
  const user = useDenUser();
  const { open } = useAppKit();
  const [copied, setCopied] = useState(false);

  const walletAddress = user.walletAddress;
  const isVerified = user.selfVerified;
  const isConnected = user.isBuilder;

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-lg border-white/20 bg-white/5 px-3 py-2 text-white transition hover:border-white/40 hover:bg-white/10"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-white/10">
            <Wallet className="h-3.5 w-3.5 text-white/80" aria-hidden />
          </span>
          <span className="hidden text-sm font-medium sm:inline">
            {formatAddress(walletAddress)}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs">{formatAddress(walletAddress)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={copyAddress}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span className="sr-only">
                {copied ? "Copied!" : "Copy address"}
              </span>
            </Button>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
            <LayoutDashboard className="h-4 w-4" />
            <span>{t("sidebar.laboratory.dashboard")}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/verification" className="flex items-center gap-2 cursor-pointer">
            <ShieldCheck className="h-4 w-4" />
            <span>{t("sidebar.account.verification")}</span>
            {!isVerified && (
              <Badge variant="outline" className="ml-auto h-5 px-1.5 text-[0.65rem]">
                ⚠️
              </Badge>
            )}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            <span>{t("sidebar.account.settings")}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default WalletMenu;
