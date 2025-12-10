import { Coins, Droplets, Grid3X3, Search } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DenMain, DenRightRail } from "@/components/den/RailSlots";
import SelfAuth from "@/components/SelfAuth";
import { requireWallet } from "@/lib/accessGuards";

export default async function AuthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireWallet({ locale, nextPath: "/auth" });
  const t = await getTranslations({ locale, namespace: "AuthPage" });
  const tips = t.raw("tips") as string[];

  return (
    <>
      <DenMain>
        <div className="space-y-8 text-wolf-foreground">
          <section className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
            <SelfAuth />
            <div className="wolf-card--muted px-6 py-6 text-sm text-white/75">
              <p className="text-xs uppercase tracking-[0.32em] text-wolf-text-subtle">
                {t("tipsTitle")}
              </p>
              <ul className="mt-3 space-y-2">
                {tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </DenMain>
      <DenRightRail>
        <AuthRightSidebar locale={locale} />
      </DenRightRail>
    </>
  );
}

type ShortcutApp = {
  id: string;
  label: string;
  href: string;
  icon: typeof Droplets;
};

const SHORTCUT_APPS: ShortcutApp[] = [
  {
    id: "gooddollar",
    label: "GoodDollar Rewards",
    href: "/gooddollar",
    icon: Coins,
  },
  {
    id: "spray",
    label: "Spray Disperser",
    href: "/spray",
    icon: Droplets,
  },
];

function AuthRightSidebar({ locale }: { locale: string }) {
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
