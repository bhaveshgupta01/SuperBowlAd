# AdBlitz — Real-Time Sports Marketing for Small Businesses

AdBlitz lets a small business (the original demo: a pizza shop during the Super Bowl) turn live game moments into instant marketing. A game event happens → the business posts an Instagram-style story with an AI-generated caption → customers who DM a reply fast enough win a discount code.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Lucide React. Optional integrations: Supabase (auth + database), Google Gemini (AI captions), ESPN (live NFL/NBA scores).

## Purpose

- **For business owners:** run "reply within N seconds" discount campaigns triggered by live sports events, without writing code. The **Live Game Watcher** streams real ESPN play-by-play (touchdowns, field goals, interceptions) into campaigns and can auto-post AI-captioned stories the moment they happen.
- **For customers:** reply to a story within the time window (default 45 seconds from when the story posts) and instantly receive a discount code.

### Campaign rules (per scenario, owner-configurable)

- The first **10** in-window replies win a **GOLD** code (50% off); everyone else gets **SILVER** (10% off) — the gold cap turns discounts into a fixed promo budget.
- **One play per customer per event** — repeat replies return the original code.
- Every code is **unique** (`GOLD50-X7K2`) and **expires in 24h**; the dashboard's redeem box validates and marks codes redeemed, feeding per-post ROI stats.

## Quick start (zero config)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No `.env.local`, database, or API keys needed — the core flow runs entirely in memory.

### The one-button live demo

Open **[/dashboard](http://localhost:3000/dashboard)** → **▶ Replay Super Bowl LX**. The watcher replays the real game's play-by-play (from ESPN), auto-posting an AI-captioned story for each campaign moment. Open **[/simulation](http://localhost:3000/simulation)** in a second tab, wait for the toast, and reply fast to win a gold code. Paste the code into the dashboard's **Redeem a code** box to complete the funnel, then click the post to see ROI stats.

### The manual 3-step flow (still works)

1. **/dashboard** → pick an event (e.g. "Touchdown - Chiefs") → **Simulate Event** → **Generate Post** → **Post to Instagram**.
2. **/simulation** in a second tab → a "New Story! Reply now!" toast appears within ~2 seconds.
3. Reply in the chat: in-window → unique GOLD code, late → SILVER. Click a past post on the dashboard for stats.

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
| `POST /api/instagram-webhook` | Simulated DM webhook → timing + cap evaluation → unique discount code |
| `GET/POST /api/watcher` | Game watcher: stream real ESPN play-by-play (live) or replay a finished game into the campaign flow, with optional auto-posting |
| `POST /api/codes/validate` | Validate/redeem codes (in-memory registry without Supabase, Supabase table with it) |
| `GET /api/campaigns` | Active campaigns (falls back to in-memory scenarios without Supabase auth) |
| `POST /api/posts/generate` | AI caption for arbitrary sport/event (Gemini with template fallback) |
| `GET /api/sports/live` | Live games (`?sport=nfl`; `?real=1` forces real ESPN data even in demo mode) |

**Supabase-backed (need `.env.local` with Supabase keys):**

| Route | Purpose |
|---|---|
| `POST/PATCH/DELETE /api/campaigns` | Campaign CRUD for the signed-in business |
| `GET/POST /api/predictions` | Submit/list customer predictions with timing evaluation |

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
