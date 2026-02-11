"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { DenMain, DenRightRail } from "@/components/den/RailSlots";
import { RecipientsCard } from "@/components/modules/spray/RecipientsCard";
import { SprayLogModal } from "@/components/modules/spray/SprayLogModal";
import { StickyFooter } from "@/components/modules/spray/StickyFooter";
import { validateAddress } from "@/lib/addressValidation";
import { NetworkSelector } from "./components/NetworkSelector";
import { TokenSelector } from "./components/TokenSelector";
import {
  DEFAULT_TOKEN_ICON,
  formatHash,
  getExplorerTxUrl,
  NATIVE_TOKEN_ICONS,
} from "./constants";
import { useSpray } from "./SprayProvider";

export default function SprayLayout() {
  const t = useTranslations("SprayDisperser");
  const locale = useLocale();
  const {
    wallet,
    network,
    token,
    balances,
    recipients,
    transaction,
    telemetry,
  } = useSpray();

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

  // Derived labels
  const nativeSymbol = network.selectedNetwork.nativeCurrency.symbol;
  const nativeTokenLabel = `${network.selectedNetwork.nativeCurrency.name} (${nativeSymbol})`;
  const customTokenNameLabel = `${translate("form.customTokenLabel", "Custom token")} (${translate("summary.tokenPlaceholder", "TOKEN")})`;
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
    "Fetching balance\u2026",
  );
  const tokenSymbolPlaceholder = translate("summary.tokenPlaceholder", "TOKEN");
  const selectedNetworkBadgeIcon =
    NATIVE_TOKEN_ICONS[network.selectedNetworkKey] ?? DEFAULT_TOKEN_ICON;
  const nativeBalanceDisplay = wallet.signerAddress
    ? (balances.nativeBalance ?? walletBalanceLoadingLabel)
    : walletBalanceConnectHint;

  const tokenCardPrimaryLabel = token.isNativeTokenSelected
    ? nativeTokenLabel
    : token.isCustomTokenSelected
      ? token.tokenAddress || t("form.tokenPlaceholder")
      : (token.selectedTrustedTokenData?.label ??
        (token.tokenInfo?.symbol
          ? `${token.tokenInfo.symbol} (${token.tokenInfo.symbol})`
          : customTokenNameLabel));

  const tokenAddressValidation = validateAddress(token.tokenAddress.trim());

  // CTA label
  const ctaLabel = (() => {
    if (transaction.erc20Steps.active) {
      switch (transaction.erc20Steps.currentStep) {
        case "approving":
          return t("actions.approving");
        case "approved":
        case "sending":
          return t("actions.submitting");
        case "complete":
          return t("messages.transactionConfirmed");
        default:
          return t("actions.send");
      }
    }
    if (transaction.isSubmitting) return t("actions.submitting");
    return t("actions.send");
  })();

  const ctaDisabledReason = (() => {
    if (transaction.isSubmitting || transaction.erc20Steps.active) {
      return "Transaction in progress.";
    }
    if (recipients.recipientCount === 0) {
      return "Add at least one recipient.";
    }
    if (recipients.hasBlockingIssues) {
      return `Fix ${recipients.issuesCount} issue(s) before sending.`;
    }
    if (
      recipients.amountMode === "same" &&
      !recipients.globalAmountValidation.valid
    ) {
      return "Enter an amount per recipient.";
    }
    if (
      token.mode === "token" &&
      (!tokenAddressValidation.valid || !token.tokenInfo)
    ) {
      return "Enter a valid token address.";
    }
    if (token.mode === "token" && transaction.allowanceStatus === "loading") {
      return "Checking allowance status...";
    }
    return null;
  })();
  const ctaDisabled = Boolean(ctaDisabledReason);

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

  const formatActivityTimestamp = (value: string) => {
    try {
      return activityTimestampFormatter.format(new Date(value));
    } catch {
      return new Date(value).toLocaleString();
    }
  };

  const totalDisplay =
    token.mode === "native"
      ? `${Number(recipients.totals.total).toFixed(4)} ${nativeSymbol}`
      : `${Number(recipients.totals.total).toFixed(4)} ${token.tokenInfo?.symbol ?? token.selectedTrustedTokenData?.symbol ?? tokenSymbolPlaceholder}`;

  // Batch progress
  const batchProgressVisible = transaction.batchProgress.status !== "idle";
  const batchProgressPercent =
    transaction.batchProgress.totalBatches > 0
      ? Math.min(
          100,
          (transaction.batchProgress.currentBatch /
            transaction.batchProgress.totalBatches) *
            100,
        )
      : 0;
  const batchProgressLabel =
    transaction.batchProgress.status === "confirmed"
      ? "All batches confirmed"
      : transaction.batchProgress.status === "error"
        ? "Batch failed"
        : "Submitting batches";
  const batchExplorerUrl =
    transaction.batchProgress.txHash && network.selectedNetworkKey
      ? getExplorerTxUrl(
          network.selectedNetworkKey,
          transaction.batchProgress.txHash,
        )
      : null;

  const sendReady =
    recipients.recipientCount > 0 &&
    !recipients.hasBlockingIssues &&
    !ctaDisabled;

  const progressSteps = [
    { label: "Network", done: true },
    { label: "Token", done: true },
    { label: "Recipients", done: recipients.recipientCount > 0 },
    { label: "Ready", done: sendReady },
  ];

  const allowanceDisplay =
    token.mode === "token"
      ? transaction.allowanceStatus === "approved"
        ? "Ready"
        : transaction.allowanceStatus === "needs_approval"
          ? "Needs approval"
          : transaction.allowanceStatus === "loading"
            ? "Checking"
            : "Not checked"
      : "Not required";

  const summaryPanel = (
    <div
      className={`wolf-card border border-wolf-border px-5 py-5 text-xs text-white/70 ${sendReady ? "shadow-[var(--den-shadow-glow-accent)]" : ""}`}
    >
      <div className="flex items-center gap-3">
        <Image
          src={selectedNetworkBadgeIcon}
          alt={`${network.selectedNetwork.name} icon`}
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
        <div>
          <p className="text-[10px] uppercase text-wolf-text-subtle">Network</p>
          <p className="text-sm font-semibold text-white">
            {network.selectedNetwork.name}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {progressSteps.map((step) => (
          <div
            key={step.label}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div
              className={`h-1.5 w-full rounded-full transition ${step.done ? "bg-wolf-emerald" : "bg-white/10"}`}
            />
            <span
              className={`text-[9px] uppercase ${step.done ? "text-wolf-emerald" : "text-white/30"}`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-wolf-border bg-wolf-panel/60 px-4 py-3 text-center">
        <p className="text-[10px] uppercase text-wolf-text-subtle">Total</p>
        <p className="mt-1 text-lg font-bold text-white">{totalDisplay}</p>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span>Recipients</span>
          <span className="font-semibold text-white">
            {recipients.recipientCount}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Balance</span>
          <span className="text-white/80">{nativeBalanceDisplay}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Allowance</span>
          <span className="text-white/80">{allowanceDisplay}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Last spray</span>
          <span className="text-white/60">
            {transaction.history[0]
              ? formatActivityTimestamp(transaction.history[0].timestamp)
              : "\u2014"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Spray log</span>
          <button
            type="button"
            onClick={() => telemetry.setSprayLogOpen(true)}
            className="text-xs font-semibold text-white/70 underline underline-offset-4 transition hover:text-white"
          >
            View log
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <DenMain>
        <div className="text-wolf-foreground">
          <div className="mx-auto flex w-full max-w-[1120px] min-h-0 flex-col gap-5 overflow-y-auto">
            <div className="shadow-[0_45px_120px_-70px_rgba(160,83,255,0.35)]">
              <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col items-start gap-2 text-sm text-white/80">
                  {wallet.signerAddress ? null : (
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
                <section className="relative z-10 wolf-card--muted border border-wolf-border-mid p-5">
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (token.mode === "token") {
                          token.handleSelectNativeToken();
                        } else {
                          token.handleSelectCustomToken();
                        }
                      }}
                      className="relative flex items-center gap-1 rounded-lg border border-wolf-border-soft/80 bg-wolf-panel/80 px-1.5 py-1 text-xs font-semibold uppercase text-wolf-text-subtle shadow-[0_0_20px_rgba(160,83,255,0.12)] backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-[rgba(160,83,255,0.6)]"
                      aria-label="Toggle native or custom token"
                      aria-pressed={token.mode === "token"}
                    >
                      <span
                        className={`flex items-center gap-1 rounded-lg px-3 py-1 transition ${
                          token.mode === "native"
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
                          token.mode === "token"
                            ? "bg-[linear-gradient(135deg,rgba(160,83,255,0.85),rgba(91,45,255,0.65))] text-white shadow-[0_0_24px_rgba(160,83,255,0.45)]"
                            : "text-wolf-text-subtle"
                        }`}
                      >
                        {t("modes.token")}
                      </span>
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-x-4">
                    <NetworkSelector
                      selectedNetworkKey={network.selectedNetworkKey}
                      selectedNetworkName={network.selectedNetwork.name}
                      isOpen={network.isNetworkDropdownOpen}
                      setIsOpen={network.setIsNetworkDropdownOpen}
                      onSelect={network.selectNetwork}
                      label={networkSelectorLabel}
                      badgeIcon={selectedNetworkBadgeIcon}
                      onOpenChange={(open) => {
                        if (open) token.setIsTrustedOpen(false);
                      }}
                    />

                    <TokenSelector
                      isOpen={token.isTrustedOpen}
                      setIsOpen={token.setIsTrustedOpen}
                      onOpenChange={(open) => {
                        if (open) network.setIsNetworkDropdownOpen(false);
                      }}
                      tokenCardIconSrc={token.tokenCardIconSrc}
                      tokenCardSymbol={token.tokenCardSymbol}
                      tokenCardPrimaryLabel={tokenCardPrimaryLabel}
                      tokenPayWithLabel={tokenPayWithLabel}
                      isCustomTokenSelected={token.isCustomTokenSelected}
                      isNativeTokenSelected={token.isNativeTokenSelected}
                      tokenAddress={token.tokenAddress}
                      onTokenAddressChange={token.setTokenAddress}
                      isFetchingTokenInfo={token.isFetchingTokenInfo}
                      tokenInfo={token.tokenInfo}
                      nativeTokenIconSrc={token.nativeTokenIconSrc}
                      nativeTokenLabel={nativeTokenLabel}
                      nativeSymbol={nativeSymbol}
                      nativeBalanceDisplay={nativeBalanceDisplay}
                      trustedTokens={token.trustedTokens}
                      selectedTrustedToken={token.selectedTrustedToken}
                      trustedTokenBalances={balances.trustedTokenBalances}
                      signerAddress={wallet.signerAddress}
                      walletBalanceConnectHint={walletBalanceConnectHint}
                      walletBalanceLoadingLabel={walletBalanceLoadingLabel}
                      tokenSymbolPlaceholder={tokenSymbolPlaceholder}
                      customTokenNameLabel={customTokenNameLabel}
                      onSelectNative={token.handleSelectNativeToken}
                      onSelectCustom={token.handleSelectCustomToken}
                      onSelectTrusted={token.handleSelectTrustedToken}
                    />
                  </div>
                </section>

                {/* ERC20 Transaction Steps Indicator */}
                {transaction.erc20Steps.active && token.mode === "token" && (
                  <div className="mt-4 rounded-2xl border border-wolf-border bg-den-bg px-5 py-4">
                    <p className="text-xs uppercase text-wolf-text-subtle mb-3">
                      Transaction Steps
                    </p>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${transaction.erc20Steps.currentStep === "approving" ? "bg-wolf-emerald/20 text-wolf-emerald animate-pulse" : transaction.erc20Steps.currentStep === "approved" || transaction.erc20Steps.currentStep === "sending" || transaction.erc20Steps.currentStep === "complete" ? "bg-wolf-emerald text-white" : "bg-white/10 text-white/50"}`}
                        >
                          {transaction.erc20Steps.currentStep === "approved" ||
                          transaction.erc20Steps.currentStep === "sending" ||
                          transaction.erc20Steps.currentStep === "complete" ? (
                            <span>&#10003;</span>
                          ) : transaction.erc20Steps.currentStep ===
                            "approving" ? (
                            <span className="animate-spin">&#9676;</span>
                          ) : (
                            <span>1</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${transaction.erc20Steps.currentStep === "approving" ? "text-wolf-emerald" : transaction.erc20Steps.currentStep === "approved" || transaction.erc20Steps.currentStep === "sending" || transaction.erc20Steps.currentStep === "complete" ? "text-white" : "text-white/50"}`}
                          >
                            {`Approve ${token.tokenInfo?.symbol || "Token"}`}
                          </p>
                          {transaction.erc20Steps.approvalTxHash ? (
                            <a
                              href={
                                getExplorerTxUrl(
                                  network.selectedNetworkKey,
                                  transaction.erc20Steps.approvalTxHash,
                                ) ?? undefined
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-mono text-wolf-emerald hover:text-wolf-emerald/80 flex items-center gap-1"
                            >
                              {formatHash(
                                transaction.erc20Steps.approvalTxHash,
                              )}
                              <span aria-hidden="true">&uarr;</span>
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${transaction.erc20Steps.currentStep === "sending" ? "bg-wolf-emerald/20 text-wolf-emerald animate-pulse" : transaction.erc20Steps.currentStep === "complete" ? "bg-wolf-emerald text-white" : "bg-white/10 text-white/50"}`}
                        >
                          {transaction.erc20Steps.currentStep === "complete" ? (
                            <span>&#10003;</span>
                          ) : transaction.erc20Steps.currentStep ===
                            "sending" ? (
                            <span className="animate-spin">&#9676;</span>
                          ) : (
                            <span>2</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${transaction.erc20Steps.currentStep === "sending" ? "text-wolf-emerald" : transaction.erc20Steps.currentStep === "complete" ? "text-white" : "text-white/50"}`}
                          >
                            Send Dispersion
                          </p>
                          {transaction.erc20Steps.sendTxHash ? (
                            <a
                              href={
                                getExplorerTxUrl(
                                  network.selectedNetworkKey,
                                  transaction.erc20Steps.sendTxHash,
                                ) ?? undefined
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-mono text-wolf-emerald hover:text-wolf-emerald/80 flex items-center gap-1"
                            >
                              {formatHash(transaction.erc20Steps.sendTxHash)}
                              <span aria-hidden="true">&uarr;</span>
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {transaction.erc20Steps.error && (
                      <p className="mt-3 text-[11px] uppercase text-rose-300">
                        {transaction.erc20Steps.error}
                      </p>
                    )}
                  </div>
                )}

                {/* Batch Progress */}
                {batchProgressVisible ? (
                  <div className="mt-4 rounded-2xl border border-wolf-border bg-den-bg px-5 py-4 text-xs text-white/70">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase text-wolf-text-subtle">
                          Batch execution
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {batchProgressLabel}
                        </p>
                        <p className="mt-1 text-[11px] text-white/60">
                          {`Recipients: ${transaction.batchProgress.totalRecipients} \u2022 Batch size: ${transaction.batchProgress.batchSize} \u2022 Total batches: ${transaction.batchProgress.totalBatches}`}
                        </p>
                      </div>
                      <div className="text-right text-[11px] text-white/60">
                        <div>{`Batch ${Math.max(transaction.batchProgress.currentBatch, 1)} of ${Math.max(transaction.batchProgress.totalBatches, 1)}`}</div>
                        {transaction.batchProgress.txHash ? (
                          <div className="mt-1 font-mono text-white/50">
                            {formatHash(transaction.batchProgress.txHash)}
                          </div>
                        ) : null}
                        {batchExplorerUrl ? (
                          <a
                            href={batchExplorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 font-semibold text-wolf-emerald hover:text-wolf-emerald/80"
                          >
                            View<span aria-hidden="true">&uarr;</span>
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-wolf-emerald transition-all"
                        style={{ width: `${batchProgressPercent}%` }}
                      />
                    </div>
                    {transaction.batchProgress.errorMessage ? (
                      <p className="mt-2 text-[11px] uppercase text-rose-300">
                        {transaction.batchProgress.errorMessage}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* Recipients Card */}
                <div className="mt-5 flex min-h-0 flex-1">
                  <RecipientsCard
                    rows={recipients.rows}
                    recipientCount={recipients.recipientCount}
                    amountMode={recipients.amountMode}
                    globalAmount={recipients.globalAmount}
                    tokenDecimals={token.activeTokenDecimals}
                    issuesCount={recipients.issuesCount}
                    duplicateCount={recipients.duplicateCount}
                    invalidCount={recipients.invalidCount}
                    missingAmountCount={recipients.missingAmountCount}
                    statusById={recipients.statusById}
                    issuesById={recipients.issuesById}
                    onModeChange={recipients.setAmountMode}
                    onGlobalAmountChange={recipients.updateGlobalAmount}
                    onRowChange={recipients.updateRow}
                    onRemoveRow={recipients.removeRow}
                    onAddRow={recipients.addRow}
                    onClearRows={recipients.clearRows}
                    onApplyParsedRows={recipients.applyParsedRows}
                    onRemoveDuplicates={recipients.removeDuplicates}
                    onRemoveInvalidRows={recipients.removeInvalidRows}
                    onFillMissingAmounts={recipients.fillMissingAmounts}
                    canFillMissing={recipients.canFillMissing}
                    fillMissingValue={recipients.fillMissingValue}
                    onFillMissingValueChange={recipients.updateFillMissingValue}
                    onPasteOpen={telemetry.handlePasteOpen}
                    onEvent={telemetry.logSprayEvent}
                    footer={
                      <StickyFooter
                        recipientCount={recipients.recipientCount}
                        totalLabel={`Total: ${totalDisplay}`}
                        feeLabel="Estimated fee: —"
                        allowanceLabel={
                          token.mode === "token"
                            ? transaction.allowanceStatus === "approved"
                              ? "Allowance: Ready"
                              : transaction.allowanceStatus === "needs_approval"
                                ? "Allowance: Needs approval"
                                : transaction.allowanceStatus === "loading"
                                  ? "Allowance: Checking..."
                                  : "Allowance: Not checked"
                            : "Allowance: Not required"
                        }
                        ctaLabel={ctaLabel}
                        ctaDisabled={ctaDisabled}
                        ctaReason={ctaDisabledReason}
                        onPrimaryAction={transaction.handleSubmit}
                        isLoading={
                          transaction.isSubmitting ||
                          transaction.erc20Steps.active
                        }
                      />
                    }
                  />
                </div>

                {transaction.feedback ? (
                  <p className="mt-4 text-xs uppercase text-wolf-emerald">
                    {transaction.feedback}
                  </p>
                ) : null}
                {transaction.error ? (
                  <p className="mt-2 text-xs uppercase text-rose-300">
                    {transaction.error}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </DenMain>
      <DenRightRail>
        <div className="space-y-4 lg:sticky lg:top-6">{summaryPanel}</div>
      </DenRightRail>
      <SprayLogModal
        isOpen={telemetry.sprayLogOpen}
        onClose={() => telemetry.setSprayLogOpen(false)}
        onRefresh={telemetry.fetchSprayEvents}
        events={telemetry.sprayEvents}
        isLoading={telemetry.sprayEventsLoading}
        error={telemetry.sprayEventsError}
      />
    </>
  );
}
