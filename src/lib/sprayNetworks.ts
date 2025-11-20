export type SprayNetworkConfig = {
  key: string;
  name: string;
  chainId: number;
  chainHex: string;
  sprayAddress: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  explorerUrls: string[];
  trustedTokens?: Array<{ label: string; address: string }>;
};

export const SPRAY_NETWORKS: Record<string, SprayNetworkConfig> = {
  celo: {
    key: "celo",
    name: "Celo",
    chainId: 42220,
    chainHex: "0xa4ec",
    sprayAddress: "0x062ad0B066bCfA6ce26C7EaD528363f7ff6483fe",
    nativeCurrency: {
      name: "Celo",
      symbol: "CELO",
      decimals: 18,
    },
    rpcUrls: ["https://forno.celo.org"],
    explorerUrls: ["https://celoscan.io"],
    trustedTokens: [
      {
        label: "Celo Colombian Peso (cCOP)",
        address: "0x8A567e2aE79CA692Bd748aB832081C45de4041eA",
      },
    ],
  },
  optimism: {
    key: "optimism",
    name: "Optimism",
    chainId: 10,
    chainHex: "0xa",
    sprayAddress: "0xe62c875ba6609E27c088F697dA16D47519b6B118",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://mainnet.optimism.io"],
    explorerUrls: ["https://optimistic.etherscan.io"],
  },
  base: {
    key: "base",
    name: "Base",
    chainId: 8453,
    chainHex: "0x2105",
    sprayAddress: "0x8C6c4Eaf07B5888629f8C5562a61fC79638c40e7",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://mainnet.base.org"],
    explorerUrls: ["https://basescan.org"],
  },
  avalanche: {
    key: "avalanche",
    name: "Avalanche",
    chainId: 43114,
    chainHex: "0xa86a",
    sprayAddress: "0xe62c875ba6609E27c088F697dA16D47519b6B118",
    nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
    },
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    explorerUrls: ["https://snowtrace.io"],
  },
};

export const DEFAULT_SPRAY_NETWORK_KEY = "celo";

export const SUPPORTED_SPRAY_NETWORKS = Object.values(SPRAY_NETWORKS);
