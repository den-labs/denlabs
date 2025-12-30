import { FlaskConical, Grid3X3, Search } from "lucide-react";
import Link from "next/link";
import { DenMain, DenRightRail } from "@/components/den/RailSlots";
import { requireProfile } from "@/lib/accessGuards";

const DEFAULT_TABERNA_URL = "https://wolf-labs.vercel.app";

function normalizeUrl(rawUrl: string) {
  if (!rawUrl) return DEFAULT_TABERNA_URL;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  const sanitized = rawUrl.replace(/^\/+/, "");
  return `https://${sanitized}`;
}

export default async function TabernaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireProfile({ locale, nextPath: "/taberna" });
  const configuredUrl = process.env.NEXT_PUBLIC_TABERNA_URL ?? "";
  const tabernaUrl = normalizeUrl(configuredUrl || DEFAULT_TABERNA_URL);
  let iframeAllow = "camera; microphone; fullscreen";

  try {
    const origin = new URL(tabernaUrl).origin;
    iframeAllow = `camera ${origin}; microphone ${origin}; fullscreen`;
  } catch {
    iframeAllow = "camera; microphone; fullscreen";
  }

  return (
    <>
      <DenMain>
        <div className="space-y-6 text-wolf-foreground">
          <section className="px-6 py-6 shadow-[0_35px_105px_-75px_rgba(0,0,0,0.75)]">
            <div className="space-y-5">
              <iframe
                src={tabernaUrl}
                title="Wolf Den Taberna"
                allow={iframeAllow}
                className="aspect-[16/10] w-full rounded-lg border border-wolf-border bg-wolf-charcoal-75 sm:min-h-[420px]"
              />
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="wolf-pill bg-wolf-emerald-soft text-xs uppercase text-wolf-emerald">
                  Live Mission Stream
                </span>
              </div>
            </div>
          </section>
        </div>
      </DenMain>
      <DenRightRail>
        <TabernaRightSidebar locale={locale} />
      </DenRightRail>
    </>
  );
}

type ShortcutApp = {
  id: string;
  label: string;
  href: string;
  icon: typeof FlaskConical;
};

const SHORTCUT_APPS: ShortcutApp[] = [
  {
    id: "lab",
    label: "Lab Profile",
    href: "/lab",
    icon: FlaskConical,
  },
];

function TabernaRightSidebar({ locale }: { locale: string }) {
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
