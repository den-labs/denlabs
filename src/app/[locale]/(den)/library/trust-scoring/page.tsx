"use client";

import { LibraryModuleTabs } from "@/components/library/LibraryModuleTabs";
import TrustScoringDemo from "./TrustScoringDemo";

export default function TrustScoringPage() {
  return (
    <LibraryModuleTabs
      modulePath="/library/trust-scoring"
      defaultTab="demo"
      tutorialContent={<TutorialTab />}
      demoContent={<TrustScoringDemo />}
      referenceContent={<ReferenceTab />}
      conceptsContent={<ConceptsTab />}
    />
  );
}

function TutorialTab() {
  return (
    <div className="space-y-6 text-white">
      <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-6">
        <h3 className="text-xl font-semibold">
          Getting Started with Trust Scoring
        </h3>
        <p className="mt-2 text-sm text-white/70">
          Learn how to integrate 8004 trust scoring into your event feedback
          system.
        </p>
      </div>

      <div className="space-y-4">
        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h4 className="font-semibold text-[#89e24a]">
            Step 1: Set up verification
          </h4>
          <p className="mt-2 text-sm text-white/70">
            Configure Self.xyz verification for your attendees to enable trust
            scoring.
          </p>
          <pre className="mt-3 rounded-lg bg-black/40 p-3 text-xs">
            {`// Example: Configure verification
const trustScore = await calculateTrustScore({
  selfVerified: true,  // +30 points
  walletConnected: true, // +20 points
  rateLimited: false    // No penalty
});`}
          </pre>
        </div>

        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h4 className="font-semibold text-[#89e24a]">
            Step 2: Score feedback items
          </h4>
          <p className="mt-2 text-sm text-white/70">
            Each feedback submission automatically receives a trust score
            (0-100).
          </p>
        </div>

        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h4 className="font-semibold text-[#89e24a]">
            Step 3: Filter by trust level
          </h4>
          <p className="mt-2 text-sm text-white/70">
            Use trust scores to prioritize high-quality feedback and filter
            spam.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReferenceTab() {
  return (
    <div className="space-y-6 text-white">
      <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-6">
        <h3 className="text-xl font-semibold">API Reference</h3>
        <p className="mt-2 text-sm text-white/70">
          Technical documentation for the 8004 trust scoring API.
        </p>
      </div>

      <div className="space-y-4">
        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h4 className="font-mono text-sm font-semibold text-[#89e24a]">
            GET /api/scan/8004
          </h4>
          <p className="mt-2 text-sm text-white/70">
            Scan an address or identifier to get trust score.
          </p>
          <div className="mt-3 space-y-2 text-xs">
            <div>
              <span className="text-white/50">Query params:</span>
              <code className="ml-2 rounded bg-black/40 px-2 py-1">
                id: string
              </code>
            </div>
            <div>
              <span className="text-white/50">Returns:</span>
              <code className="ml-2 rounded bg-black/40 px-2 py-1">
                {`{ status, message, data }`}
              </code>
            </div>
          </div>
        </div>

        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h4 className="font-semibold">Trust Score Calculation</h4>
          <pre className="mt-3 rounded-lg bg-black/40 p-3 text-xs text-white/80">
            {`Base score: 0
+ Self verified: +30
+ Wallet connected: +20
+ Good behavior: +50
- Rate limited (>10 submissions): -50

Final score: 0-100`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function ConceptsTab() {
  return (
    <div className="space-y-6 text-white">
      <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-6">
        <h3 className="text-xl font-semibold">What is Trust Scoring?</h3>
        <p className="mt-2 text-white/70">
          Trust scoring is a system that assigns a reliability score (0-100) to
          users based on verification status, wallet connection, and behavioral
          signals.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h4 className="font-semibold text-[#89e24a]">Why Trust Scoring?</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>• Reduce spam in feedback systems</li>
            <li>• Prioritize verified participants</li>
            <li>• Improve signal-to-noise ratio</li>
            <li>• Enable reputation-based features</li>
          </ul>
        </div>

        <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
          <h4 className="font-semibold text-[#89e24a]">Use Cases</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>• Event feedback collection</li>
            <li>• Demo day voting systems</li>
            <li>• Community governance</li>
            <li>• Reward distribution</li>
          </ul>
        </div>
      </div>

      <div className="wolf-card--muted rounded-xl border border-wolf-border-soft p-4">
        <h4 className="font-semibold">How it Works</h4>
        <div className="mt-3 space-y-3 text-sm text-white/70">
          <p>
            <strong className="text-white">1. Verification:</strong> Users
            verify their identity with Self.xyz to establish a baseline trust
            level (+30 points).
          </p>
          <p>
            <strong className="text-white">2. Wallet Connection:</strong>{" "}
            Connecting a wallet demonstrates ownership and adds to trust score
            (+20 points).
          </p>
          <p>
            <strong className="text-white">3. Behavioral Signals:</strong>{" "}
            Actions like submitting quality feedback, participating in events,
            and avoiding spam increase trust.
          </p>
          <p>
            <strong className="text-white">4. Rate Limiting:</strong> Excessive
            submissions ({">"}10 per session) trigger penalties to prevent
            abuse.
          </p>
        </div>
      </div>
    </div>
  );
}
