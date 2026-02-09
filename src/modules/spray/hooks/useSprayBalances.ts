"use client";

import { Contract, formatUnits } from "ethers";
import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { DEFAULT_SPRAY_NETWORK_KEY, SPRAY_NETWORKS } from "@/lib/sprayNetworks";
import { ERC20_ABI, formatTokenBalanceDisplay } from "../constants";
import type { useSprayNetwork } from "./useSprayNetwork";
import type { useSprayWallet } from "./useSprayWallet";

type WalletHandle = ReturnType<typeof useSprayWallet>;
type NetworkHandle = ReturnType<typeof useSprayNetwork>;

const BALANCE_CACHE_TTL_MS = 30_000;

export function useSprayBalances(wallet: WalletHandle, network: NetworkHandle) {
  const { signerAddress } = wallet;
  const { selectedNetworkKey, readOnlyProvider } = network;

  const [trustedTokenBalances, setTrustedTokenBalances] = useState<
    Record<string, string | null>
  >({});
  const [nativeBalance, setNativeBalance] = useState<string | null>(null);

  const debouncedSignerAddress = useDebouncedValue(signerAddress, 500);

  const balanceCacheRef = useRef<{
    key: string;
    timestamp: number;
    native: string | null;
    tokens: Record<string, string | null>;
  } | null>(null);
  const fetchInProgressRef = useRef<string | null>(null);

  useEffect(() => {
    const networkKey = selectedNetworkKey;
    const networkConfig =
      SPRAY_NETWORKS[networkKey] ?? SPRAY_NETWORKS[DEFAULT_SPRAY_NETWORK_KEY];
    const tokens = networkConfig.trustedTokens ?? [];
    const cacheKey = `${networkKey}:${debouncedSignerAddress}`;

    if (!debouncedSignerAddress) {
      setNativeBalance(null);
      setTrustedTokenBalances({});
      return;
    }

    const balanceProvider = readOnlyProvider;
    if (!balanceProvider) {
      setNativeBalance(null);
      setTrustedTokenBalances({});
      return;
    }

    const cached = balanceCacheRef.current;
    const now = Date.now();
    if (cached && cached.key === cacheKey) {
      const age = now - cached.timestamp;
      if (age < BALANCE_CACHE_TTL_MS) {
        setNativeBalance(cached.native);
        setTrustedTokenBalances(cached.tokens);
        return;
      }
    }

    if (fetchInProgressRef.current === cacheKey) {
      return;
    }

    if (!cached || cached.key !== cacheKey) {
      setNativeBalance(null);
      setTrustedTokenBalances({});
    }

    fetchInProgressRef.current = cacheKey;
    let isCancelled = false;

    async function fetchAllBalances() {
      if (!balanceProvider || !debouncedSignerAddress) return;

      console.log("[Balances] Fetching", { network: networkKey });

      try {
        let nativeFormatted: string | null = null;
        try {
          const nativeBal = await balanceProvider.getBalance(
            debouncedSignerAddress,
          );
          const decimals = networkConfig.nativeCurrency.decimals ?? 18;
          nativeFormatted = formatTokenBalanceDisplay(
            formatUnits(nativeBal, decimals),
          );
        } catch (e) {
          console.warn("[Balances] Native balance error", e);
          nativeFormatted = "0";
        }

        const tokenEntries = await Promise.all(
          tokens.map(async (token) => {
            try {
              const erc20 = new Contract(
                token.address,
                ERC20_ABI,
                balanceProvider,
              );
              const decimalsValue =
                typeof token.decimals === "number"
                  ? token.decimals
                  : await erc20.decimals();
              const balance = await erc20.balanceOf(debouncedSignerAddress);
              return [
                token.address.toLowerCase(),
                formatTokenBalanceDisplay(formatUnits(balance, decimalsValue)),
              ];
            } catch {
              return [token.address.toLowerCase(), null];
            }
          }),
        );

        if (isCancelled) return;

        const tokenBalances = Object.fromEntries(tokenEntries);

        balanceCacheRef.current = {
          key: cacheKey,
          timestamp: Date.now(),
          native: nativeFormatted,
          tokens: tokenBalances,
        };

        setNativeBalance(nativeFormatted);
        setTrustedTokenBalances(tokenBalances);

        console.log("[Balances] Complete", {
          network: networkKey,
          tokens: Object.keys(tokenBalances).length,
        });
      } catch (error) {
        console.warn("[Balances] Fetch error", error);
        if (!isCancelled) {
          setNativeBalance("0");
          setTrustedTokenBalances({});
        }
      } finally {
        if (fetchInProgressRef.current === cacheKey) {
          fetchInProgressRef.current = null;
        }
      }
    }

    fetchAllBalances();

    return () => {
      isCancelled = true;
    };
  }, [readOnlyProvider, debouncedSignerAddress, selectedNetworkKey]);

  return {
    nativeBalance,
    trustedTokenBalances,
  };
}
