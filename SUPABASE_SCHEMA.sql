-- AdBlitz Database Schema
-- Run this SQL in your Supabase project's SQL editor (https://app.supabase.com)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Businesses table (owner accounts)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'restaurant', 'retail', 'bar', 'gym', etc.
  location TEXT NOT NULL,
  instagram_handle TEXT,
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Campaigns table (prediction campaign rules set by owner)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sport TEXT NOT NULL, -- 'nfl', 'nba', 'soccer', 'cricket'
  game_id TEXT NOT NULL,
  event_types TEXT[] NOT NULL, -- ['touchdown', 'field_goal']
  prediction_type TEXT NOT NULL, -- 'story_poll', 'dm_chatbot', 'both'
  timing_window_secs INT NOT NULL DEFAULT 120,
  discount_percent INT NOT NULL DEFAULT 20,
  code_validity_mins INT NOT NULL DEFAULT 10,
  auto_post_interval_mins INT, -- NULL = event-triggered only
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game Events table (live sports events from APIs or demo)
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport TEXT NOT NULL,
  game_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'touchdown', 'wicket', 'goal', etc.
  severity TEXT NOT NULL, -- 'minor', 'major', 'peak'
  description TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table (generated and published posts)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  game_event_id UUID REFERENCES game_events(id) ON DELETE SET NULL,
  caption TEXT NOT NULL,
  image_url TEXT,
  prediction_question TEXT NOT NULL,
  correct_answer TEXT, -- Set when event resolves
  platform TEXT NOT NULL, -- 'instagram', 'whatsapp', 'both'
  posted_at TIMESTAMPTZ NOT NULL,
  prediction_closes_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions table (customer predictions submitted)
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  customer_identifier TEXT NOT NULL, -- hashed IG handle or WA number
  prediction_value TEXT NOT NULL, -- 'yes', 'no', or custom
  submitted_at TIMESTAMPTZ NOT NULL,
  is_correct BOOLEAN,
  within_window BOOLEAN,
  code_issued BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount Codes table
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE SET NULL,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_percent INT NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_campaigns_business_id ON campaigns(business_id);
CREATE INDEX idx_campaigns_active ON campaigns(active) WHERE active = TRUE;
CREATE INDEX idx_game_events_sport ON game_events(sport);
CREATE INDEX idx_game_events_game_id ON game_events(game_id);
CREATE INDEX idx_game_events_occurred_at ON game_events(occurred_at DESC);
CREATE INDEX idx_posts_campaign_id ON posts(campaign_id);
CREATE INDEX idx_posts_game_event_id ON posts(game_event_id);
CREATE INDEX idx_posts_prediction_closes_at ON posts(prediction_closes_at);
CREATE INDEX idx_predictions_post_id ON predictions(post_id);
CREATE INDEX idx_predictions_customer_identifier ON predictions(customer_identifier);
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_campaign_id ON discount_codes(campaign_id);
CREATE INDEX idx_discount_codes_valid_until ON discount_codes(valid_until);

-- Row Level Security (RLS) Policies
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Businesses: Users can only see/edit their own business
CREATE POLICY "Users can view their own business"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business"
  ON businesses FOR UPDATE
  USING (auth.uid() = user_id);

-- Campaigns: Users can only manage campaigns for their business
CREATE POLICY "Users can view campaigns for their business"
  ON campaigns FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create campaigns for their business"
  ON campaigns FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update campaigns for their business"
  ON campaigns FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Game Events: Public read, only admin can insert
CREATE POLICY "Anyone can read game events"
  ON game_events FOR SELECT
  USING (TRUE);

-- Posts: Public read, business can insert
CREATE POLICY "Anyone can read posts"
  ON posts FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create posts for their campaigns"
  ON posts FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      INNER JOIN businesses b ON c.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Predictions: Public read, public can insert
CREATE POLICY "Anyone can read predictions"
  ON predictions FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can submit predictions"
  ON predictions FOR INSERT
  WITH CHECK (TRUE);

-- Discount Codes: Public read redeemed status only
CREATE POLICY "Anyone can read discount codes"
  ON discount_codes FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can create discount codes"
  ON discount_codes FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Anyone can redeem discount codes"
  ON discount_codes FOR UPDATE
  USING (TRUE);
