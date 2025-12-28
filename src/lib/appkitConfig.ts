import {
  type AppKitNetwork,
  avalanche,
  base,
  celo,
  optimism,
} from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { cookieStorage, createStorage } from "wagmi";
import { avalanche as avalancheChain, base as baseChain, celo as celoChain, optimism as optimismChain } from "wagmi/chains";

export const appKitProjectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ??
  "b56e18d47c72ab683b10814fe9495694";

export const appKitNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
  celo,
  optimism,
  base,
  avalanche,
];

export const appKitMetadata = {
  name: "Wolf Den",
  description: "Wallet onboarding for Wolf Den",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://wolfden.xyz",
  icons: ["https://wolfden.xyz/android-chrome-512x512.png"],
};

export const wagmiConfig = {
  chains: [celoChain, optimismChain, baseChain, avalancheChain] as const,
  projectId: appKitProjectId,
  metadata: appKitMetadata,
  networks: appKitNetworks,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
};

export const appKitAdapter = new WagmiAdapter(wagmiConfig);
