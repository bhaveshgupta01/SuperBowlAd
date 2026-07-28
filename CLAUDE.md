# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build (type-checks and lints — keep this green)
npm run lint     # ESLint check (.eslintrc.json extends next/core-web-vitals)
```

No test suite exists. Manual testing uses the 3-step flow described below.

**Never run `npm run build` while the dev server is running** — both write to `.next/` and the build corrupts the dev server's chunks (`Cannot find module './NNN.js'`). If it happens: stop the dev server, `rm -rf .next`, restart.

## Architecture

**AdBlitz** is a Next.js 14 App Router app (TypeScript, Tailwind, Lucide React). It contains **two coexisting stacks** that share one design principle: the app must always work with zero configuration, and integrations light up only when their env vars are present.

### Stack 1 — In-memory demo (always works, no env needed)

All state lives in `lib/store.ts`, anchored on `globalThis` (Next dev compiles each route into its own module instance — plain module-level arrays get duplicated per route and routes stop seeing each other's data). State resets on every server restart.

| Route | Role |
|---|---|
| `/dashboard` | Business owner: simulate game events, generate posts, view stats |
| `/simulation` | Customer view: WhatsApp-style chat UI that polls for events and lets users "DM" a reply |

Core pipeline:

1. Events enter the store either manually (`POST /api/simulate-event`) or via the **game watcher** (`lib/watcher.ts`, `/api/watcher`) which streams real ESPN play-by-play — live polling or replay of a finished game (featured: Super Bowl LX, game id 401772988). Emitted events are stamped with the *current* time, and with `autoPost` the watcher generates a caption and creates the post server-side.
2. `POST /api/generate-post` — caption via shared `lib/captions.ts`: Gemini (`generateFromPrompt()`) when `GEMINI_API_KEY` is set, template otherwise; falls back to body payload when `store.ts` is a different worker instance
3. `POST /api/posts` — saves a `Post` record and calls `setActivePostId()` — only one post is "active" at a time
4. `/simulation` polls `GET /api/events?latest=1` every 2 seconds; fires a toast for 6 seconds on a new event
5. User submits any message → `POST /api/instagram-webhook { userId, message, timestamp }` → evaluated **against the active post's event** (not the newest raw event) → returns a unique code

Business rules (`lib/campaign-logic.ts` + webhook; from the 2026-07 market analysis):
- Reply window (`scenario.winWindowSecs`, default 45s) anchors to the **post's `postedAt`**, falling back to event time when no post exists.
- One play per user per event — repeats return the original code (`findBetByUserAndEvent`).
- Gold winners capped per event (`scenario.winnerCap`, default 10); once hit, in-window replies get silver with a "sold out" message.
- Codes are unique (`generateUniqueCode` → `GOLD50-X7K2`, alphabet excludes 0/O/1/I) and expire after `CODE_VALIDITY_MINS` (24h). `/api/codes/validate` validates/redeems against the in-memory bet registry when Supabase is unconfigured.
- Timestamps are Unix **seconds** (`number`) everywhere.

State shape (`lib/store.ts`): a single `globalThis.__adblitzStore` object holding four arrays (`gameEvents` capped at 50 newest-first, `bettingScenarios`, `userBets`, `posts`) plus the `activePostId` and `latestEventForSimulation` singletons. Two default `BettingScenario` records (touchdown + interception) are seeded at module import. This works in any single-process deployment but **not serverless/edge**, where each invocation gets a fresh runtime.

### Stack 2 — Supabase/SaaS layer (needs `.env.local`)

- `lib/supabase.ts` — client + `isSupabaseConfigured` flag. **Never throws at import time**; the exported `supabase` is a proxy that throws a descriptive error only when actually called without config. Keep it that way — pages/routes must render in zero-config mode.
- `lib/auth.ts` — signup/signin + `businesses` profile CRUD
- `lib/codes.ts` — nanoid discount codes with expiry/redemption in Supabase
- `lib/gemini.ts` — `generateCaption()` (structured), `generateFromPrompt()` (raw, returns null on failure), template fallbacks. **Server-side only** — never import it in a client component; `GEMINI_API_KEY` is not `NEXT_PUBLIC`.
- `lib/sports/` — adapter pattern: ESPN (NFL/NBA, real) + scripted demo data (4 sports). `NEXT_PUBLIC_DEMO_MODE` / `NEXT_PUBLIC_USE_REAL_SPORTS_API` pick the source; `getLiveGames(sport, { forceReal: true })` (or `/api/sports/live?real=1`) bypasses the flags. ESPN events come from the **summary endpoint's play-by-play** (`summary?event=<gameId>`; NFL plays live in `drives.previous[].plays[]`, NBA in top-level `plays[]`), classified into touchdown/field_goal/interception/sack/fumble (NFL) or 3pointer/dunk/technical_foul (NBA) — the scoreboard endpoint has no plays. `lib/watcher.ts` state lives on `globalThis` like the store.
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
