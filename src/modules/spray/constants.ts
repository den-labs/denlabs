import {
  type AppKitNetwork,
  avalancheFuji as avalancheFujiNetwork,
  avalanche as avalancheNetwork,
  base as baseNetwork,
  celo as celoNetwork,
  mainnet as ethereumNetwork,
  optimism as optimismNetwork,
} from "@reown/appkit/networks";
import { JsonRpcProvider, parseUnits } from "ethers";
import {
  type AmountMode,
  isValidAmount,
  type RecipientRowInput,
} from "@/lib/recipients";
import {
  DEFAULT_SPRAY_NETWORK_KEY,
  SPRAY_NETWORKS,
  type SprayNetworkConfig,
} from "@/lib/sprayNetworks";
import type { EthereumProvider } from "./types";

export const SPRAY_ABI = [
  "function disperseNative(address[] _recipients, uint256[] _amounts) payable",
  "function disperseToken(address tokenAddress, address[] _recipients, uint256[] _amounts)",
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

export const APPKIT_NETWORKS_BY_KEY: Partial<Record<string, AppKitNetwork>> = {
  ethereum: ethereumNetwork,
  celo: celoNetwork,
  optimism: optimismNetwork,
  base: baseNetwork,
  avalanche: avalancheNetwork,
  avalancheFuji: avalancheFujiNetwork,
};

export const DEFAULT_TOKEN_ICON = "/tokens-usdc.png";
export const CUSTOM_TOKEN_ICON = "/tokens-custom.png";
export const NATIVE_TOKEN_KEY = "__native__";
export const BATCH_SIZE = 200;

export const NATIVE_TOKEN_ICONS: Record<string, string> = {
  ethereum: "/tokens-eth.png",
  celo: "/tokens-celo.png",
  optimism: "/tokens-optimism.png",
  base: "/tokens-base.png",
  avalanche: "/tokens-avax.png",
};

export function normalizeChainId(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.length > 0) {
    if (value.startsWith("eip155:")) {
      const [, raw] = value.split(":");
      const parsed = Number.parseInt(raw ?? "", 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
    if (value.startsWith("0x")) {
      const parsed = Number.parseInt(value, 16);
      return Number.isNaN(parsed) ? null : parsed;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function formatHash(hash: string) {
  if (hash.length <= 10) {
    return hash;
  }
  return `${hash.slice(0, 6)}...${hash.slice(-5)}`;
}

export function formatTokenBalanceDisplay(value: string) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }
  if (parsed === 0) {
    return "0";
  }
  if (parsed >= 1) {
    return parsed.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  return parsed.toPrecision(3);
}

export function getExplorerTxUrl(networkKey: string, txHash: string) {
  const explorerBase =
    SPRAY_NETWORKS[networkKey]?.explorerUrls?.[0] ??
    SPRAY_NETWORKS[DEFAULT_SPRAY_NETWORK_KEY]?.explorerUrls?.[0];
  if (!explorerBase) {
    return null;
  }
  const trimmedBase = explorerBase.endsWith("/")
    ? explorerBase.slice(0, -1)
    : explorerBase;
  return `${trimmedBase}/tx/${txHash}`;
}

export function isSuccessfulReceiptStatus(status: unknown) {
  if (status == null) {
    return true;
  }
  if (typeof status === "bigint") {
    return status === BigInt(1);
  }
  if (typeof status === "number") {
    return status === 1;
  }
  if (typeof status === "string") {
    return status === "0x1" || status === "1";
  }
  return false;
}

export function createReadOnlyProvider(config?: SprayNetworkConfig | null) {
  if (!config?.rpcUrls?.length) {
    return null;
  }
  try {
    return new JsonRpcProvider(config.rpcUrls[0], {
      chainId: config.chainId,
      name: config.name,
    });
  } catch (providerError) {
    console.warn("Failed to create read-only provider", providerError);
    return null;
  }
}

export function buildTokenAmounts(
  decimals: number,
  sourceRows: RecipientRowInput[],
  modeForAmounts: AmountMode,
  globalValue: string,
) {
  try {
    if (modeForAmounts === "same") {
      const validation = isValidAmount(globalValue, decimals);
      if (!validation.valid) {
        return null;
      }
      const parsed = parseUnits(validation.normalized, decimals);
      const amounts = sourceRows.map(() => parsed);
      const total = parsed * BigInt(sourceRows.length);
      return { amounts, total };
    }
    const amounts = sourceRows.map((row) =>
      parseUnits((row.amount ?? "").trim(), decimals),
    );
    const total = amounts.reduce((acc, value) => acc + value, BigInt(0));
    return { amounts, total };
  } catch {
    return null;
  }
}

export function createRow(): RecipientRowInput {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    address: "",
    amount: "",
  };
}

export function getEthereum(): EthereumProvider | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const { ethereum } = window as typeof window & {
    ethereum?: EthereumProvider;
  };
  return ethereum;
}
