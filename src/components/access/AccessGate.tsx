"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import {
  Check,
  ChevronRight,
  Lock,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import ConnectWalletButton from "@/components/ui/ConnectWalletButton";
import { useRouter } from "@/i18n/routing";
import {
  claimUserHandle,
  fetchUserSession,
  loginWithWallet,
  type UserSession,
} from "@/lib/userClient";
import { cn } from "@/lib/utils";

type AccessGateProps = {
  nextPath?: string;
};

type StepKey = 1 | 2 | 3;

const HANDLE_REGEX = /^[A-Za-z0-9_.-]{3,32}$/;

function formatAddress(address?: `0x${string}` | null) {
  if (!address) {
    return "";
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function AccessGate({ nextPath }: AccessGateProps) {
  const t = useTranslations("AccessGate");
  const router = useRouter();
  const { address } = useAppKitAccount();
  const [session, setSession] = useState<UserSession | null>(null);
  const [currentStep, setCurrentStep] = useState<StepKey>(1);
  const [handleInput, setHandleInput] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingWallet, setIsSyncingWallet] = useState(false);
  const [isSavingHandle, setIsSavingHandle] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clean the next path to remove any locale prefix that might be duplicated
  const cleanNextPath = (path: string): string => {
    // Remove leading /en/ or /es/ if present
    const cleaned = path.replace(/^\/(en|es)\//, "/");
    return cleaned;
  };

  const resolvedNext = nextPath ? cleanNextPath(nextPath) : "/labs";

  const applySession = useCallback((next: UserSession) => {
    setSession(next);
    if (next.handle) {
      setHandleInput(next.handle);
    }
    if (!next.isAuthenticated) {
      setCurrentStep(1);
    } else if (!next.hasProfile) {
      setCurrentStep(2);
    } else {
      setCurrentStep(3);
    }
  }, []);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchUserSession();
      applySession(data);

      // Auto-redirect if already onboarded (wallet + handle)
      if (data.isAuthenticated && data.hasProfile) {
        // User is fully onboarded, redirect to next path (router will add locale)
        router.push(resolvedNext);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("errors.generic"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [applySession, t, router, resolvedNext]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const connectedWallet =
    typeof session?.walletAddress === "string" && session.walletAddress
      ? (session.walletAddress as `0x${string}`)
      : typeof address === "string" && address.startsWith("0x")
        ? (address as `0x${string}`)
        : null;
  const hasWallet = Boolean(connectedWallet);
  const hasHandle = Boolean(session?.hasProfile);
  const continueDisabled = !hasWallet || !hasHandle || isContinuing;
  const isHandleValid = HANDLE_REGEX.test(handleInput);

  useEffect(() => {
    if (!address) {
      return;
    }
    if (
      session?.walletAddress &&
      session.walletAddress.toLowerCase() === address.toLowerCase()
    ) {
      return;
    }
    let cancelled = false;
    setIsSyncingWallet(true);
    setErrorMessage(null);
    loginWithWallet(address)
      .then((result) => {
        if (cancelled) {
          return;
        }
        const nextSession: UserSession = {
          isAuthenticated: true,
          labUserId: result.labUserId,
          walletAddress: (result.walletAddress ??
            address.toLowerCase()) as `0x${string}`,
          handle: result.handle as string | null,
          hasProfile: result.hasProfile,
          isSelfVerified: result.isSelfVerified,
          holdScore: result.holdScore,
        };
        applySession(nextSession);
        setStatusMessage(t("status.walletConnected"));
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : t("errors.generic"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsSyncingWallet(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address, applySession, session?.walletAddress, t]);

  const handleProfileSave = useCallback(async () => {
    if (!isHandleValid) {
      setHandleError(t("profile.handleInvalid"));
      return;
    }
    setIsSavingHandle(true);
    setErrorMessage(null);
    try {
      const result = await claimUserHandle(handleInput);
      if (session) {
        applySession({
          ...session,
          handle: result.handle,
          hasProfile: result.hasProfile,
        });
      } else {
        await loadSession();
      }
      setStatusMessage(t("status.profileSaved"));
      setHandleError(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("errors.generic"),
      );
    } finally {
      setIsSavingHandle(false);
    }
  }, [applySession, handleInput, isHandleValid, loadSession, session, t]);

  const handleContinue = useCallback(async () => {
    if (continueDisabled) {
      return;
    }
    setIsContinuing(true);
    setErrorMessage(null);
    try {
      router.push(resolvedNext);
    } finally {
      setIsContinuing(false);
    }
  }, [continueDisabled, resolvedNext, router]);

  const walletStatus = useMemo(() => {
    if (isSyncingWallet) {
      return t("wallet.messages.connecting");
    }
    if (connectedWallet) {
      return `${t("wallet.messages.connected")} ${formatAddress(
        connectedWallet,
      )}`;
    }
    return t("wallet.messages.notConnected");
  }, [connectedWallet, isSyncingWallet, t]);

  const continueHint = !hasWallet
    ? t("continue.hintWallet")
    : !hasHandle
      ? t("continue.hintHandle")
      : t("continue.hintReady");

  const primaryActionLabel =
    currentStep === 1
      ? t("navigation.next")
      : currentStep === 2
        ? t("profile.saveCta")
        : t("continue.cta");

  const canAdvance =
    currentStep === 1
      ? hasWallet && !isSyncingWallet
      : currentStep === 2
        ? isHandleValid && !isSavingHandle
        : !continueDisabled;

  const handlePrimaryAction = useCallback(() => {
    if (currentStep === 1) {
      if (hasWallet) {
        setCurrentStep(2);
      }
      return;
    }
    if (currentStep === 2) {
      void handleProfileSave();
      return;
    }
    void handleContinue();
  }, [currentStep, handleContinue, handleProfileSave, hasWallet]);

  const handleBack = useCallback(() => {
    setCurrentStep((step) => {
      if (step <= 1) {
        return 1;
      }
      return (step - 1) as StepKey;
    });
  }, []);

  const handleSkip = useCallback(() => {
    if (currentStep === 3) {
      void handleContinue();
    }
  }, [currentStep, handleContinue]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white/80">
        {t("loading")}
      </div>
    );
  }

  const stepItems = [
    {
      id: 1 as StepKey,
      icon: Wallet,
      label: t("steps.walletRequired"),
      completed: hasWallet,
    },
    {
      id: 2 as StepKey,
      icon: ChevronRight,
      label: t("steps.profile"),
      completed: hasHandle,
    },
    {
      id: 3 as StepKey,
      icon: Shield,
      label: t("steps.self"),
      completed: Boolean(session?.isSelfVerified),
    },
  ];

  const showSkip = currentStep === 3;

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-4 py-10 text-white sm:px-6 lg:px-0">
      <div className="rounded-3xl border border-white/10 bg-[#05090f]/85 p-6 shadow-[0_35px_130px_-80px_rgba(0,0,0,0.9)] sm:p-10">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              <Image
                src="/denlabs.png"
                alt="Den Labs logo"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">
                {t("title")}
              </h1>
              <p className="text-sm text-white/60">{t("subtitle")}</p>
            </div>
          </div>
          {statusMessage ? (
            <p className="flex items-center gap-2 text-sm text-emerald-300">
              <Check className="h-4 w-4" aria-hidden />
              {statusMessage}
            </p>
          ) : null}
          {errorMessage ? (
            <p className="text-sm text-red-300">{errorMessage}</p>
          ) : null}
        </header>

        <section className="mt-8 space-y-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {stepItems.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = step.completed;
              return (
                <div key={step.id} className="flex flex-1 items-center gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-semibold transition",
                      isActive
                        ? "border-white bg-white text-[#05090f]"
                        : isCompleted
                          ? "border-white/70 bg-white/10 text-white"
                          : "border-white/15 bg-transparent text-white/40",
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[0.75rem] font-semibold uppercase text-white/50">
                      {t("steps.stepLabel", { step: step.id })}
                    </p>
                    <p className="text-sm text-white/80">{step.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {currentStep === 1 ? (
            <div className="space-y-6">
              <div>
                <p className="text-lg font-semibold text-white">
                  {t("wallet.required.title")}
                </p>
                <p className="text-sm text-white/60">
                  {t("wallet.required.copy")}
                </p>
              </div>
              <ConnectWalletButton
                disabled={isSyncingWallet}
                className="inline-flex h-12 w-full justify-center rounded-full border border-white/20 bg-transparent text-sm font-semibold uppercase text-white transition hover:border-white/50"
                connectLabel={t("wallet.connectCta")}
                connectedLabel={t("wallet.changeCta")}
              />
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                <p className="text-xs uppercase text-white/45">
                  {t("wallet.statusLabel")}
                </p>
                <p className="mt-1 font-mono text-white">{walletStatus}</p>
                {!connectedWallet ? (
                  <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {t("wallet.required.blocker")}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-5">
              <p className="text-sm text-white/60">{t("profile.copy")}</p>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase text-white/55">
                  {t("profile.nameLabel")}
                </span>
                <input
                  type="text"
                  value={handleInput}
                  maxLength={32}
                  onChange={(event) => {
                    const sanitized = event.target.value
                      .replace(/\s+/g, "")
                      .slice(0, 32);
                    setHandleInput(sanitized);
                    setHandleError(null);
                  }}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/40 focus:outline-none"
                  placeholder={t("profile.namePlaceholder")}
                />
                {handleError ? (
                  <p className="text-xs text-red-300">{handleError}</p>
                ) : (
                  <p className="text-xs text-white/45">
                    {t("profile.handleHint")}
                  </p>
                )}
              </label>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-5">
              <p className="text-sm text-white/60">{t("profile.copy")}</p>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase text-white/55">
                  {t("profile.nameLabel")}
                </span>
                <input
                  type="text"
                  value={handleInput}
                  maxLength={32}
                  onChange={(event) => {
                    const sanitized = event.target.value
                      .replace(/\s+/g, "")
                      .slice(0, 32);
                    setHandleInput(sanitized);
                    setHandleError(null);
                  }}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/40 focus:outline-none"
                  placeholder={t("profile.namePlaceholder")}
                />
                {handleError ? (
                  <p className="text-xs text-red-300">{handleError}</p>
                ) : (
                  <p className="text-xs text-white/45">
                    {t("profile.handleHint")}
                  </p>
                )}
              </label>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-6">
              <div>
                <p className="text-lg font-semibold text-white">
                  {t("self.title")}
                </p>
                <p className="text-sm text-white/60">{t("self.copy")}</p>
              </div>
              {!hasWallet ? (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
                  <Lock className="h-4 w-4" aria-hidden />
                  <span>{t("self.requireWallet")}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/90 text-sm font-semibold uppercase text-[#05090f] transition hover:bg-white"
                    onClick={() => router.push("/auth")}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    {t("self.cta")}
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase text-white/55 underline-offset-4 hover:text-white"
                    onClick={() => setStatusMessage(t("self.skip"))}
                  >
                    {t("self.skipCta")}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </section>

        <footer className="mt-10 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-white/20 text-sm font-semibold uppercase text-white transition hover:border-white/40"
              >
                {t("navigation.back")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={!canAdvance}
              className={cn(
                "inline-flex h-12 flex-1 items-center justify-center rounded-full text-sm font-semibold uppercase transition",
                canAdvance
                  ? "bg-white text-[#05090f] hover:bg-white/90"
                  : "bg-white/30 text-white/50",
              )}
            >
              {currentStep === 3 && isContinuing
                ? t("continue.loading")
                : primaryActionLabel}
            </button>
          </div>
          {showSkip ? (
            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-center text-xs font-semibold uppercase text-white/60 underline-offset-4 hover:text-white disabled:text-white/30"
              disabled={continueDisabled}
            >
              {t("navigation.skipAndEnter")}
            </button>
          ) : null}
          <p className="text-center text-sm text-white/60">{continueHint}</p>
          <p className="text-center text-xs text-white/40">
            {t("navigation.help")}{" "}
            <a
              href="mailto:wolfcito.learn+opdl@gmail.com"
              className="text-white/80 underline-offset-4 hover:underline"
            >
              {t("navigation.contact")}
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
