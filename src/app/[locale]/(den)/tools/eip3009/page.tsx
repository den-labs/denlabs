"use client";

import { AlertCircle, CheckCircle2, Copy, Shield, XCircle } from "lucide-react";
import { useState } from "react";
import {
  type Eip3009CheckResult,
  type SupportedChainId,
  checkEip3009,
  getChainName,
  getSupportedChainIds,
} from "@/lib/eip3009/checker";

export default function Eip3009CheckerPage() {
  const [chainId, setChainId] = useState<SupportedChainId>(43114); // Avalanche default
  const [tokenAddress, setTokenAddress] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<Eip3009CheckResult | null>(null);
  const [copied, setCopied] = useState(false);

  const supportedChains = getSupportedChainIds();

  const handleCheck = async () => {
    if (!tokenAddress.trim()) return;

    setIsChecking(true);
    setResult(null);

    try {
      const checkResult = await checkEip3009(chainId, tokenAddress.trim());
      setResult(checkResult);
    } catch (error) {
      console.error("EIP-3009 check failed:", error);
      setResult({
        isEip3009Likely: false,
        tokenAddress: tokenAddress as `0x${string}`,
        isProxy: false,
        selectorsFound: {
          transferWithAuthorization: false,
          receiveWithAuthorization: false,
          authorizationState: false,
          cancelAuthorization: false,
        },
        targetInspected: tokenAddress as `0x${string}`,
        error: error instanceof Error ? error.message : "Unknown error",
        chainId,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;

    const exportData = {
      chainId: result.chainId,
      tokenAddress: result.tokenAddress,
      isEip3009Likely: result.isEip3009Likely,
      implementationAddress: result.implementationAddress,
      selectorsFound: result.selectorsFound,
      checkedAt: new Date().toISOString(),
    };

    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">EIP-3009 Token Checker</h1>
        <p className="text-white/60">
          Detect if an ERC-20 token supports EIP-3009 (Transfer With Authorization)
          for gasless/authorized transfers.
        </p>
      </div>

      {/* Info Card */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 flex-shrink-0 text-blue-400" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-blue-300">What is EIP-3009?</p>
            <p className="text-blue-200/80">
              EIP-3009 enables gasless token transfers using signed authorizations.
              Required for x402 payment system. This tool checks for{" "}
              <code className="rounded bg-blue-400/10 px-1 py-0.5">
                transferWithAuthorization
              </code>{" "}
              and{" "}
              <code className="rounded bg-blue-400/10 px-1 py-0.5">
                receiveWithAuthorization
              </code>{" "}
              functions.
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="space-y-2">
          <label
            htmlFor="network"
            className="block text-sm font-medium text-white/80"
          >
            Network
          </label>
          <select
            id="network"
            value={chainId}
            onChange={(e) => setChainId(Number(e.target.value) as SupportedChainId)}
            className="w-full rounded border border-white/20 bg-black/40 px-4 py-2 text-white outline-none focus:border-white/40"
          >
            {supportedChains.map((id) => (
              <option key={id} value={id}>
                {getChainName(id)} (Chain ID: {id})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="tokenAddress"
            className="block text-sm font-medium text-white/80"
          >
            Token Address
          </label>
          <input
            id="tokenAddress"
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            className="w-full rounded border border-white/20 bg-black/40 px-4 py-2 font-mono text-sm text-white outline-none focus:border-white/40"
          />
        </div>

        <button
          type="button"
          onClick={handleCheck}
          disabled={isChecking || !tokenAddress.trim()}
          className="w-full rounded bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isChecking ? "Checking..." : "Detect EIP-3009"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Verdict */}
          <div
            className={`rounded-lg border p-6 ${
              result.error
                ? "border-red-500/20 bg-red-500/5"
                : result.isEip3009Likely
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-yellow-500/20 bg-yellow-500/5"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.error ? (
                <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-400" />
              ) : result.isEip3009Likely ? (
                <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-400" />
              ) : (
                <XCircle className="h-6 w-6 flex-shrink-0 text-yellow-400" />
              )}
              <div className="flex-1 space-y-2">
                <h3
                  className={`text-lg font-bold ${
                    result.error
                      ? "text-red-300"
                      : result.isEip3009Likely
                        ? "text-green-300"
                        : "text-yellow-300"
                  }`}
                >
                  {result.error
                    ? "Error"
                    : result.isEip3009Likely
                      ? "EIP-3009 Likely ✓"
                      : "Not EIP-3009"}
                </h3>
                {result.error && (
                  <p className="text-sm text-red-200/80">{result.error}</p>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          {!result.error && (
            <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
              <h4 className="font-semibold text-white">Details</h4>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Token Address:</span>
                  <code className="font-mono text-white">
                    {result.tokenAddress.slice(0, 6)}...
                    {result.tokenAddress.slice(-4)}
                  </code>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/60">Is Proxy:</span>
                  <span className="text-white">
                    {result.isProxy ? `Yes (${result.proxyType})` : "No"}
                  </span>
                </div>

                {result.implementationAddress && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Implementation:</span>
                    <code className="font-mono text-white">
                      {result.implementationAddress.slice(0, 6)}...
                      {result.implementationAddress.slice(-4)}
                    </code>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-white/60">Address Inspected:</span>
                  <code className="font-mono text-white">
                    {result.targetInspected.slice(0, 6)}...
                    {result.targetInspected.slice(-4)}
                  </code>
                </div>
              </div>

              {/* Selectors Found */}
              <div className="space-y-2 border-t border-white/10 pt-4">
                <h5 className="font-semibold text-white/80">Function Selectors</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(result.selectorsFound).map(([name, found]) => (
                    <div
                      key={name}
                      className="flex items-center gap-2 rounded bg-black/20 px-3 py-2"
                    >
                      {found ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-white/20" />
                      )}
                      <span
                        className={found ? "text-green-300" : "text-white/40"}
                      >
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopyResult}
                className="flex w-full items-center justify-center gap-2 rounded border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy Result (JSON)"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Usage Info */}
      <div className="rounded-lg border border-white/5 bg-white/5 p-4 text-sm text-white/60">
        <p className="font-semibold text-white/80">For x402 Integration:</p>
        <p className="mt-1">
          Tokens showing &quot;EIP-3009 Likely&quot; can be added to the x402
          allowlist for gasless payment support. Copy the JSON result and add it to{" "}
          <code className="rounded bg-white/10 px-1 py-0.5">
            src/config/x402Tokens.ts
          </code>
        </p>
      </div>
    </div>
  );
}
