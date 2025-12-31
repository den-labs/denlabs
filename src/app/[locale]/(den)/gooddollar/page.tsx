"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DenMain } from "@/components/den/RailSlots";
import { useDenUser } from "@/hooks/useDenUser";
import { useGoodDollar } from "@/hooks/useGoodDollar";
import { useGoodDollarInvite } from "@/hooks/useGoodDollarInvite";
import { Link } from "@/i18n/routing";
import { checkEligibility, claimReward } from "@/lib/gooddollar";

type State =
  | "idle"
  | "noWallet"
  | "noSelf"
  | "checking"
  | "eligible"
  | "ineligible"
  | "claiming"
  | "claimed"
  | "error";

type AppInfo = {
  userPercentage: number;
  inviterPercentage: number;
};

export default function GoodDollarPage() {
  const t = useTranslations("gooddollar");
  const { selfVerified } = useDenUser();
  const { initSDK, appAddress } = useGoodDollar();
  const { getInviter } = useGoodDollarInvite();
  const { address } = useAppKitAccount();

  const [state, setState] = useState<State>("idle");
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!address) {
        setState("noWallet");
        return;
      }

      if (!selfVerified) {
        setState("noSelf");
        return;
      }

      try {
        setState("checking");
        const rewards = await initSDK();
        const { can, appInfo } = await checkEligibility(
          rewards,
          appAddress,
          address as `0x${string}`,
        );
        setAppInfo(appInfo);
        setState(can ? "eligible" : "ineligible");
      } catch (err) {
        console.error(err);
        setErrorMsg(t("errors.generic"));
        setState("error");
      }
    };

    void run();
  }, [address, selfVerified, initSDK, appAddress, t]);

  const handleClaim = async () => {
    if (!address) return;

    try {
      setState("claiming");
      const rewards = await initSDK();
      const inviter = getInviter();
      const hash = await claimReward(
        rewards,
        appAddress,
        address as `0x${string}`,
        (inviter ||
          "0x0000000000000000000000000000000000000000") as `0x${string}`,
      );
      setTxHash(hash);
      setState("claimed");
    } catch (err) {
      console.error(err);
      setErrorMsg(t("errors.claimFailed"));
      setState("error");
    }
  };

  return (
    <DenMain>
      <main className="mx-auto max-w-2xl space-y-6 py-10">
        <section>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-sm text-zinc-400">{t("subtitle")}</p>
        </section>

        {state === "noWallet" && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-sm text-zinc-400">{t("states.noWallet")}</p>
          </div>
        )}

        {state === "noSelf" && (
          <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-sm">{t("states.noSelf.description")}</p>
            <Link
              href="/access"
              className="inline-block rounded-lg bg-[--den-lime] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[--den-lime]/90"
            >
              {t("actions.verifyWithSelf")}
            </Link>
          </div>
        )}

        {state === "checking" && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-sm text-zinc-400">{t("states.checking")}</p>
          </div>
        )}

        {state === "eligible" && (
          <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            {appInfo && (
              <p className="text-sm text-zinc-400">
                {t("appInfo.distribution", {
                  user: appInfo.userPercentage,
                  inviter: appInfo.inviterPercentage,
                })}
              </p>
            )}

            <button
              type="button"
              onClick={handleClaim}
              className="w-full rounded-lg bg-[--den-lime] px-4 py-3 font-medium text-black transition-colors hover:bg-[--den-lime]/90"
            >
              {t("actions.claim")}
            </button>

            <p className="text-xs text-zinc-500">{t("notes.limits")}</p>
          </div>
        )}

        {state === "ineligible" && (
          <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-sm">{t("states.ineligible.description")}</p>
            <p className="text-xs text-zinc-500">
              {t("states.ineligible.hint")}
            </p>
          </div>
        )}

        {state === "claiming" && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-sm text-zinc-400">{t("states.claiming")}</p>
          </div>
        )}

        {state === "claimed" && (
          <div className="space-y-4 rounded-lg border border-emerald-800/50 bg-emerald-900/20 p-6">
            <p className="text-sm font-medium text-emerald-400">
              {t("states.claimed.success")}
            </p>
            {txHash && (
              <a
                href={`https://celoscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm text-[--den-lime] underline hover:no-underline"
              >
                {t("states.claimed.viewTx")}
              </a>
            )}

            {address && (
              <div className="mt-4 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-sm font-medium">{t("invite.title")}</p>
                <p className="text-xs text-zinc-400">
                  {t("invite.description")}
                </p>
                <pre className="mt-2 overflow-x-auto rounded bg-zinc-950 p-3 text-xs text-zinc-300">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/gooddollar?invite=${address}`
                    : `https://denlabs.vercel.app/en/gooddollar?invite=${address}`}
                </pre>
              </div>
            )}
          </div>
        )}

        {state === "error" && errorMsg && (
          <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-4">
            <p className="text-sm text-red-400">{errorMsg}</p>
          </div>
        )}

        <section className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-400">
          <p className="mb-2 font-medium text-zinc-300">{t("faq.title")}</p>
          <ul className="list-inside list-disc space-y-1">
            <li>{t("faq.item1")}</li>
            <li>{t("faq.item2")}</li>
            <li>{t("faq.item3")}</li>
          </ul>
        </section>
      </main>
    </DenMain>
  );
}
