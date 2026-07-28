import { ESPNNFLAdapter, ESPNNBAAdapter } from "./sports/espn";
import type { GameEvent as SportEvent, SportsApiAdapter } from "./sports/types";
import { addGameEvent, addPost, setActivePostId, getActiveScenarioForEventType } from "./store";
import { captionForEvent } from "./captions";
import { WIN_WINDOW_SECONDS } from "./campaign-logic";

/**
 * Game watcher: the bridge between the sports feed and the campaign flow.
 *
 * - "live" mode polls ESPN play-by-play every intervalSecs; plays present at
 *   start are baselined (not emitted) so only new game moments trigger.
 * - "replay" mode fetches a finished game's play-by-play once and re-emits
 *   its marketing moments one per tick — real data, demoable any day.
 *
 * Every emitted event is stamped with the CURRENT time (the customer's reply
 * window starts when we detect/post, not at the original wallclock), and with
 * autoPost the story is generated and published server-side immediately, so
 * the full advertised window belongs to the customer.
 *
 * State lives on globalThis for the same reason as lib/store.ts.
 */

export interface WatcherConfig {
  sport: "nfl" | "nba";
  gameId: string;
  mode: "live" | "replay";
  intervalSecs: number;
  autoPost: boolean;
  label?: string;
}

export interface WatcherStatus {
  running: boolean;
  config: WatcherConfig | null;
  startedAt: number | null;
  emittedCount: number;
  queueRemaining: number | null; // replay only
  lastEvent: { description: string; at: number } | null;
  lastError: string | null;
}

interface WatcherState {
  config: WatcherConfig | null;
  timer: ReturnType<typeof setInterval> | null;
  running: boolean;
  startedAt: number | null;
  seenPlayIds: Set<string>;
  queue: SportEvent[];
  emittedCount: number;
  lastEvent: { description: string; at: number } | null;
  lastError: string | null;
  ticking: boolean;
}

const globalStore = globalThis as unknown as { __adblitzWatcher?: WatcherState };

const state: WatcherState = (globalStore.__adblitzWatcher ??= {
  config: null,
  timer: null,
  running: false,
  startedAt: null,
  seenPlayIds: new Set(),
  queue: [],
  emittedCount: 0,
  lastEvent: null,
  lastError: null,
  ticking: false,
});

export const FEATURED_REPLAY = {
  sport: "nfl" as const,
  gameId: "401772988",
  label: "Super Bowl LX — Seahawks @ Patriots (Feb 2026)",
};

function adapterFor(sport: "nfl" | "nba"): SportsApiAdapter {
  return sport === "nfl" ? ESPNNFLAdapter : ESPNNBAAdapter;
}

async function emitEvent(ev: SportEvent, config: WatcherConfig): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const stored = addGameEvent({
    type: ev.eventType,
    description: ev.description,
    timestamp: now,
  });
  state.emittedCount += 1;
  state.lastEvent = { description: ev.description, at: now };

  if (!config.autoPost) return;

  // Only auto-post moments that have an active campaign — no point posting
  // a sack story when no discount is attached to sacks.
  const scenario = getActiveScenarioForEventType(ev.eventType.toLowerCase());
  if (!scenario) return;

  try {
    const { prompt, caption } = await captionForEvent(stored, scenario.winWindowSecs ?? WIN_WINDOW_SECONDS);
    const post = addPost({
      eventId: stored.id,
      eventDescription: stored.description,
      caption,
      prompt,
      postedAt: Math.floor(Date.now() / 1000),
    });
    setActivePostId(post.id);
  } catch (e) {
    state.lastError = `Auto-post failed: ${e instanceof Error ? e.message : String(e)}`;
  }
}

async function tick(): Promise<void> {
  if (!state.running || !state.config || state.ticking) return;
  state.ticking = true;
  const config = state.config;

  try {
    if (config.mode === "replay") {
      const next = state.queue.shift();
      if (!next) {
        stopWatcher();
        return;
      }
      await emitEvent(next, config);
      if (state.queue.length === 0) {
        stopWatcher();
      }
      return;
    }

    // live mode: emit plays not seen before
    const events = await adapterFor(config.sport).getGameEvents(config.gameId);
    for (const ev of events) {
      if (state.seenPlayIds.has(ev.id)) continue;
      state.seenPlayIds.add(ev.id);
      await emitEvent(ev, config);
    }
  } catch (e) {
    state.lastError = e instanceof Error ? e.message : String(e);
  } finally {
    state.ticking = false;
  }
}

export async function startWatcher(config: WatcherConfig): Promise<WatcherStatus> {
  stopWatcher();

  state.config = config;
  state.startedAt = Math.floor(Date.now() / 1000);
  state.seenPlayIds = new Set();
  state.queue = [];
  state.emittedCount = 0;
  state.lastEvent = null;
  state.lastError = null;

  const adapter = adapterFor(config.sport);

  if (config.mode === "replay") {
    const events = await adapter.getGameEvents(config.gameId);
    if (events.length === 0) {
      state.lastError = "No campaign-worthy plays found for this game";
      return getWatcherStatus();
    }
    state.queue = events;
  } else {
    // Baseline existing plays so only future moments trigger campaigns
    const existing = await adapter.getGameEvents(config.gameId);
    existing.forEach((ev) => state.seenPlayIds.add(ev.id));
  }

  state.running = true;
  state.timer = setInterval(() => {
    void tick();
  }, Math.max(5, config.intervalSecs) * 1000);

  // Replay: emit the first moment immediately so the demo starts instantly
  if (config.mode === "replay") {
    void tick();
  }

  return getWatcherStatus();
}

export function stopWatcher(): WatcherStatus {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  state.running = false;
  return getWatcherStatus();
}

export function getWatcherStatus(): WatcherStatus {
  return {
    running: state.running,
    config: state.config,
    startedAt: state.startedAt,
    emittedCount: state.emittedCount,
    queueRemaining: state.config?.mode === "replay" ? state.queue.length : null,
    lastEvent: state.lastEvent,
    lastError: state.lastError,
  };
}
