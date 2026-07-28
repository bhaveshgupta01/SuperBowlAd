import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when Supabase env vars are present. The app must keep working without
 * them (zero-config demo mode) — callers use this to pick a fallback path.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Copy .env.local.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see SETUP.md). The demo at /dashboard and /simulation works without it.";

// Throws only when a Supabase call is actually attempted, so importing this
// module never crashes a page or route in zero-config mode.
function unconfiguredClient(): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get() {
      throw new Error(NOT_CONFIGURED_MESSAGE);
    },
  });
}

// Browser client
export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : unconfiguredClient();

// Server-side client (with service role for admin operations)
export function getServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      supabaseUrl ? "SUPABASE_SERVICE_ROLE_KEY not set" : NOT_CONFIGURED_MESSAGE
    );
  }
  return createClient(supabaseUrl, serviceKey);
}

// Types for database
export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          location: string;
          instagram_handle: string | null;
          whatsapp_number: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["businesses"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
      };
      campaigns: {
        Row: {
          id: string;
          business_id: string;
          sport: string;
          game_id: string;
          event_types: string[];
          prediction_type: string;
          timing_window_secs: number;
          discount_percent: number;
          code_validity_mins: number;
          auto_post_interval_mins: number | null;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["campaigns"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
      };
      game_events: {
        Row: {
          id: string;
          sport: string;
          game_id: string;
          event_type: string;
          severity: string;
          description: string;
          occurred_at: string;
          home_team: string;
          away_team: string;
          home_score: number;
          away_score: number;
          raw_data: unknown;
        };
        Insert: Omit<Database["public"]["Tables"]["game_events"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["game_events"]["Insert"]>;
      };
      posts: {
        Row: {
          id: string;
          campaign_id: string;
          game_event_id: string;
          caption: string;
          image_url: string | null;
          prediction_question: string;
          correct_answer: string | null;
          platform: string;
          posted_at: string;
          prediction_closes_at: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["posts"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
      };
      predictions: {
        Row: {
          id: string;
          post_id: string;
          customer_identifier: string;
          prediction_value: string;
          submitted_at: string;
          is_correct: boolean | null;
          within_window: boolean | null;
          code_issued: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["predictions"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["predictions"]["Insert"]>;
      };
      discount_codes: {
        Row: {
          id: string;
          prediction_id: string | null;
          campaign_id: string;
          code: string;
          discount_percent: number;
          valid_from: string;
          valid_until: string;
          redeemed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["discount_codes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["discount_codes"]["Insert"]>;
      };
    };
  };
};
