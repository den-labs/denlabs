"use client";

import { FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { RetroPackView } from "@/components/modules/labs/RetroPackView";
import { generateRetro } from "@/lib/eventLabsClient";
import type { RetroPack } from "@/lib/retroPack";

export default function RetroPackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [retro, setRetro] = useState<RetroPack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRetro() {
      setIsLoading(true);
      setError(null);

      try {
        const fetchedRetro = await generateRetro(slug);
        setRetro(fetchedRetro);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate retro pack",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchRetro();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-wolf-emerald" />
          <p className="mt-4 text-sm text-white/60">Generating retro pack...</p>
        </div>
      </div>
    );
  }

  if (error || !retro) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Link
          href={`/labs/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          ← Back to Lab
        </Link>
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error || "Failed to load retro pack"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/labs/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          ← Back to Lab
        </Link>

        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5">
            <FileText
              className="h-6 w-6 text-wolf-emerald"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-3xl font-semibold text-white">Retro Pack</h1>
        </div>
      </div>

      {/* Retro Pack Content */}
      <RetroPackView labSlug={slug} retro={retro} />
    </div>
  );
}
