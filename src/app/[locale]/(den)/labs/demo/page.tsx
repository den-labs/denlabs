"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createEventLab } from "@/lib/eventLabsClient";

export default function DemoLabPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createDemoLab() {
      try {
        // Try to create the demo lab
        await createEventLab({
          name: "Demo Event Lab",
          objective:
            "Explore Event Feedback Ops with this demo lab. Submit feedback and see how signals are captured.",
          surfaces_to_observe: ["/lab/demo-event"],
          start_date: new Date().toISOString(),
          slug: "demo-event",
        });

        // Success - redirect to the demo lab
        router.push("/lab/demo-event");
      } catch (err) {
        // If 409 conflict (lab already exists), redirect anyway
        if (err instanceof Error && err.message.includes("already exists")) {
          router.push("/lab/demo-event");
          return;
        }

        // Other errors - show error message
        setError(
          err instanceof Error ? err.message : "Failed to create demo lab",
        );
      }
    }

    createDemoLab();
  }, [router]);

  if (error) {
    return (
      <div className="container mx-auto max-w-2xl space-y-6 px-4 py-16 text-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
          <h1 className="mb-2 text-2xl font-bold text-red-400">
            Failed to Start Demo Lab
          </h1>
          <p className="mb-6 text-sm text-red-400/80">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/labs/create")}
            className="inline-flex items-center gap-2 rounded-lg bg-wolf-emerald px-6 py-3 text-sm font-semibold text-black transition hover:bg-wolf-emerald/90"
          >
            Create Your Own Lab Instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-wolf-emerald" />
        <p className="mt-4 text-sm text-white/70">
          Setting up your demo lab...
        </p>
      </div>
    </div>
  );
}
