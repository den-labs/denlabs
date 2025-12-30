"use client";

import {
  type AppKitNetwork,
  avalanche as avalancheNetwork,
  base as baseNetwork,
  celo as celoNetwork,
  optimism as optimismNetwork,
} from "@reown/appkit/networks";
import {
  useAppKit,
  useAppKitNetwork,
  useAppKitProvider,
} from "@reown/appkit/react";
import {
  BrowserProvider,
  Contract,
  type Eip1193Provider,
  formatEther,
  formatUnits,
  isAddress,
  JsonRpcProvider,
  parseEther,
  parseUnits,
} from "ethers";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { DenMain, DenRightRail } from "@/components/den/RailSlots";
import { useDenUser } from "@/hooks/useDenUser";
import { isENSName, validateAddress } from "@/lib/addressValidation";
import {
  DEFAULT_SPRAY_NETWORK_KEY,
  SPRAY_NETWORKS,
  type SprayNetworkConfig,
  SUPPORTED_SPRAY_NETWORKS,
} from "@/lib/sprayNetworks";

const SPRAY_ABI = [
  "function disperseNative(address[] _recipients, uint256[] _amounts) payable",
  "function disperseToken(address tokenAddress, address[] _recipients, uint256[] _amounts)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

type RecipientRow = {
  id: string;
  address: string;
  amount: string;
};

type TransactionRecord = {
  id: string;
  type: "native" | "token";
  hash: string;
  status: "pending" | "success" | "error";
  timestamp: string;
  recipients: number;
  totalFormatted: string;
  tokenSymbol: string;
  networkKey: string;
  sequence: number;
  errorMessage?: string;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void,
  ) => void;
};

function getEthereum(): EthereumProvider | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const { ethereum } = window as typeof window & {
    ethereum?: EthereumProvider;
  };
  return ethereum;
}

function createRow(): RecipientRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    address: "",
    amount: "",
  };
}

function _formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatHash(hash: string) {
  if (hash.length <= 10) {
    return hash;
  }
  return `${hash.slice(0, 6)}...${hash.slice(-5)}`;
}

function formatTokenBalanceDisplay(value: string) {
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

function getExplorerTxUrl(networkKey: string, txHash: string) {
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

function isSuccessfulReceiptStatus(status: unknown) {
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

function createReadOnlyProvider(config?: SprayNetworkConfig | null) {
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

const APPKIT_NETWORKS_BY_KEY: Partial<Record<string, AppKitNetwork>> = {
  celo: celoNetwork,
  optimism: optimismNetwork,
  base: baseNetwork,
  avalanche: avalancheNetwork,
};
const DEFAULT_TOKEN_ICON = "/tokens-usdc.png";
const CUSTOM_TOKEN_ICON = "/tokens-custom.png";
const NATIVE_TOKEN_KEY = "__native__";
const NATIVE_TOKEN_ICONS: Record<string, string> = {
  celo: "/tokens-celo.png",
  optimism: "/tokens-optimism.png",
  base: "/tokens-base.png",
  avalanche: "/tokens-avax.png",
};

function normalizeChainId(value: unknown): number | null {
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

export default function SprayDisperser() {
  const t = useTranslations("SprayDisperser");
  const locale = useLocale();
  const { open } = useAppKit();
  const { switchNetwork, chainId: appKitChainId } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>("eip155");
  const { walletAddress } = useDenUser();
  const translate = (
    key: string,
    fallback: string,
    values?: Record<string, string | number>,
  ) => {
    try {
      const translated = values ? t(key, values) : t(key);
      if (typeof translated === "string" && translated === key) {
        return fallback;
      }
      return translated;
    } catch {
      return fallback;
    }
  };
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [selectedNetworkKey, setSelectedNetworkKey] = useState(
    DEFAULT_SPRAY_NETWORK_KEY,
  );
  const [hasUserSelectedNetwork, setHasUserSelectedNetwork] = useState(false);
  const [signerAddress, setSignerAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [mode, setMode] = useState<"native" | "token">("native");
  const [tokenAddress, setTokenAddress] = useState("");
  const [selectedTrustedToken, setSelectedTrustedToken] =
    useState<string>(NATIVE_TOKEN_KEY);
  const [isTrustedOpen, setIsTrustedOpen] = useState(false);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const trustedDropdownRef = useRef<HTMLDivElement | null>(null);
  const networkDropdownRef = useRef<HTMLDivElement | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{
    symbol: string;
    decimals: number;
  } | null>(null);
  const [isFetchingTokenInfo, setIsFetchingTokenInfo] = useState(false);
  const [trustedTokenBalances, setTrustedTokenBalances] = useState<
    Record<string, string | null>
  >({});
  const [nativeBalance, setNativeBalance] = useState<string | null>(null);
  // Use a deterministic initial row to avoid SSR/CSR mismatch from Math.random/Date.now()
  const [rows, setRows] = useState<RecipientRow[]>([
    { id: "initial", address: "", amount: "" },
  ]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const spraySequenceRef = useRef(0);
  const selectedNetwork =
    SPRAY_NETWORKS[selectedNetworkKey] ??
    SPRAY_NETWORKS[DEFAULT_SPRAY_NETWORK_KEY];
  const trustedTokens = selectedNetwork.trustedTokens ?? [];
  const sprayAddress = selectedNetwork.sprayAddress;
  const selectedTrustedTokenData =
    selectedTrustedToken &&
    selectedTrustedToken !== NATIVE_TOKEN_KEY &&
    selectedTrustedToken !== ""
      ? trustedTokens.find((token) => token.address === selectedTrustedToken)
      : null;
  const isNativeTokenSelected = selectedTrustedToken === NATIVE_TOKEN_KEY;
  const isCustomTokenSelected = selectedTrustedToken === "";
  const nativeTokenLabel = `${selectedNetwork.nativeCurrency.name} (${selectedNetwork.nativeCurrency.symbol})`;
  const tokenCardSymbol = isNativeTokenSelected
    ? selectedNetwork.nativeCurrency.symbol
    : (selectedTrustedTokenData?.symbol ??
      tokenInfo?.symbol ??
      t("summary.tokenPlaceholder"));
  const nativeTokenIconSrc =
    NATIVE_TOKEN_ICONS[selectedNetworkKey] ?? DEFAULT_TOKEN_ICON;
  const tokenCardIconSrc = isNativeTokenSelected
    ? nativeTokenIconSrc
    : isCustomTokenSelected
      ? CUSTOM_TOKEN_ICON
      : (selectedTrustedTokenData?.iconUrl ?? DEFAULT_TOKEN_ICON);
  const customTokenNameLabel = `${translate(
    "form.customTokenLabel",
    "Custom token",
  )} (${translate("summary.tokenPlaceholder", "TOKEN")})`;
  const tokenCardPrimaryLabel = isNativeTokenSelected
    ? nativeTokenLabel
    : isCustomTokenSelected
      ? tokenAddress || t("form.tokenPlaceholder")
      : (selectedTrustedTokenData?.label ??
        (tokenInfo?.symbol
          ? `${tokenInfo.symbol} (${tokenInfo.symbol})`
          : customTokenNameLabel));
  const tokenPayWithLabel = translate("form.payWithLabel", "Pay with");
  const networkSelectorLabel = translate(
    "network.selectorLabel",
    "Choose a network",
  );
  const walletBalanceConnectHint = translate(
    "summary.walletBalanceConnect",
    "Connect wallet to view balance",
  );
  const walletBalanceLoadingLabel = translate(
    "summary.walletBalanceLoading",
    "Fetching balance…",
  );
  const tokenSymbolPlaceholder = translate("summary.tokenPlaceholder", "TOKEN");
  const selectedNetworkBadgeIcon =
    NATIVE_TOKEN_ICONS[selectedNetworkKey] ?? DEFAULT_TOKEN_ICON;
  const nativeBalanceDisplay = signerAddress
    ? (nativeBalance ?? walletBalanceLoadingLabel)
    : walletBalanceConnectHint;
  const readOnlyProvider = useMemo(
    () => createReadOnlyProvider(selectedNetwork),
    [selectedNetwork],
  );

  useEffect(() => {
    setSignerAddress(walletAddress ?? null);
  }, [walletAddress]);

  useEffect(() => {
    const normalizedChainId = normalizeChainId(appKitChainId);
    setChainId(normalizedChainId);
  }, [appKitChainId]);

  useEffect(() => {
    if (!walletProvider) {
      setProvider(null);
      return;
    }
    setProvider(new BrowserProvider(walletProvider));
  }, [walletProvider]);

  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) {
      return;
    }

    const handleAccountsChanged: (...args: unknown[]) => void = (...args) => {
      const [rawAccounts] = args;
      if (!Array.isArray(rawAccounts) || rawAccounts.length === 0) {
        setSignerAddress(null);
        return;
      }

      setSignerAddress(String(rawAccounts[0]));
    };

    const handleChainChanged = (newChainId: unknown) => {
      if (typeof newChainId === "string") {
        setChainId(Number.parseInt(newChainId, 16));
      }
    };

    ethereum.on?.("accountsChanged", handleAccountsChanged);
    ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (mode !== "token") {
      setTokenInfo(null);
      setIsFetchingTokenInfo(false);
      return;
    }

    const normalized = tokenAddress.trim();
    const validation = validateAddress(normalized);
    if (!validation.valid) {
      setTokenInfo(null);
      setIsFetchingTokenInfo(false);
      if (validation.error) {
        console.warn(validation.error);
      }
      return;
    }

    const normalizedAddress = normalized.toLowerCase();
    const trustedMetadata = trustedTokens.find(
      (token) =>
        token.address.toLowerCase() === normalizedAddress &&
        typeof token.decimals === "number",
    );

    if (trustedMetadata) {
      const trustedDecimals =
        typeof trustedMetadata.decimals === "number"
          ? trustedMetadata.decimals
          : 18;
      setTokenInfo({
        symbol: trustedMetadata.symbol ?? t("summary.tokenPlaceholder"),
        decimals: trustedDecimals,
      });
      setIsFetchingTokenInfo(false);
      setError(null);
      return;
    }

    const contractRunner = provider ?? readOnlyProvider;
    if (!contractRunner) {
      setTokenInfo(null);
      setIsFetchingTokenInfo(false);
      return;
    }

    let isCancelled = false;

    async function fetchTokenDetails() {
      setIsFetchingTokenInfo(true);
      setError(null);
      try {
        const erc20 = new Contract(normalized, ERC20_ABI, contractRunner);
        const [symbol, decimals] = await Promise.all([
          erc20.symbol(),
          erc20.decimals(),
        ]);
        if (!isCancelled) {
          setTokenInfo({ symbol, decimals: Number(decimals) });
        }
      } catch (_fetchError) {
        if (!isCancelled) {
          setTokenInfo(null);
          setError(t("errors.tokenLookupFailed"));
        }
      } finally {
        if (!isCancelled) {
          setIsFetchingTokenInfo(false);
        }
      }
    }

    fetchTokenDetails();

    return () => {
      isCancelled = true;
    };
  }, [provider, readOnlyProvider, tokenAddress, mode, trustedTokens, t]);

  useEffect(() => {
    if (!trustedTokens.length || !signerAddress) {
      setTrustedTokenBalances({});
      return;
    }

    const balanceProvider = readOnlyProvider ?? provider;
    if (!balanceProvider) {
      setTrustedTokenBalances({});
      return;
    }

    let isCancelled = false;

    async function fetchTrustedTokenBalances() {
      try {
        const entries = await Promise.all(
          trustedTokens.map(async (token) => {
            try {
              const erc20 = new Contract(
                token.address,
                ERC20_ABI,
                balanceProvider,
              );
              const decimalsValue =
                typeof token.decimals === "number"
                  ? token.decimals
                  : await erc20.decimals();
              const balance = await erc20.balanceOf(signerAddress);
              const formattedValue = formatTokenBalanceDisplay(
                formatUnits(balance, decimalsValue),
              );
              return [token.address.toLowerCase(), formattedValue];
            } catch (balanceError) {
              console.warn("Failed to fetch trusted token balance", {
                token: token.label,
                error: balanceError,
              });
              return [token.address.toLowerCase(), null];
            }
          }),
        );
        if (!isCancelled) {
          setTrustedTokenBalances(Object.fromEntries(entries));
        }
      } catch (outerError) {
        console.warn("Failed to prepare trusted token balances", outerError);
        if (!isCancelled) {
          setTrustedTokenBalances({});
        }
      }
    }

    fetchTrustedTokenBalances();

    return () => {
      isCancelled = true;
    };
  }, [provider, readOnlyProvider, signerAddress, trustedTokens]);

  useEffect(() => {
    if (!signerAddress) {
      setNativeBalance(null);
      return;
    }

    const providerForNative = readOnlyProvider ?? provider;
    if (!providerForNative) {
      setNativeBalance(null);
      return;
    }
    const address = signerAddress;

    let isCancelled = false;

    async function fetchNativeBalance(
      currentProvider: BrowserProvider | JsonRpcProvider,
      addressToQuery: string,
    ) {
      try {
        const balance = await currentProvider.getBalance(addressToQuery);
        const decimals = selectedNetwork.nativeCurrency.decimals ?? 18;
        const formatted = formatTokenBalanceDisplay(
          formatUnits(balance, decimals),
        );
        if (!isCancelled) {
          setNativeBalance(formatted);
        }
      } catch (nativeBalanceError) {
        console.warn("Failed to fetch native balance", nativeBalanceError);
        if (!isCancelled) {
          setNativeBalance("0");
        }
      }
    }

    fetchNativeBalance(providerForNative, address);

    return () => {
      isCancelled = true;
    };
  }, [
    provider,
    readOnlyProvider,
    signerAddress,
    selectedNetwork.nativeCurrency.decimals,
  ]);

  // When the user selects a trusted token, keep the address input in sync
  useEffect(() => {
    if (!selectedTrustedToken || selectedTrustedToken === NATIVE_TOKEN_KEY) {
      return;
    }
    const found = trustedTokens.find(
      (token) => token.address === selectedTrustedToken,
    );
    if (found) {
      setTokenAddress(found.address);
    }
  }, [selectedTrustedToken, trustedTokens]);

  // Close the trusted token dropdown on outside click
  useEffect(() => {
    if (!isTrustedOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (
        trustedDropdownRef.current &&
        target &&
        !trustedDropdownRef.current.contains(target)
      ) {
        setIsTrustedOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isTrustedOpen]);

  useEffect(() => {
    if (!isNetworkDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (
        networkDropdownRef.current &&
        target &&
        !networkDropdownRef.current.contains(target)
      ) {
        setIsNetworkDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNetworkDropdownOpen]);

  const totalEntered = useMemo(() => {
    const rawTotal = rows.reduce(
      (acc, row) => acc + (Number.parseFloat(row.amount) || 0),
      0,
    );
    return Number.isFinite(rawTotal) ? rawTotal : 0;
  }, [rows]);
  const activityTimestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    [locale],
  );

  const isTargetNetworkReady =
    signerAddress != null && chainId === selectedNetwork.chainId;
  const nativeSymbol = selectedNetwork.nativeCurrency.symbol;
  const displayedHistory = history.slice(0, 5);
  const hasMoreHistory = history.length > displayedHistory.length;

  const handleNetworkSelect = (networkKey: string) => {
    setSelectedNetworkKey(networkKey);
    setHasUserSelectedNetwork(true);
    setIsNetworkDropdownOpen(false);
    attemptNetworkSwitch(networkKey).catch((switchError) => {
      console.warn("Automatic network switch failed", switchError);
    });
  };

  const attemptNetworkSwitch = async (networkKey: string) => {
    const targetConfig =
      SPRAY_NETWORKS[networkKey] ?? SPRAY_NETWORKS[DEFAULT_SPRAY_NETWORK_KEY];
    const targetAppKitNetwork = APPKIT_NETWORKS_BY_KEY[networkKey];

    if (targetAppKitNetwork) {
      try {
        await switchNetwork(targetAppKitNetwork);
        return;
      } catch (appKitSwitchError) {
        console.warn("AppKit network switch failed", appKitSwitchError);
      }
    }

    const hasInjectedProvider = Boolean(getEthereum());
    if (hasInjectedProvider) {
      const switched = await ensureTargetNetwork(targetConfig);
      if (switched) {
        return;
      }
    }

    open?.({ view: "Networks" }).catch(() => {
      setError(t("errors.switchFailed"));
    });
  };

  const signerPromise = provider?.getSigner();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleWalletState = (event: Event) => {
      const customEvent = event as CustomEvent<{
        address: string | null;
        isConnecting: boolean;
        chainId: number | null;
        provider: BrowserProvider | null;
      }>;
      if (!customEvent.detail) {
        return;
      }
      setSignerAddress(customEvent.detail.address);
      setChainId(customEvent.detail.chainId ?? null);
      setProvider(customEvent.detail.provider ?? null);
    };
    window.addEventListener(
      "wolf-wallet-state",
      handleWalletState as EventListener,
    );
    return () => {
      window.removeEventListener(
        "wolf-wallet-state",
        handleWalletState as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!chainId) {
      return;
    }
    const matchedNetwork = SUPPORTED_SPRAY_NETWORKS.find(
      (network) => network.chainId === chainId,
    );
    if (
      matchedNetwork &&
      !hasUserSelectedNetwork &&
      matchedNetwork.key !== selectedNetworkKey
    ) {
      setSelectedNetworkKey(matchedNetwork.key);
    }
  }, [chainId, hasUserSelectedNetwork, selectedNetworkKey]);

  useEffect(() => {
    if (!trustedTokens.length) {
      if (
        selectedTrustedToken !== "" &&
        selectedTrustedToken !== NATIVE_TOKEN_KEY
      ) {
        setSelectedTrustedToken("");
        setTokenAddress("");
      }
      return;
    }
    if (
      selectedTrustedToken === "" ||
      selectedTrustedToken === NATIVE_TOKEN_KEY
    ) {
      return;
    }
    const stillAvailable = trustedTokens.some(
      (token) => token.address === selectedTrustedToken,
    );
    if (!stillAvailable) {
      const fallbackAddress = trustedTokens[0].address;
      setSelectedTrustedToken(fallbackAddress);
      setTokenAddress(fallbackAddress);
    }
  }, [selectedTrustedToken, trustedTokens]);

  const handleSelectNativeToken = () => {
    setMode("native");
    setSelectedTrustedToken(NATIVE_TOKEN_KEY);
    setTokenAddress("");
    setTokenInfo(null);
    setIsTrustedOpen(false);
  };

  const handleSelectCustomToken = () => {
    setMode("token");
    setSelectedTrustedToken("");
    setTokenAddress("");
    setTokenInfo(null);
    setIsTrustedOpen(false);
  };

  const handleSelectTrustedToken = (tokenAddressValue: string) => {
    setMode("token");
    setSelectedTrustedToken(tokenAddressValue);
    setTokenAddress(tokenAddressValue);
    setTokenInfo(null);
    setIsTrustedOpen(false);
  };

  async function ensureTargetNetwork(
    targetConfig: SprayNetworkConfig = selectedNetwork,
  ) {
    const ethereum = getEthereum();
    if (!ethereum) {
      setError(t("errors.noWallet"));
      return false;
    }

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetConfig.chainHex }],
      });
      setChainId(targetConfig.chainId);
      return true;
    } catch (switchError: unknown) {
      const errorWithCode = switchError as { code?: number };
      if (errorWithCode.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetConfig.chainHex,
                chainName: targetConfig.name,
                nativeCurrency: targetConfig.nativeCurrency,
                rpcUrls: targetConfig.rpcUrls,
                blockExplorerUrls: targetConfig.explorerUrls,
              },
            ],
          });
          setChainId(targetConfig.chainId);
          return true;
        } catch (_addError) {
          setError(t("errors.switchFailed"));
          return false;
        }
      }

      setError(t("errors.switchFailed"));
      return false;
    }
  }

  const sanitizeDecimalInput = (rawValue: string) => {
    const normalized = rawValue.replace(/,/g, ".");
    const filtered = normalized.replace(/[^0-9.]/g, "");
    if (!filtered) {
      return "";
    }
    const segments = filtered.split(".");
    if (segments.length <= 1) {
      return filtered;
    }
    const [integerPart, ...fractionParts] = segments;
    return `${integerPart}.${fractionParts.join("")}`;
  };

  function updateRow(id: string, key: "address" | "amount", value: string) {
    const nextValue = key === "amount" ? sanitizeDecimalInput(value) : value;
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: nextValue } : row)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, createRow()]);
  }

  function removeRow(id: string) {
    if (rows.length === 1) {
      return;
    }
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  function addHistoryRecord(record: Omit<TransactionRecord, "sequence">) {
    spraySequenceRef.current += 1;
    setHistory((prev) =>
      [{ ...record, sequence: spraySequenceRef.current }, ...prev].slice(0, 10),
    );
  }

  function buildTokenAmounts(decimals: number) {
    try {
      const amounts = rows.map((row) =>
        parseUnits(row.amount.trim(), decimals),
      );
      const total = amounts.reduce((acc, value) => acc + value, BigInt(0));
      return { amounts, total };
    } catch {
      return null;
    }
  }

  async function handleApprove() {
    if (!provider || !signerPromise || !tokenInfo) {
      setError(t("errors.noWallet"));
      return;
    }

    const normalized = tokenAddress.trim();
    const validation = validateAddress(normalized);
    if (!validation.valid) {
      setError(validation.error || t("errors.invalidToken"));
      return;
    }

    if (
      rows.some(
        (row) =>
          row.address.trim() === "" ||
          row.amount.trim() === "" ||
          Number(row.amount) <= 0,
      )
    ) {
      setError(t("errors.invalidAmount"));
      return;
    }

    const parsed = buildTokenAmounts(tokenInfo.decimals);
    if (!parsed) {
      setError(t("errors.invalidAmount"));
      return;
    }

    const { total: totalValue } = parsed;
    const totalAmountLabel = totalEntered.toFixed(4);
    const tokenSymbolLabel = tokenInfo?.symbol ?? t("summary.tokenPlaceholder");

    setIsApproving(true);
    setError(null);
    setFeedback(null);

    let approvalHash: string | null = null;

    try {
      const signer = await signerPromise;
      const erc20 = new Contract(normalized, ERC20_ABI, signer);
      const allowance: bigint = await erc20.allowance(
        await signer.getAddress(),
        sprayAddress,
      );

      if (allowance >= totalValue) {
        setFeedback(t("messages.alreadyApproved"));
        return;
      }

      const tx = await erc20.approve(sprayAddress, totalValue);
      approvalHash = tx.hash;
      addHistoryRecord({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "token",
        hash: tx.hash,
        status: "pending",
        timestamp: new Date().toISOString(),
        recipients: rows.length,
        totalFormatted: totalAmountLabel,
        tokenSymbol: tokenSymbolLabel,
        networkKey: selectedNetworkKey,
      });
      setFeedback(t("messages.approvalSent"));
      await tx.wait();
      setFeedback(t("messages.approvalComplete"));
      setHistory((prev) =>
        prev.map((entry) =>
          entry.hash === tx.hash ? { ...entry, status: "success" } : entry,
        ),
      );
    } catch (_approveError) {
      setError(t("errors.approvalFailed"));
      if (approvalHash) {
        setHistory((prev) =>
          prev.map((entry) =>
            entry.hash === approvalHash
              ? {
                  ...entry,
                  status: "error",
                  errorMessage: t("errors.approvalFailed"),
                }
              : entry,
          ),
        );
      }
    } finally {
      setIsApproving(false);
    }
  }

  async function handleSubmit() {
    if (!provider || !signerPromise) {
      setError(t("errors.noWallet"));
      return;
    }

    if (!isTargetNetworkReady) {
      const switched = await ensureTargetNetwork();
      if (!switched) {
        return;
      }
    }

    const recipients = rows.map((row) => row.address.trim());
    const amountsInput = rows.map((row) => row.amount.trim());

    // Validate all addresses
    const hasENS = recipients.some((address) => isENSName(address));
    if (hasENS) {
      setError(
        "ENS names are not supported. Please use wallet addresses (0x...)",
      );
      return;
    }

    if (recipients.some((address) => !isAddress(address))) {
      setError(t("errors.invalidRecipient"));
      return;
    }

    if (amountsInput.some((amount) => amount === "" || Number(amount) <= 0)) {
      setError(t("errors.invalidAmount"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const signer = await signerPromise;
      const contract = new Contract(sprayAddress, SPRAY_ABI, signer);

      if (mode === "native") {
        const amounts = amountsInput.map((amount) => parseEther(amount));
        const totalValue = amounts.reduce(
          (acc, value) => acc + value,
          BigInt(0),
        );

        const tx = await contract.disperseNative(recipients, amounts, {
          value: totalValue,
        });
        const recordId = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`;
        addHistoryRecord({
          id: recordId,
          type: "native",
          hash: tx.hash,
          status: "pending",
          timestamp: new Date().toISOString(),
          recipients: recipients.length,
          totalFormatted: formatEther(totalValue),
          tokenSymbol: nativeSymbol,
          networkKey: selectedNetworkKey,
        });
        setFeedback(t("messages.transactionSent"));
        const receipt = await tx.wait();

        if (isSuccessfulReceiptStatus(receipt.status)) {
          setFeedback(t("messages.transactionConfirmed"));
          setHistory((prev) =>
            prev.map((entry) =>
              entry.id === recordId ? { ...entry, status: "success" } : entry,
            ),
          );
        } else {
          setError(t("errors.transactionFailed"));
          setHistory((prev) =>
            prev.map((entry) =>
              entry.id === recordId
                ? {
                    ...entry,
                    status: "error",
                    errorMessage: t("errors.transactionFailed"),
                  }
                : entry,
            ),
          );
        }
      } else {
        const normalized = tokenAddress.trim();
        const validation = validateAddress(normalized);
        if (!validation.valid || !tokenInfo) {
          setError(validation.error || t("errors.invalidToken"));
          return;
        }

        const decimals = tokenInfo.decimals;
        const parsed = buildTokenAmounts(decimals);
        if (!parsed) {
          setError(t("errors.invalidAmount"));
          return;
        }

        const { amounts, total: totalValue } = parsed;

        const erc20 = new Contract(normalized, ERC20_ABI, signer);
        const allowance: bigint = await erc20.allowance(
          await signer.getAddress(),
          sprayAddress,
        );

        if (allowance < totalValue) {
          setError(t("errors.needsApproval"));
          await handleApprove();
          return;
        }

        const tx = await contract.disperseToken(
          normalized,
          recipients,
          amounts,
        );
        const recordId = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`;
        addHistoryRecord({
          id: recordId,
          type: "token",
          hash: tx.hash,
          status: "pending",
          timestamp: new Date().toISOString(),
          recipients: recipients.length,
          totalFormatted: totalEntered.toFixed(4),
          tokenSymbol: tokenInfo.symbol,
          networkKey: selectedNetworkKey,
        });
        setFeedback(t("messages.transactionSent"));
        const receipt = await tx.wait();

        if (isSuccessfulReceiptStatus(receipt.status)) {
          setFeedback(t("messages.transactionConfirmed"));
          setHistory((prev) =>
            prev.map((entry) =>
              entry.id === recordId ? { ...entry, status: "success" } : entry,
            ),
          );
        } else {
          setError(t("errors.transactionFailed"));
          setHistory((prev) =>
            prev.map((entry) =>
              entry.id === recordId
                ? {
                    ...entry,
                    status: "error",
                    errorMessage: t("errors.transactionFailed"),
                  }
                : entry,
            ),
          );
        }
      }
    } catch (_submitError) {
      setError(t("errors.transactionFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const ctaDisabled =
    isSubmitting ||
    rows.some((row) => row.address.trim() === "" || row.amount.trim() === "") ||
    (mode === "token" &&
      (!validateAddress(tokenAddress.trim()).valid || !tokenInfo));
  const formatActivityTimestamp = (value: string) => {
    try {
      return activityTimestampFormatter.format(new Date(value));
    } catch {
      return new Date(value).toLocaleString();
    }
  };
  const getActivitySummary = (entry: TransactionRecord) => {
    const key =
      entry.recipients === 1
        ? "activity.summarySingle"
        : "activity.summaryMany";
    return t(key, {
      amount: entry.totalFormatted,
      symbol: entry.tokenSymbol,
      count: entry.recipients,
    });
  };
  const activityPanel = (
    <div className="wolf-card--muted border border-wolf-border px-5 py-5">
      <p className="text-xs uppercase text-wolf-text-subtle">
        {t("activity.title")}
      </p>
      {history.length === 0 ? (
        <p className="mt-3 text-sm text-white/60">{t("activity.empty")}</p>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {displayedHistory.map((entry) => {
              const statusLabel =
                entry.status === "success"
                  ? t("activity.confirmed")
                  : t(`activity.status.${entry.status}`);
              const statusPillClass =
                entry.status === "success"
                  ? "bg-wolf-emerald-soft text-wolf-emerald"
                  : entry.status === "pending"
                    ? "bg-wolf-charcoal-70 text-wolf-amber"
                    : "bg-rose-500/10 text-rose-300";
              const explorerUrl = getExplorerTxUrl(
                entry.networkKey,
                entry.hash,
              );
              return (
                <li
                  key={entry.id}
                  className="rounded-lg border border-wolf-border-soft bg-wolf-charcoal-70 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {`Spray #${entry.sequence} · ${getActivitySummary(
                        entry,
                      )}`}
                    </p>
                    <span
                      className={`wolf-pill text-[10px] uppercase ${statusPillClass}`}
                    >
                      {t(`activity.status.${entry.status}`)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/70">
                    {`${statusLabel} • ${formatActivityTimestamp(
                      entry.timestamp,
                    )}`}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-white/60">
                    <span className="font-mono text-white/50">
                      {formatHash(entry.hash)}
                    </span>
                    {explorerUrl ? (
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-wolf-emerald hover:text-wolf-emerald/80"
                      >
                        {t("activity.viewOnExplorer")}
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                  </div>
                  {entry.errorMessage ? (
                    <p className="mt-2 text-[11px] uppercase text-rose-300">
                      {entry.errorMessage}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {hasMoreHistory ? (
            <button
              type="button"
              className="mt-4 text-xs font-semibold text-white/70 underline underline-offset-4 transition hover:text-white"
            >
              {t("activity.viewAll")}
            </button>
          ) : null}
        </>
      )}
    </div>
  );

  return (
    <>
      <DenMain>
        <div className="space-y-8 text-wolf-foreground">
          <div className="shadow-[0_45px_120px_-70px_rgba(160,83,255,0.35)]">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-start gap-2 text-sm text-white/80">
                {signerAddress ? null : (
                  <>
                    <span className="text-xs uppercase text-wolf-text-subtle">
                      {translate(
                        "network.prompt",
                        "Connect a wallet to load Spray.",
                      )}
                    </span>
                    <p className="max-w-[32ch] text-xs text-white/60">
                      {translate(
                        "wallet.helper",
                        "Use the top bar to connect your wallet and load Spray rewards.",
                      )}
                    </p>
                  </>
                )}
              </div>
            </header>

            <div>
              <section className="wolf-card--muted border border-wolf-border-mid p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (mode === "token") {
                        handleSelectNativeToken();
                      } else {
                        handleSelectCustomToken();
                      }
                    }}
                    className="relative flex items-center gap-1 rounded-lg border border-wolf-border-soft/80 bg-wolf-panel/80 px-1.5 py-1 text-xs font-semibold uppercase text-wolf-text-subtle shadow-[0_0_20px_rgba(160,83,255,0.12)] backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-[rgba(160,83,255,0.6)]"
                    aria-label="Toggle native or custom token"
                    aria-pressed={mode === "token"}
                  >
                    <span
                      className={`flex items-center gap-1 rounded-lg px-3 py-1 transition ${
                        mode === "native"
                          ? "bg-wolf-neutral-soft text-white shadow-[0_0_16px_rgba(255,255,255,0.08)]"
                          : "text-wolf-text-subtle"
                      }`}
                    >
                      {translate("modes.native", `Native (${nativeSymbol})`, {
                        symbol: nativeSymbol,
                      })}
                    </span>
                    <span
                      className={`flex items-center gap-1 rounded-lg px-3 py-1 transition ${
                        mode === "token"
                          ? "bg-[linear-gradient(135deg,rgba(160,83,255,0.85),rgba(91,45,255,0.65))] text-white shadow-[0_0_24px_rgba(160,83,255,0.45)]"
                          : "text-wolf-text-subtle"
                      }`}
                    >
                      {t("modes.token")}
                    </span>
                  </button>
                </div>
                <div ref={networkDropdownRef} className="relative mt-4 w-full">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isNetworkDropdownOpen}
                    aria-controls="network-selector-options"
                    onClick={() => setIsNetworkDropdownOpen((prev) => !prev)}
                    className="flex w-full items-center gap-3 rounded-xl border border-wolf-border bg-[#0f141d] px-4 py-3 text-left text-sm text-white/80 transition hover:border-wolf-emerald focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wolf-emerald"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <Image
                        src={selectedNetworkBadgeIcon}
                        alt={`${selectedNetwork.name} badge`}
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                      />
                    </div>
                    <div className="flex-1 text-left leading-tight">
                      <p className="text-[10px] uppercase text-white/50">
                        {networkSelectorLabel}
                      </p>
                      <p className="text-base font-semibold text-white">
                        {selectedNetwork.name}
                      </p>
                    </div>
                    <svg
                      className={`h-5 w-5 text-white/70 transition ${
                        isNetworkDropdownOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 0 1 1.08 1.04l-4.25 4.38a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                  {isNetworkDropdownOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-2xl border border-wolf-border-soft bg-wolf-panel p-2 shadow-2xl">
                      <ul id="network-selector-options" className="space-y-1">
                        {SUPPORTED_SPRAY_NETWORKS.map((network) => {
                          const isActive = network.key === selectedNetworkKey;
                          const iconSrc =
                            NATIVE_TOKEN_ICONS[network.key] ??
                            DEFAULT_TOKEN_ICON;
                          return (
                            <li key={network.key}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                onClick={() => handleNetworkSelect(network.key)}
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                                  isActive
                                    ? "bg-wolf-emerald-soft text-wolf-emerald"
                                    : "text-white/80 hover:bg-white/5"
                                }`}
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                                  <Image
                                    src={iconSrc}
                                    alt={`${network.name} icon`}
                                    width={24}
                                    height={24}
                                    className="h-6 w-6 object-contain"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold">
                                    {network.name}
                                  </span>
                                  <span className="text-[10px] uppercase text-white/50">
                                    {network.nativeCurrency.symbol}
                                  </span>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="space-y-2">
                    <div
                      ref={trustedDropdownRef}
                      className="relative"
                      id="trusted-token-select"
                    >
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={isTrustedOpen}
                        aria-controls="trusted-token-options"
                        onClick={() => setIsTrustedOpen((v) => !v)}
                        title={tokenCardPrimaryLabel}
                        className="flex w-full items-center gap-3 rounded-xl border border-wolf-border bg-[#0f141d] px-3 py-2 text-left text-sm text-white/80 transition hover:border-wolf-emerald focus:border-wolf-emerald focus:outline-none"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                          <Image
                            src={tokenCardIconSrc}
                            alt={`${tokenCardSymbol} token icon`}
                            width={32}
                            height={32}
                            className="h-8 w-8 object-contain"
                          />
                        </div>
                        <div className="text-left leading-tight w-full">
                          <p className="text-[11px] uppercase text-white/60">
                            {tokenPayWithLabel}
                          </p>
                          {isCustomTokenSelected ? (
                            <div className="mt-2 space-y-1">
                              <input
                                id="token-address-input-inline"
                                value={tokenAddress}
                                onChange={(event) =>
                                  setTokenAddress(event.target.value)
                                }
                                placeholder={t("form.tokenPlaceholder")}
                                className="w-full rounded-md border border-wolf-border bg-wolf-panel px-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none"
                              />
                              {isFetchingTokenInfo ? (
                                <p className="text-xs text-white/50">
                                  {t("form.tokenLoading")}
                                </p>
                              ) : tokenInfo ? (
                                <p className="text-xs text-wolf-emerald">
                                  {t("form.tokenResolved", {
                                    symbol: tokenInfo.symbol,
                                    decimals: tokenInfo.decimals,
                                  })}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <p className="text-lg font-semibold text-white">
                              {tokenCardPrimaryLabel}
                            </p>
                          )}
                        </div>
                        <svg
                          className="ml-auto h-4 w-4 text-white/70"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            d="M5 8l5 5 5-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      {isTrustedOpen ? (
                        <div
                          id="trusted-token-options"
                          role="listbox"
                          className="absolute z-20 mt-2 w-full max-h-[18rem] overflow-y-auto rounded-xl border border-wolf-border bg-[#0b111a] py-1 text-sm text-white/80 shadow-2xl"
                        >
                          <button
                            type="button"
                            role="option"
                            aria-selected={isNativeTokenSelected}
                            className={`block w-full cursor-pointer px-3 py-2 text-left transition hover:bg-white/5 ${
                              isNativeTokenSelected ? "bg-white/5" : ""
                            }`}
                            onClick={handleSelectNativeToken}
                            aria-label={translate("actions.paste", "Paste")}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                                <Image
                                  src={nativeTokenIconSrc}
                                  alt={`${selectedNetwork.nativeCurrency.symbol} icon`}
                                  width={32}
                                  height={32}
                                  className="h-8 w-8 object-contain"
                                />
                              </div>
                              <div className="text-left leading-tight w-full">
                                <p className="text-sm font-semibold text-white">
                                  {nativeTokenLabel}
                                </p>
                                <div className="flex items-center justify-between text-xs text-white/60">
                                  <span>
                                    {selectedNetwork.nativeCurrency.symbol}
                                  </span>
                                  <span>{nativeBalanceDisplay}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                          {trustedTokens.map((tok) => {
                            const balanceKey = tok.address.toLowerCase();
                            const storedBalance =
                              trustedTokenBalances[balanceKey];
                            const hasBalanceEntry = Object.hasOwn(
                              trustedTokenBalances,
                              balanceKey,
                            );

                            let walletBalanceValue: string;
                            if (storedBalance != null) {
                              walletBalanceValue = storedBalance;
                            } else if (!signerAddress) {
                              walletBalanceValue = walletBalanceConnectHint;
                            } else if (!hasBalanceEntry) {
                              walletBalanceValue = walletBalanceLoadingLabel;
                            } else {
                              walletBalanceValue = "0";
                            }

                            return (
                              <button
                                key={tok.address}
                                type="button"
                                role="option"
                                aria-selected={
                                  selectedTrustedToken === tok.address
                                }
                                className={`block w-full cursor-pointer px-3 py-2 text-left transition hover:bg-white/5 ${
                                  selectedTrustedToken === tok.address
                                    ? "bg-white/5"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleSelectTrustedToken(tok.address)
                                }
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                                    <Image
                                      src={tok.iconUrl ?? DEFAULT_TOKEN_ICON}
                                      alt={`${tok.symbol ?? tok.label} icon`}
                                      width={32}
                                      height={32}
                                      className="h-8 w-8 object-contain"
                                    />
                                  </div>
                                  <div className="text-left leading-tight w-full">
                                    <p className="text-sm font-semibold text-white">
                                      {tok.label}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-white/60">
                                      <span>
                                        {tok.symbol ?? tokenSymbolPlaceholder}
                                      </span>
                                      <span>{walletBalanceValue}</span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            role="option"
                            aria-selected={isCustomTokenSelected}
                            className={`block w-full cursor-pointer px-3 py-2 text-left transition hover:bg-white/5 ${
                              isCustomTokenSelected ? "bg-white/5" : ""
                            }`}
                            onClick={handleSelectCustomToken}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                                <Image
                                  src={CUSTOM_TOKEN_ICON}
                                  alt="Custom token icon"
                                  width={32}
                                  height={32}
                                  className="h-8 w-8 object-contain"
                                />
                              </div>
                              <div className="text-left leading-tight">
                                <p className="text-sm font-semibold text-white">
                                  {customTokenNameLabel}
                                </p>
                                <p className="text-xs text-white/60">
                                  {t("form.tokenPlaceholder")}
                                </p>
                              </div>
                            </div>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-xs uppercase text-wolf-emerald">
                    <span>
                      {t("summary.recipients", { count: rows.length })}
                    </span>
                    <span className="ml-3">
                      {mode === "native"
                        ? translate(
                            "summary.totalNative",
                            `Total: ${totalEntered.toFixed(4)} ${nativeSymbol}`,
                            {
                              amount: totalEntered.toFixed(4),
                              symbol: nativeSymbol,
                            },
                          )
                        : t("summary.totalToken", {
                            amount: totalEntered.toFixed(4),
                            symbol:
                              tokenInfo?.symbol ??
                              selectedTrustedTokenData?.symbol ??
                              t("summary.tokenPlaceholder"),
                          })}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {rows.map((row) => (
                    <div key={row.id}>
                      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            value={row.address}
                            onChange={(event) =>
                              updateRow(row.id, "address", event.target.value)
                            }
                            placeholder={t("form.addressPlaceholder")}
                            className="flex-1 rounded-lg border border-wolf-border bg-wolf-panel px-4 py-3 text-sm text-white/80 placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                if (typeof navigator === "undefined") {
                                  setError(
                                    translate(
                                      "errors.clipboardFailed",
                                      "Unable to read clipboard.",
                                    ),
                                  );
                                  return;
                                }
                                const clipboardText =
                                  await navigator.clipboard.readText();
                                if (clipboardText) {
                                  updateRow(
                                    row.id,
                                    "address",
                                    clipboardText.trim(),
                                  );
                                }
                              } catch {
                                setError(
                                  translate(
                                    "errors.clipboardFailed",
                                    "Unable to read clipboard.",
                                  ),
                                );
                              }
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-wolf-border text-white/70 transition hover:border-wolf-emerald hover:text-white"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-5 w-5"
                              aria-hidden="true"
                            >
                              <path
                                d="M8 3h8v2h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3V3Zm2 0v2h4V3h-4Z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                        </div>
                        <input
                          value={row.amount}
                          onChange={(event) =>
                            updateRow(row.id, "amount", event.target.value)
                          }
                          placeholder={t("form.amountPlaceholder")}
                          className="w-full rounded-lg border border-wolf-border bg-wolf-panel px-4 py-3 text-sm text-white/80 placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none md:w-40"
                        />
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-wolf-emerald transition hover:text-white disabled:cursor-not-allowed disabled:text-white/20"
                          aria-label={t("actions.remove")}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
                            aria-hidden="true"
                          >
                            <path
                              d="M6 7h12M10 7V5h4v2m-7 0v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={addRow}
                    className="rounded-md border border-wolf-border px-5 py-2 text-xs font-semibold text-white/80 transition hover:border-wolf-border-strong hover:text-white"
                  >
                    {t("actions.addRecipient")}
                  </button>
                  {mode === "token" && tokenInfo ? (
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={ctaDisabled || isApproving}
                      className="rounded-md border border-wolf-border-soft px-5 py-2 text-xs font-semibold text-wolf-emerald transition hover:border-wolf-border-strong hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isApproving
                        ? t("actions.approving")
                        : t("actions.approve")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={ctaDisabled}
                    className="ml-auto inline-flex items-center gap-3 rounded-xl border border-[#4ca22a] bg-[#89e24a] px-6 py-3 text-[0.75rem] font-semibold uppercase text-[#09140a] shadow-[0_0_20px_rgba(186,255,92,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(186,255,92,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#baff5c] disabled:translate-y-0 disabled:border-wolf-border disabled:bg-wolf-border disabled:text-white/40 disabled:shadow-none"
                  >
                    <span>
                      {isSubmitting
                        ? t("actions.submitting")
                        : t("actions.send")}
                    </span>
                  </button>
                </div>

                {feedback ? (
                  <p className="mt-4 text-xs uppercase text-wolf-emerald">
                    {feedback}
                  </p>
                ) : null}
                {error ? (
                  <p className="mt-2 text-xs uppercase text-rose-300">
                    {error}
                  </p>
                ) : null}
              </section>
            </div>
          </div>
        </div>
      </DenMain>
      <DenRightRail>{activityPanel}</DenRightRail>
    </>
  );
}
