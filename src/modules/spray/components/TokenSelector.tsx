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
  onOpenChange?: (open: boolean) => void;
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
  onOpenChange,
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
    <div
      ref={dropdownRef}
      className={`relative w-full ${isOpen ? "z-50" : "z-auto"}`}
      id="trusted-token-select"
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="trusted-token-options"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          onOpenChange?.(next);
        }}
        title={tokenCardPrimaryLabel}
        className="flex w-full items-center gap-3 rounded-xl border border-wolf-border bg-wolf-panel px-4 py-2 text-left text-sm text-white/80 transition hover:border-wolf-emerald focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wolf-emerald"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Image
            src={tokenCardIconSrc}
            alt={`${tokenCardSymbol} token icon`}
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
        </div>
        <div className="flex-1 text-left leading-tight">
          <p className="text-[10px] uppercase text-white/50">
            {tokenPayWithLabel}
          </p>
          {isCustomTokenSelected ? (
            <div className="mt-2 space-y-1">
              <input
                id="token-address-input-inline"
                value={tokenAddress}
                onChange={(event) => onTokenAddressChange(event.target.value)}
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
            <p className="text-base font-semibold text-white">
              {tokenCardPrimaryLabel}
            </p>
          )}
        </div>
        <svg
          className={`h-5 w-5 text-white/70 transition ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 0 1 1.08 1.04l-4.25 4.38a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
            fill="currentColor"
          />
        </svg>
      </button>
      {isOpen ? (
        <div
          id="trusted-token-options"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 isolate max-h-[18rem] overflow-y-auto rounded-2xl border border-wolf-border-soft bg-wolf-panel p-2 text-sm text-white/80 shadow-2xl"
        >
          <ul id="trusted-token-options-list" className="space-y-1">
            <li>
              <button
                type="button"
                role="option"
                aria-selected={isNativeTokenSelected}
                onClick={onSelectNative}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${isNativeTokenSelected ? "bg-wolf-emerald-soft text-wolf-emerald" : "text-white/80 hover:bg-white/5"}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Image
                    src={nativeTokenIconSrc}
                    alt={`${nativeSymbol} icon`}
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold">
                    {nativeTokenLabel}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-white/50">
                      {nativeSymbol}
                    </span>
                    <span className="text-[10px] text-white/50">
                      {nativeBalanceDisplay}
                    </span>
                  </div>
                </div>
              </button>
            </li>
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
                <li key={tok.address}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedTrustedToken === tok.address}
                    onClick={() => onSelectTrusted(tok.address)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${selectedTrustedToken === tok.address ? "bg-wolf-emerald-soft text-wolf-emerald" : "text-white/80 hover:bg-white/5"}`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <Image
                        src={tok.iconUrl ?? DEFAULT_TOKEN_ICON}
                        alt={`${tok.symbol ?? tok.label} icon`}
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-semibold">{tok.label}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase text-white/50">
                          {tok.symbol ?? tokenSymbolPlaceholder}
                        </span>
                        <span className="text-[10px] text-white/50">
                          {walletBalanceValue}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                role="option"
                aria-selected={isCustomTokenSelected}
                onClick={onSelectCustom}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${isCustomTokenSelected ? "bg-wolf-emerald-soft text-wolf-emerald" : "text-white/80 hover:bg-white/5"}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Image
                    src={CUSTOM_TOKEN_ICON}
                    alt="Custom token icon"
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    {customTokenNameLabel}
                  </span>
                  <span className="text-[10px] uppercase text-white/50">
                    {t("form.tokenPlaceholder")}
                  </span>
                </div>
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
