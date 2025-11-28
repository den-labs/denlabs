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
        label: "USD Coin (USDC)",
        address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
      },
      {
        label: "Celo Colombian Peso (cCOP)",
        address: "0x8A567e2aE79CA692Bd748aB832081C45de4041eA",
      },
      {
        label: "GoodDollar (G$)",
        address: "0x62b8b11039FCfE5ab0C56E502B1c372A3D2a9C7a",
      },
      {
        label: "USD Coin (USDC)",
        address: "0xceba9300F2b948710D2653dD7B07f33A8B32118c",
      },
      {
        label: "Celo Dollar (cUSD)",
        address: "0x765DE816845861E75A25fCA122bb6898B8B1282a",
      },
      {
        label: "Celo Euro (cEUR)",
        address: "0xd8763CBa276a3738e6DE85b4B3BF5Fded6d6CA73",
      },
      {
        label: "Celo Brazilian Real (cREAL)",
        address: "0xE8537A3d056DA446677B9E9d6C5dB704EaAb4787",
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
    trustedTokens: [
      {
        label: "USD Coin (USDC)",
        address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      },
    ],
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
    trustedTokens: [
      {
        label: "USD Coin (USDC)",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      },
    ],
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
    trustedTokens: [
      {
        label: "USD Coin (USDC)",
        address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
      },
    ],
  },
};

export const DEFAULT_SPRAY_NETWORK_KEY = "celo";

export const SUPPORTED_SPRAY_NETWORKS = Object.values(SPRAY_NETWORKS);
