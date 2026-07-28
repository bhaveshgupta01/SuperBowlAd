# AdBlitz — Real-Time Sports Marketing for Small Businesses

AdBlitz lets a small business (the original demo: a pizza shop during the Super Bowl) turn live game moments into instant marketing. A game event happens → the business posts an Instagram-style story with an AI-generated caption → customers who DM a reply fast enough win a discount code.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Lucide React. Optional integrations: Supabase (auth + database), Google Gemini (AI captions), ESPN (live NFL/NBA scores).

## Purpose

- **For business owners:** run "reply within N seconds" discount campaigns triggered by live sports events, without writing code.
- **For customers:** reply to a story within the time window (default 45 seconds) and instantly receive a discount code — fast replies get the premium code (`GOLD50`), late replies get the consolation code (`SILVER10`).

## Quick start (zero config)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No `.env.local`, database, or API keys needed — the core flow runs entirely in memory.

### The 3-step demo flow

1. Open **[/dashboard](http://localhost:3000/dashboard)** → pick an event (e.g. "Touchdown - Chiefs") → **Simulate Event** → **Generate Post** → **Post to Instagram**.
2. Open **[/simulation](http://localhost:3000/simulation)** in a second tab → a "New Story! Reply now!" toast appears within ~2 seconds of the event.
3. Type any reply in the chat. Within 45 seconds of the event → **GOLD50**. Later → **SILVER10**. Click a past post on the dashboard to see its stats (interactions, win/late split).

## Pages

| Route | Role | Needs setup? |
|---|---|---|
| `/` | Landing page | No |
| `/dashboard` | Business owner: simulate events, generate & "post" stories, view per-post stats | No |
| `/simulation` | Customer view: WhatsApp-style chat that polls for events and evaluates reply timing | No |
| `/demo` | Multi-sport scripted simulation (NFL/NBA/soccer/cricket) with caption generation | No |
| `/auth/signin`, `/auth/signup` | Email/password auth with business profile | Supabase |
| `/onboarding` | Post-signup business setup (Instagram handle, WhatsApp number) | Supabase |

## API routes

**In-memory demo flow (always work):**

| Route | Purpose |
|---|---|
| `POST /api/simulate-event` | Create a game event (`{ type: "touchdown" }`) |
| `GET /api/events` (`?latest=1`) | List events / latest event for simulation polling |
| `POST /api/generate-post` | Prompt + caption for an event (Gemini when `GEMINI_API_KEY` set, templates otherwise) |
| `GET/POST /api/posts` | List / create posts; newest post becomes the "active" one |
| `GET /api/posts/[id]/stats` | Per-post interactions, win/late counts, code usage |
| `POST /api/instagram-webhook` | Simulated DM webhook → `evaluateBet()` → discount code |
| `GET /api/campaigns` | Active campaigns (falls back to in-memory scenarios without Supabase auth) |
| `POST /api/posts/generate` | AI caption for arbitrary sport/event (Gemini with template fallback) |
| `GET /api/sports/live` | Live games (`?sport=nfl` etc.); demo data unless real APIs enabled |

**Supabase-backed (need `.env.local` with Supabase keys):**

| Route | Purpose |
|---|---|
| `POST/PATCH/DELETE /api/campaigns` | Campaign CRUD for the signed-in business |
| `GET/POST /api/predictions` | Submit/list customer predictions with timing evaluation |
| `POST /api/codes/validate` | Validate / redeem generated discount codes |

## Setup tiers

1. **Zero config** — everything above marked "No" works out of the box. State is in-memory and resets on server restart.
2. **+ Gemini** — set `GEMINI_API_KEY` in `.env.local` for real AI captions (free key at [aistudio.google.com](https://aistudio.google.com/app/apikey)). Without it, template captions are used automatically.
3. **+ Supabase** — enables auth, business profiles, persistent campaigns/predictions/codes. See [SETUP.md](./SETUP.md).
4. **Production** — real Instagram/WhatsApp APIs, background jobs, deployment. See the roadmap in [STATUS](./README_IMPLEMENTATION.md).

## Documentation index

| File | Contents |
|---|---|
| [README.md](./README.md) | This file — purpose, quick start, route map |
| [QUICKSTART.md](./QUICKSTART.md) | 5-minute walkthrough + curl examples |
| [SETUP.md](./SETUP.md) | Full setup: Supabase, Gemini, deployment |
| [README_IMPLEMENTATION.md](./README_IMPLEMENTATION.md) | Honest status report: what works, known limitations, roadmap |
| [CLAUDE.md](./CLAUDE.md) | Architecture notes for AI-assisted development |
| [SUPABASE_SCHEMA.sql](./SUPABASE_SCHEMA.sql) | Database schema with RLS policies |

## Commands

```bash
npm run dev      # dev server at localhost:3000
npm run build    # production build (type-checks + lints)
npm run lint     # ESLint
```

There is no test suite yet; use the 3-step demo flow above for manual verification.
