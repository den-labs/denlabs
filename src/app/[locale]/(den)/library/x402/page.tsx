"use client";

import { LibraryModuleTabs, EmptyTabContent } from "@/components/library/LibraryModuleTabs";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

export default function X402Page() {
  return (
    <LibraryModuleTabs
      modulePath="/library/x402"
      defaultTab="concepts"
      tutorialContent={<EmptyTabContent tabName="Tutorial" />}
      demoContent={<DemoTab />}
      referenceContent={<EmptyTabContent tabName="Reference" />}
      conceptsContent={<ConceptsTab />}
    />
  );
}

function DemoTab() {
  const t = useTranslations("X402");

  return (
    <div className="space-y-6">
      <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-8 text-center">
        <Sparkles className="mx-auto mb-4 h-12 w-12 text-[#89e24a]" />
        <h3 className="text-xl font-semibold text-white">{t("demo.title")}</h3>
        <p className="mt-2 text-sm text-white/60">{t("demo.description")}</p>
        <button
          type="button"
          className="mt-6 rounded-lg border border-[#89e24a] bg-[#89e24a]/10 px-6 py-3 font-semibold text-[#89e24a] transition hover:bg-[#89e24a]/20"
        >
          {t("demo.tryDemo")}
        </button>
      </div>

      <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
        <h4 className="font-semibold text-white">Code Example</h4>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-4 text-xs text-white/80">
{`// Request premium feature with x402
const response = await fetch('/api/x402/analytics', {
  headers: {
    'X-Payment-Token': 'your-payment-token',
    'X-Payment-Amount': '0.001'
  }
});

if (response.status === 402) {
  // Payment required - show payment UI
  console.log('Premium feature requires payment');
} else if (response.ok) {
  // Payment accepted, feature unlocked
  const data = await response.json();
}`}
        </pre>
      </div>
    </div>
  );
}

function ConceptsTab() {
  const t = useTranslations("X402");

  return (
    <div className="space-y-6 text-white">
      <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-6">
        <h3 className="text-xl font-semibold">{t("concept.title")}</h3>
        <p className="mt-2 text-white/70">{t("concept.description")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h4 className="font-semibold text-[#89e24a]">Pay-per-use</h4>
          <p className="mt-2 text-sm text-white/70">
            {t("concept.item1")}
          </p>
        </div>

        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h4 className="font-semibold text-[#89e24a]">Micropayments</h4>
          <p className="mt-2 text-sm text-white/70">
            {t("concept.item2")}
          </p>
        </div>

        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h4 className="font-semibold text-[#89e24a]">Transparent pricing</h4>
          <p className="mt-2 text-sm text-white/70">
            {t("concept.item3")}
          </p>
        </div>
      </div>

      <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
        <h4 className="font-semibold">Use in Event Feedback Ops</h4>
        <p className="mt-2 text-sm text-white/70">
          Gate high-value labs behind small payments to ensure committed participants and reduce
          noise. Experimental feature for premium access control.
        </p>
      </div>
    </div>
  );
}
