# DenLabs: Feedback & Proof Lab

**DenLabs** is a Feedback & Proof Lab where builders ship work, get actionable feedback, run experiments, and generate verifiable proofs of their capabilities.

**Core Promise:** "Ship. Get feedback. Prove it."

Instead of building in isolation, DenLabs provides structured feedback loops, experimental features to test hypotheses, and onchain proof generation to build reputation.

---

## Modules

### **Feedback** (Coming Soon)
Submit projects, designs, or code for structured feedback from peers, mentors, and AI systems. Iterate based on critiques and build reputation through demonstrated improvement.

### **8004 Scan**
Trust verification scanner for addresses and identifiers. Check reputation scores, verify credentials, and assess trustworthiness before collaborating.

### **x402 Premium**
Experimental HTTP 402 payment layer for premium access. Test pay-per-use models for advanced analytics, deeper feedback, and priority processing.

### **A2A (Agent-to-Agent)**
Discover and expose agent capabilities for interoperability. Enable AI agents to find and interact with DenLabs services programmatically.

### **Existing Features**
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
        8004-scan/        # Trust verification scanner
        x402/             # Premium layer experiments
        a2a/              # Agent capabilities
        lab/              # Builder profile
        missions/         # Challenges
        spray/            # Bulk payouts
        gooddollar/       # Engagement rewards
        taberna/          # Live sessions
        settings/         # User preferences
      page.tsx            # Landing page
      access/             # Wallet connection + onboarding
    api/
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
    modules/              # Feature modules
    ui/                   # Reusable UI components
  hooks/                  # Custom React hooks
  lib/                    # Utilities and helpers
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
