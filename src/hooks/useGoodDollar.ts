import { EngagementRewardsSDK } from "@goodsdks/engagement-sdk";
import { useAppKitProvider } from "@reown/appkit/react";
import { useCallback } from "react";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { celo } from "viem/chains";

const REWARDS_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_GD_REWARDS_CONTRACT ||
  "") as `0x${string}`;
const APP_ADDRESS = (process.env.NEXT_PUBLIC_GD_APP_ADDRESS ||
  "") as `0x${string}`;

export const useGoodDollar = () => {
  const { walletProvider } = useAppKitProvider("eip155");

  const initSDK = useCallback(async () => {
    if (!walletProvider) {
      throw new Error("No wallet provider available");
    }

    const publicClient = createPublicClient({
      chain: celo,
      transport: http(),
    });

    const walletClient = createWalletClient({
      chain: celo,
      transport: custom(walletProvider as any),
    });

    const rewards = new EngagementRewardsSDK(
      publicClient as any,
      walletClient as any,
      REWARDS_CONTRACT_ADDRESS,
    );

    return rewards;
  }, [walletProvider]);

  return {
    initSDK,
    appAddress: APP_ADDRESS,
  };
};
