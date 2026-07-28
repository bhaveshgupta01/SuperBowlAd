/**
 * In-memory store for AdBlitz prototype.
 * Holds active campaigns, game events, and user bets.
 *
 * State is anchored on globalThis because Next.js dev mode can compile each
 * route handler into its own module instance — plain module-level arrays end
 * up duplicated per route and the routes stop seeing each other's data.
 */

export interface GameEvent {
  id: string;
  type: string;
  description: string;
  timestamp: number; // Unix seconds
  createdAt: number;
}

export interface BettingScenario {
  id: string;
  title: string;
  description: string;
  eventType: string; // e.g. "touchdown"
  active: boolean;
  createdAt: number;
  // Campaign economics — owner-configurable per scenario
  winWindowSecs: number; // reply window, anchored to post time
  winnerCap: number; // first N fast replies win gold; the rest get silver
  winCodeBase: string; // e.g. "GOLD50"
  lateCodeBase: string; // e.g. "SILVER10"
  winDiscountPercent: number;
  lateDiscountPercent: number;
}

export interface UserBet {
  userId: string;
  scenarioId: string;
  eventId: string;
  eventTime: number;
  replyTime: number;
  latencySecs: number; // reply delay vs the window anchor (post time)
  result: "WIN" | "LATE";
  code: string; // unique per bet, e.g. GOLD50-X7K2
  discountPercent: number;
  expiresAt: number; // Unix seconds; invalid at redemption after this
  redeemedAt?: number;
  createdAt: number;
  postId?: string;
}

export interface Post {
  id: string;
  eventId: string;
  eventDescription: string;
  caption: string;
  prompt: string;
  postedAt: number;
  imageUrl?: string;
  createdAt: number;
}

interface StoreState {
  gameEvents: GameEvent[];
  bettingScenarios: BettingScenario[];
  userBets: UserBet[];
  posts: Post[];
  activePostId: string | null;
  // Latest event for simulation page (so it can show "New Story! Reply now!")
  latestEventForSimulation: GameEvent | null;
}

const globalStore = globalThis as unknown as { __adblitzStore?: StoreState };

const state: StoreState = (globalStore.__adblitzStore ??= {
  gameEvents: [],
  bettingScenarios: [],
  userBets: [],
  posts: [],
  activePostId: null,
  latestEventForSimulation: null,
});

// --- Game Events ---
export function addGameEvent(event: Omit<GameEvent, "id" | "createdAt">): GameEvent {
  const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const created: GameEvent = {
    ...event,
    id,
    createdAt: Math.floor(Date.now() / 1000),
  };
  state.gameEvents.unshift(created);
  state.latestEventForSimulation = created;
  // Keep last 50 events
  if (state.gameEvents.length > 50) state.gameEvents.pop();
  return created;
}

export function getGameEvents(): GameEvent[] {
  return [...state.gameEvents];
}

export function getLatestEventForSimulation(): GameEvent | null {
  return state.latestEventForSimulation;
}

export function clearLatestEventForSimulation(): void {
  state.latestEventForSimulation = null;
}

// --- Betting Scenarios (Active Campaigns) ---
const scenarioDefaults = {
  active: true,
  winWindowSecs: 45,
  winnerCap: 10,
  winCodeBase: "GOLD50",
  lateCodeBase: "SILVER10",
  winDiscountPercent: 50,
  lateDiscountPercent: 10,
};

const defaultScenarios: Omit<BettingScenario, "createdAt">[] = [
  { id: "sc_td", title: "Touchdown rush", description: "First 10 replies within 45s of a touchdown story win GOLD (50% off); everyone else gets SILVER (10%)", eventType: "touchdown", ...scenarioDefaults },
  { id: "sc_int", title: "Interception alert", description: "First 10 replies within 45s of an interception story win GOLD (50% off); everyone else gets SILVER (10%)", eventType: "interception", ...scenarioDefaults },
  { id: "sc_fg", title: "Field goal flash", description: "First 10 replies within 45s of a field-goal story win GOLD (50% off); everyone else gets SILVER (10%)", eventType: "field_goal", ...scenarioDefaults },
];

function initScenarios() {
  const now = Math.floor(Date.now() / 1000);
  if (state.bettingScenarios.length === 0) {
    defaultScenarios.forEach((s) => {
      state.bettingScenarios.push({ ...s, createdAt: now });
    });
    return;
  }
  // The globalThis store survives dev hot reloads — backfill fields added
  // after older-shape scenarios were seeded, and add any new default scenario.
  state.bettingScenarios.forEach((s, i) => {
    state.bettingScenarios[i] = { ...scenarioDefaults, ...s };
  });
  defaultScenarios.forEach((d) => {
    if (!state.bettingScenarios.some((s) => s.id === d.id)) {
      state.bettingScenarios.push({ ...d, createdAt: now });
    }
  });
}
initScenarios();

export function getBettingScenarios(): BettingScenario[] {
  return [...state.bettingScenarios];
}

export function getActiveScenarioForEventType(eventType: string): BettingScenario | null {
  return state.bettingScenarios.find((s) => s.active && s.eventType === eventType) ?? null;
}

// --- User Bets ---
export function addUserBet(bet: Omit<UserBet, "createdAt">): UserBet {
  const created: UserBet = {
    ...bet,
    createdAt: Math.floor(Date.now() / 1000),
  };
  state.userBets.unshift(created);
  return created;
}

export function getUserBets(): UserBet[] {
  return [...state.userBets];
}

export function getBetsForPost(postId: string): UserBet[] {
  return state.userBets.filter((b) => b.postId === postId);
}

export function findBetByUserAndEvent(userId: string, eventId: string): UserBet | null {
  return state.userBets.find((b) => b.userId === userId && b.eventId === eventId) ?? null;
}

export function countWinsForEvent(eventId: string): number {
  return state.userBets.filter((b) => b.eventId === eventId && b.result === "WIN").length;
}

export function findBetByCode(code: string): UserBet | null {
  return state.userBets.find((b) => b.code.toUpperCase() === code.toUpperCase()) ?? null;
}

export function markBetRedeemed(code: string): UserBet | null {
  const bet = findBetByCode(code);
  if (!bet) return null;
  bet.redeemedAt = Math.floor(Date.now() / 1000);
  return bet;
}

// --- Posts ---
export function addPost(post: Omit<Post, "id" | "createdAt">): Post {
  const id = `post_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const created: Post = {
    ...post,
    id,
    createdAt: Math.floor(Date.now() / 1000),
  };
  state.posts.unshift(created);
  return created;
}

export function getPosts(): Post[] {
  return [...state.posts];
}

export function getPostById(id: string): Post | null {
  return state.posts.find((p) => p.id === id) ?? null;
}

export function setActivePostId(id: string | null): void {
  state.activePostId = id;
}

export function getActivePostId(): string | null {
  return state.activePostId;
}
