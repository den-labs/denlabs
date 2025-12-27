"use client";

import { FlaskConical, Scan, Sparkles, Workflow } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { fetchUserSession } from "@/lib/userClient";

export default function HomeLanding() {
  const t = useTranslations("HomeLanding");
  const [enterLabHref, setEnterLabHref] = useState("/access");

  useEffect(() => {
    let cancelled = false;
    fetchUserSession()
      .then((session) => {
        if (!cancelled && session?.hasProfile) {
          setEnterLabHref("/lab");
        }
      })
      .catch(() => {
        // ignore errors, default CTA stays on /access
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const experiments = t.raw("experiments.items") as Array<{
    id: string;
    title: string;
    description: string;
    href: string;
  }>;

  const experimentIcons: Record<string, typeof Scan> = {
    "8004-scan": Scan,
    x402: Sparkles,
    a2a: Workflow,
  };

  return (
    <div
      className="relative overflow-hidden text-white"
      style={{
        backgroundColor: "#050809",
        backgroundImage: "url('/bgf.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/80" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(160,83,255,0.32),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(60,196,134,0.28),transparent_52%)]" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-16 px-6 py-16 text-balance sm:px-10">
        {/* Hero Section */}
        <section className="flex flex-col items-center gap-8 text-center">
          <Image
            src="/logowolf.png"
            alt="DenLabs logo"
            width={350}
            height={350}
            className="mx-auto h-48 w-48 sm:h-60 sm:w-60"
            priority
          />

          <h1 className="max-w-[28ch] text-4xl font-semibold leading-tight sm:text-5xl">
            {t("hero.title")}
          </h1>

          <p className="text-xl font-semibold uppercase text-wolf-emerald">
            {t("hero.subtitle")}
          </p>

          <p className="max-w-[54ch] text-base text-white/75">
            {t("hero.description")}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={t("hero.primaryCta.href")}
              className="inline-flex items-center gap-3 rounded-xl border border-[#4ca22a] bg-[#89e24a] px-6 py-3 text-[0.85rem] font-semibold uppercase text-[#09140a] shadow-[0_0_20px_rgba(186,255,92,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(186,255,92,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#baff5c]"
            >
              <span>{t("hero.primaryCta.label")}</span>
            </Link>

            <a
              href={t("hero.secondaryCta.href")}
              className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-[0.85rem] font-semibold uppercase text-white transition hover:border-white/30 hover:bg-white/10"
            >
              <span>{t("hero.secondaryCta.label")}</span>
            </a>
          </div>

          <div className="mt-6 flex w-full max-w-[420px] gap-6 text-white/80 justify-between">
            <svg
              className="h-18 w-auto text-white/80"
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
        </section>

        {/* Experiments Section */}
        <section
          id="experiments"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-8"
        >
          <div className="mb-6 text-center">
            <p className="mb-2 text-sm font-semibold uppercase text-white/70">
              {t("experiments.label")}
            </p>
            <h2 className="text-2xl font-semibold text-white">
              {t("experiments.title")}
            </h2>
            <p className="mt-3 text-sm text-white/80">
              {t("experiments.description")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {experiments.map((experiment) => {
              const Icon = experimentIcons[experiment.id] || FlaskConical;
              return (
                <Link
                  key={experiment.id}
                  href={experiment.href}
                  className="group flex flex-col rounded-xl border border-white/10 bg-black/30 p-6 transition hover:border-wolf-emerald/40 hover:bg-wolf-emerald/5"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition group-hover:border-wolf-emerald/40 group-hover:bg-wolf-emerald/10">
                    <Icon
                      className="h-6 w-6 text-white/80 transition group-hover:text-wolf-emerald"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {experiment.title}
                  </h3>
                  <p className="text-sm text-white/70">
                    {experiment.description}
                  </p>
                  <div className="mt-4 text-sm font-semibold uppercase text-wolf-emerald transition group-hover:text-white">
                    Explore →
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section
          id="final-cta"
          className="flex flex-col items-center gap-4 rounded-2xl border border-wolf-emerald/40 bg-wolf-emerald/10 p-8 text-center"
        >
          <FlaskConical
            className="h-12 w-12 text-wolf-emerald"
            aria-hidden="true"
          />
          <p className="text-2xl font-semibold text-white">
            Ready to start building?
          </p>
          <p className="text-sm text-white/75">
            Access your lab, connect your wallet, and join the builder
            community.
          </p>
          <Link
            href={enterLabHref}
            className="den-button-primary inline-flex items-center gap-2"
          >
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
            <span>Enter Lab</span>
          </Link>
        </section>
      </main>
    </div>
  );
}
