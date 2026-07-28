# AdBlitz Setup Guide

> **Setup is optional.** The core demo (`/dashboard`, `/simulation`, `/demo`) runs with zero configuration — see [QUICKSTART.md](./QUICKSTART.md). This guide is for enabling the optional integrations: Supabase (auth + persistence) and Gemini (AI captions).

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Google Gemini API key (optional, for AI caption generation)
- GitHub account (for deployment)

## Step 1: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new account
2. Click "New Project" and create a project named "AdBlitz"
3. Copy your project URL and anon key from the dashboard
4. Go to the **SQL Editor** and run the schema from [SUPABASE_SCHEMA.sql](./SUPABASE_SCHEMA.sql):
   - Copy the entire SQL file
   - Paste it into the SQL editor in Supabase
   - Click "Run"

## Step 2: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in the required variables:

   ```bash
   # From Supabase Project Settings
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # Google Gemini API (optional but recommended)
   # Get from: https://aistudio.google.com/app/apikey
   GEMINI_API_KEY=your_gemini_key_here

   # Feature Flags
   NEXT_PUBLIC_DEMO_MODE=true
   NEXT_PUBLIC_USE_REAL_SPORTS_API=false
   ```

   To get Supabase keys:
   - Go to Project Settings → API
   - Copy `Project URL` and `anon` key
   - Copy `service_role` key (keep this secret!)

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Test the App

### Option A: Demo Mode (No Auth Needed)

1. Go to [http://localhost:3000/demo](http://localhost:3000/demo)
2. Select a sport from the dropdown
3. Watch demo game events trigger automatically
4. Click "Generate Post" to create AI-powered captions
5. Submit a prediction to test the discount code flow

### Option B: Full Auth Flow (Email/Password)

1. Go to [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup)
2. Create an account with your email
3. Fill in business details (e.g., "Joe's Pizza", "Restaurant", "San Francisco")
4. On the onboarding page, add your Instagram handle
5. Manage campaigns via the API (`POST /api/campaigns` etc. — see QUICKSTART.md); a campaign-management UI on the dashboard is still on the roadmap

> **Known limitation:** API routes currently create a Supabase client without cookie forwarding, so the server cannot see the browser's session — authenticated API calls (campaign CRUD) return 401/fallback data even when you are signed in on the client. Fixing this requires wiring `@supabase/auth-helpers-nextjs` (already installed) into the routes. See README_IMPLEMENTATION.md.

## Step 6: Deploy to Vercel

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial AdBlitz deployment"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub

3. Click "Add New..." → "Project"

4. Select your AdBlitz repository

5. Add environment variables:
   - Go to Settings → Environment Variables
   - Add all variables from `.env.local`

6. Click "Deploy"

7. Your app will be live at `https://your-project.vercel.app`

## Troubleshooting

### "Supabase is not configured"
- Make sure `.env.local` is in the root of the project
- Verify all keys are copied correctly (no extra spaces)
- Dev server must be restarted after changing `.env.local`
- Without keys the app still runs — auth pages show a notice and the demo flow works

### "Unauthorized" errors
- Make sure you're signed in (check `/auth/signin`)
- Check browser console for auth errors
- Note the known limitation above: server-side routes can't currently see the browser session, so authed API calls fail by design until cookie-based auth is wired in

### Gemini API errors
- If you don't have a Gemini key, captions will use templates
- Get a free key at https://aistudio.google.com/app/apikey
- No cost for reasonable usage (up to 60 requests/min)

### Demo mode not showing events
- Check that `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local`
- Refresh the page
- Check browser console for errors

## File Structure Overview

```
app/
  auth/                          # Authentication pages
    signin/
    signup/
  api/
    sports/live                  # Get live games
    campaigns                     # CRUD campaigns
    posts/generate               # Generate AI captions
    posts/                        # Post CRUD
    predictions/                 # Submit predictions
    codes/validate               # Validate discount codes
  dashboard/                      # Owner dashboard
  onboarding/                     # Setup flow
  demo/                           # Public demo page
lib/
  auth.ts                         # Auth utilities
  gemini.ts                       # AI caption generation
  codes.ts                        # Discount code generation
  supabase.ts                     # Supabase client
  sports/                         # Sports data adapters
    index.ts
    types.ts
    espn.ts                       # ESPN NFL/NBA
    demo-data.ts                  # Demo events for testing
SUPABASE_SCHEMA.sql              # Database schema
```

## Next Steps (Production Ready)

To make this production-ready for deployment:

1. **Real Instagram API**: Implement `POST /api/instagram/post` to actually post to Instagram stories
2. **WhatsApp Business API**: Integrate Meta Cloud API for real DM interactions
3. **Real Sports Data**: Configure ESPN, Football-Data, or Cricket APIs
4. **Authentication**: Add social login (Google, Instagram)
5. **Payments**: Add Stripe for subscription pricing
6. **Email**: Set up Resend or SendGrid for email notifications
7. **Analytics**: Integrate PostHog or Mixpanel for usage tracking
8. **Rate Limiting**: Add rate limiting on API routes
9. **Tests**: Add Jest/Playwright tests
10. **Monitoring**: Set up Sentry for error tracking

## Support

For issues or questions:
- Check the CLAUDE.md file for codebase documentation
- Review README_IMPLEMENTATION.md for current status and known limitations
