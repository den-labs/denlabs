"use client";

import { useAppKitNetwork } from "@reown/appkit/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SPRAY_NETWORK_KEY,
  SPRAY_NETWORKS,
  type SprayNetworkConfig,
  SUPPORTED_SPRAY_NETWORKS,
} from "@/lib/sprayNetworks";
import {
  APPKIT_NETWORKS_BY_KEY,
  createReadOnlyProvider,
  getEthereum,
} from "../constants";
import type { useSprayWallet } from "./useSprayWallet";

type WalletHandle = ReturnType<typeof useSprayWallet>;

export function useSprayNetwork(wallet: WalletHandle) {
  const { switchNetwork } = useAppKitNetwork();
  const { chainId, signerAddress, openWallet } = wallet;

  const [selectedNetworkKey, setSelectedNetworkKey] = useState(
    DEFAULT_SPRAY_NETWORK_KEY,
  );
  const [hasUserSelectedNetwork, setHasUserSelectedNetwork] = useState(false);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);

  const selectedNetwork = useMemo(
    () =>
      SPRAY_NETWORKS[selectedNetworkKey] ??
      SPRAY_NETWORKS[DEFAULT_SPRAY_NETWORK_KEY],
    [selectedNetworkKey],
  );

  const readOnlyProvider = useMemo(
    () => createReadOnlyProvider(selectedNetwork),
    [selectedNetwork],
  );

  // Auto-detect network from wallet chainId
  useEffect(() => {
    if (!chainId) {
      return;
    }
    const matchedNetwork = SUPPORTED_SPRAY_NETWORKS.find(
      (network) => network.chainId === chainId,
    );
    if (
      matchedNetwork &&
      !hasUserSelectedNetwork &&
      matchedNetwork.key !== selectedNetworkKey
    ) {
      setSelectedNetworkKey(matchedNetwork.key);
    }
  }, [chainId, hasUserSelectedNetwork, selectedNetworkKey]);

  const ensureTargetNetwork = useCallback(
    async (
      targetConfig: SprayNetworkConfig = selectedNetwork,
      _t?: (key: string) => string,
    ) => {
      const ethereum = getEthereum();
      if (!ethereum) {
        return false;
      }

      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetConfig.chainHex }],
        });
        return true;
      } catch (switchError: unknown) {
        const errorWithCode = switchError as { code?: number };
        if (errorWithCode.code === 4902) {
          try {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: targetConfig.chainHex,
                  chainName: targetConfig.name,
                  nativeCurrency: targetConfig.nativeCurrency,
                  rpcUrls: targetConfig.rpcUrls,
                  blockExplorerUrls: targetConfig.explorerUrls,
                },
              ],
            });
            return true;
          } catch {
            return false;
          }
        }
        return false;
      }
    },
    [selectedNetwork],
  );

  const attemptNetworkSwitch = useCallback(
    async (networkKey: string) => {
      const targetConfig =
        SPRAY_NETWORKS[networkKey] ?? SPRAY_NETWORKS[DEFAULT_SPRAY_NETWORK_KEY];
      const targetAppKitNetwork = APPKIT_NETWORKS_BY_KEY[networkKey];

      if (targetAppKitNetwork) {
        try {
          await switchNetwork(targetAppKitNetwork);
        } catch (appKitSwitchError) {
          console.warn("AppKit network switch failed", appKitSwitchError);
        }
      }

      const hasInjectedProvider = Boolean(getEthereum());
      if (hasInjectedProvider) {
        const switched = await ensureTargetNetwork(targetConfig);
        if (switched) {
          return;
        }
      }

      openWallet("Networks");
    },
    [ensureTargetNetwork, openWallet, switchNetwork],
  );

  const selectNetwork = useCallback(
    (networkKey: string) => {
      setSelectedNetworkKey(networkKey);
      setHasUserSelectedNetwork(true);
      setIsNetworkDropdownOpen(false);
      attemptNetworkSwitch(networkKey).catch((switchError) => {
        console.warn("Automatic network switch failed", switchError);
      });
    },
    [attemptNetworkSwitch],
  );

  return {
    selectedNetwork,
    selectedNetworkKey,
    selectNetwork,
    isNetworkDropdownOpen,
    setIsNetworkDropdownOpen,
    readOnlyProvider,
    ensureTargetNetwork,
    isTargetNetworkReady:
      signerAddress != null && chainId === selectedNetwork.chainId,
  };
}
