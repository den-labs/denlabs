"use client";

import type { BrowserProvider } from "ethers";
import {
  Contract,
  formatEther,
  isAddress,
  parseEther,
  parseUnits,
} from "ethers";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

const SPRAY_ADDRESS = (
  process.env.NEXT_PUBLIC_SPRAY_ADDRESS ??
  "0x9b091AC8f8Db060B134A2FCE33563b3eF4A74015"
).trim();
const CELO_CHAIN_ID = 42220;
const CELO_CHAIN_HEX = "0xa4ec";

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

// Trusted ERC20 tokens (Celo mainnet)
// Users can select from this list or enter any ERC20 address manually.
const TRUSTED_TOKENS: Array<{ label: string; address: string }> = [
  {
    label: "Celo Colombian Peso (cCOP)",
    address: "0x8A567e2aE79CA692Bd748aB832081C45de4041eA",
  },
  // Add more trusted tokens below as needed, keeping cCOP first in the list
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

export default function SprayDisperser() {
  const t = useTranslations("SprayDisperser");
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
  const [signerAddress, setSignerAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [mode, setMode] = useState<"native" | "token">("native");
  const [tokenAddress, setTokenAddress] = useState("");
  const [selectedTrustedToken, setSelectedTrustedToken] = useState<string>("");
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
  const tips = t.raw("tips.items") as string[];

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
      return;
    }

    const activeProvider = provider;

    const normalized = tokenAddress.trim();
    if (!isAddress(normalized)) {
      setTokenInfo(null);
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
  }, [provider, tokenAddress, mode, t]);

  // When the user selects a trusted token, keep the address input in sync
  useEffect(() => {
    if (mode !== "token") return;
    if (!selectedTrustedToken) return;
    const found = TRUSTED_TOKENS.find(
      (t) => t.address === selectedTrustedToken,
    );
    if (found) {
      setTokenAddress(found.address);
    }
  }, [selectedTrustedToken, mode]);

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

  const celoNetworkReady = signerAddress && chainId === CELO_CHAIN_ID;

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

  async function ensureCeloNetwork() {
    const ethereum = getEthereum();
    if (!ethereum) {
      setError(t("errors.noWallet"));
      return false;
    }

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CELO_CHAIN_HEX }],
      });
      setChainId(CELO_CHAIN_ID);
      return true;
    } catch (switchError: unknown) {
      const errorWithCode = switchError as { code?: number };
      if (errorWithCode.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: CELO_CHAIN_HEX,
                chainName: "Celo Mainnet",
                nativeCurrency: {
                  name: "Celo",
                  symbol: "CELO",
                  decimals: 18,
                },
                rpcUrls: ["https://forno.celo.org"],
                blockExplorerUrls: ["https://celoscan.io"],
              },
            ],
          });
          setChainId(CELO_CHAIN_ID);
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

  function addHistoryRecord(record: TransactionRecord) {
    setHistory((prev) => [record, ...prev].slice(0, 10));
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

    setIsApproving(true);
    setError(null);
    setFeedback(null);

    let approvalHash: string | null = null;

    try {
      const signer = await signerPromise;
      const erc20 = new Contract(normalized, ERC20_ABI, signer);
      const allowance: bigint = await erc20.allowance(
        await signer.getAddress(),
        SPRAY_ADDRESS,
      );

      if (allowance >= totalValue) {
        setFeedback(t("messages.alreadyApproved"));
        return;
      }

      const tx = await erc20.approve(SPRAY_ADDRESS, totalValue);
      approvalHash = tx.hash;
      addHistoryRecord({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "token",
        hash: tx.hash,
        status: "pending",
        timestamp: new Date().toISOString(),
        recipients: rows.length,
        totalFormatted:
          `${totalEntered.toFixed(4)} ${tokenInfo?.symbol ?? ""}`.trim(),
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

    if (!celoNetworkReady) {
      const switched = await ensureCeloNetwork();
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
      const contract = new Contract(SPRAY_ADDRESS, SPRAY_ABI, signer);

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
          totalFormatted: `${formatEther(totalValue)} CELO`,
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
          SPRAY_ADDRESS,
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
          totalFormatted: `${totalEntered.toFixed(4)} ${tokenInfo.symbol}`,
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

  return (
    <div className="space-y-8 text-wolf-foreground">
      <div className="shadow-[0_45px_120px_-70px_rgba(160,83,255,0.35)]">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-wolf-text-subtle">
              {signerAddress
                ? translate(
                    "actions.connected",
                    `Connected: ${formatAddress(signerAddress)}`,
                    { address: formatAddress(signerAddress) },
                  )
                : translate(
                    "network.prompt",
                    "Connect a wallet to load Spray.",
                  )}
            </span>
            {signerAddress ? (
              <span
                className={`wolf-pill text-xs uppercase tracking-[0.26em] ${
                  celoNetworkReady
                    ? "bg-wolf-emerald-soft text-wolf-emerald"
                    : "bg-wolf-charcoal-70 text-wolf-text-subtle"
                }`}
              >
                {celoNetworkReady
                  ? translate("network.ready", "Celo mainnet detected")
                  : translate("network.switch", "Switch to Celo mainnet")}
              </span>
            ) : (
              <p className="max-w-[32ch] text-xs text-white/60">
                {translate(
                  "wallet.helper",
                  "Use the top bar to connect your wallet and load Spray rewards.",
                )}
              </p>
            )}
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
                {t("modes.native")}
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
                  ? t("summary.totalNative", {
                      amount: totalEntered.toFixed(4),
                    })
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
                  <label
                    htmlFor="trusted-token-select"
                    className="text-xs uppercase tracking-[0.32em] text-wolf-text-subtle"
                  >
                    {translate(
                      "form.trustedTokenLabel",
                      "Trusted token (optional)",
                    )}
                  </label>
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
                      className="w-full rounded-lg border border-wolf-border bg-wolf-panel px-4 py-3 text-left text-sm text-white/80 focus:border-wolf-emerald focus:outline-none"
                    >
                      {selectedTrustedToken
                        ? (TRUSTED_TOKENS.find(
                            (t) => t.address === selectedTrustedToken,
                          )?.label ?? "")
                        : translate(
                            "form.trustedTokenPlaceholder",
                            "Select a trusted token or choose custom",
                          )}
                    </button>
                    {isTrustedOpen ? (
                      <div
                        id="trusted-token-options"
                        role="listbox"
                        className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-wolf-border bg-wolf-panel py-1 text-sm text-white/80 shadow-lg"
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={!selectedTrustedToken}
                          className="block w-full cursor-pointer px-3 py-2 text-left hover:bg-wolf-neutral-haze"
                          onClick={() => {
                            setSelectedTrustedToken("");
                            setIsTrustedOpen(false);
                          }}
                        >
                          {translate(
                            "form.trustedTokenPlaceholder",
                            "Select a trusted token or choose custom",
                          )}
                        </button>
                        {TRUSTED_TOKENS.map((tok) => (
                          <button
                            key={tok.address}
                            type="button"
                            role="option"
                            aria-selected={selectedTrustedToken === tok.address}
                            className="block w-full cursor-pointer px-3 py-2 text-left hover:bg-wolf-neutral-haze"
                            onClick={() => {
                              setSelectedTrustedToken(tok.address);
                              setIsTrustedOpen(false);
                            }}
                          >
                            {tok.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="token-address-input"
                      className="text-xs uppercase tracking-[0.32em] text-wolf-text-subtle"
                    >
                      {t("form.tokenLabel")}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrustedToken("");
                        setTokenAddress("");
                      }}
                      className="text-[11px] uppercase tracking-[0.28em] text-wolf-emerald hover:text-white"
                    >
                      {translate("form.useCustom", "Use custom")}
                    </button>
                  </div>
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
                {t("history.title")}
              </p>
              {history.length === 0 ? (
                <p className="mt-3 text-sm text-white/60">
                  {t("history.empty")}
                </p>
              ) : (
                <ul className="mt-4 space-y-3 text-xs text-white/70">
                  {history.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg border border-wolf-border-soft bg-wolf-charcoal-70 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="uppercase tracking-[0.3em] text-wolf-text-subtle">
                          {entry.type === "native"
                            ? t("history.native")
                            : t("history.token")}
                        </span>
                        <span
                          className={`uppercase tracking-[0.3em] ${
                            entry.status === "success"
                              ? "text-wolf-emerald"
                              : entry.status === "pending"
                                ? "text-wolf-amber"
                                : "text-rose-300"
                          }`}
                        >
                          {t(`history.status.${entry.status}`)}
                        </span>
                      </div>
                      <p className="mt-2 break-words text-[11px] uppercase tracking-[0.26em] text-white/40">
                        {entry.hash}
                      </p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-white/60">
                        {t("history.summary", {
                          recipients: entry.recipients,
                          total: entry.totalFormatted,
                        })}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/40">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                      {entry.errorMessage ? (
                        <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-rose-300">
                          {entry.errorMessage}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
