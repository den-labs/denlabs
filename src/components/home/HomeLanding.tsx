"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Download,
  Menu,
  Scan,
  Send,
  Shield,
  Sparkles,
  TestTube,
  Workflow,
  X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DemoChooser } from "@/components/demo/DemoChooser";
import { Link } from "@/i18n/routing";
import { fetchUserSession } from "@/lib/userClient";

export default function HomeLanding() {
  const t = useTranslations("HomeLanding");
  const [enterLabHref, setEnterLabHref] = useState("/access");
  const [createLabHref, setCreateLabHref] = useState("/access");
  const [finalCtaHref, setFinalCtaHref] = useState("/access");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [isDemoChooserOpen, setIsDemoChooserOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchUserSession()
      .then((session) => {
        if (!cancelled && session?.hasProfile) {
          // User has wallet + handle, go directly to host console
          setEnterLabHref("/labs");
          setCreateLabHref("/labs/create");
          setFinalCtaHref("/labs/create");
        }
      })
      .catch(() => {
        // ignore errors, default CTAs go to /access which handles redirection
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const capabilities = t.raw("capabilities.items") as Array<{
    id: string;
    title: string;
    description: string;
    href: string;
    cta: string;
  }>;

  const outputs = t.raw("outputs.items") as Array<{
    title: string;
    description: string;
  }>;

  const howItWorksSteps = t.raw("howItWorks.steps") as Array<{
    title: string;
    description: string;
  }>;

  const faqItems = t.raw("faq.items") as Array<{
    question: string;
    answer: string;
  }>;

  const footerSections = t.raw("footer.sections") as {
    product: { title: string; links: Array<{ label: string; href: string }> };
    resources: { title: string; links: Array<{ label: string; href: string }> };
    community: {
      title: string;
      links: Array<{ label: string; href: string; external?: boolean }>;
    };
  };

  const capabilityIcons: Record<string, typeof Scan> = {
    "scan-8004": Scan,
    x402: Sparkles,
    a2a: Workflow,
  };

  const stepIcons = [Send, TestTube, CheckCircle2];

  const outputIcons = [AlertCircle, BarChart3, AlertTriangle, Shield, Download];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050809] text-white">
      {/* Background elements */}
      <div className="pointer-events-none fixed inset-0 bg-[url('/bgf.png')] bg-cover bg-center bg-no-repeat opacity-30" />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />

      {/* Navbar */}
      <nav
        className="relative z-50 border-b border-white/5 backdrop-blur-xl"
        aria-label={t("navbar.aria.navigation")}
      >
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/denlabs.png"
                alt={t("navbar.logo")}
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <span className="text-xl font-bold text-white">
                {t("navbar.logo")}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-8 md:flex">
              <a
                href="#capabilities"
                className="text-sm font-medium text-white/70 transition hover:text-white"
              >
                {t("navbar.links.capabilities")}
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-white/70 transition hover:text-white"
              >
                {t("navbar.links.howItWorks")}
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-white/70 transition hover:text-white"
              >
                {t("navbar.links.faq")}
              </a>
              <Link
                href={enterLabHref}
                className="inline-flex items-center gap-2 rounded-lg bg-[#baff5c] px-5 py-2.5 text-sm font-semibold text-[#09140a] transition hover:bg-[#89e24a] hover:shadow-[0_0_20px_rgba(186,255,92,0.35)]"
              >
                {t("navbar.links.enterLab")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={t("navbar.aria.toggleMenu")}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="mt-4 flex flex-col gap-4 border-t border-white/5 pt-4 md:hidden">
              {/* biome-ignore lint/a11y/useValidAnchor: Hash links for in-page navigation */}
              <a
                href="#capabilities"
                className="text-sm font-medium text-white/70 transition hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("navbar.links.capabilities")}
              </a>
              {/* biome-ignore lint/a11y/useValidAnchor: Hash links for in-page navigation */}
              <a
                href="#how-it-works"
                className="text-sm font-medium text-white/70 transition hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("navbar.links.howItWorks")}
              </a>
              {/* biome-ignore lint/a11y/useValidAnchor: Hash links for in-page navigation */}
              <a
                href="#faq"
                className="text-sm font-medium text-white/70 transition hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("navbar.links.faq")}
              </a>
              <Link
                href={enterLabHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#baff5c] px-5 py-2.5 text-sm font-semibold text-[#09140a] transition hover:bg-[#89e24a]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("navbar.links.enterLab")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-8 lg:py-32">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mb-4 text-xl font-semibold text-[#baff5c] sm:text-2xl">
              {t("hero.subtitle")}
            </p>
            <p className="mx-auto mb-10 max-w-2xl text-base text-white/70 sm:text-lg">
              {t("hero.description")}
            </p>

            {/* CTAs */}
            <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={createLabHref}
                className="inline-flex items-center gap-3 rounded-xl bg-[#baff5c] px-8 py-4 text-base font-semibold text-[#09140a] shadow-[0_0_20px_rgba(186,255,92,0.35)] transition hover:bg-[#89e24a] hover:shadow-[0_16px_40px_rgba(186,255,92,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#baff5c]"
              >
                <span>{t("hero.primaryCta.label")}</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={() => setIsDemoChooserOpen(true)}
                className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-white/10"
              >
                <span>{t("hero.secondaryCta.label")}</span>
              </button>
            </div>

            {/* Trust row */}
            <div className="flex flex-col items-center gap-6">
              <p className="text-sm font-medium uppercase tracking-wider text-white/50">
                {t("hero.trustRow.label")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 opacity-80">
                {/* Celo logo */}
                <svg
                  className="h-8 w-auto text-white/80"
                  viewBox="0 0 265 123"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M59.8435 0H0V60H59.8423V39.0558H49.9109C46.4875 46.6964 38.7819 52.0179 29.9635 52.0179C17.8065 52.0179 7.96128 42.0619 7.96128 29.9579C7.96128 17.8542 17.8065 7.9833 29.9635 7.9833C38.9529 7.9833 46.6585 13.4773 50.0833 21.288H59.8435V0ZM117.797 39.0547C114.288 46.695 106.668 52.0163 97.765 52.0168C85.9498 52.0168 76.2757 42.5747 75.8478 30.8149H127.729V0H67.8851V59.9986H127.729V39.0547H117.797ZM118.564 23.4335H76.7856C79.4393 13.5624 88.2565 7.9834 97.7599 7.9834C107.263 7.9834 115.483 13.2185 118.564 23.4335ZM256.954 29.9568C256.954 42.1458 247.193 52.0168 235.036 52.0168C222.965 52.0168 213.12 42.0605 213.12 29.9568C213.12 17.853 222.88 7.98209 235.036 7.98209C247.193 7.98209 256.954 17.7679 256.954 29.9568ZM265 0H205.157V60H265V0ZM187.744 39.0547H197.675V59.9986H135.692V0H145.794V29.9568C145.794 43.3478 155.725 51.9315 167.539 51.9315C176.7 51.9315 184.747 46.9517 187.744 39.0547Z"
                    fill="currentColor"
                  />
                </svg>
                {/* Self logo */}
                <svg
                  className="h-10 w-auto"
                  viewBox="0 0 192 72"
                  fill="none"
                  aria-hidden="true"
                >
                  <g clipPath="url(#self-a)">
                    <path
                      d="M36.246 27.63h-.01a8.37 8.37 0 0 0-8.37 8.37v.01a8.37 8.37 0 0 0 8.37 8.37h.01a8.37 8.37 0 0 0 8.37-8.37V36a8.37 8.37 0 0 0-8.37-8.37Z"
                      fill="#00FFB6"
                    />
                    <path
                      d="M19.816 28.25a9 9 0 0 1 9-9h17.38L65.446 0h-47.99L.236 17.22v28.33h19.58V28.24v.01Zm32.84-1.87v16.71a9 9 0 0 1-9 9h-16.71L7.026 72.01h47.99l17.22-17.22v-28.4h-19.58v-.01Z"
                      fill="#fff"
                    />
                  </g>
                  <path
                    d="M114.102 26.082c-.812-6.728-4.466-10.614-9.976-10.614-4.06 0-6.438 2.494-6.438 6.496 0 11.136 20.822 11.716 20.822 28.478 0 8.584-5.51 14.152-14.326 14.152-7.482 0-11.948-2.668-11.948-5.162 0-.928.232-3.016.232-5.104 0-2.378-.232-4.698-.232-5.162 0-.986.696-1.276 1.218-1.276s.986.232 1.218 1.16c2.32 9.164 5.626 12.934 11.368 12.934 4.35 0 6.902-2.842 6.902-7.714 0-14.384-20.706-13.746-20.706-28.478 0-7.83 5.046-12.934 13.34-12.934 4.35 0 10.904 1.508 10.904 4.234 0 .812-.116 2.9-.116 4.988l.116 4.524c0 .928-.522 1.218-1.044 1.218-.58 0-1.16-.232-1.334-1.74Zm22.971 13.398c3.712 0 5.916-1.856 5.916-5.046 0-3.77-2.262-6.206-5.51-6.206-4.234 0-6.902 3.654-7.772 10.672-.058.406.116.58.464.58h6.902Zm-15.254 6.09c0-12.238 5.974-20.242 15.138-20.242 7.076 0 11.716 5.22 11.716 14.094 0 2.204-.58 2.958-1.914 2.958h-16.82c-.348 0-.522.174-.522.406l-.058 2.262c0 9.57 3.712 15.776 10.034 15.776 3.016 0 5.046-1.102 7.366-3.19.464-.406.986-.464 1.392-.174.406.29.464.812.232 1.276-1.74 3.538-6.032 5.8-10.904 5.8-9.512 0-15.66-7.482-15.66-18.966Zm39.39 12.238c0 3.016 1.798 3.654 3.074 3.944.754.174.928.522.928.986 0 .406-.232.928-.986.928-.638 0-3.48-.348-6.554-.348-2.958 0-5.8.348-6.438.348-.754 0-.986-.522-.986-.928 0-.464.174-.812.928-.986 1.276-.29 3.074-.928 3.074-3.944V15.062c0-1.624-.638-2.088-1.914-2.436-.638-.174-.812-.522-.812-.986 0-.406.116-.812.87-.928 2.262-.348 5.858-1.334 7.424-2.9.348-.348.464-.406.754-.406.464 0 .638.174.638.58v49.822Zm24.117-31.552c.928 0 1.566.522 1.566 1.392 0 .986-.406 1.508-1.566 1.508h-6.032c-.87 0-1.276.348-1.276 1.044v27.608c0 3.016 1.798 3.654 3.074 3.944.754.174.928.522.928.986 0 .406-.232.928-.986.928-.638 0-3.48-.348-6.496-.348-3.016 0-5.858.348-6.496.348-.754 0-.986-.522-.986-.928 0-.464.174-.812.928-.986 1.276-.29 3.074-.928 3.074-3.944v-27.55c0-.754-.348-1.044-1.044-1.044l-1.624.058c-.58 0-1.044-.406-1.044-1.102 0-.522.174-.87.812-1.102l1.972-.754c.638-.29.928-.696.928-1.218v-2.088c0-8.99 5.278-15.544 12.586-15.544 4.93 0 8.12 3.132 8.12 6.67 0 1.74-.986 2.842-2.436 2.842-1.334 0-2.32-.522-2.958-2.204-1.044-2.842-1.856-4.698-3.828-4.698-2.494 0-4.524 3.306-4.524 13.282v1.856c0 .754.464 1.044 1.334 1.044h5.974Z"
                    fill="#fff"
                  />
                  <defs>
                    <clipPath id="self-a">
                      <path fill="#fff" d="M.236 0h72v72h-72z" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="mx-auto max-w-7xl px-6 py-24 lg:px-8"
        >
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#baff5c]">
              {t("howItWorks.label")}
            </p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              {t("howItWorks.title")}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {howItWorksSteps.map((step, index) => {
              const Icon = stepIcons[index];
              return (
                <div
                  key={step.title}
                  className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-8 backdrop-blur-sm transition hover:border-[#baff5c]/30 hover:bg-white/[0.08]"
                >
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#baff5c]/20 to-[#2fe68b]/10 transition group-hover:border-[#baff5c]/40 group-hover:shadow-[0_0_20px_rgba(186,255,92,0.3)]">
                    <Icon
                      className="h-7 w-7 text-[#baff5c]"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-sm font-bold text-[#baff5c]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-white/70">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Outputs */}
        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#baff5c]">
              {t("outputs.label")}
            </p>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {t("outputs.title")}
            </h2>
            <p className="mx-auto max-w-2xl text-base text-white/70">
              {t("outputs.description")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {outputs.map((output, index) => {
              const Icon = outputIcons[index];
              return (
                <div
                  key={output.title}
                  className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <Icon
                      className="h-6 w-6 text-white/80"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {output.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/70">
                    {output.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Capabilities */}
        <section
          id="capabilities"
          className="mx-auto max-w-7xl px-6 py-24 lg:px-8"
        >
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#baff5c]">
              {t("capabilities.label")}
            </p>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {t("capabilities.title")}
            </h2>
            <p className="mx-auto max-w-2xl text-base text-white/70">
              {t("capabilities.description")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {capabilities.map((capability) => {
              const Icon = capabilityIcons[capability.id];
              return (
                <Link
                  key={capability.id}
                  href={capability.href}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-8 backdrop-blur-sm transition hover:border-[#2fe68b]/40 hover:shadow-[0_8px_30px_rgba(47,230,139,0.15)]"
                >
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition group-hover:border-[#2fe68b]/40 group-hover:bg-[#2fe68b]/10">
                    <Icon
                      className="h-6 w-6 text-white/80 transition group-hover:text-[#2fe68b]"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-white">
                    {capability.title}
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-white/70">
                    {capability.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#2fe68b] transition group-hover:gap-3">
                    <span>{capability.cta}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl px-6 py-24 lg:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#baff5c]">
              {t("faq.label")}
            </p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              {t("faq.title")}
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item) => {
              const faqIndex = faqItems.indexOf(item);
              return (
                <div
                  key={item.question}
                  className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm transition hover:border-white/20"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 p-6 text-left transition"
                    onClick={() =>
                      setActiveFAQ(activeFAQ === faqIndex ? null : faqIndex)
                    }
                    aria-expanded={activeFAQ === faqIndex}
                  >
                    <span className="font-semibold text-white">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 flex-shrink-0 text-white/70 transition ${
                        activeFAQ === faqIndex ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {activeFAQ === faqIndex && (
                    <div className="border-t border-white/5 px-6 pb-6 pt-4">
                      <p className="text-sm leading-relaxed text-white/70">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-[#baff5c]/30 bg-gradient-to-br from-[#baff5c]/10 via-[#2fe68b]/5 to-transparent p-12 text-center backdrop-blur-sm">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(186,255,92,0.15),transparent_70%)]" />
            <div className="relative z-10">
              <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                {t("finalCta.title")}
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-base text-white/80">
                {t("finalCta.description")}
              </p>
              <Link
                href={finalCtaHref}
                className="inline-flex items-center gap-3 rounded-xl bg-[#baff5c] px-8 py-4 text-base font-semibold text-[#09140a] shadow-[0_0_20px_rgba(186,255,92,0.35)] transition hover:bg-[#89e24a] hover:shadow-[0_16px_40px_rgba(186,255,92,0.45)]"
              >
                <span>{t("finalCta.cta.label")}</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-white/10 bg-black/40 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {/* Logo & Tagline */}
              <div className="lg:col-span-1">
                <div className="mb-4 flex items-center gap-3">
                  <Image
                    src="/denlabs.png"
                    alt="DenLabs"
                    width={32}
                    height={32}
                    className="h-8 w-8"
                  />
                  <span className="text-lg font-bold text-white">DenLabs</span>
                </div>
                <p className="text-sm text-white/60">{t("footer.tagline")}</p>
              </div>

              {/* Product */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                  {footerSections.product.title}
                </h3>
                <ul className="space-y-3">
                  {footerSections.product.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="text-sm text-white/60 transition hover:text-white"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                  {footerSections.resources.title}
                </h3>
                <ul className="space-y-3">
                  {footerSections.resources.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="text-sm text-white/60 transition hover:text-white"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Community */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                  {footerSections.community.title}
                </h3>
                <ul className="space-y-3">
                  {footerSections.community.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="text-sm text-white/60 transition hover:text-white"
                        {...(link.external && {
                          target: "_blank",
                          rel: "noopener noreferrer",
                        })}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-12 border-t border-white/5 pt-8 text-center">
              <p className="text-sm text-white/50">
                {t("footer.legal.copyright")}
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Demo Chooser Modal */}
      <DemoChooser
        isOpen={isDemoChooserOpen}
        onClose={() => setIsDemoChooserOpen(false)}
      />
    </div>
  );
}
