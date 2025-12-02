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
  formatEther,
  isAddress,
  parseEther,
  parseUnits,
  type Eip1193Provider,
} from "ethers";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SPRAY_NETWORK_KEY,
  SPRAY_NETWORKS,
  type SprayNetworkConfig,
  SUPPORTED_SPRAY_NETWORKS,
} from "@/lib/sprayNetworks";
import { useDenUser } from "@/hooks/useDenUser";

const SPRAY_ABI = [
  "function disperseNative(address[] _recipients, uint256[] _amounts) payable",
  "function disperseToken(address tokenAddress, address[] _recipients, uint256[] _amounts)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
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

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatHash(hash: string) {
  if (hash.length <= 10) {
    return hash;
  }
  return `${hash.slice(0, 6)}...${hash.slice(-5)}`;
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

const APPKIT_NETWORKS_BY_KEY: Partial<Record<string, AppKitNetwork>> = {
  celo: celoNetwork,
  optimism: optimismNetwork,
  base: baseNetwork,
  avalanche: avalancheNetwork,
};
const DEFAULT_TOKEN_ICON = "/tokens-usdc.png";
const INITIAL_TRUSTED_TOKEN =
  SPRAY_NETWORKS[DEFAULT_SPRAY_NETWORK_KEY]?.trustedTokens?.[0]?.address ?? "";

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
      return values ? t(key, values) : t(key);
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
  const [selectedTrustedToken, setSelectedTrustedToken] = useState<string>(
    INITIAL_TRUSTED_TOKEN,
  );
  const [isTrustedOpen, setIsTrustedOpen] = useState(false);
  const trustedDropdownRef = useRef<HTMLDivElement | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{
    symbol: string;
    decimals: number;
  } | null>(null);
  const [isFetchingTokenInfo, setIsFetchingTokenInfo] = useState(false);
  // Use a deterministic initial row to avoid SSR/CSR mismatch from Math.random/Date.now()
  const [rows, setRows] = useState<RecipientRow[]>([
    { id: "initial", address: "", amount: "" },
  ]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const spraySequenceRef = useRef(0);
  const tips = t.raw("tips.items") as string[];
  const selectedNetwork =
    SPRAY_NETWORKS[selectedNetworkKey] ??
    SPRAY_NETWORKS[DEFAULT_SPRAY_NETWORK_KEY];
  const trustedTokens = selectedNetwork.trustedTokens ?? [];
  const sprayAddress = selectedNetwork.sprayAddress;
  const selectedTrustedTokenData = selectedTrustedToken
    ? trustedTokens.find((token) => token.address === selectedTrustedToken)
    : null;
  const tokenCardSymbol =
    selectedTrustedTokenData?.symbol ??
    tokenInfo?.symbol ??
    t("summary.tokenPlaceholder");
  const tokenCardIconSrc =
    selectedTrustedTokenData?.iconUrl ?? DEFAULT_TOKEN_ICON;
  const customTokenNameLabel = `${translate(
    "form.customTokenLabel",
    "Custom token",
  )} (${translate("summary.tokenPlaceholder", "TOKEN")})`;
  const tokenCardPrimaryLabel =
    selectedTrustedTokenData?.label ??
    (tokenInfo?.symbol
      ? `${tokenInfo.symbol} (${tokenInfo.symbol})`
      : customTokenNameLabel);
  const tokenReceiveLabel = translate("form.receiveLabel", "Receive");

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
    if (!provider || mode !== "token") {
      setTokenInfo(null);
      setIsFetchingTokenInfo(false);
      return;
    }
    if (selectedTrustedToken !== "") {
      setTokenInfo(null);
      setIsFetchingTokenInfo(false);
      return;
    }

    const activeProvider = provider;

    const normalized = tokenAddress.trim();
    if (!isAddress(normalized)) {
      setTokenInfo(null);
      setIsFetchingTokenInfo(false);
      return;
    }

    let isCancelled = false;

    async function fetchTokenDetails(targetProvider: BrowserProvider) {
      setIsFetchingTokenInfo(true);
      setError(null);
      try {
        const signer = await targetProvider.getSigner();
        const erc20 = new Contract(normalized, ERC20_ABI, signer);
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

    fetchTokenDetails(activeProvider);

    return () => {
      isCancelled = true;
    };
  }, [provider, tokenAddress, mode, selectedTrustedToken, t]);

  // When the user selects a trusted token, keep the address input in sync
  useEffect(() => {
    if (!selectedTrustedToken) return;
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
  };

  const handleNetworkPromptClick = async () => {
    if (isTargetNetworkReady) {
      return;
    }

    const targetAppKitNetwork = APPKIT_NETWORKS_BY_KEY[selectedNetworkKey];
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
      const switched = await ensureTargetNetwork(selectedNetwork);
      if (switched) {
        return;
      }
    }

    open?.({ view: "Networks" }).catch(() => {
      setError(t("errors.switchFailed"));
    });
  };

  const networkStatusLabel = isTargetNetworkReady
    ? translate("network.ready", `${selectedNetwork.name} network detected`, {
        network: selectedNetwork.name,
      })
    : translate("network.switch", `Switch to ${selectedNetwork.name}`, {
        network: selectedNetwork.name,
      });

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
      if (selectedTrustedToken !== "") {
        setSelectedTrustedToken("");
      }
      return;
    }
    if (selectedTrustedToken === "") {
      return;
    }
    const stillAvailable = trustedTokens.some(
      (token) => token.address === selectedTrustedToken,
    );
    if (!stillAvailable) {
      setSelectedTrustedToken(trustedTokens[0].address);
    }
  }, [selectedTrustedToken, trustedTokens]);

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

  function updateRow(id: string, key: "address" | "amount", value: string) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
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
    if (!isAddress(normalized)) {
      setError(t("errors.invalidToken"));
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
        const recordId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
        if (!isAddress(normalized) || !tokenInfo) {
          setError(t("errors.invalidToken"));
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
        const recordId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
    (mode === "token" && (!isAddress(tokenAddress.trim()) || !tokenInfo));
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

  return (
    <div className="space-y-8 text-wolf-foreground">
      <div className="shadow-[0_45px_120px_-70px_rgba(160,83,255,0.35)]">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-wolf-text-subtle">
              {signerAddress
                ? translate(
                    "actions.connected",
                    `${selectedNetwork.name}: ${formatAddress(signerAddress)}`,
                    {
                      address: formatAddress(signerAddress),
                      network: selectedNetwork.name,
                    },
                  )
                : translate(
                    "network.prompt",
                    "Connect a wallet to load Spray.",
                  )}
            </span>
            {signerAddress ? (
              isTargetNetworkReady ? (
                <span className="wolf-pill text-xs uppercase tracking-[0.26em] bg-wolf-emerald-soft text-wolf-emerald">
                  {networkStatusLabel}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleNetworkPromptClick}
                  className="wolf-pill text-xs uppercase tracking-[0.26em] bg-wolf-charcoal-70 text-wolf-text-subtle transition hover:bg-wolf-border hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wolf-emerald"
                >
                  {networkStatusLabel}
                </button>
              )
            ) : (
              <p className="max-w-[32ch] text-xs text-white/60">
                {translate(
                  "wallet.helper",
                  "Use the top bar to connect your wallet and load Spray rewards.",
                )}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.26em] text-wolf-text-subtle">
            <span>{translate("network.selectorLabel", "Target network")}</span>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_SPRAY_NETWORKS.map((network) => {
                const isActive = network.key === selectedNetworkKey;
                return (
                  <button
                    key={network.key}
                    type="button"
                    onClick={() => handleNetworkSelect(network.key)}
                    className={`rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.26em] transition ${
                      isActive
                        ? "border-wolf-emerald text-wolf-emerald bg-wolf-emerald-soft"
                        : "border-wolf-border text-white/70 hover:border-white/80 hover:text-white"
                    }`}
                  >
                    {network.name}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="wolf-card--muted border border-wolf-border-mid p-6">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setMode("native")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] transition ${
                  mode === "native"
                    ? "bg-wolf-emerald-soft text-wolf-emerald"
                    : "border border-wolf-border text-white/70"
                }`}
              >
                {translate("modes.native", `Native (${nativeSymbol})`, {
                  symbol: nativeSymbol,
                })}
              </button>
              <button
                type="button"
                onClick={() => setMode("token")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] transition ${
                  mode === "token"
                    ? "bg-wolf-emerald-soft text-wolf-emerald"
                    : "border border-wolf-border text-white/70"
                }`}
              >
                {t("modes.token")}
              </button>
              <span className="text-xs uppercase tracking-[0.28em] text-wolf-text-subtle">
                {t("summary.recipients", { count: rows.length })}
              </span>
              <span className="text-xs uppercase tracking-[0.28em] text-wolf-text-subtle">
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
                        tokenInfo?.symbol ?? t("summary.tokenPlaceholder"),
                    })}
              </span>
            </div>

            {mode === "token" ? (
              <div className="mt-6 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="trusted-token-select"
                      className="text-xs uppercase tracking-[0.32em] text-wolf-text-subtle"
                    >
                      {translate("form.trustedTokenLabel", "Pay with")}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrustedToken("");
                        setTokenAddress("");
                        setTokenInfo(null);
                        setIsTrustedOpen(false);
                      }}
                      className="text-[11px] uppercase tracking-[0.28em] text-wolf-emerald hover:text-white"
                    >
                      {translate("form.useCustom", "Use custom")}
                    </button>
                  </div>
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
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                        <Image
                          src={tokenCardIconSrc}
                          alt={`${tokenCardSymbol} token icon`}
                          width={32}
                          height={32}
                          className="h-8 w-8"
                        />
                      </div>
                      <div className="text-left leading-tight">
                        <p className="text-[11px] uppercase tracking-[0.26em] text-white/60">
                          {tokenReceiveLabel}
                        </p>
                        <p className="text-lg font-semibold text-white">
                          {tokenCardPrimaryLabel}
                        </p>
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
                        className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-wolf-border bg-[#0b111a] py-1 text-sm text-white/80 shadow-2xl"
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={!selectedTrustedToken}
                          className="block w-full cursor-pointer px-3 py-2 text-left transition hover:bg-white/5"
                          onClick={() => {
                            setSelectedTrustedToken("");
                            setTokenAddress("");
                            setTokenInfo(null);
                            setIsTrustedOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                              <Image
                                src={DEFAULT_TOKEN_ICON}
                                alt="Custom token icon"
                                width={32}
                                height={32}
                                className="h-8 w-8"
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
                        {trustedTokens.map((tok) => (
                          <button
                            key={tok.address}
                            type="button"
                            role="option"
                            aria-selected={selectedTrustedToken === tok.address}
                            className={`block w-full cursor-pointer px-3 py-2 text-left transition hover:bg-white/5 ${
                              selectedTrustedToken === tok.address
                                ? "bg-white/5"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedTrustedToken(tok.address);
                              setTokenInfo(null);
                              setIsTrustedOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                                <Image
                                  src={tok.iconUrl ?? DEFAULT_TOKEN_ICON}
                                  alt={`${tok.symbol ?? tok.label} icon`}
                                  width={32}
                                  height={32}
                                  className="h-8 w-8"
                                />
                              </div>
                              <div className="text-left leading-tight">
                                <p className="text-sm font-semibold text-white">
                                  {tok.label}
                                </p>
                                <p className="font-mono text-xs text-white/60 break-all">
                                  {tok.address}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {selectedTrustedToken === "" ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="token-address-input"
                      className="text-xs uppercase tracking-[0.32em] text-wolf-text-subtle"
                    >
                      {t("form.tokenLabel")}
                    </label>
                    <input
                      id="token-address-input"
                      value={tokenAddress}
                      onChange={(event) => setTokenAddress(event.target.value)}
                      placeholder={t("form.tokenPlaceholder")}
                      className="w-full rounded-lg border border-wolf-border bg-wolf-panel px-4 py-3 text-sm text-white/80 placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none"
                    />
                    {isFetchingTokenInfo ? (
                      <p className="text-xs text-wolf-text-subtle">
                        {t("form.tokenLoading")}
                      </p>
                    ) : tokenInfo ? (
                      <p className="text-xs text-wolf-text-subtle">
                        {t("form.tokenResolved", {
                          symbol: tokenInfo.symbol,
                          decimals: tokenInfo.decimals,
                        })}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              {rows.map((row, index) => (
                <div key={row.id}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.28em] text-wolf-text-subtle">
                      {t("form.recipientLabel", { index: index + 1 })}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      className="text-xs uppercase tracking-[0.28em] text-wolf-emerald transition hover:text-white disabled:cursor-not-allowed disabled:text-white/20"
                    >
                      {t("actions.remove")}
                    </button>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 md:flex-row">
                    <input
                      value={row.address}
                      onChange={(event) =>
                        updateRow(row.id, "address", event.target.value)
                      }
                      placeholder={t("form.addressPlaceholder")}
                      className="flex-1 rounded-lg border border-wolf-border bg-wolf-panel px-4 py-3 text-sm text-white/80 placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none"
                    />
                    <input
                      value={row.amount}
                      onChange={(event) =>
                        updateRow(row.id, "amount", event.target.value)
                      }
                      placeholder={t("form.amountPlaceholder")}
                      className="w-full rounded-lg border border-wolf-border bg-wolf-panel px-4 py-3 text-sm text-white/80 placeholder:text-white/30 focus:border-wolf-emerald focus:outline-none md:w-40"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={addRow}
                className="rounded-md border border-wolf-border px-5 py-2 text-xs font-semibold tracking-[0.28em] text-white/80 transition hover:border-wolf-border-strong hover:text-white"
              >
                {t("actions.addRecipient")}
              </button>
              {mode === "token" && tokenInfo ? (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={ctaDisabled || isApproving}
                  className="rounded-md border border-wolf-border-soft px-5 py-2 text-xs font-semibold tracking-[0.28em] text-wolf-emerald transition hover:border-wolf-border-strong hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isApproving ? t("actions.approving") : t("actions.approve")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={ctaDisabled}
                className="ml-auto items-center justify-center rounded-md den-button-primary px-6 py-3 text-xs font-semibold text-[#0b1407] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t("actions.submitting") : t("actions.send")}
              </button>
            </div>

            {feedback ? (
              <p className="mt-4 text-xs uppercase tracking-[0.32em] text-wolf-emerald">
                {feedback}
              </p>
            ) : null}
            {error ? (
              <p className="mt-2 text-xs uppercase tracking-[0.32em] text-rose-300">
                {error}
              </p>
            ) : null}
          </section>

          <aside className="space-y-4">
            <div className="wolf-card--muted border border-wolf-border px-5 py-5">
              <p className="text-xs uppercase tracking-[0.32em] text-wolf-text-subtle">
                {t("tips.title")}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="wolf-card--muted border border-wolf-border px-5 py-5">
              <p className="text-xs uppercase tracking-[0.32em] text-wolf-text-subtle">
                {t("activity.title")}
              </p>
              {history.length === 0 ? (
                <p className="mt-3 text-sm text-white/60">
                  {t("activity.empty")}
                </p>
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
                              {`Spray #${entry.sequence} · ${getActivitySummary(entry)}`}
                            </p>
                            <span
                              className={`wolf-pill text-[10px] uppercase tracking-[0.26em] ${statusPillClass}`}
                            >
                              {t(`activity.status.${entry.status}`)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-white/70">
                            {`${statusLabel} • ${formatActivityTimestamp(entry.timestamp)}`}
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
                            <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-rose-300">
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
          </aside>
        </div>
      </div>
    </div>
  );
}
