"use client";

import { createContext, useContext } from "react";
import { useSprayBalances } from "./hooks/useSprayBalances";
import { useSprayNetwork } from "./hooks/useSprayNetwork";
import { useSprayRecipients } from "./hooks/useSprayRecipients";
import { useSprayTelemetry } from "./hooks/useSprayTelemetry";
import { useSprayToken } from "./hooks/useSprayToken";
import { useSprayTransaction } from "./hooks/useSprayTransaction";
import { useSprayWallet } from "./hooks/useSprayWallet";

export type SprayContextValue = {
  wallet: ReturnType<typeof useSprayWallet>;
  network: ReturnType<typeof useSprayNetwork>;
  token: ReturnType<typeof useSprayToken>;
  balances: ReturnType<typeof useSprayBalances>;
  recipients: ReturnType<typeof useSprayRecipients>;
  transaction: ReturnType<typeof useSprayTransaction>;
  telemetry: ReturnType<typeof useSprayTelemetry>;
};

const SprayContext = createContext<SprayContextValue | null>(null);

export function SprayProvider({ children }: { children: React.ReactNode }) {
  const wallet = useSprayWallet();
  const network = useSprayNetwork(wallet);
  const token = useSprayToken(wallet, network);
  const balances = useSprayBalances(wallet, network);
  const recipients = useSprayRecipients(token.activeTokenDecimals);
  const telemetry = useSprayTelemetry();
  const transaction = useSprayTransaction(
    wallet,
    network,
    token,
    recipients,
    telemetry,
  );

  return (
    <SprayContext.Provider
      value={{
        wallet,
        network,
        token,
        balances,
        recipients,
        transaction,
        telemetry,
      }}
    >
      {children}
    </SprayContext.Provider>
  );
}

export function useSpray(): SprayContextValue {
  const context = useContext(SprayContext);
  if (!context) {
    throw new Error("useSpray must be used within a SprayProvider");
  }
  return context;
}
