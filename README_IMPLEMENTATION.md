# AdBlitz — Implementation Status

Honest, code-verified status of every feature. Last audited: 2026-07-28.

## Feature status

| Feature | Status | Notes |
|---|---|---|
| In-memory demo flow (`/dashboard` + `/simulation`) | ✅ Works, zero config | Event → post → DM reply → unique gold/silver codes, with per-post ROI stats |
| **Live Game Watcher** | ✅ Works, zero config | Streams real ESPN play-by-play into campaigns: live polling or replay of a finished game (featured: Super Bowl LX); optional auto-posting of AI-captioned stories |
| **Business rules** | ✅ Works | Post-anchored reply window, one play per user per event, gold winner cap (default 10), unique codes with 24h expiry, in-memory redemption tracking |
| Multi-sport demo page (`/demo`) | ✅ Works, zero config | Scripted events for NFL/NBA/soccer/cricket; captions via `/api/posts/generate` |
| Caption generation | ✅ Works | Gemini (`gemini-flash-lite-latest`, overridable via `GEMINI_MODEL`) when `GEMINI_API_KEY` is set, template fallback otherwise — shared `lib/captions.ts` |
| Sports data adapters | ✅ Works | ESPN NFL/NBA scoreboard + **real play-by-play** via the summary endpoint (free, no key); NFL parsing verified against Super Bowl LX data, NBA follows the same shape (unverified live) |
| Auth pages (signup/signin/onboarding) | ⚠️ Needs Supabase | Render fine without config (with a notice); functional once Supabase keys are set |
| Campaigns API (Supabase CRUD) | ⚠️ Partially works | GET falls back to in-memory scenarios (feeds the dashboard). Authed CRUD is blocked by the server-session limitation below |
| Predictions + discount codes (Supabase) | ⚠️ Needs Supabase | Logic is complete; needs a configured project and rows created via API |
| Discount code validation/redemption | ✅ Works, zero config | `POST /api/codes/validate` uses the in-memory bet registry without Supabase (dashboard "Redeem a code" box), Supabase table with it |
| Image generation | ❌ Stub | `generateImage()` always returns null; `Post.imageUrl` never populated |
| Real Instagram Graph API | ❌ Not built | "Post to Instagram" writes to the in-memory store only |
| Real WhatsApp Business API | ❌ Not built | Env var placeholders exist, no code uses them |
| Real soccer/cricket data | ❌ Not built | Demo adapters only; football-data.org / RapidAPI not implemented |
| Tests | ❌ None | Scripted end-to-end run (replay → codes → redemption) exists as a manual script; no test suite |
| Campaign management UI | ❌ Not built | Scenario economics (window/cap/discounts) are configurable in the store but there's no edit UI yet |
| Prediction correctness (YES/NO evaluated) | ❌ Not built | Reply content still ignored; only timing + cap matter (P1 from market analysis) |

## Known limitations

1. **Server-side auth session** — API routes create the Supabase client without cookie forwarding, so `getCurrentUser()` on the server always returns null even when the browser is signed in. `@supabase/auth-helpers-nextjs` is installed but unused; wiring it into the routes (and switching pages to the component client) is the fix. Until then, authed API paths return 401 or fallback data.
2. **In-memory state is per-process** — `lib/store.ts` state is anchored on `globalThis` (required because Next dev duplicates modules per route), which works in `next dev`/`next start` (single process) but resets on restart and will not work on serverless/edge deployments where each invocation gets a fresh runtime.
3. **Two campaign models coexist** — in-memory `BettingScenario` (hardcoded GOLD50/SILVER10) and Supabase `campaigns` (configurable window/discount/expiry). They are not synchronized; the dashboard reads whichever `GET /api/campaigns` returns.
4. **The watcher is an in-process interval** — `lib/watcher.ts` runs `setInterval` inside the Next server (fine for one process; not serverless-compatible, same constraint as the store). Live mode polls ESPN every `intervalSecs`; detection latency is up to one interval.
5. **NBA play-by-play parsing is unverified against live data** — implemented from ESPN's documented summary shape; NFL parsing is verified against real Super Bowl LX data.

## Market analysis (2026-07-28)

A business-workflow review concluded the core loop (live moment → story → timed DM → instant reward) is commercially sound, but the original reward rules inverted the economics — shared static codes, no cap, no expiry meant a viral post burned unbounded margin. The P0 fixes (all implemented): unique per-user codes, one play per user per event, gold winner cap, 24h expiry, and anchoring the window to post time. Remaining recommendations: evaluate prediction content (YES/NO vs outcome), owner-configurable tiers UI, "no purchase necessary" copy to avoid gambling/sweepstakes framing, per-userId rate limiting for real webhooks.

## Architecture decisions

- **Zero-config first**: every page renders and the core flow works with no `.env.local`. Integrations (Gemini, Supabase, real sports APIs) activate via env vars and always have fallbacks.
- **`lib/supabase.ts` never throws at import** — it exports `isSupabaseConfigured` plus a proxy client that raises a descriptive error only on actual use. This is what keeps zero-config mode alive; preserve it.
- **Gemini is server-only** — the key is not `NEXT_PUBLIC`; client pages get captions through API routes.
- **Adapter pattern for sports** — add a sport by implementing `SportsApiAdapter` in `lib/sports/`.
- **Multi-tenancy via RLS** — `SUPABASE_SCHEMA.sql` scopes campaigns/posts/predictions to the owning business.

## Roadmap (rough priority order)

1. **Campaign management UI** on the dashboard (edit window/cap/discount tiers per scenario — the fields already exist in the store)
2. **Prediction correctness** — evaluate YES/NO reply content against the next game outcome (P1 from market analysis)
3. **Wire server-side Supabase auth** with `@supabase/auth-helpers-nextjs` — unblocks real campaign CRUD and predictions end-to-end
4. **Real Instagram Graph API** story posting + webhook for DMs (replaces the simulated webhook)
5. **Unify the two campaign models** — make the in-memory scenarios a demo seed of the Supabase shape so logic is written once
6. **Image generation** — Vertex AI / Imagen or similar for story images
7. **Tests** — start with campaign logic (timing/cap/codes), the webhook route, and the watcher
8. **Production hardening** — persistence, rate limiting, error tracking, live-game picker UI for the watcher (currently featured-replay + API)

## Commands

```bash
npm run dev       # start dev server
npm run build     # production build (type-check + lint)
npm run start     # run production server
npm run lint      # ESLint
```

See [SETUP.md](./SETUP.md) for Supabase/Gemini configuration and Vercel deployment.
