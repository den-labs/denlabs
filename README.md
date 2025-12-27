# DenLabs - Event Feedback Ops

> Trust-native feedback platform for events, demos, and launches. Capture signals, track interactions, and ship improvements faster.

## What is Event Feedback Ops?

DenLabs helps you run **Event Labs**—feedback collection sessions for your events and demos. Share a public link, participants submit feedback (no account required), and you get:

- **Trust-scored feedback** - Every submission gets a 0-100 trust score based on self-verification, wallet connection, and behavioral signals
- **Automatic event tracking** - Page views, clicks, and errors captured in real-time
- **Hybrid visibility** - Participants see their own feedback + top issues; you see everything
- **Retro Pack export** - Auto-generated markdown summary with P0/P1/P2 issues, drop-offs, and recommendations

## Core Components

### Event Labs
Create feedback labs for events and demos. Define objectives, share public links, and collect trust-scored feedback.

**Key Features:**
- Public participation (no auth required)
- Real-time event tracking with instrumentation
- Trust scoring (0-100) based on verification signals
- Hybrid visibility model (creators vs participants)
- Retro pack generation with markdown export

**Routes:**
- `/labs` - List all your labs
- `/labs/create` - Create new lab
- `/labs/[slug]` - Lab detail (creator view)
- `/labs/[slug]/retro` - Retro pack view
- `/lab/[slug]` - Public participation page

### 8004 Trust Scoring
Middleware that scores feedback (0-100) based on:
- Self-verification (+30 points)
- Wallet connection (+20 points)
- Rate limiting (-50 if >10 submissions per session)

Trust scores help filter spam automatically and prioritize high-quality signals.

### Premium Access (x402) - *Mock*
Experimental HTTP 402 payment layer for gating premium labs. Not yet implemented.

### Agent Interoperability (A2A) - *Mock*
Agent-to-agent protocol for querying labs and exporting feedback data. Static capability discovery only.

### Existing Features
- **Lab** - Builder profile and command center
- **Missions** - Challenges and quests with rewards
- **Spray** - Bulk CELO/ERC20 payouts and airdrops
- **GoodDollar** - Engagement rewards with anti-sybil verification
- **Taberna** - Live mentorship sessions and events

---

## Tech Stack

- **Next.js 15** (App Router + Turbopack)
- **React 19** with TypeScript 5 (strict mode)
- **Tailwind CSS v4** (PostCSS pipeline)
- **Biome** for linting and formatting
- **Reown AppKit** for wallet connection (ethers 6.15)
- **Self.xyz** for identity verification (@selfxyz/core, @selfxyz/qrcode)
- **Supabase** for user profiles and persistence
- **next-intl** for internationalization (EN/ES)

---

## Requirements

- Node.js 20.11+ (Node 22 recommended)
- npm 10+ or pnpm 9+
- A tunnel (ngrok, Cloudflare, etc.) when testing Self verification

---

## Quick Start

```bash
# Install dependencies
npm install  # or pnpm install

# Create .env.local (copy .env.example and fill in values)
cp .env.example .env.local

# Start development server
npm run dev  # or pnpm dev

# Visit http://localhost:3000
```

The middleware will redirect to `/en` by default for English locale.

### Quick Start for Event Labs

1. **Run database migration**
   ```bash
   # Navigate to Supabase Dashboard → SQL Editor
   # Copy contents of database/migrations/001_event_feedback_ops.sql
   # Execute in SQL Editor
   # See database/migrations/README.md for details
   ```

2. **Create your first lab**
   - Navigate to `/labs/create`
   - Fill in lab details (name, objective, dates)
   - Share the public link with participants

3. **Public participation**
   - Participants visit `/lab/[your-slug]`
   - No account required to submit feedback
   - Automatic event tracking and trust scoring

4. **Generate retro pack**
   - Visit `/labs/[your-slug]/retro`
   - Export markdown summary with top issues and recommendations

## Key Principles

### Trust-First
Every feedback item is scored 0-100. Filter spam automatically and prioritize high-quality signals.

### Hybrid Visibility
Balance transparency with privacy:
- **Creators** see all feedback
- **Participants** see their own + top P0/P1 issues
- **Anonymous visitors** see top issues only

### Retro-Ready
Export markdown retro packs with one click. Share with your team and ship improvements faster.

### Session Cookies
Anonymous participation enabled via `denlabs-lab-session` cookie. No account required to submit feedback.

---

## Scripts

```bash
npm run dev          # Next.js dev server with Turbopack
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # Biome lint + static analysis
npm run format       # Apply Biome formatting fixes
npm run doc:delta    # Check documentation drift
npm run doc:snapshot # Create documentation snapshot (in denlabs-docs repo)
```

**Before committing:** Run `npm run lint` and `npm run build` to ensure code quality.

---

## Environment Setup

Create `.env.local` with required variables (see `.env.example` for template):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Reown AppKit (wallet connection)
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id

# Self.xyz (identity verification)
NEXT_PUBLIC_SELF_APP_NAME=DenLabs
NEXT_PUBLIC_SELF_ENDPOINT=https://yourapp.com/api/self/verify
NEXT_PUBLIC_SELF_SCOPE=your-scope
NEXT_PUBLIC_SELF_DEEPLINK_CALLBACK=https://yourapp.com/auth
SELF_USE_SANDBOX=false  # Set true for development

# GoodDollar
NEXT_PUBLIC_GD_REWARDS_CONTRACT=0x...
NEXT_PUBLIC_GD_APP_ADDRESS=0x...

# Spray Disperser
NEXT_PUBLIC_SPRAY_ADDRESS=0x...  # Celo mainnet

# Taberna
NEXT_PUBLIC_TABERNA_URL=https://...

# Site
NEXT_PUBLIC_SITE_URL=https://denlabs.vercel.app
```

**Note:** Restart dev server after changing environment variables.

---

## Project Structure

```
src/
  app/
    [locale]/
      (den)/              # Main app: lab, missions, spray, experiments
        labs/             # Event Labs (creator view)
          page.tsx        # Labs list
          create/         # Create new lab
          [slug]/         # Lab detail + retro
        8004-scan/        # Trust verification scanner
        x402/             # Premium layer experiments
        a2a/              # Agent capabilities
        lab/              # Builder profile
        missions/         # Challenges
        spray/            # Bulk payouts
        gooddollar/       # Engagement rewards
        taberna/          # Live sessions
        settings/         # User preferences
      lab/
        [slug]/           # Public participation page (no auth)
      page.tsx            # Landing page
      access/             # Wallet connection + onboarding
    api/
      labs/               # Event Labs API
        route.ts          # List + Create labs
        [slug]/
          route.ts        # Get + Update + Delete lab
          feedback/       # Feedback endpoints
          events/         # Event tracking
          retro/          # Retro pack generation
      scan/8004/          # 8004 scan API endpoint
      x402/demo/          # x402 demo endpoint
      a2a/capabilities/   # A2A capabilities endpoint
      auth/               # Authentication endpoints
      profile/            # User profile management
      trust/              # Trust/verification endpoints
    layout.tsx            # Global fonts, providers
    globals.css           # Tailwind + theme tokens
  components/
    home/                 # Landing page components
    den/                  # Shell (SidebarNav, TopBar, StatusStrip)
    modules/
      labs/               # Event Labs components
        LabCard.tsx       # Lab summary card
        LabForm.tsx       # Create/edit lab form
        FeedbackForm.tsx  # Submit feedback
        FeedbackItem.tsx  # Feedback item with trust indicator
        FeedbackList.tsx  # Feedback list with filters
        RetroPackView.tsx # Retro pack display + export
    ui/                   # Reusable UI components
      TrustIndicator.tsx  # Trust score badge
  hooks/                  # Custom React hooks
  lib/                    # Utilities and helpers
    eventLabs.ts          # Event Labs types + utilities
    eventLabsClient.ts    # Client-side fetch helpers
    trustScoring.ts       # Trust score calculation
    retroPack.ts          # Retro pack generation
    instrumentation.ts    # Event tracking library
  providers/
    EventLabInstrumentationProvider.tsx  # Event tracking context
  database/
    migrations/           # Database migration scripts
      001_event_feedback_ops.sql         # Event Labs schema
      README.md           # Migration instructions
  i18n/
    messages/             # Translation files (en.json, es.json)
    routing.ts            # next-intl configuration
  middleware.ts           # Locale detection
```

---

## Localization

- Routes are prefixed with `/[locale]` (en or es)
- Messages in `src/i18n/messages/{locale}.json`
- Use `useTranslations()` hook in components
- `t.raw()` for structured data (arrays, objects)
- Keep JSON keys alphabetical when adding new translations

---

## Styling & Theming

- **Tailwind CSS v4** via PostCSS pipeline
- Custom **"wolf" theme tokens** in `globals.css`:
  - `--den-lime`, `--den-emerald` (primary colors)
  - Neon-glass aesthetic with pill buttons (`rounded-[10px]`)
- **Fonts:** Geist (sans + mono), Bitcount Single Ink for headlines
- **Theme toggle:** Infrastructure exists for future light/dark modes

---

## Documentation Workflow

DenLabs uses a **split documentation model**:

- **Public repo (denlabs):** Code, minimal docs, tooling
- **Private repo (denlabs-docs):** Complete documentation, status, roadmaps

### When Making Changes

1. **Run doc:delta** after functional changes:
   ```bash
   npm run doc:delta  # or pnpm doc:delta
   ```

2. **Check the report:** `docs/DOC_DELTA_REPORT.md` (auto-generated, not committed)

3. **Update docs in denlabs-docs:**
   - `docs/STATUS.md` - Project status and features map
   - `docs/CHANGELOG.md` - Add entry in [Unreleased] section
   - `CLAUDE.md` - Update architecture/API sections if needed

4. **Link docs PR:** Include link to denlabs-docs PR in your code PR

### Documentation Pointer

See `docs/DOCS_POINTER.md` for complete documentation workflow and access to private docs repo.

---

## Development Workflow

### Code Quality
- **TypeScript strict mode** enforced
- Export component prop types, avoid `any`
- Use Tailwind utility-first styling in JSX
- Biome handles import sorting automatically

### Testing
- No automated test suite yet (manual testing required)
- Test flows manually: `/access → /lab → missions/spray/experiments`
- Test both desktop and mobile layouts
- Test locale switching (EN/ES)

### Pre-commit Validation
**REQUIRED before committing:**
```bash
npm run lint     # Fix lint errors
npm run format   # Apply formatting
npm run build    # Ensure production build succeeds
```

All three must pass without errors.

### Commit Conventions
Use Conventional Commits for clean history:
- `feat: add 8004 scan page`
- `fix: correct x402 endpoint response`
- `docs: update README with feedback vision`
- `style: format imports`
- `chore: update dependencies`

---

## Key Features

### Self.xyz Verification
- QR code + deeplink flow for identity verification
- Sandbox mode for development (`SELF_USE_SANDBOX=true`)
- Enforces: attestation id 1, age ≥18, OFAC screening
- Anti-sybil layer for quality gating

### Spray Console
- Bulk CELO/ERC20 airdrops and payouts
- CSV upload for recipient lists
- Multi-network support
- Allowance approval flows
- Contract address: `NEXT_PUBLIC_SPRAY_ADDRESS`

### GoodDollar Rewards
- Engagement rewards with invite links
- Uses Viem (not ethers) for blockchain interactions
- Limits: 1 claim/app/180 days, max 3 apps/180 days
- Requires Self verification as anti-sybil

---

## Deployment

1. **Build production bundle:**
   ```bash
   npm run build
   ```

2. **Test production build locally:**
   ```bash
   npm run start
   ```

3. **Environment variables:**
   - Set all `NEXT_PUBLIC_*` vars in hosting platform
   - Self verifier endpoint must be HTTPS in production
   - Configure iframe origins for Taberna camera/microphone

4. **Image domains:**
   - Configure in `next.config.ts` for remote images

---

## Contributing

### Before Starting Work
1. **Read documentation:**
   - Request access to `denlabs-docs` private repo
   - Review `docs/STATUS.md`, `docs/VISION_FEEDBACK.md`
   - Check `PROJECT_FLOW.md` for current phase

2. **Check existing issues:** Align on UX and architecture before large features

3. **Follow the doc workflow:**
   - Run `pnpm doc:delta` before submitting PR
   - Create corresponding PR in `denlabs-docs` for functional changes
   - Link docs PR in code PR description

### PR Requirements
- [ ] `pnpm run lint` passes
- [ ] `pnpm run build` passes
- [ ] Docs PR linked (if functional changes)
- [ ] Manual testing completed (desktop + mobile)
- [ ] Screenshots attached for UI changes

---

## Related Documentation

**Public (in this repo):**
- `docs/DOCS_POINTER.md` - Documentation workflow and access
- `docs/DOC_TARGETS.json` - Code-to-docs mapping
- `.env.example` - Environment variables template
- `CLAUDE.md` - Claude Code configuration

**Private (denlabs-docs repo - request access):**
- `docs/STATUS.md` - Complete project status
- `docs/VISION_FEEDBACK.md` - Product vision and roadmap
- `PROJECT_FLOW.md` - Development phases
- `AGENTS.md` - AI assistant guidelines
- `docs/CHANGELOG.md` - Documentation changelog

---

## License

MIT

---

**Last Updated:** 2025-12-26
