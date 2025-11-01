import { useTranslations } from "next-intl";
import BlogHighlights from "@/components/den/BlogHighlights";
import VerificationBadge from "@/components/ui/VerificationBadge";
import { Link } from "@/i18n/routing";

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
}

export default function HomeLanding() {
  const t = useTranslations("HomeLanding");

  const strategicPillars = t.raw("pillars.items") as Array<{
    title: string;
    description: string;
  }>;
  const modules = t.raw("modules") as ModuleCard[];
  const flows = t.raw("flows.items") as Array<{
    title: string;
    description: string;
  }>;
  const metrics = t.raw("metrics.items") as Array<{
    value: string;
    label: string;
  }>;
  const highlights = t.raw("highlights.items") as Array<{
    title: string;
    description: string;
  }>;

  return (
    <div className="relative overflow-hidden text-white">
      <div
        className="den-blob pointer-events-none"
        style={{ left: "-18rem", top: "-14rem" }}
      />
      <div
        className="den-blob den-blob--warm pointer-events-none"
        style={{ right: "-20rem", top: "26rem" }}
      />
      <div
        className="den-blob pointer-events-none"
        style={{ right: "-12rem", bottom: "-14rem" }}
      />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-24 px-6 py-16 sm:px-10 lg:px-16">
        <section className="relative grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <span className="wolf-pill">{t("hero.tagline")}</span>
            <h1 className="text-balance text-white">{t("hero.title")}</h1>
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-wolf-text-subtle">
              {t("hero.subtitle")}
            </p>
            <p className="max-w-[42ch] text-lg text-white/80">
              {t("hero.description")}
            </p>
            <VerificationBadge className="mt-2" />
            <div className="flex flex-wrap gap-4">
              <Link
                href={t("hero.primaryCta.href")}
                className="den-button-primary"
              >
                {t("hero.primaryCta.label")}
              </Link>
              <Link
                href={t("hero.secondaryCta.href")}
                className="den-button-ghost"
              >
                {t("hero.secondaryCta.label")}
              </Link>
            </div>
          </div>
          <div className="wolf-card den-halo-accent den-noise-surface relative h-full min-h-[360px] overflow-hidden p-10">
            <div className="pointer-events-none absolute inset-x-10 top-10 h-20 rounded-full bg-[radial-gradient(circle_at_top,#baff5c_0%,rgba(10,12,13,0)_75%)] opacity-70" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-wolf-text-subtle">
                {t("hero.visionLabel")}
              </p>
              <p className="text-2xl font-semibold text-white">
                {t("hero.visionQuote")}
              </p>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                {t("hero.visionSource")}
              </div>
            </div>
          </div>
        </section>

        <section className="wolf-card den-noise-surface rounded-[2.5rem] border border-wolf-border-strong/60 p-10">
          <header className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-wolf-text-subtle">
              {t("highlights.label")}
            </p>
            <h2 className="text-3xl font-semibold text-white">
              {t("highlights.title")}
            </h2>
            <p className="max-w-[46ch] text-sm text-white/75">
              {t("highlights.description")}
            </p>
          </header>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {highlights.map((highlight) => (
              <article
                key={highlight.title}
                className="wolf-card--muted den-glass rounded-[1.9rem] border border-wolf-border-mid/70 p-6"
              >
                <h3 className="text-lg font-semibold text-white">
                  {highlight.title}
                </h3>
                <p className="mt-3 text-sm text-white/75">
                  {highlight.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="wolf-card den-noise-surface rounded-[2.5rem] border border-wolf-border-strong/60 p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[36ch]">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-wolf-text-subtle">
                {t("metrics.label")}
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                {t("metrics.title")}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {t("metrics.description")}
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-4 text-center sm:grid-cols-3 lg:grid-cols-6">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="wolf-card--muted den-glass rounded-[1.6rem] border border-wolf-border-mid/70 px-4 py-4"
                >
                  <p className="text-2xl font-semibold text-white">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-wolf-text-subtle">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-14">
          <header className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-wolf-emerald">
                {t("pillars.label")}
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                {t("pillars.title")}
              </h2>
            </div>
            <p className="max-w-[36ch] text-sm text-white/70">
              {t("pillars.description")}
            </p>
          </header>
          <div className="grid gap-8 lg:grid-cols-3">
            {strategicPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="wolf-card--muted den-glass rounded-[1.9rem] border border-wolf-border-soft p-6"
              >
                <h3 className="text-xl font-semibold text-white">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm text-white/75">
                  {pillar.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="wolf-card den-noise-surface rounded-[2.5rem] border border-wolf-border-strong/60 p-10">
          <header className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-wolf-text-subtle">
                {t("modulesLabel")}
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                {t("modulesTitle")}
              </h2>
            </div>
            <p className="max-w-[38ch] text-sm text-white/75">
              {t("modulesDescription")}
            </p>
          </header>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <article
                key={module.id}
                className="wolf-card--muted den-glass flex h-full flex-col justify-between rounded-[1.9rem] border border-wolf-border p-6 transition hover:-translate-y-1 hover:border-wolf-border-xstrong hover:shadow-[0_0_28px_rgba(160,83,255,0.35)]"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {module.title}
                  </h3>
                  <p className="mt-3 text-sm text-white/70">
                    {module.description}
                  </p>
                  {module.id === "showcase" ? (
                    <VerificationBadge className="mt-4" />
                  ) : null}
                </div>
                <Link
                  href={module.cta.href}
                  className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-wolf-emerald transition hover:text-white"
                >
                  {module.cta.label}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-10">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-wolf-text-subtle">
              {t("flows.label")}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {t("flows.title")}
            </h2>
          </header>
          <div className="grid gap-6 lg:grid-cols-3">
            {flows.map((flow) => (
              <article
                key={flow.title}
                className="wolf-card--muted den-glass rounded-[1.9rem] border border-wolf-border-mid/70 p-6"
              >
                <h3 className="text-xl font-semibold text-white">
                  {flow.title}
                </h3>
                <p className="mt-3 text-sm text-white/75">{flow.description}</p>
              </article>
            ))}
          </div>
        </section>

        <BlogHighlights />
      </main>
    </div>
  );
}
