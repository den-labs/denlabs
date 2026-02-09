"use client";

import { Contract } from "ethers";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { validateAddress } from "@/lib/addressValidation";
import {
  CUSTOM_TOKEN_ICON,
  DEFAULT_TOKEN_ICON,
  ERC20_ABI,
  NATIVE_TOKEN_ICONS,
  NATIVE_TOKEN_KEY,
} from "../constants";
import type { useSprayNetwork } from "./useSprayNetwork";
import type { useSprayWallet } from "./useSprayWallet";

type WalletHandle = ReturnType<typeof useSprayWallet>;
type NetworkHandle = ReturnType<typeof useSprayNetwork>;

export function useSprayToken(wallet: WalletHandle, network: NetworkHandle) {
  const t = useTranslations("SprayDisperser");
  const { provider } = wallet;
  const { selectedNetwork, readOnlyProvider, selectedNetworkKey } = network;

  const [mode, setMode] = useState<"native" | "token">("native");
  const [tokenAddress, setTokenAddress] = useState("");
  const [selectedTrustedToken, setSelectedTrustedToken] =
    useState<string>(NATIVE_TOKEN_KEY);
  const [isTrustedOpen, setIsTrustedOpen] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{
    symbol: string;
    decimals: number;
  } | null>(null);
  const [isFetchingTokenInfo, setIsFetchingTokenInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trustedTokens = useMemo(
    () => selectedNetwork.trustedTokens ?? [],
    [selectedNetwork],
  );

  const isNativeTokenSelected = selectedTrustedToken === NATIVE_TOKEN_KEY;
  const isCustomTokenSelected = selectedTrustedToken === "";

  const selectedTrustedTokenData =
    selectedTrustedToken &&
    selectedTrustedToken !== NATIVE_TOKEN_KEY &&
    selectedTrustedToken !== ""
      ? trustedTokens.find((token) => token.address === selectedTrustedToken)
      : null;

  const activeTokenDecimals =
    mode === "native"
      ? (selectedNetwork.nativeCurrency.decimals ?? 18)
      : (tokenInfo?.decimals ?? 18);

  const tokenCardSymbol = isNativeTokenSelected
    ? selectedNetwork.nativeCurrency.symbol
    : (selectedTrustedTokenData?.symbol ??
      tokenInfo?.symbol ??
      t("summary.tokenPlaceholder"));

  const nativeTokenIconSrc =
    NATIVE_TOKEN_ICONS[selectedNetworkKey] ?? DEFAULT_TOKEN_ICON;

  const tokenCardIconSrc = isNativeTokenSelected
    ? nativeTokenIconSrc
    : isCustomTokenSelected
      ? CUSTOM_TOKEN_ICON
      : (selectedTrustedTokenData?.iconUrl ?? DEFAULT_TOKEN_ICON);

  // Fetch token info for custom address
  useEffect(() => {
    if (mode !== "token") {
      setTokenInfo(null);
      setIsFetchingTokenInfo(false);
      return;
    }

    const normalized = tokenAddress.trim();
    const validation = validateAddress(normalized);
    if (!validation.valid) {
      setTokenInfo(null);
      setIsFetchingTokenInfo(false);
      if (validation.error) {
        console.warn(validation.error);
      }
      return;
    }

    const normalizedAddress = normalized.toLowerCase();
    const trustedMetadata = trustedTokens.find(
      (token) =>
        token.address.toLowerCase() === normalizedAddress &&
        typeof token.decimals === "number",
    );

    if (trustedMetadata) {
      const trustedDecimals =
        typeof trustedMetadata.decimals === "number"
          ? trustedMetadata.decimals
          : 18;
      setTokenInfo({
        symbol: trustedMetadata.symbol ?? t("summary.tokenPlaceholder"),
        decimals: trustedDecimals,
      });
      setIsFetchingTokenInfo(false);
      setError(null);
      return;
    }

    const contractRunner = provider ?? readOnlyProvider;
    if (!contractRunner) {
      setTokenInfo(null);
      setIsFetchingTokenInfo(false);
      return;
    }

    let isCancelled = false;

    async function fetchTokenDetails() {
      setIsFetchingTokenInfo(true);
      setError(null);
      try {
        const erc20 = new Contract(normalized, ERC20_ABI, contractRunner);
        const [symbol, decimals] = await Promise.all([
          erc20.symbol(),
          erc20.decimals(),
        ]);
        if (!isCancelled) {
          setTokenInfo({ symbol, decimals: Number(decimals) });
        }
      } catch {
        if (!isCancelled) {
          setTokenInfo(null);
          setError(t("errors.tokenLookupFailed"));
        }
      } finally {
        if (!isCancelled) {
          setIsFetchingTokenInfo(false);
        }
      }
    }

    fetchTokenDetails();

    return () => {
      isCancelled = true;
    };
  }, [provider, readOnlyProvider, tokenAddress, mode, trustedTokens, t]);

  // Sync token address when trusted token selected
  useEffect(() => {
    if (!selectedTrustedToken || selectedTrustedToken === NATIVE_TOKEN_KEY) {
      return;
    }
    const found = trustedTokens.find(
      (token) => token.address === selectedTrustedToken,
    );
    if (found) {
      setTokenAddress(found.address);
    }
  }, [selectedTrustedToken, trustedTokens]);

  // Reset token if network changes and current trusted token is gone
  useEffect(() => {
    if (!trustedTokens.length) {
      if (
        selectedTrustedToken !== "" &&
        selectedTrustedToken !== NATIVE_TOKEN_KEY
      ) {
        setSelectedTrustedToken("");
        setTokenAddress("");
      }
      return;
    }
    if (
      selectedTrustedToken === "" ||
      selectedTrustedToken === NATIVE_TOKEN_KEY
    ) {
      return;
    }
    const stillAvailable = trustedTokens.some(
      (token) => token.address === selectedTrustedToken,
    );
    if (!stillAvailable) {
      const fallbackAddress = trustedTokens[0].address;
      setSelectedTrustedToken(fallbackAddress);
      setTokenAddress(fallbackAddress);
    }
  }, [selectedTrustedToken, trustedTokens]);

  const handleSelectNativeToken = () => {
    setMode("native");
    setSelectedTrustedToken(NATIVE_TOKEN_KEY);
    setTokenAddress("");
    setTokenInfo(null);
    setIsTrustedOpen(false);
  };

  const handleSelectCustomToken = () => {
    setMode("token");
    setSelectedTrustedToken("");
    setTokenAddress("");
    setTokenInfo(null);
    setIsTrustedOpen(false);
  };

  const handleSelectTrustedToken = (tokenAddressValue: string) => {
    setMode("token");
    setSelectedTrustedToken(tokenAddressValue);
    setTokenAddress(tokenAddressValue);
    setTokenInfo(null);
    setIsTrustedOpen(false);
  };

  return {
    mode,
    tokenAddress,
    setTokenAddress,
    selectedTrustedToken,
    isTrustedOpen,
    setIsTrustedOpen,
    tokenInfo,
    isFetchingTokenInfo,
    activeTokenDecimals,
    trustedTokens,
    isNativeTokenSelected,
    isCustomTokenSelected,
    selectedTrustedTokenData,
    tokenCardSymbol,
    tokenCardIconSrc,
    nativeTokenIconSrc,
    error,
    setError,
    handleSelectNativeToken,
    handleSelectCustomToken,
    handleSelectTrustedToken,
  };
}
