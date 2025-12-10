"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { Grid3X3, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DenMain, DenRightRail } from "@/components/den/RailSlots";
import { useDenUser } from "@/hooks/useDenUser";
import { useGoodDollar } from "@/hooks/useGoodDollar";
import { useGoodDollarInvite } from "@/hooks/useGoodDollarInvite";
import { usePathname } from "@/i18n/routing";
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
        (inviter || "0x0000000000000000000000000000000000000000") as `0x${string}`,
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
    <>
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
      <DenRightRail>
        <GoodDollarRightSidebar />
      </DenRightRail>
    </>
  );
}

type ShortcutApp = {
  id: string;
  label: string;
  href: string;
  icon: typeof ShieldCheck;
};

const SHORTCUT_APPS: ShortcutApp[] = [
  {
    id: "auth",
    label: "Self.xyz Auth",
    href: "/auth",
    icon: ShieldCheck,
  },
];

function GoodDollarRightSidebar() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "en";
  const localePrefix = `/${locale}`;

  return (
    <aside className="hidden flex-col gap-6 lg:flex text-wolf-foreground">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search experiments"
          className="w-full rounded-full border border-wolf-border bg-wolf-panel/80 py-2.5 pl-10 pr-14 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89e24a]"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-wolf-border bg-wolf-panel px-2 py-0.5 text-[10px] text-white/60">
          ⌘K
        </kbd>
      </div>
      <section className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-5">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Shortcuts</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-md p-1.5 text-white/60 hover:bg-white/10"
            >
              <Grid3X3 className="h-4 w-4" aria-hidden />
              <span className="sr-only">Open apps grid</span>
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {SHORTCUT_APPS.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.id}
                href={`${localePrefix}${app.href}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-wolf-border-soft bg-wolf-panel/60 p-3 text-center text-xs text-white transition hover:bg-wolf-panel"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wolf-neutral-soft">
                  <Icon className="h-5 w-5 text-[#89e24a]" />
                </div>
                <span className="leading-tight">{app.label}</span>
                <span className="rounded-full bg-[#89e24a]/20 px-2 py-0.5 text-[10px] font-semibold text-[#89e24a]">
                  LIVE
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <div className="mt-auto flex flex-wrap gap-2 text-[11px] text-white/50">
        <Link href="#" className="hover:text-white">
          Support
        </Link>
        <span>•</span>
        <Link href="#" className="hover:text-white">
          Privacy
        </Link>
        <span>•</span>
        <Link href="#" className="hover:text-white">
          Terms
        </Link>
      </div>
    </aside>
  );
}
