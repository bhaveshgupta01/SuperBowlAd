# AdBlitz Quick Start (5 minutes)

## Try it right now (no setup, no env vars)

```bash
npm install
npm run dev
```

**Fastest demo — replay the real Super Bowl:**

1. Open **http://localhost:3000/dashboard** → click **▶ Replay Super Bowl LX**. Real ESPN play-by-play streams in; each touchdown/field goal/interception auto-posts an AI-captioned story.
2. Open **http://localhost:3000/simulation** in a second tab → wait for the "New Story! Reply now!" toast → reply fast. First 10 fast replies win a unique **GOLD** code (50% off); everyone else gets **SILVER** (10%). One play per story; codes expire in 24h.
3. Back on the dashboard: paste your code into **Redeem a code** (the simulated register), then click the post in **Past posts** for the ROI funnel (replies, unique customers, gold cap usage, redemption rate, median reply speed).

**Manual flow (no watcher):**

1. On the dashboard, pick "Touchdown - Chiefs" → **Simulate Event**
2. **Generate Post** → edit the caption if you like → **Post to Instagram**
3. Reply on `/simulation` as above

Also try **http://localhost:3000/demo** — a scripted multi-sport simulation (NFL, NBA, soccer, cricket) with caption generation and mock discount codes.

Everything above runs in memory and resets on server restart.

## Optional upgrades

| Add | Get | How |
|---|---|---|
| `GEMINI_API_KEY` | Real AI captions instead of templates | Free key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey), put it in `.env.local` |
| Supabase keys | Auth, business profiles, persistent campaigns/predictions/codes | See [SETUP.md](./SETUP.md) |

## API endpoints (curl)

These work with zero config:

```bash
# Trigger a game event
curl -X POST http://localhost:3000/api/simulate-event \
  -H "Content-Type: application/json" -d '{"type": "touchdown"}'

# Latest event (what /simulation polls)
curl "http://localhost:3000/api/events?latest=1"

# Generate a caption for the latest event
curl -X POST http://localhost:3000/api/generate-post \
  -H "Content-Type: application/json" -d '{}'

# Simulate a customer DM reply (timestamp = Unix seconds)
curl -X POST http://localhost:3000/api/instagram-webhook \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"u1\", \"message\": \"YES\", \"timestamp\": $(date +%s)}"

# Start the Super Bowl LX replay (real ESPN play-by-play, auto-posting)
curl -X POST http://localhost:3000/api/watcher \
  -H "Content-Type: application/json" \
  -d '{"action":"start","sport":"nfl","gameId":"401772988","mode":"replay","intervalSecs":15,"autoPost":true}'

# Watcher status / stop
curl http://localhost:3000/api/watcher
curl -X POST http://localhost:3000/api/watcher \
  -H "Content-Type: application/json" -d '{"action":"stop"}'

# Validate & redeem a code minted by the webhook (works with zero config)
curl -X POST http://localhost:3000/api/codes/validate \
  -H "Content-Type: application/json" -d '{"code": "GOLD50-X7K2", "redeem": true}'

# Live games (demo data unless real sports APIs enabled)
curl "http://localhost:3000/api/sports/live?sport=nfl"

# AI caption for an arbitrary event (templates without GEMINI_API_KEY)
curl -X POST http://localhost:3000/api/posts/generate \
  -H "Content-Type: application/json" \
  -d '{"sport":"nfl","eventType":"touchdown","eventDescription":"Chiefs score!","businessName":"Pizza Place","discountPercent":20,"timingWindowSecs":45}'
```

These need Supabase configured (see [SETUP.md](./SETUP.md)):

```bash
# Submit a prediction (post_id must exist in Supabase)
curl -X POST http://localhost:3000/api/predictions \
  -H "Content-Type: application/json" \
  -d '{"post_id":"<uuid>","customer_identifier":"customer_456","prediction_value":"yes"}'

# Validate a discount code
curl -X POST http://localhost:3000/api/codes/validate \
  -H "Content-Type: application/json" -d '{"code": "ABC12345", "redeem": false}'
```

## Troubleshooting

**Campaign Manager shows nothing** — refresh; with no Supabase configured it lists the two built-in in-memory scenarios (touchdown + interception).

**Replies always return SILVER10** — more than 45 seconds passed since the simulated event. Simulate a fresh event and reply immediately.

**Sign up / sign in shows "Accounts are disabled"** — expected without Supabase keys; the demo pages work regardless.

**Captions look templated** — that's the fallback. Set `GEMINI_API_KEY` in `.env.local` and restart the dev server for AI captions.

## More documentation

- **[README.md](./README.md)** — purpose, route map, setup tiers
- **[SETUP.md](./SETUP.md)** — full Supabase/Gemini/deployment guide
- **[README_IMPLEMENTATION.md](./README_IMPLEMENTATION.md)** — what works, known limitations, roadmap
- **[CLAUDE.md](./CLAUDE.md)** — architecture notes
