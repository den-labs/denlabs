import { celo } from "@reown/appkit/networks";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";

type CeloNetwork = typeof celo;

export const appKitProjectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ??
  "b56e18d47c72ab683b10814fe9495694";

export const appKitNetworks = [celo] satisfies [CeloNetwork, ...CeloNetwork[]];

export const appKitMetadata = {
  name: "Wolf Den",
  description: "Wallet onboarding for Wolf Den",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://wolfden.xyz",
  icons: ["https://wolfden.xyz/android-chrome-512x512.png"],
};

export const appKitAdapter = new EthersAdapter();
