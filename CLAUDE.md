# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build (type-checks and lints — keep this green)
npm run lint     # ESLint check (.eslintrc.json extends next/core-web-vitals)
```

No test suite exists. Manual testing uses the 3-step flow described below.

## Architecture

**AdBlitz** is a Next.js 14 App Router app (TypeScript, Tailwind, Lucide React). It contains **two coexisting stacks** that share one design principle: the app must always work with zero configuration, and integrations light up only when their env vars are present.

### Stack 1 — In-memory demo (always works, no env needed)

All state lives in `lib/store.ts`, anchored on `globalThis` (Next dev compiles each route into its own module instance — plain module-level arrays get duplicated per route and routes stop seeing each other's data). State resets on every server restart.

| Route | Role |
|---|---|
| `/dashboard` | Business owner: simulate game events, generate posts, view stats |
| `/simulation` | Customer view: WhatsApp-style chat UI that polls for events and lets users "DM" a reply |

Core pipeline:

1. `POST /api/simulate-event` — creates a `GameEvent` in the store with the current Unix timestamp
2. `POST /api/generate-post` — returns a caption: Gemini via `generateFromPrompt()` when `GEMINI_API_KEY` is set, template string otherwise; falls back to body payload when `store.ts` is a different worker instance
3. `POST /api/posts` — saves a `Post` record and calls `setActivePostId()` — only one post is "active" at a time
4. `/simulation` polls `GET /api/events?latest=1` every 2 seconds; fires a toast for 6 seconds on a new event
5. User submits any message → `POST /api/instagram-webhook { userId, message, timestamp }` → `evaluateBet()` → returns code

Discount logic (`lib/campaign-logic.ts`): reply within 45s of event → WIN → GOLD50; later → LATE → SILVER10. `evaluateBet(userReplyTime, eventTime)` takes Unix **second** timestamps (both `number`). The 45-second constant is `WIN_WINDOW_SECONDS`, module-level.

State shape (`lib/store.ts`): a single `globalThis.__adblitzStore` object holding four arrays (`gameEvents` capped at 50 newest-first, `bettingScenarios`, `userBets`, `posts`) plus the `activePostId` and `latestEventForSimulation` singletons. Two default `BettingScenario` records (touchdown + interception) are seeded at module import. This works in any single-process deployment but **not serverless/edge**, where each invocation gets a fresh runtime.

### Stack 2 — Supabase/SaaS layer (needs `.env.local`)

- `lib/supabase.ts` — client + `isSupabaseConfigured` flag. **Never throws at import time**; the exported `supabase` is a proxy that throws a descriptive error only when actually called without config. Keep it that way — pages/routes must render in zero-config mode.
- `lib/auth.ts` — signup/signin + `businesses` profile CRUD
- `lib/codes.ts` — nanoid discount codes with expiry/redemption in Supabase
- `lib/gemini.ts` — `generateCaption()` (structured), `generateFromPrompt()` (raw, returns null on failure), template fallbacks. **Server-side only** — never import it in a client component; `GEMINI_API_KEY` is not `NEXT_PUBLIC`.
- `lib/sports/` — adapter pattern: ESPN (NFL/NBA, real) + scripted demo data (4 sports). `NEXT_PUBLIC_DEMO_MODE` / `NEXT_PUBLIC_USE_REAL_SPORTS_API` pick the source.
- Routes: `/api/campaigns` (CRUD), `/api/predictions`, `/api/codes/validate`; pages: `/auth/*`, `/onboarding`, `/demo`
- Schema: `SUPABASE_SCHEMA.sql` (multi-tenant with RLS)

### Cross-stack wiring to preserve

- `GET /api/campaigns` returns `{ scenarios }` from the in-memory store whenever Supabase is unconfigured **or** there is no server-visible user — this is what feeds the dashboard's Campaign Manager panel. Don't remove the fallback.
- `/demo` generates captions by calling `POST /api/posts/generate` (server-side Gemini), not by importing `lib/gemini` directly.

## Important gaps (current state)

- **Server-side auth is not actually wired**: API routes call `supabase.auth.getSession()` on a client with no cookie forwarding, so the server never sees a browser session. `@supabase/auth-helpers-nextjs` is installed but unused — using it is the correct fix if the authed campaign/prediction paths are needed.
- `imageUrl` on `Post` is never populated; the dashboard renders an icon placeholder. `generateImage()` in `lib/gemini.ts` is a stub that always returns null.
- No real Instagram/WhatsApp API calls anywhere — "Post to Instagram" only updates the store.
- `getActiveScenarioForEventType` matches on `eventType.toLowerCase()`, so event types passed to `simulate-event` must match scenario `eventType` strings exactly (`"touchdown"`, `"interception"`, `"field_goal"`).
- GET route handlers that don't read the request must set `export const dynamic = "force-dynamic"` or `next build` freezes them as static cached responses (already done for `/api/posts` and `/api/campaigns`).

## Documentation map

README.md (entry point) · QUICKSTART.md (5-min walkthrough) · SETUP.md (Supabase/Gemini/deploy) · README_IMPLEMENTATION.md (status + roadmap) · SUPABASE_SCHEMA.sql (DB schema). Keep status claims in these files truthful — they previously drifted badly from the code.
