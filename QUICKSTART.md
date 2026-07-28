# AdBlitz Quick Start (5 minutes)

## Try it right now (no setup, no env vars)

```bash
npm install
npm run dev
```

Then walk the core flow:

1. Open **http://localhost:3000/dashboard**
2. Pick "Touchdown - Chiefs" → click **Simulate Event**
3. Click **Generate Post** → edit the caption if you like → **Post to Instagram**
4. Open **http://localhost:3000/simulation** in a second tab → you'll see the "New Story! Reply now!" toast
5. Type any reply. Within 45 seconds of the event → code **GOLD50**. Later → **SILVER10**
6. Back on the dashboard, click the post in **Past posts** to see its stats

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
