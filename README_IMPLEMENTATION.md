# AdBlitz — Implementation Status

Honest, code-verified status of every feature. Last audited: 2026-07-19.

## Feature status

| Feature | Status | Notes |
|---|---|---|
| In-memory demo flow (`/dashboard` + `/simulation`) | ✅ Works, zero config | Event → post → DM reply → GOLD50/SILVER10, with per-post stats |
| Multi-sport demo page (`/demo`) | ✅ Works, zero config | Scripted events for NFL/NBA/soccer/cricket; captions via `/api/posts/generate` |
| Caption generation | ✅ Works | Gemini (`gemini-flash-lite-latest`, overridable via `GEMINI_MODEL`) when `GEMINI_API_KEY` is set, template fallback otherwise — in both `/api/generate-post` and `/api/posts/generate` |
| Sports data adapters | ✅ Works | ESPN NFL/NBA (real, free, no key) + demo data; adapter pattern in `lib/sports/` |
| Auth pages (signup/signin/onboarding) | ⚠️ Needs Supabase | Render fine without config (with a notice); functional once Supabase keys are set |
| Campaigns API (Supabase CRUD) | ⚠️ Partially works | GET falls back to in-memory scenarios (feeds the dashboard). Authed CRUD is blocked by the server-session limitation below |
| Predictions + discount codes (Supabase) | ⚠️ Needs Supabase | Logic is complete; needs a configured project and rows created via API |
| Discount code validation/redemption | ⚠️ Needs Supabase | `POST /api/codes/validate` |
| Image generation | ❌ Stub | `generateImage()` always returns null; `Post.imageUrl` never populated |
| Real Instagram Graph API | ❌ Not built | "Post to Instagram" writes to the in-memory store only |
| Real WhatsApp Business API | ❌ Not built | Env var placeholders exist, no code uses them |
| Real soccer/cricket data | ❌ Not built | Demo adapters only; football-data.org / RapidAPI not implemented |
| Tests | ❌ None | Manual 3-step flow is the only verification |
| Campaign management UI | ❌ Not built | Dashboard shows campaigns read-only; create/edit is API-only |

## Known limitations

1. **Server-side auth session** — API routes create the Supabase client without cookie forwarding, so `getCurrentUser()` on the server always returns null even when the browser is signed in. `@supabase/auth-helpers-nextjs` is installed but unused; wiring it into the routes (and switching pages to the component client) is the fix. Until then, authed API paths return 401 or fallback data.
2. **In-memory state is per-process** — `lib/store.ts` state is anchored on `globalThis` (required because Next dev duplicates modules per route), which works in `next dev`/`next start` (single process) but resets on restart and will not work on serverless/edge deployments where each invocation gets a fresh runtime.
3. **Two campaign models coexist** — in-memory `BettingScenario` (hardcoded GOLD50/SILVER10) and Supabase `campaigns` (configurable window/discount/expiry). They are not synchronized; the dashboard reads whichever `GET /api/campaigns` returns.
4. **Event polling is client-driven** — `/simulation` polls every 2s; there is no background job watching real games.

## Architecture decisions

- **Zero-config first**: every page renders and the core flow works with no `.env.local`. Integrations (Gemini, Supabase, real sports APIs) activate via env vars and always have fallbacks.
- **`lib/supabase.ts` never throws at import** — it exports `isSupabaseConfigured` plus a proxy client that raises a descriptive error only on actual use. This is what keeps zero-config mode alive; preserve it.
- **Gemini is server-only** — the key is not `NEXT_PUBLIC`; client pages get captions through API routes.
- **Adapter pattern for sports** — add a sport by implementing `SportsApiAdapter` in `lib/sports/`.
- **Multi-tenancy via RLS** — `SUPABASE_SCHEMA.sql` scopes campaigns/posts/predictions to the owning business.

## Roadmap (rough priority order)

1. **Wire server-side Supabase auth** with `@supabase/auth-helpers-nextjs` — unblocks real campaign CRUD and predictions end-to-end
2. **Campaign management UI** on the dashboard (create/edit window, discount, event types)
3. **Unify the two campaign models** — make the in-memory scenarios a demo seed of the Supabase shape so logic is written once
4. **Real Instagram Graph API** story posting + webhook for DMs (replaces the simulated webhook)
5. **Background event watcher** — poll `lib/sports` adapters server-side and auto-trigger posts for active campaigns
6. **Image generation** — Vertex AI / Imagen or similar for story images
7. **Tests** — start with `evaluateBet`, the webhook route, and the store
8. **Production hardening** — persistence for the demo flow, rate limiting, error tracking

## Commands

```bash
npm run dev       # start dev server
npm run build     # production build (type-check + lint)
npm run start     # run production server
npm run lint      # ESLint
```

See [SETUP.md](./SETUP.md) for Supabase/Gemini configuration and Vercel deployment.
