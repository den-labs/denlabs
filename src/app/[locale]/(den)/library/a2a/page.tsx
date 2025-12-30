"use client";

import { LibraryModuleTabs, EmptyTabContent } from "@/components/library/LibraryModuleTabs";
import { useTranslations } from "next-intl";
import { Workflow } from "lucide-react";

export default function A2APage() {
  return (
    <LibraryModuleTabs
      modulePath="/library/a2a"
      defaultTab="concepts"
      tutorialContent={<EmptyTabContent tabName="Tutorial" />}
      demoContent={<DemoTab />}
      referenceContent={<EmptyTabContent tabName="Reference" />}
      conceptsContent={<ConceptsTab />}
    />
  );
}

function DemoTab() {
  const t = useTranslations("A2A");

  return (
    <div className="space-y-6">
      <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-8 text-center">
        <Workflow className="mx-auto mb-4 h-12 w-12 text-[#89e24a]" />
        <h3 className="text-xl font-semibold text-white">{t("test.title")}</h3>
        <p className="mt-2 text-sm text-white/60">{t("test.description")}</p>
        <button
          type="button"
          className="mt-6 rounded-lg border border-[#89e24a] bg-[#89e24a]/10 px-6 py-3 font-semibold text-[#89e24a] transition hover:bg-[#89e24a]/20"
        >
          {t("test.testCapabilities")}
        </button>
      </div>

      <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
        <h4 className="font-semibold text-white">Example Capabilities</h4>
        <ul className="mt-3 space-y-2 text-sm text-white/70">
          <li>• Query lab feedback data</li>
          <li>• Analyze retro packs</li>
          <li>• Suggest improvements</li>
          <li>• Cross-platform integration</li>
        </ul>
      </div>
    </div>
  );
}

function ConceptsTab() {
  const t = useTranslations("A2A");

  return (
    <div className="space-y-6 text-white">
      <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-6">
        <h3 className="text-xl font-semibold">{t("concept.title")}</h3>
        <p className="mt-2 text-white/70">{t("concept.description")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h4 className="font-semibold text-[#89e24a]">Capability Discovery</h4>
          <p className="mt-2 text-sm text-white/70">
            {t("concept.item1")}
          </p>
        </div>

        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h4 className="font-semibold text-[#89e24a]">Standardized Interfaces</h4>
          <p className="mt-2 text-sm text-white/70">
            {t("concept.item2")}
          </p>
        </div>

        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h4 className="font-semibold text-[#89e24a]">Interoperability</h4>
          <p className="mt-2 text-sm text-white/70">
            {t("concept.item3")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Use Cases in Event Feedback Ops</h4>

        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h5 className="font-semibold text-[#89e24a]">
            {t("useCases.case1Title")}
          </h5>
          <p className="mt-2 text-sm text-white/70">
            {t("useCases.case1Description")}
          </p>
        </div>

        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h5 className="font-semibold text-[#89e24a]">
            {t("useCases.case2Title")}
          </h5>
          <p className="mt-2 text-sm text-white/70">
            {t("useCases.case2Description")}
          </p>
        </div>

        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h5 className="font-semibold text-[#89e24a]">
            {t("useCases.case3Title")}
          </h5>
          <p className="mt-2 text-sm text-white/70">
            {t("useCases.case3Description")}
          </p>
        </div>
      </div>
    </div>
  );
}
