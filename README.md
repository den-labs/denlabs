# 🧪 DenLabs: Event Feedback Ops

> **Capture signals, ignore noise.**
> A trust-native feedback platform for events, demos, and launches. Track interactions, score user credibility, and ship improvements faster.

---

## ⚡ The Product: Why Event Labs?

Running demos and events is high-effort. Gathering actionable feedback from them is usually chaotic. **DenLabs** solves the "noisy feedback" problem by introducing **Trust Scores** and **Automated Retros**.

### The Feedback Loop

1. **Create a Lab:** Define your event objectives and generate a public link.
2. **Collect Signals:** Participants submit feedback (no account required). We track behavior and verify identity in the background.
3. **Filter by Trust:** Our middleware scores every piece of feedback (0-100) based on wallet history, self-verification, and behavioral patterns.
4. **Export Retro:** Generate an instant Markdown summary with P0/P1 issues, sorted by trust score, ready to paste into your engineering roadmap.

---

## 💎 Core Features

### 1. Trust Scoring (Middleware 8004)

Not all feedback is equal. We assign a **Trust Score (0-100)** to every interaction to filter spam and prioritize power users.

- **+30 pts:** Self.xyz Verification (Anti-Sybil).
- **+20 pts:** Wallet Connection (On-chain history).
- **-50 pts:** Spam behavior (Rate limiting).

### 2. Hybrid Visibility

Balance transparency with privacy during live events.

- **Creators:** See everything (raw data + analytics).
- **Participants:** See their own feedback + top upvoted issues.
- **Public:** See only high-trust, aggregated top issues.

### 3. Retro Packs (The "Killer Feature")

Stop manually compiling notes. Click one button to get a **Retro Pack**:

- Summary of top P0/P1 issues.
- Drop-off analytics.
- Actionable recommendations.
- _Format: Markdown (ready for GitHub/Linear)._

### 4. x402 Premium Access (Experimental)

A payment layer based on HTTP 402.

- **Free Tier:** Unlimited collection & real-time ops.
- **Premium Tier:** Paid access for high-value exports (CSV, detailed Retros, extended history) via crypto micro-payments.

---

## 🛠 Tech Stack

Built for speed, type safety, and modern web standards.

| Layer         | Technology                                          |
| ------------- | --------------------------------------------------- |
| **Framework** | Next.js 15 (App Router + Turbopack)                 |
| **Language**  | React 19 + TypeScript 5 (Strict)                    |
| **Styling**   | Tailwind CSS v4 + Biome (Linting)                   |
| **Database**  | Supabase (PostgreSQL)                               |
| **Identity**  | Reown AppKit (Wallet) + Self.xyz (Verifiable Creds) |
| **Payments**  | HTTP 402 (Custom Middleware)                        |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.11+
- pnpm 9+
- Supabase Project

### 1. Installation

```bash
# Clone and install
git clone https://github.com/your-org/denlabs.git
cd denlabs
pnpm install
```

### 2. Environment Setup

Create a `.env.local` file based on `.env.example`.

```bash
cp .env.example .env.local

```

**Critical Variables:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
NEXT_PUBLIC_REOWN_PROJECT_ID=your-wallet-connect-id

```

### 3. Database Migration

DenLabs relies on specific SQL schemas for the Labs functionality.

1. Go to your Supabase Dashboard → SQL Editor.
2. Run the content of `database/migrations/001_event_feedback_ops.sql`.
3. _(Optional)_ Read `database/migrations/README.md` for schema details.

### 4. Run Development Server

```bash
pnpm dev
# Visit http://localhost:3000
```

> **Note:** The app redirects to `/en` (English) or `/es` (Spanish) automatically.

---

## 🎮 Usage Guide: Running Your First Lab

1. **Builder View:** Navigate to `/labs/create`.

- Set a name (e.g., "Alpha Launch V1").
- Define the objective.

2. **Share:** Copy the public link (e.g., `denlabs.app/lab/alpha-v1`).
3. **Simulate Feedback:** Open the link in an incognito window.

- Notice no login is required (Session Cookie).
- Submit feedback.

4. **Review:** Go back to `/labs/alpha-v1/retro` to see the trust-scored data and generate your Retro Pack.

---

## 🧪 Advanced: x402 & Testing

DenLabs implements the **x402 Payment Required** standard for premium features.

**Facilitator Health Check:**
Before processing payments, the system checks the UVDAO facilitator.

```bash
pnpm x402:smoke
```

**Integration Tests:**
Validate the payment gating logic (returns 402 vs 200).

```bash
pnpm x402:test
```

_Set `X402_DEV_BYPASS=true` in .env to skip payments during development._

---

## 📂 Project Structure

Key directories for contributors:

```
src/
├── app/[locale]/
│   ├── (den)/labs/      # Creator Dashboard (Protected)
│   ├── (den)/lab/       # Public Participation (Anonymous/Session)
│   ├── (den)/scan-8004/ # Trust Verification Logic
│   └── (den)/x402/      # Payment Layer Experiments
├── components/
│   ├── modules/labs/    # Core Lab Components (Forms, Lists, Retro)
│   └── ui/              # Design System
├── lib/
│   ├── trustScoring.ts  # The 0-100 Scoring Algorithm
│   └── retroPack.ts     # Markdown Generator Logic
└── database/            # SQL Migrations

```

---

## 🤝 Contributing

We follow a **Split Documentation** model:

1. **Code:** Lives here.
2. **Docs:** Detailed specs live in `denlabs-docs` (private).

**Workflow:**

1. Run `pnpm doc:delta` to check for documentation drift.
2. Run `pnpm lint` and `pnpm build` before committing.
3. Use Conventional Commits (e.g., `feat: add trust score filter`).

---

## License

MIT © 2024 DenLabs Builders
