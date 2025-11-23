# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` implements the App Router; `page.tsx` drives the Mines flow and `auth/` powers the SELF authentication experience.
- Shared UI belongs in `src/components/`; promote widgets such as `SelfAuth.tsx` here before wiring them into routes.
- Static assets (icons, manifests, imagery) live in `public/` and are referenced with `/asset-name.ext` paths.
- Capture architectural decisions, UX notes, and runbooks inside `docs/` so future agents can trace context quickly.
- Root configs (`biome.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`) define linting, TypeScript, and Tailwind; update them deliberately and document changes in `docs/`.

## Build, Test, and Development Commands
- `npm run dev` (or `pnpm dev`) starts the Turbopack dev server at `http://localhost:3000` with hot reload.
- `npm run build` compiles the production bundle; run after dependency or config updates to surface breaking issues.
- `npm run start` serves the built output for deployment validation.
- `npm run lint` executes Biome linting; treat a clean report as a merge prerequisite.
- `npm run format` applies Biome formatting—stage only intentional diffs.

## Coding Style & Naming Conventions
- TypeScript throughout `src/`; keep components as default exports and utilities as named exports.
- Follow Biome defaults: 2-space indentation, single quotes in TS/TSX, trailing commas where valid.
- Naming: PascalCase for React components (`SelfAuth`), camelCase for state/hooks (`mineCount`), SCREAMING_SNAKE_CASE for shared constants.
- Tailwind utility classes are preferred; reserve additions to `src/app/globals.css` for shared tokens and document them.

## Testing Guidelines
- No automated suite yet; manually verify `/` and `/auth` flows before merging.
- Colocate future tests beside modules as `*.test.ts[x]` and expose a runner via `npm run test`.
- Treat failed linting or TypeScript errors as blockers.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) to keep changelogs clear.
- After completing a task, generate a Conventional Commit message describing the change.
- Before opening a PR, run lint/format, summarize the change, and link relevant issues.
- Attach screenshots or GIFs for UI updates and call out manual testing steps in the description.

## Security & Configuration Tips
- Keep secrets in `.env.local`; never commit credentials. Document required keys in `README.md` or PR notes.
- SELF and wallet integrations depend on a clean browser profile—test with cached data cleared to surface auth regressions.
