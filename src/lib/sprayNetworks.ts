const DEFAULT_TOKEN_ICON = "/tokens-usdc.png";
const CELO_DOLLAR_ICON = "/tokens-celodollar.png";
const CELO_CCOP_ICON = "/tokens-ccop.png";
const CELO_GOOD_ICON = "/tokens-gooddollar.png";
const OPTIMISM_OP_ICON = "/tokens-op.png";
const WCT_ICON = "https://basescan.org/token/images/WCT_64.png";

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
  trustedTokens?: Array<{
    label: string;
    address: string;
    symbol?: string;
    iconUrl?: string;
    decimals?: number;
  }>;
};

export const SPRAY_NETWORKS: Record<string, SprayNetworkConfig> = {
  ethereum: {
    key: "ethereum",
    name: "Ethereum",
    chainId: 1,
    chainHex: "0x1",
    sprayAddress: "0xB9Acfe176fae237915C865AF3444fAfF3aD24064",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://eth.llamarpc.com", "https://rpc.ankr.com/eth"],
    explorerUrls: ["https://etherscan.io"],
    trustedTokens: [
      {
        label: "USD Coin (USDC)",
        symbol: "USDC",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        iconUrl: DEFAULT_TOKEN_ICON,
        decimals: 6,
      },
      {
        label: "Tether USD (USDT)",
        symbol: "USDT",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        iconUrl: DEFAULT_TOKEN_ICON,
        decimals: 6,
      },
      {
        label: "Dai Stablecoin (DAI)",
        symbol: "DAI",
        address: "0x6B175474E89094C44Da98b954EedeC8E5BE3830",
        iconUrl: DEFAULT_TOKEN_ICON,
        decimals: 18,
      },
    ],
  },
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
        symbol: "cCOP",
        address: "0x8A567e2aE79CA692Bd748aB832081C45de4041eA",
        iconUrl: CELO_CCOP_ICON,
        decimals: 18,
      },
      {
        label: "Celo Dollar (cUSD)",
        symbol: "cUSD",
        address: "0x765DE816845861E75A25fCA122bb6898B8B1282a",
        iconUrl: CELO_DOLLAR_ICON,
        decimals: 18,
      },
      {
        label: "Celo Euro (cEUR)",
        symbol: "cEUR",
        address: "0xd8763CBa276a3738e6DE85b4B3BF5Fded6d6CA73",
        iconUrl: CELO_DOLLAR_ICON,
        decimals: 18,
      },
      {
        label: "Celo Brazilian Real (cREAL)",
        symbol: "cREAL",
        address: "0xE8537A3d056DA446677B9E9d6C5dB704EaAb4787",
        iconUrl: CELO_DOLLAR_ICON,
        decimals: 18,
      },
      {
        label: "GoodDollar (G$)",
        symbol: "G$",
        address: "0x62b8b11039FCfE5ab0C56E502B1c372A3D2a9C7a",
        iconUrl: CELO_GOOD_ICON,
        decimals: 2,
      },
      {
        label: "USD Coin (USDC)",
        symbol: "USDC",
        address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
        iconUrl: DEFAULT_TOKEN_ICON,
        decimals: 6,
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
        symbol: "USDC",
        address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        iconUrl: DEFAULT_TOKEN_ICON,
        decimals: 6,
      },
      {
        label: "Optimism (OP)",
        symbol: "OP",
        address: "0x4200000000000000000000000000000000000042",
        iconUrl: OPTIMISM_OP_ICON,
        decimals: 18,
      },
      {
        label: "WalletConnect (WCT)",
        symbol: "WCT",
        address: "0xeF4461891DfB3AC8572cCf7C794664A8DD927945",
        iconUrl: WCT_ICON,
        decimals: 18,
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
        symbol: "USDC",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        iconUrl: DEFAULT_TOKEN_ICON,
        decimals: 6,
      },
      {
        label: "WalletConnect (WCT)",
        symbol: "WCT",
        address: "0xeF4461891DfB3AC8572cCf7C794664A8DD927945",
        iconUrl: WCT_ICON,
        decimals: 18,
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
        symbol: "USDC",
        address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        iconUrl: DEFAULT_TOKEN_ICON,
        decimals: 6,
      },
    ],
  },
  avalancheFuji: {
    key: "avalancheFuji",
    name: "Avalanche Fuji Testnet",
    chainId: 43113,
    chainHex: "0xa869",
    sprayAddress: "0xe62c875ba6609E27c088F697dA16D47519b6B118",
    nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
    },
    rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
    explorerUrls: ["https://testnet.snowtrace.io"],
    trustedTokens: [
      {
        label: "USD Coin (USDC)",
        symbol: "USDC",
        address: "0x5425890298aed601595a70AB815c96711a31Bc65",
        iconUrl: DEFAULT_TOKEN_ICON,
        decimals: 6,
      },
    ],
  },
};

export const DEFAULT_SPRAY_NETWORK_KEY = "celo";

export const SUPPORTED_SPRAY_NETWORKS = Object.values(SPRAY_NETWORKS);
