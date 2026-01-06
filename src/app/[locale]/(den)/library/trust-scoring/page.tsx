"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  Shield,
  XCircle,
} from "lucide-react";
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
      bestPracticesContent={<BestPracticesTab />}
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

function BestPracticesTab() {
  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#89e24a]/10">
            <Shield className="h-6 w-6 text-[#89e24a]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Best Practices (ERC-8004)</h3>
            <p className="mt-2 text-white/70">
              Trust isn't a feature — it's infrastructure. ERC-8004 defines
              identity, reputation, and validation primitives for autonomous
              agents, but trustworthy systems depend on how you publish
              metadata, record feedback, and defend against abuse.
            </p>
            <p className="mt-3 text-sm text-white/50">
              This page is implementation-agnostic. We separate{" "}
              <strong className="text-white/70">ERC-8004 Standard</strong>{" "}
              (interoperability requirements) from{" "}
              <strong className="text-white/70">DenLabs Profile</strong> (our
              recommended defaults).
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Agent Identity */}
      <BestPracticeSection
        number={1}
        title="Establish a Clear Agent Identity"
        goal="Make every actor discoverable, stable, and attributable."
        standard={[
          "Register a stable AgentID (do not rotate identifiers to reset history).",
          "Publish an AgentURI that is reachable and durable.",
          "Ensure metadata is accurate and versioned.",
        ]}
        profile={[
          "One canonical identity per agent + one public 'Agent Card' page.",
          "AgentURI should include: name, description, version, capabilities[], endpoints (HTTP/MCP/A2A) with versions, registrations[] (chain + contract addresses), optional attestations[] (e.g., Self.xyz verification).",
        ]}
        antiPatterns={[
          "Creating a new AgentID per release.",
          "Metadata that cannot be resolved reliably (broken URLs, ephemeral hosts).",
        ]}
      />

      {/* Section 2: Reputation */}
      <BestPracticeSection
        number={2}
        title="Design Honest & Verifiable Reputation"
        goal="Reputation must reflect real interactions with evidence and context."
        standard={[
          "Keep minimal signals on-chain (IDs, pointers, hashes).",
          "Store rich feedback off-chain via URI + integrity hash.",
        ]}
        profile={[
          "Every feedback record SHOULD include: timestamp (ISO 8601), context (event/session/task identifiers), actor identifier (wallet/session/proof reference), structured outcome (labels, score, tags), evidence[] (tx hashes, links, attachments, logs).",
          "Use consistent schemas so third parties can index and compare outcomes.",
        ]}
        antiPatterns={[
          "Star ratings with no context.",
          "Reputation based only on unverifiable self-reports.",
        ]}
      />

      {/* Section 3: Validation */}
      <BestPracticeSection
        number={3}
        title="Use Validation for High-Impact Work"
        goal="Add measurable confidence for sensitive or high-value operations."
        standard={[
          "High-value payouts / grant decisions",
          "Governance voting eligibility",
          "Security-sensitive workflows",
          "Irreversible actions",
        ]}
        standardLabel="When to require validation"
        profile={[
          "A validation record SHOULD include: target (what was validated), validator identity (who validated), methodology + criteria, result + confidence score, reproducible artifacts (report hashes, logs, signed statements).",
        ]}
        antiPatterns={[
          "'Trust me' validations without methodology or evidence.",
        ]}
      />

      {/* Section 4: On-Chain vs Off-Chain */}
      <BestPracticeSection
        number={4}
        title="Optimize On-Chain vs Off-Chain Data"
        goal="Scale without losing integrity."
        standard={[
          "On-chain: AgentID, pointers (URI), hashes, minimal counters/flags",
          "Off-chain: heavy payloads (feedback bodies, reports, attachments, analytics)",
        ]}
        standardLabel="Recommended split"
        profile={[
          "Cost and throughput optimization",
          "Indexability for third-party consumers",
          "Privacy controls where needed",
          "Upgradeability without migrations",
        ]}
        profileLabel="Why it matters"
      />

      {/* Section 5: Interfaces */}
      <BestPracticeSection
        number={5}
        title="Publish Clear Interfaces & Documentation"
        goal="Interoperability is a trust multiplier."
        standard={[
          "Versioned endpoints (/v1/...)",
          "Clear capability descriptions (inputs/outputs, constraints)",
          "Error taxonomy + rate limits",
        ]}
        standardLabel="Required"
        profile={[
          "'Happy-path' examples",
          "Explicit assumptions (what you do NOT protect against)",
          "Stability policy (how breaking changes are handled)",
        ]}
        profileLabel="Provide"
      />

      {/* Section 6: Abuse Resistance */}
      <BestPracticeSection
        number={6}
        title="Long-Term Trust & Abuse Resistance"
        goal="Trust compounds; abuse scales."
        standard={[
          "Rate limiting: cap submissions per session and per wallet",
          "Sybil resistance: require stronger proofs for higher trust tiers (e.g., Self.xyz)",
          "Evidence gating: higher scores require stronger evidence",
          "Recency weighting: recent behavior matters more than old history",
          "Anomaly detection: bursts, repeated patterns, recycled content",
        ]}
        standardLabel="Recommended defenses"
        antiPatterns={[
          "New identities reaching max trust instantly.",
          "Unlimited submissions per session.",
        ]}
      />

      {/* Implementation Checklist */}
      <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-6">
        <h4 className="flex items-center gap-2 text-lg font-semibold">
          <CheckCircle2 className="h-5 w-5 text-[#89e24a]" />
          Implementation Checklist
        </h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ChecklistGroup
            title="Identity"
            items={[
              "AgentID is stable and unique",
              "AgentURI is durable and versioned",
              "Agent Card exists for human discovery",
            ]}
          />
          <ChecklistGroup
            title="Reputation"
            items={[
              "Feedback schema is standardized",
              "Feedback includes timestamp + context + evidence",
              "On-chain pointers include URI + hash (integrity)",
            ]}
          />
          <ChecklistGroup
            title="Validation"
            items={[
              "High-impact flows require validation",
              "Validation records include methodology + reproducible artifacts",
            ]}
          />
          <ChecklistGroup
            title="Interoperability"
            items={[
              "APIs are versioned and documented",
              "Capabilities are machine-readable",
              "Error taxonomy + rate limit policy published",
            ]}
          />
        </div>
      </div>

      {/* Templates */}
      <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-6">
        <h4 className="flex items-center gap-2 text-lg font-semibold">
          <FileCode2 className="h-5 w-5 text-[#89e24a]" />
          Templates
        </h4>

        <div className="mt-4 space-y-4">
          <CodeTemplate
            title="AgentURI (minimal useful example)"
            code={`{
  "name": "DenLabs Trust Scorer",
  "description": "Trust scoring for event feedback operations.",
  "version": "1.0.0",
  "capabilities": ["trust_score", "feedback_filtering"],
  "endpoints": [
    { "type": "http", "url": "https://denlabs.vercel.app/api/scan/8004", "version": "v1" }
  ],
  "registrations": [
    { "chain": "eip155:1", "contract": "0x...", "standard": "erc-8004" }
  ]
}`}
          />

          <CodeTemplate
            title="Feedback record (off-chain)"
            code={`{
  "subject": { "type": "agent", "id": "AgentID:123" },
  "actor": { "type": "wallet", "id": "eip155:1:0xabc..." },
  "timestamp": "yyyy-mm-ddThh:mm:ssZ",
  "context": { "event": "DenLabs Demo Day", "session": "retro-pack-01" },
  "rating": { "label": "useful", "value": 1 },
  "evidence": [
    { "type": "tx", "ref": "0xdeadbeef..." },
    { "type": "url", "ref": "https://..." }
  ],
  "notes": "Actionable feedback with reproducible details."
}`}
          />

          <CodeTemplate
            title="Validation record (off-chain)"
            code={`{
  "target": { "type": "feedback_item", "id": "feedback:0xhash" },
  "validator": { "type": "entity", "id": "validator:denlabs" },
  "timestamp": "yyyy-mm-ddThh:mm:ssZ",
  "method": { "name": "manual_review", "criteria": ["reproducible", "non-spam", "contextual"] },
  "result": { "status": "pass", "confidence": 0.86 },
  "artifacts": [{ "type": "hash", "ref": "sha256:..." }]
}`}
          />
        </div>
      </div>

      {/* Resources */}
      <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-6">
        <h4 className="flex items-center gap-2 text-lg font-semibold">
          <ExternalLink className="h-5 w-5 text-[#89e24a]" />
          Resources
        </h4>
        <ul className="mt-4 space-y-2">
          <ResourceLink
            href="https://eips.ethereum.org/EIPS/eip-8004"
            label="ERC-8004 specification (EIP)"
          />
          <ResourceLink href="https://www.8004scan.io/" label="8004scan" />
          <ResourceLink
            href="https://composable-security.com/blog/erc-8004-a-practical-explainer-for-trustless-agents/"
            label="Practical explainer (trustless agents)"
          />
          <ResourceLink
            href="https://github.com/vistara-apps/erc-8004-example"
            label="Example repo"
          />
          <ResourceLink
            href="https://github.com/sudeepb02/awesome-erc8004"
            label="Awesome ERC-8004 list"
          />
        </ul>
      </div>
    </div>
  );
}

function BestPracticeSection({
  number,
  title,
  goal,
  standard,
  standardLabel = "ERC-8004 Standard",
  profile,
  profileLabel = "DenLabs Profile",
  antiPatterns,
}: {
  number: number;
  title: string;
  goal: string;
  standard?: string[];
  standardLabel?: string;
  profile?: string[];
  profileLabel?: string;
  antiPatterns?: string[];
}) {
  return (
    <div className="wolf-card--muted rounded-2xl border border-wolf-border-mid p-6">
      <h4 className="text-lg font-semibold">
        <span className="mr-2 text-[#89e24a]">{number}.</span>
        {title}
      </h4>
      <p className="mt-1 text-sm text-white/60">
        <strong>Goal:</strong> {goal}
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {standard && standard.length > 0 && (
          <div className="rounded-xl border border-[#89e24a]/20 bg-[#89e24a]/5 p-4">
            <h5 className="flex items-center gap-2 text-sm font-semibold text-[#89e24a]">
              <CheckCircle2 className="h-4 w-4" />
              {standardLabel}
            </h5>
            <ul className="mt-2 space-y-1.5 text-sm text-white/70">
              {standard.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[#89e24a]">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile && profile.length > 0 && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <h5 className="flex items-center gap-2 text-sm font-semibold text-blue-400">
              <Shield className="h-4 w-4" />
              {profileLabel}
            </h5>
            <ul className="mt-2 space-y-1.5 text-sm text-white/70">
              {profile.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {antiPatterns && antiPatterns.length > 0 && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <h5 className="flex items-center gap-2 text-sm font-semibold text-red-400">
            <XCircle className="h-4 w-4" />
            Anti-patterns
          </h5>
          <ul className="mt-2 space-y-1.5 text-sm text-white/70">
            {antiPatterns.map((item) => (
              <li key={item} className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ChecklistGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h5 className="font-semibold text-white/80">{title}</h5>
      <ul className="mt-2 space-y-1.5 text-sm text-white/60">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1 h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-[#89e24a] focus:ring-[#89e24a]/50"
              readOnly
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CodeTemplate({ title, code }: { title: string; code: string }) {
  return (
    <div>
      <h5 className="text-sm font-semibold text-white/80">{title}</h5>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-4 text-xs text-white/80">
        {code}
      </pre>
    </div>
  );
}

function ResourceLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-[#89e24a] transition hover:text-[#89e24a]/80 hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {label}
      </a>
    </li>
  );
}
