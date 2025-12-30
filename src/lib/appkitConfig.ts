import {
  type AppKitNetwork,
  avalanche,
  avalancheFuji,
  base,
  celo,
  optimism,
} from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { http } from "wagmi";

export const appKitProjectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ??
  "b56e18d47c72ab683b10814fe9495694";

export const appKitNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
  celo,
  optimism,
  base,
  avalanche,
  avalancheFuji,
];

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://denlabs.vercel.app";

export const appKitMetadata = {
  name: "Wolf Den",
  description: "Wallet onboarding for Wolf Den",
  url: siteUrl,
  icons: [`${siteUrl}/android-chrome-512x512.png`],
};

// WagmiAdapter - Recommended by Core Extension docs for optimal integration
// https://docs.core.app/developer-guides/core-extension/integrate-core-extension
export const appKitAdapter = new WagmiAdapter({
  networks: appKitNetworks,
  transports: {
    [celo.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [avalanche.id]: http(),
    [avalancheFuji.id]: http(),
  },
  projectId: appKitProjectId,
});
