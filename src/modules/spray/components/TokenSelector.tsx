"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { CUSTOM_TOKEN_ICON, DEFAULT_TOKEN_ICON } from "../constants";

type TrustedToken = {
  label: string;
  address: string;
  symbol?: string;
  iconUrl?: string;
  decimals?: number;
};

type TokenSelectorProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  tokenCardIconSrc: string;
  tokenCardSymbol: string;
  tokenCardPrimaryLabel: string;
  tokenPayWithLabel: string;
  isCustomTokenSelected: boolean;
  isNativeTokenSelected: boolean;
  tokenAddress: string;
  onTokenAddressChange: (value: string) => void;
  isFetchingTokenInfo: boolean;
  tokenInfo: { symbol: string; decimals: number } | null;
  nativeTokenIconSrc: string;
  nativeTokenLabel: string;
  nativeSymbol: string;
  nativeBalanceDisplay: string;
  trustedTokens: TrustedToken[];
  selectedTrustedToken: string;
  trustedTokenBalances: Record<string, string | null>;
  signerAddress: string | null;
  walletBalanceConnectHint: string;
  walletBalanceLoadingLabel: string;
  tokenSymbolPlaceholder: string;
  customTokenNameLabel: string;
  onSelectNative: () => void;
  onSelectCustom: () => void;
  onSelectTrusted: (address: string) => void;
};

export function TokenSelector({
  isOpen,
  setIsOpen,
  tokenCardIconSrc,
  tokenCardSymbol,
  tokenCardPrimaryLabel,
  tokenPayWithLabel,
  isCustomTokenSelected,
  isNativeTokenSelected,
  tokenAddress,
  onTokenAddressChange,
  isFetchingTokenInfo,
  tokenInfo,
  nativeTokenIconSrc,
  nativeTokenLabel,
  nativeSymbol,
  nativeBalanceDisplay,
  trustedTokens,
  selectedTrustedToken,
  trustedTokenBalances,
  signerAddress,
  walletBalanceConnectHint,
  walletBalanceLoadingLabel,
  tokenSymbolPlaceholder,
  customTokenNameLabel,
  onSelectNative,
  onSelectCustom,
  onSelectTrusted,
}: TokenSelectorProps) {
  const t = useTranslations("SprayDisperser");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (
        dropdownRef.current &&
        target &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  return (
    <div className="mt-6 space-y-3">
      <div className="space-y-2">
        <div
          ref={dropdownRef}
          className="relative z-30"
          id="trusted-token-select"
        >
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls="trusted-token-options"
            onClick={() => setIsOpen((v: boolean) => !v)}
            title={tokenCardPrimaryLabel}
            className="flex w-full items-center gap-3 rounded-xl border border-wolf-border bg-[#0f141d] px-3 py-2 text-left text-sm text-white/80 transition hover:border-wolf-emerald focus:border-wolf-emerald focus:outline-none"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Image
                src={tokenCardIconSrc}
                alt={`${tokenCardSymbol} token icon`}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="text-left leading-tight w-full">
              <p className="text-[11px] uppercase text-white/60">
                {tokenPayWithLabel}
              </p>
              {isCustomTokenSelected ? (
                <div className="mt-2 space-y-1">
                  <input
                    id="token-address-input-inline"
                    value={tokenAddress}
                    onChange={(event) =>
                      onTokenAddressChange(event.target.value)
                    }
                    placeholder={t("form.tokenPlaceholder")}
                    className="w-full rounded-md border border-wolf-border bg-wolf-panel px-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none"
                  />
                  {isFetchingTokenInfo ? (
                    <p className="text-xs text-white/50">
                      {t("form.tokenLoading")}
                    </p>
                  ) : tokenInfo ? (
                    <p className="text-xs text-wolf-emerald">
                      {t("form.tokenResolved", {
                        symbol: tokenInfo.symbol,
                        decimals: tokenInfo.decimals,
                      })}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-lg font-semibold text-white">
                  {tokenCardPrimaryLabel}
                </p>
              )}
            </div>
            <svg
              className="ml-auto h-4 w-4 text-white/70"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                d="M5 8l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {isOpen ? (
            <div
              id="trusted-token-options"
              role="listbox"
              className="absolute z-40 mt-2 w-full max-h-[18rem] overflow-y-auto rounded-xl border border-wolf-border bg-[#0b111a] py-1 text-sm text-white/80 shadow-2xl"
            >
              <button
                type="button"
                role="option"
                aria-selected={isNativeTokenSelected}
                className={`block w-full cursor-pointer px-3 py-2 text-left transition hover:bg-white/5 ${isNativeTokenSelected ? "bg-white/5" : ""}`}
                onClick={onSelectNative}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Image
                      src={nativeTokenIconSrc}
                      alt={`${nativeSymbol} icon`}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                  <div className="text-left leading-tight w-full">
                    <p className="text-sm font-semibold text-white">
                      {nativeTokenLabel}
                    </p>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>{nativeSymbol}</span>
                      <span>{nativeBalanceDisplay}</span>
                    </div>
                  </div>
                </div>
              </button>
              {trustedTokens.map((tok) => {
                const balanceKey = tok.address.toLowerCase();
                const storedBalance = trustedTokenBalances[balanceKey];
                const hasBalanceEntry = Object.hasOwn(
                  trustedTokenBalances,
                  balanceKey,
                );
                let walletBalanceValue: string;
                if (storedBalance != null) {
                  walletBalanceValue = storedBalance;
                } else if (!signerAddress) {
                  walletBalanceValue = walletBalanceConnectHint;
                } else if (!hasBalanceEntry) {
                  walletBalanceValue = walletBalanceLoadingLabel;
                } else {
                  walletBalanceValue = "0";
                }
                return (
                  <button
                    key={tok.address}
                    type="button"
                    role="option"
                    aria-selected={selectedTrustedToken === tok.address}
                    className={`block w-full cursor-pointer px-3 py-2 text-left transition hover:bg-white/5 ${selectedTrustedToken === tok.address ? "bg-white/5" : ""}`}
                    onClick={() => onSelectTrusted(tok.address)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                        <Image
                          src={tok.iconUrl ?? DEFAULT_TOKEN_ICON}
                          alt={`${tok.symbol ?? tok.label} icon`}
                          width={32}
                          height={32}
                          className="h-8 w-8 object-contain"
                        />
                      </div>
                      <div className="text-left leading-tight w-full">
                        <p className="text-sm font-semibold text-white">
                          {tok.label}
                        </p>
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>{tok.symbol ?? tokenSymbolPlaceholder}</span>
                          <span>{walletBalanceValue}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              <button
                type="button"
                role="option"
                aria-selected={isCustomTokenSelected}
                className={`block w-full cursor-pointer px-3 py-2 text-left transition hover:bg-white/5 ${isCustomTokenSelected ? "bg-white/5" : ""}`}
                onClick={onSelectCustom}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Image
                      src={CUSTOM_TOKEN_ICON}
                      alt="Custom token icon"
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                  <div className="text-left leading-tight">
                    <p className="text-sm font-semibold text-white">
                      {customTokenNameLabel}
                    </p>
                    <p className="text-xs text-white/60">
                      {t("form.tokenPlaceholder")}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
