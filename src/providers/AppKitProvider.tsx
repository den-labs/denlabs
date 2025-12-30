"use client";

import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { type Config, cookieToInitialState, WagmiProvider } from "wagmi";
import {
  appKitAdapter,
  appKitMetadata,
  appKitNetworks,
  appKitProjectId,
} from "@/lib/appkitConfig";

const queryClient = new QueryClient();

const shouldEnableAppKit = Boolean(appKitProjectId);

// Singleton flag to ensure createAppKit is called only once
let appKitInitialized = false;

function initializeAppKit() {
  // Prevent multiple initializations
  if (appKitInitialized) {
    console.log("[AppKit] Already initialized, skipping...");
    return;
  }

  if (!shouldEnableAppKit) {
    console.warn(
      "[AppKit] Reown AppKit project ID is not configured. Wallet connect modal will be disabled.",
    );
    return;
  }

  try {
    createAppKit({
      adapters: [appKitAdapter],
      projectId: appKitProjectId,
      networks: appKitNetworks,
      metadata: appKitMetadata,
      themeMode: "dark",
      features: {
        analytics: false,
        email: false,
        socials: [],
      },
      // Enable EIP-6963 for Core wallet auto-detection
      enableEIP6963: true,
      // Allow testnets and chains not in our explicit list
      allowUnsupportedChain: true,
    });

    appKitInitialized = true;
    console.log("[AppKit] Initialized successfully", {
      projectId: `${appKitProjectId.slice(0, 8)}...`,
      metadata: appKitMetadata,
    });
  } catch (error) {
    console.error("[AppKit] Failed to initialize:", error);
  }
}

// Initialize on module load (only once)
initializeAppKit();

interface AppKitProviderProps {
  children: ReactNode;
  cookies?: string | null;
}

export function AppKitProvider({ children, cookies }: AppKitProviderProps) {
  const initialState = cookieToInitialState(
    appKitAdapter.wagmiConfig as Config,
    cookies ?? "",
  );

  return (
    <WagmiProvider
      config={appKitAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export default AppKitProvider;
