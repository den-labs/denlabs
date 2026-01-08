"use client";

import { FlaskConical, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LabCard } from "@/components/modules/labs/LabCard";
import { Button } from "@/components/ui/button";
import type { EventLab } from "@/lib/eventLabs";
import { listEventLabs } from "@/lib/eventLabsClient";

export default function LabsPage() {
  const t = useTranslations("Labs.list");
  const [labs, setLabs] = useState<EventLab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "active" | "paused" | "completed"
  >("all");

  useEffect(() => {
    async function fetchLabs() {
      setIsLoading(true);
      setError(null);

      try {
        const fetchedLabs = await listEventLabs();
        setLabs(fetchedLabs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch labs");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLabs();
  }, []);

  const filteredLabs = labs.filter((lab) => {
    if (filter === "all") return true;
    return lab.status === filter;
  });

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <FlaskConical
                className="h-6 w-6 text-wolf-emerald"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-3xl font-semibold text-white">My Labs</h1>
          </div>
          <p className="text-sm text-white/70">
            Create and manage feedback for your events.
          </p>
        </div>

        <Link href="/labs/create">
          <Button className="bg-wolf-emerald text-black hover:bg-wolf-emerald/90">
            <Plus className="mr-2 h-4 w-4" />
            New Lab
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-wolf-emerald text-black"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            filter === "active"
              ? "bg-wolf-emerald text-black"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setFilter("paused")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            filter === "paused"
              ? "bg-wolf-emerald text-black"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          Paused
        </button>
        <button
          type="button"
          onClick={() => setFilter("completed")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            filter === "completed"
              ? "bg-wolf-emerald text-black"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          Completed
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-wolf-emerald" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : filteredLabs.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
          <FlaskConical
            className="mx-auto h-12 w-12 text-white/20"
            aria-hidden="true"
          />
          <h3 className="mt-4 text-lg font-semibold text-white">
            {filter === "all"
              ? t("empty.title")
              : t("empty.titleFiltered", { filter })}
          </h3>
          <p className="mt-2 text-sm text-white/60">
            {filter === "all"
              ? t("empty.description")
              : t("empty.descriptionFiltered", { filter })}
          </p>
          {filter === "all" && (
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/labs/create">
                <Button className="bg-wolf-emerald text-black hover:bg-wolf-emerald/90">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("empty.cta")}
                </Button>
              </Link>
              <Link href="/labs/demo-event">
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <FlaskConical className="mr-2 h-4 w-4" />
                  {t("empty.demoLab")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLabs.map((lab) => (
            <LabCard key={lab.id} lab={lab} />
          ))}
        </div>
      )}
    </div>
  );
}
