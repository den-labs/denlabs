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
            <span className="wolf-pill bg-wolf-emerald-soft text-xs uppercase tracking-[0.28em] text-wolf-emerald">
              Live Mission Stream
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
