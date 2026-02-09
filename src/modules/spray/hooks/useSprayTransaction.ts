"use client";

import { Contract, formatEther, isAddress, parseEther } from "ethers";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { isENSName, validateAddress } from "@/lib/addressValidation";
import { findDuplicateRowIds, validateRow } from "@/lib/recipients";
import {
  BATCH_SIZE,
  buildTokenAmounts,
  ERC20_ABI,
  isSuccessfulReceiptStatus,
  SPRAY_ABI,
} from "../constants";
import type {
  AllowanceStatus,
  BatchProgress,
  Erc20Steps,
  TransactionRecord,
} from "../types";
import type { useSprayNetwork } from "./useSprayNetwork";
import type { useSprayRecipients } from "./useSprayRecipients";
import type { useSprayTelemetry } from "./useSprayTelemetry";
import type { useSprayToken } from "./useSprayToken";
import type { useSprayWallet } from "./useSprayWallet";

type WalletHandle = ReturnType<typeof useSprayWallet>;
type NetworkHandle = ReturnType<typeof useSprayNetwork>;
type TokenHandle = ReturnType<typeof useSprayToken>;
type RecipientsHandle = ReturnType<typeof useSprayRecipients>;
type TelemetryHandle = ReturnType<typeof useSprayTelemetry>;

export function useSprayTransaction(
  wallet: WalletHandle,
  network: NetworkHandle,
  token: TokenHandle,
  recipients: RecipientsHandle,
  telemetry: TelemetryHandle,
) {
  const t = useTranslations("SprayDisperser");
  const { provider, signerAddress, getSignerLazy } = wallet;
  const {
    selectedNetwork,
    selectedNetworkKey,
    isTargetNetworkReady,
    ensureTargetNetwork,
  } = network;
  const {
    mode,
    tokenAddress,
    tokenInfo,
    selectedTrustedTokenData,
    activeTokenDecimals,
  } = token;
  const {
    rows,
    amountMode,
    globalAmount,
    debouncedGlobalAmount,
    validRows,
    hasBlockingIssues,
    globalAmountValidation,
    totals,
  } = recipients;

  const sprayAddress = selectedNetwork.sprayAddress;
  const nativeSymbol = selectedNetwork.nativeCurrency.symbol;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowanceStatus, setAllowanceStatus] =
    useState<AllowanceStatus>("unknown");
  const [erc20Steps, setErc20Steps] = useState<Erc20Steps>({
    active: false,
    currentStep: "idle",
    approvalTxHash: null,
    sendTxHash: null,
    error: null,
  });
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    status: "idle",
    totalRecipients: 0,
    batchSize: BATCH_SIZE,
    totalBatches: 0,
    currentBatch: 0,
    txHash: null,
    errorMessage: null,
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const spraySequenceRef = useRef(0);

  const addHistoryRecord = useCallback(
    (record: Omit<TransactionRecord, "sequence">) => {
      spraySequenceRef.current += 1;
      setHistory((prev) =>
        [{ ...record, sequence: spraySequenceRef.current }, ...prev].slice(
          0,
          10,
        ),
      );
    },
    [],
  );

  // Check allowance for ERC20 tokens
  useEffect(() => {
    if (mode !== "token" || !tokenInfo || !provider || !signerAddress) {
      setAllowanceStatus("unknown");
      return;
    }

    if (hasBlockingIssues || validRows.length === 0) {
      setAllowanceStatus("unknown");
      return;
    }

    const normalized = tokenAddress.trim();
    const validation = validateAddress(normalized);
    if (!validation.valid) {
      setAllowanceStatus("unknown");
      return;
    }

    const tokenDecimals = tokenInfo?.decimals ?? null;
    if (tokenDecimals == null) {
      setAllowanceStatus("unknown");
      return;
    }

    const activeProvider = provider;
    if (!activeProvider) {
      setAllowanceStatus("unknown");
      return;
    }

    let isCancelled = false;
    async function checkAllowance() {
      setAllowanceStatus("loading");
      try {
        const parsed = buildTokenAmounts(
          tokenDecimals,
          validRows,
          amountMode,
          debouncedGlobalAmount,
        );
        if (!parsed) {
          setAllowanceStatus("unknown");
          return;
        }
        const { total } = parsed;
        const signer = await activeProvider.getSigner();
        const erc20 = new Contract(normalized, ERC20_ABI, signer);
        const allowance: bigint = await erc20.allowance(
          await signer.getAddress(),
          sprayAddress,
        );
        if (!isCancelled) {
          setAllowanceStatus(
            allowance >= total ? "approved" : "needs_approval",
          );
        }
      } catch {
        if (!isCancelled) {
          setAllowanceStatus("unknown");
        }
      }
    }

    checkAllowance();

    return () => {
      isCancelled = true;
    };
  }, [
    amountMode,
    debouncedGlobalAmount,
    hasBlockingIssues,
    mode,
    provider,
    signerAddress,
    sprayAddress,
    tokenAddress,
    tokenInfo,
    validRows,
  ]);

  const handleSubmit = useCallback(async () => {
    if (!provider) {
      setError(t("errors.noWallet"));
      return;
    }

    if (!isTargetNetworkReady) {
      const switched = await ensureTargetNetwork();
      if (!switched) {
        return;
      }
    }

    // Runtime validation
    const duplicates = findDuplicateRowIds(rows);
    const validations = rows.map((row) => ({
      row,
      validation: validateRow(row, activeTokenDecimals, amountMode, duplicates),
    }));
    const runtimeValidRows = validations
      .filter(({ validation }) => validation.status === "valid")
      .map(({ row }) => row);
    const runtimeInvalid = validations.filter(
      ({ validation }) => validation.status === "invalid",
    ).length;
    const runtimeDuplicate = validations.filter(
      ({ validation }) => validation.status === "duplicate",
    ).length;
    const runtimeHasIssues =
      validations.some(({ validation }) => validation.status !== "valid") ||
      (amountMode === "same" && !globalAmountValidation.valid);

    if (runtimeValidRows.length === 0) {
      setError(t("errors.invalidRecipient"));
      return;
    }

    if (runtimeHasIssues) {
      setError(
        runtimeInvalid > 0 || runtimeDuplicate > 0
          ? t("errors.invalidRecipient")
          : t("errors.invalidAmount"),
      );
      return;
    }

    const recipientAddresses = runtimeValidRows.map((row) =>
      row.address.trim(),
    );
    const amountsInput =
      amountMode === "same"
        ? runtimeValidRows.map(() => globalAmount.trim())
        : runtimeValidRows.map((row) => (row.amount ?? "").trim());

    const hasENS = recipientAddresses.some((address) => isENSName(address));
    if (hasENS) {
      setError(
        "ENS names are not supported. Please use wallet addresses (0x...)",
      );
      return;
    }

    if (recipientAddresses.some((address) => !isAddress(address))) {
      setError(t("errors.invalidRecipient"));
      return;
    }

    if (amountMode === "same" && !globalAmountValidation.valid) {
      setError(t("errors.invalidAmount"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);
    setBatchProgress({
      status: "submitting",
      totalRecipients: recipientAddresses.length,
      batchSize: BATCH_SIZE,
      totalBatches: Math.ceil(recipientAddresses.length / BATCH_SIZE),
      currentBatch: Math.min(
        1,
        Math.ceil(recipientAddresses.length / BATCH_SIZE),
      ),
      txHash: null,
      errorMessage: null,
    });
    const sendMetadataBase = {
      recipients: recipientAddresses.length,
      amountMode,
      tokenMode: mode,
      network: selectedNetworkKey,
    };

    try {
      const signerOrNull = await getSignerLazy();
      if (!signerOrNull) {
        setError(t("errors.noWallet"));
        return;
      }
      const signer = signerOrNull;
      const contract = new Contract(sprayAddress, SPRAY_ABI, signer);

      if (mode === "native") {
        const amounts = amountsInput.map((amount) => parseEther(amount));
        const totalValue = amounts.reduce(
          (acc, value) => acc + value,
          BigInt(0),
        );

        const nativeMetadata = {
          ...sendMetadataBase,
          tokenSymbol: nativeSymbol,
          totalAmount: formatEther(totalValue),
        };
        telemetry.logSprayEvent("send_started", nativeMetadata);
        telemetry.updateSprayStatus("started");

        const tx = await contract.disperseNative(recipientAddresses, amounts, {
          value: totalValue,
        });
        const recordId = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`;
        setBatchProgress((prev) => ({
          ...prev,
          txHash: tx.hash,
          currentBatch: Math.min(
            prev.totalBatches || 1,
            Math.max(prev.currentBatch, 1),
          ),
        }));
        addHistoryRecord({
          id: recordId,
          type: "native",
          hash: tx.hash,
          status: "pending",
          timestamp: new Date().toISOString(),
          recipients: recipientAddresses.length,
          totalFormatted: formatEther(totalValue),
          tokenSymbol: nativeSymbol,
          networkKey: selectedNetworkKey,
        });
        setFeedback(t("messages.transactionSent"));
        const receipt = await tx.wait();

        if (isSuccessfulReceiptStatus(receipt.status)) {
          setFeedback(t("messages.transactionConfirmed"));
          setBatchProgress((prev) => ({ ...prev, status: "confirmed" }));
          telemetry.logSprayEvent("send_completed", {
            ...nativeMetadata,
            txHash: tx.hash,
          });
          telemetry.updateSprayStatus("completed");
          setHistory((prev) =>
            prev.map((entry) =>
              entry.id === recordId ? { ...entry, status: "success" } : entry,
            ),
          );
        } else {
          setError(t("errors.transactionFailed"));
          setBatchProgress((prev) => ({
            ...prev,
            status: "error",
            errorMessage: t("errors.transactionFailed"),
          }));
          telemetry.logSprayEvent("send_failed", {
            ...nativeMetadata,
            txHash: tx.hash,
            reason: "transaction_failed",
          });
          telemetry.updateSprayStatus("failed");
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
        // ERC20 Token mode
        const normalized = tokenAddress.trim();
        const validation = validateAddress(normalized);
        if (!validation.valid || !tokenInfo) {
          setError(validation.error || t("errors.invalidToken"));
          return;
        }

        const decimals = tokenInfo.decimals;
        const parsed = buildTokenAmounts(
          decimals,
          runtimeValidRows,
          amountMode,
          globalAmount,
        );
        if (!parsed) {
          setError(t("errors.invalidAmount"));
          return;
        }

        const { amounts, total: totalValue } = parsed;
        const signerAddr = await signer.getAddress();
        const erc20 = new Contract(normalized, ERC20_ABI, signer);
        const allowance: bigint = await erc20.allowance(
          signerAddr,
          sprayAddress,
        );

        const tokenMetadata = {
          ...sendMetadataBase,
          tokenSymbol: tokenInfo.symbol,
          totalAmount: Number(totals.total).toFixed(4),
        };

        const needsApprovalNow = allowance < totalValue;

        if (needsApprovalNow) {
          setErc20Steps({
            active: true,
            currentStep: "approving",
            approvalTxHash: null,
            sendTxHash: null,
            error: null,
          });

          try {
            const approveTx = await erc20.approve(sprayAddress, totalValue);
            setErc20Steps((prev) => ({
              ...prev,
              approvalTxHash: approveTx.hash,
            }));
            setFeedback(t("messages.approvalSent"));

            await approveTx.wait();

            setErc20Steps((prev) => ({
              ...prev,
              currentStep: "approved",
            }));
            setAllowanceStatus("approved");
            setFeedback(t("messages.approvalComplete"));
          } catch {
            setErc20Steps((prev) => ({
              ...prev,
              currentStep: "idle",
              error: t("errors.approvalFailed"),
              active: false,
            }));
            setError(t("errors.approvalFailed"));
            return;
          }
        } else {
          setErc20Steps({
            active: true,
            currentStep: "approved",
            approvalTxHash: null,
            sendTxHash: null,
            error: null,
          });
        }

        setErc20Steps((prev) => ({ ...prev, currentStep: "sending" }));
        telemetry.logSprayEvent("send_started", tokenMetadata);
        telemetry.updateSprayStatus("started");

        const tx = await contract.disperseToken(
          normalized,
          recipientAddresses,
          amounts,
        );
        const recordId = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`;

        setErc20Steps((prev) => ({ ...prev, sendTxHash: tx.hash }));
        setBatchProgress((prev) => ({
          ...prev,
          txHash: tx.hash,
          currentBatch: Math.min(
            prev.totalBatches || 1,
            Math.max(prev.currentBatch, 1),
          ),
        }));
        addHistoryRecord({
          id: recordId,
          type: "token",
          hash: tx.hash,
          status: "pending",
          timestamp: new Date().toISOString(),
          recipients: recipientAddresses.length,
          totalFormatted: Number(totals.total).toFixed(4),
          tokenSymbol: tokenInfo.symbol,
          networkKey: selectedNetworkKey,
        });
        setFeedback(t("messages.transactionSent"));
        const receipt = await tx.wait();

        if (isSuccessfulReceiptStatus(receipt.status)) {
          setFeedback(t("messages.transactionConfirmed"));
          setErc20Steps((prev) => ({ ...prev, currentStep: "complete" }));
          setBatchProgress((prev) => ({ ...prev, status: "confirmed" }));
          telemetry.logSprayEvent("send_completed", {
            ...tokenMetadata,
            txHash: tx.hash,
          });
          telemetry.updateSprayStatus("completed");
          setHistory((prev) =>
            prev.map((entry) =>
              entry.id === recordId ? { ...entry, status: "success" } : entry,
            ),
          );
          setTimeout(() => {
            setErc20Steps({
              active: false,
              currentStep: "idle",
              approvalTxHash: null,
              sendTxHash: null,
              error: null,
            });
          }, 3000);
        } else {
          setError(t("errors.transactionFailed"));
          setErc20Steps((prev) => ({
            ...prev,
            currentStep: "idle",
            error: t("errors.transactionFailed"),
            active: false,
          }));
          setBatchProgress((prev) => ({
            ...prev,
            status: "error",
            errorMessage: t("errors.transactionFailed"),
          }));
          telemetry.logSprayEvent("send_failed", {
            ...tokenMetadata,
            txHash: tx.hash,
            reason: "transaction_failed",
          });
          telemetry.updateSprayStatus("failed");
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
    } catch {
      setError(t("errors.transactionFailed"));
      setBatchProgress((prev) => ({
        ...prev,
        status: "error",
        errorMessage: t("errors.transactionFailed"),
      }));
      const tokenSymbolPlaceholder = t("summary.tokenPlaceholder");
      const fallbackTokenSymbol =
        mode === "native"
          ? nativeSymbol
          : (tokenInfo?.symbol ??
            selectedTrustedTokenData?.symbol ??
            tokenSymbolPlaceholder);
      telemetry.logSprayEvent("send_failed", {
        ...sendMetadataBase,
        tokenSymbol: fallbackTokenSymbol,
        reason: "transaction_failed",
      });
      telemetry.updateSprayStatus("failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    provider,
    isTargetNetworkReady,
    ensureTargetNetwork,
    rows,
    activeTokenDecimals,
    amountMode,
    globalAmountValidation,
    globalAmount,
    mode,
    selectedNetworkKey,
    getSignerLazy,
    sprayAddress,
    nativeSymbol,
    telemetry,
    addHistoryRecord,
    t,
    tokenAddress,
    tokenInfo,
    totals,
    selectedTrustedTokenData,
  ]);

  return {
    isSubmitting,
    allowanceStatus,
    erc20Steps,
    history,
    batchProgress,
    feedback,
    error: error,
    setError,
    handleSubmit,
  };
}
