"use client";

import { createAppKit } from "@reown/appkit/react";
import type { ReactNode } from "react";
import {
  appKitAdapter,
  appKitMetadata,
  appKitNetworks,
  appKitProjectId,
} from "@/lib/appkitConfig";

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
      allowUnsupportedChain: false,
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

export function AppKitProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default AppKitProvider;
