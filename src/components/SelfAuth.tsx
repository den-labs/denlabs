"use client";

import { getUniversalLink, type VerificationConfig } from "@selfxyz/core";
import { type SelfApp, SelfAppBuilder } from "@selfxyz/qrcode";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { normalizeSelfEndpoint } from "@/lib/selfEndpoint";
import {
  getSelfVerification,
  setSelfVerification,
} from "@/lib/selfVerification";

interface SelfAuthProps {
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

type QrWrapperProps = {
  selfApp: SelfApp;
  onSuccess: () => void;
  onError: (data: { error_code?: string; reason?: string }) => void;
  size?: number;
  darkMode?: boolean;
};

type QrWrapperComponent = (props: QrWrapperProps) => ReactElement | null;

export default function SelfAuth({ onSuccess, onError }: SelfAuthProps) {
  const t = useTranslations("SelfAuth");
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [missingConfig, setMissingConfig] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [universalLink, setUniversalLink] = useState<string | null>(null);
  const [deeplinkConfigured, setDeeplinkConfigured] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrWrapper, setQrWrapper] = useState<QrWrapperComponent | null>(null);
  const [qrWrapperError, setQrWrapperError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const Wrapper = qrWrapper;

  const markVerified = useCallback(() => {
    setSelfVerification(true);
    if (!isVerified) {
      onSuccess?.(undefined);
    }
    setIsVerified(true);
  }, [isVerified, onSuccess]);

  const clearVerified = useCallback(() => {
    setSelfVerification(false);
    setIsVerified(false);
  }, []);

  useEffect(() => {
    const detectMobile = () => {
      if (typeof window === "undefined") {
        return false;
      }
      const ua = window.navigator.userAgent || "";
      const navigatorInfo = window.navigator as Navigator & {
        msMaxTouchPoints?: number;
        userAgentData?: {
          mobile?: boolean;
        };
      };
      if (typeof navigatorInfo.userAgentData?.mobile === "boolean") {
        return navigatorInfo.userAgentData.mobile;
      }
      if (/Mobi|Android|iPhone|iPod|Phone/i.test(ua)) {
        return true;
      }
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const smallViewport = window.matchMedia("(max-width: 640px)").matches;
      const hasTouch =
        "ontouchstart" in window ||
        navigatorInfo.maxTouchPoints > 0 ||
        (navigatorInfo.msMaxTouchPoints ?? 0) > 0;
      return (coarsePointer || hasTouch) && smallViewport;
    };

    const updateMobileState = () => {
      setIsMobile(detectMobile());
    };

    updateMobileState();
    window.addEventListener("resize", updateMobileState);

    return () => {
      window.removeEventListener("resize", updateMobileState);
    };
  }, []);

  useEffect(() => {
    if (isVerified) {
      return;
    }
    if (getSelfVerification()) {
      markVerified();
    }
  }, [isVerified, markVerified]);

  useEffect(() => {
    const endpoint = normalizeSelfEndpoint(
      process.env.NEXT_PUBLIC_SELF_ENDPOINT ?? "",
    );
    const appName = process.env.NEXT_PUBLIC_SELF_APP_NAME ?? "";
    const scope = process.env.NEXT_PUBLIC_SELF_SCOPE ?? "";

    const missing: string[] = [];
    if (!appName) missing.push("NEXT_PUBLIC_SELF_APP_NAME");
    if (!scope) missing.push("NEXT_PUBLIC_SELF_SCOPE");
    if (!endpoint) missing.push("NEXT_PUBLIC_SELF_ENDPOINT");

    if (missing.length > 0) {
      setMissingConfig(missing);
      setSelfApp(null);
      return;
    }

    if (!userIdRef.current) {
      const randomId =
        typeof globalThis !== "undefined" &&
        typeof globalThis.crypto?.randomUUID === "function"
          ? globalThis.crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      userIdRef.current = randomId;
    }

    if (!sessionIdRef.current) {
      const randomSessionId =
        typeof globalThis !== "undefined" &&
        typeof globalThis.crypto?.randomUUID === "function"
          ? globalThis.crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      sessionIdRef.current = randomSessionId;
    }

    const devModeSetting = process.env.NEXT_PUBLIC_SELF_DEV_MODE;
    const devMode =
      devModeSetting != null
        ? devModeSetting === "true"
        : process.env.NODE_ENV !== "production";
    const endpointType = devMode ? "staging_https" : "https";
    const chainID = devMode ? 44787 : 42220;

    const compliance: Pick<
      VerificationConfig,
      "minimumAge" | "excludedCountries" | "ofac"
    > = {
      minimumAge: 18,
      excludedCountries: [],
      ofac: !devMode,
    };

    let deeplinkCallback = process.env.NEXT_PUBLIC_SELF_DEEPLINK_CALLBACK ?? "";
    if (!deeplinkCallback && typeof window !== "undefined") {
      try {
        const url = new URL(window.location.origin + pathname);
        url.searchParams.set("selfStatus", "verified");
        deeplinkCallback = url.toString();
      } catch (error) {
        console.warn("Failed to derive deeplink callback URL", error);
      }
    }

    const app = new SelfAppBuilder({
      appName,
      scope,
      endpoint,
      logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
      userId: userIdRef.current ?? "",
      userIdType: "uuid",
      devMode,
      endpointType,
      chainID,
      sessionId: sessionIdRef.current ?? undefined,
      deeplinkCallback,
      disclosures: {
        ...compliance,
        nationality: true,
        gender: true,
      },
    }).build();

    setMissingConfig([]);
    setSelfApp(app);
    if (deeplinkCallback) {
      setUniversalLink(getUniversalLink(app));
      setDeeplinkConfigured(true);
    } else {
      setUniversalLink(null);
      setDeeplinkConfigured(false);
    }
  }, [pathname]);

  useEffect(() => {
    let isActive = true;

    void import("@selfxyz/qrcode")
      .then((mod) => {
        if (!isActive) {
          return;
        }
        type SelfQrModule = {
          SelfQRcodeWrapper?: unknown;
          SelfQRcode?: unknown;
          default?: {
            SelfQRcodeWrapper?: unknown;
          };
        };

        const moduleExports = mod as unknown as SelfQrModule;
        const exportedWrapper =
          moduleExports.SelfQRcodeWrapper ??
          moduleExports.SelfQRcode ??
          moduleExports.default?.SelfQRcodeWrapper;

        if (typeof exportedWrapper === "function") {
          setQrWrapper(() => exportedWrapper as QrWrapperComponent);
          setQrWrapperError(false);
        } else {
          console.error(
            "Self verification unavailable: SelfQRcodeWrapper export not found. Verify @selfxyz/qrcode version.",
          );
          setQrWrapper(null);
          setQrWrapperError(true);
        }
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        console.error(
          "Self verification unavailable: failed to load SelfQRcodeWrapper.",
          error,
        );
        setQrWrapper(null);
        setQrWrapperError(true);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !searchParams) {
      return;
    }
    const status = searchParams.get("selfStatus");
    if (!status) {
      return;
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("selfStatus");

    if (status === "verified" && !isVerified) {
      markVerified();
      console.log("Self verification successful via deeplink!");
    } else if (status === "error") {
      const error = new Error("Verification failed");
      onError?.(error);
      clearVerified();
      console.error("Self verification error via deeplink.");
    }

    void router.replace(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`, {
      scroll: false,
    });
  }, [clearVerified, isVerified, markVerified, onError, router, searchParams]);

  const handleSuccess = () => {
    markVerified();
    console.log("Self verification successful!");
  };

  const handleError = (data: { error_code?: string; reason?: string }) => {
    const error = new Error(data.reason || "Verification failed");
    clearVerified();
    if (onError) {
      onError(error);
    }
    console.error("Self verification error:", data);
  };

  const handleOpenSelfApp = useCallback(() => {
    if (!universalLink) {
      return;
    }
    if (typeof window !== "undefined") {
      window.location.assign(universalLink);
    }
  }, [universalLink]);

  const handleQrToggle = (value: "hide" | "show") => {
    setShowQr(value === "show");
  };

  useEffect(() => {
    if (!isMobile) {
      setShowQr(true);
    }
  }, [isMobile]);

  return (
    <div className="wolf-card flex flex-col items-center justify-center gap-5 rounded-[1.9rem] border border-wolf-border-strong px-6 py-8 text-center text-wolf-foreground">
      {missingConfig.length > 0 ? (
        <div className="space-y-3">
          <div className="text-4xl">⚠️</div>
          <h3 className="text-lg font-semibold text-white">
            {t("error.missingConfig.title")}
          </h3>
          <p className="text-sm text-white/70">
            {t("error.missingConfig.body", {
              vars: missingConfig.join(", "),
            })}
          </p>
          <p className="text-xs text-wolf-text-subtle">
            {t("error.missingConfig.hint")}
          </p>
        </div>
      ) : isVerified ? (
        <div>
          <div className="mb-2 text-4xl">✅</div>
          <h3 className="text-lg font-semibold text-white">
            {t("success.title")}
          </h3>
          <p className="mt-2 text-sm text-white/70">{t("success.body")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {t("intro.title")}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              {isMobile ? t("intro.mobile") : t("intro.body")}
            </p>
          </div>
          {isMobile ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleOpenSelfApp}
                disabled={!universalLink}
                className="den-button-primary w-full text-sm tracking-[0.22em] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {t("intro.mobileCta")}
              </button>
              <p className="text-xs text-white/60">
                {deeplinkConfigured
                  ? t("intro.mobileHint")
                  : t("intro.mobileUnavailable")}
              </p>
              <fieldset className="space-y-2 rounded-[1.15rem] border border-wolf-border-soft px-4 py-3 text-left">
                <legend className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                  {t("intro.mobileQrLabel")}
                </legend>
                <div className="flex flex-col gap-2 text-sm text-white/80 sm:flex-row">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="mobile-qr-toggle"
                      value="hide"
                      checked={!showQr}
                      onChange={() => handleQrToggle("hide")}
                      className="h-4 w-4 accent-[#baff5c]"
                    />
                    <span>{t("intro.mobileQrHide")}</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="mobile-qr-toggle"
                      value="show"
                      checked={showQr}
                      onChange={() => handleQrToggle("show")}
                      className="h-4 w-4 accent-[#baff5c]"
                    />
                    <span>{t("intro.mobileQrShow")}</span>
                  </label>
                </div>
              </fieldset>
            </div>
          ) : null}
          {selfApp ? (
            !isMobile || showQr ? (
              Wrapper ? (
                <div className="mx-auto w-full max-w-[260px] sm:max-w-[300px] [&>div>div:first-child]:hidden [&>div>div:last-child]:overflow-hidden [&>div>div:last-child]:rounded-[1.15rem] [&>div>div:last-child]:border [&>div>div:last-child]:border-wolf-border-soft [&>div>div:last-child]:bg-wolf-charcoal-90/85 [&>div>div:last-child]:shadow-[0_28px_75px_-55px_rgba(0,0,0,0.7)]">
                  <Wrapper
                    selfApp={selfApp}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    size={260}
                    darkMode
                  />
                </div>
              ) : qrWrapperError ? (
                <p className="text-sm text-[#ff8f94]">
                  {t("error.missingWrapper")}
                </p>
              ) : (
                <p className="text-sm text-wolf-text-subtle">
                  {t("intro.loading")}
                </p>
              )
            ) : (
              <p className="text-sm text-wolf-text-subtle">
                {t("intro.mobileQrHidden")}
              </p>
            )
          ) : (
            <p className="text-sm text-wolf-text-subtle">
              {t("intro.loading")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
