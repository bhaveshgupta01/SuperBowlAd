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
}

export interface UserBet {
  userId: string;
  scenarioId: string;
  eventTime: number;
  replyTime: number;
  result: "WIN" | "LATE";
  code: string;
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
const defaultScenarios: Omit<BettingScenario, "createdAt">[] = [
  { id: "sc_td", title: "Will they score?", description: "Reply within 45s of a touchdown", eventType: "touchdown", active: true },
  { id: "sc_int", title: "Interception alert", description: "Reply within 45s of an interception", eventType: "interception", active: true },
];

function initScenarios() {
  if (state.bettingScenarios.length === 0) {
    const now = Math.floor(Date.now() / 1000);
    defaultScenarios.forEach((s) => {
      state.bettingScenarios.push({ ...s, createdAt: now });
    });
  }
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
