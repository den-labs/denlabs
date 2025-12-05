"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import {
  Check,
  ChevronDown,
  Lock,
  Shield,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import ConnectWalletButton from "@/components/ui/ConnectWalletButton";
import { useRouter } from "@/i18n/routing";
import {
  fetchUserProfile,
  saveUserProfile,
  updateUserWallet,
} from "@/lib/userClient";
import type { LabUserProfile, UserRole } from "@/lib/userProfile";
import { cn } from "@/lib/utils";

type AccessGateProps = {
  walletRequired: boolean;
  nextPath?: string;
};

const ROLE_VALUES: UserRole[] = ["organizer", "player", "sponsor"];
const HANDLE_REGEX = /^[a-zA-Z0-9_.-]{3,24}$/;
type StepKey = 1 | 2 | 3;

function formatAddress(address?: `0x${string}` | null) {
  if (!address) {
    return "";
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function AccessGate({
  walletRequired,
  nextPath,
}: AccessGateProps) {
  const t = useTranslations("AccessGate");
  const router = useRouter();
  const { address } = useAppKitAccount();
  const [user, setUser] = useState<LabUserProfile | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [roleInput, setRoleInput] = useState<UserRole | "player">("player");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSyncingWallet, setIsSyncingWallet] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [didPrefill, setDidPrefill] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepKey>(1);
  const [handleError, setHandleError] = useState<string | null>(null);

  const profileComplete = Boolean(user);
  const hasWallet = Boolean(user?.wallet_address);
  const walletStepRequired = walletRequired && !hasWallet;
  const continueDisabled =
    !profileComplete || walletStepRequired || isContinuing;
  const resolvedNext = nextPath ?? "/lab";

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const existing = await fetchUserProfile();
      setUser(existing);
      if (existing && !didPrefill) {
        setNameInput(existing.name);
        setRoleInput(existing.role ?? "player");
        setDidPrefill(true);
        setCurrentStep(existing.wallet_address ? 3 : 2);
      } else if (!existing && !didPrefill) {
        setCurrentStep(1);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("errors.generic"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [didPrefill, t]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!user || !address || user.wallet_address === address) {
      return;
    }
    let aborted = false;
    setIsSyncingWallet(true);
    setStatusMessage(null);
    updateUserWallet({ id: user.id, walletAddress: address })
      .then((updated) => {
        if (!aborted && updated) {
          setUser(updated);
          setStatusMessage(t("status.walletConnected"));
        }
      })
      .catch((error) => {
        if (!aborted) {
          setErrorMessage(
            error instanceof Error ? error.message : t("errors.generic"),
          );
        }
      })
      .finally(() => {
        if (!aborted) {
          setIsSyncingWallet(false);
        }
      });

    return () => {
      aborted = true;
    };
  }, [address, t, user]);

  const handleProfileSave = useCallback(async () => {
    if (!HANDLE_REGEX.test(nameInput)) {
      setHandleError(t("profile.handleInvalid"));
      return false;
    }
    setIsSavingProfile(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const saved = await saveUserProfile({
        id: user?.id,
        name: nameInput,
        role: roleInput || "player",
      });
      if (saved) {
        setUser(saved);
        setDidPrefill(true);
        setStatusMessage(t("status.profileSaved"));
        setCurrentStep(saved.wallet_address ? 3 : 2);
        setHandleError(null);
        return true;
      }
      return false;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("errors.generic"),
      );
      return false;
    } finally {
      setIsSavingProfile(false);
    }
  }, [nameInput, roleInput, t, user?.id]);

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
    if (!profileComplete) {
      return t("wallet.messages.profileFirst");
    }
    if (isSyncingWallet) {
      return t("wallet.messages.connecting");
    }
    if (user?.wallet_address) {
      return `${t("wallet.messages.connected")} ${formatAddress(
        user.wallet_address as `0x${string}`,
      )}`;
    }
    return t("wallet.messages.notConnected");
  }, [profileComplete, isSyncingWallet, t, user?.wallet_address]);

  const showBlockedSelfCard = !user?.wallet_address;
  const isHandleValid = HANDLE_REGEX.test(nameInput);
  const continueHint = !profileComplete
    ? t("continue.hintProfile")
    : walletStepRequired
      ? t("continue.hintWallet")
      : t("continue.hintReady");
  const primaryActionLabel =
    currentStep === 1
      ? t("profile.saveCta")
      : currentStep === 3
        ? t("continue.cta")
        : t("navigation.next");
  const canAdvance =
    currentStep === 1
      ? isHandleValid && !isSavingProfile
      : currentStep === 2
        ? !walletRequired || hasWallet
        : !continueDisabled;

  const stepItems = [
    {
      id: 1 as StepKey,
      icon: User,
      label: t("steps.profile"),
      completed: profileComplete,
    },
    {
      id: 2 as StepKey,
      icon: Wallet,
      label: walletRequired
        ? t("steps.walletRequired")
        : t("steps.walletOptional"),
      completed: hasWallet,
    },
    {
      id: 3 as StepKey,
      icon: Shield,
      label: t("steps.self"),
      completed: Boolean(user?.self_verified),
    },
  ];

  const handlePrimaryAction = useCallback(async () => {
    if (currentStep === 1) {
      if (!isHandleValid || isSavingProfile) {
        setHandleError(t("profile.handleInvalid"));
        return;
      }
      await handleProfileSave();
      return;
    }
    if (currentStep === 3) {
      await handleContinue();
      return;
    }
    setCurrentStep((step) => Math.min((step + 1) as StepKey, 3));
  }, [
    currentStep,
    handleContinue,
    handleProfileSave,
    isHandleValid,
    isSavingProfile,
    t,
  ]);

  const handleBack = useCallback(() => {
    setCurrentStep((step) => Math.max((step - 1) as StepKey, 1));
  }, []);

  const handleSkip = useCallback(() => {
    if (currentStep === 2 && !walletRequired) {
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3 && !continueDisabled) {
      void handleContinue();
    }
  }, [continueDisabled, currentStep, handleContinue, walletRequired]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white/80">
        {t("loading")}
      </div>
    );
  }

  const showSkip =
    (currentStep === 2 && !walletRequired) ||
    (currentStep === 3 && !walletStepRequired);

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
              <h1 className="text-3xl font-semibold tracking-tight text-white">
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
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.28em] text-white/50">
                      {t("steps.stepLabel", { step: step.id })}
                    </p>
                    <p className="text-sm text-white/80">{step.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {currentStep === 1 ? (
            <div className="space-y-5">
              <p className="text-sm text-white/60">{t("profile.copy")}</p>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/55">
                  {t("profile.nameLabel")}
                </span>
                <input
                  type="text"
                  value={nameInput}
                  maxLength={24}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const sanitized = event.target.value
                      .replace(/\s+/g, "")
                      .slice(0, 24);
                    setNameInput(sanitized);
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
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/55">
                  {t("profile.roleLabel")}
                </span>
                <div className="relative">
                  <select
                    value={roleInput}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setRoleInput(event.target.value as UserRole | "player")
                    }
                    className="w-full appearance-none rounded-2xl border border-white/15 bg-white/5 px-4 py-3 pr-10 text-sm text-white focus:border-white/40 focus:outline-none"
                  >
                    {ROLE_VALUES.map((value) => (
                      <option
                        key={value}
                        value={value}
                        className="bg-[#05090f]"
                      >
                        {t(
                          `profile.roles.${value.toLowerCase() as Lowercase<UserRole>}`,
                        )}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                </div>
              </label>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-6">
              <div>
                <p className="text-lg font-semibold text-white">
                  {walletRequired
                    ? t("wallet.required.title")
                    : t("wallet.optional.title")}
                </p>
                <p className="text-sm text-white/60">
                  {walletRequired
                    ? t("wallet.required.copy")
                    : t("wallet.optional.copy")}
                </p>
              </div>
              <ConnectWalletButton
                disabled={!profileComplete}
                className="inline-flex h-12 w-full justify-center rounded-full border border-white/20 bg-transparent text-sm font-semibold uppercase tracking-[0.28em] text-white transition hover:border-white/50"
                connectLabel={t("wallet.connectCta")}
                connectedLabel={t("wallet.changeCta")}
              />
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                <p className="text-xs uppercase tracking-[0.32em] text-white/45">
                  {t("wallet.statusLabel")}
                </p>
                <p className="mt-1 font-mono text-white">{walletStatus}</p>
                {!walletRequired ? (
                  <p className="mt-3 text-xs text-white/50">
                    {t("wallet.skipMessage")}
                  </p>
                ) : null}
                {walletStepRequired ? (
                  <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {t("wallet.required.blocker")}
                  </p>
                ) : null}
              </div>
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
              {showBlockedSelfCard ? (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
                  <Lock className="h-4 w-4" aria-hidden />
                  <span>{t("self.requireWallet")}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/90 text-sm font-semibold uppercase tracking-[0.28em] text-[#05090f] transition hover:bg-white"
                    onClick={() => router.push("/auth")}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    {t("self.cta")}
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55 underline-offset-4 hover:text-white"
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
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-white/20 text-sm font-semibold uppercase tracking-[0.28em] text-white transition hover:border-white/40"
              >
                {t("navigation.back")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={!canAdvance}
              className={cn(
                "inline-flex h-12 flex-1 items-center justify-center rounded-full text-sm font-semibold uppercase tracking-[0.3em] transition",
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
              className="w-full text-center text-xs font-semibold uppercase tracking-[0.32em] text-white/60 underline-offset-4 hover:text-white disabled:text-white/30"
              disabled={currentStep === 3 && continueDisabled}
            >
              {currentStep === 3
                ? t("navigation.skipAndEnter")
                : t("navigation.skip")}
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
