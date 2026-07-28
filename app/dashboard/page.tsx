"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Radio,
  Target,
  Zap,
  ArrowLeft,
  RefreshCw,
  FileText,
  Send,
  Image as ImageIcon,
  X,
  Users,
  Gift,
  Tag,
} from "lucide-react";

interface GameEvent {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  createdAt: number;
}

interface BettingScenario {
  id: string;
  title: string;
  description: string;
  eventType: string;
  active: boolean;
  createdAt: number;
}

interface Post {
  id: string;
  eventId: string;
  eventDescription: string;
  caption: string;
  prompt: string;
  postedAt: number;
  imageUrl?: string;
  createdAt: number;
}

interface PostStats {
  postId: string;
  interactions: number;
  uniqueUsers: number;
  gotDiscount: number;
  winCount: number;
  lateCount: number;
  redeemed: { gold: number; silver: number; total: number };
  redemptionRatePct: number;
  medianReplyLatencySecs: number | null;
  goldCap: { used: number; total: number } | null;
  usedPromoCode: { GOLD50: number; SILVER10: number };
}

interface WatcherStatus {
  running: boolean;
  config: {
    sport: string;
    gameId: string;
    mode: string;
    intervalSecs: number;
    autoPost: boolean;
    label?: string;
  } | null;
  emittedCount: number;
  queueRemaining: number | null;
  lastEvent: { description: string; at: number } | null;
  lastError: string | null;
}

interface FeaturedReplay {
  sport: string;
  gameId: string;
  label: string;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [scenarios, setScenarios] = useState<BettingScenario[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [eventType, setEventType] = useState("touchdown");
  // Generate Post flow
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [caption, setCaption] = useState("");
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  // Past post detail
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postStats, setPostStats] = useState<PostStats | null>(null);
  const [postSuccessMessage, setPostSuccessMessage] = useState<string | null>(null);
  // Game watcher
  const [watcher, setWatcher] = useState<WatcherStatus | null>(null);
  const [featuredReplay, setFeaturedReplay] = useState<FeaturedReplay | null>(null);
  const [replaySpeed, setReplaySpeed] = useState(15);
  const [autoPost, setAutoPost] = useState(true);
  const [watcherBusy, setWatcherBusy] = useState(false);
  // Code redemption (simulated point-of-sale)
  const [redeemInput, setRedeemInput] = useState("");
  const [redeemResult, setRedeemResult] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/events");
    const data = await res.json();
    setEvents(data.events ?? []);
  }, []);

  const fetchScenarios = useCallback(async () => {
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setScenarios(data.scenarios ?? []);
  }, []);

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.posts ?? []);
  }, []);

  const fetchWatcher = useCallback(async () => {
    try {
      const res = await fetch("/api/watcher");
      const data = await res.json();
      setWatcher(data.status ?? null);
      if (data.featuredReplay) setFeaturedReplay(data.featuredReplay);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchScenarios();
    fetchPosts();
    fetchWatcher();
    const t = setInterval(() => {
      fetchEvents();
      fetchWatcher();
      fetchPosts();
    }, 3000);
    return () => clearInterval(t);
  }, [fetchEvents, fetchScenarios, fetchPosts, fetchWatcher]);

  const handleStartReplay = async () => {
    if (!featuredReplay) return;
    setWatcherBusy(true);
    try {
      const res = await fetch("/api/watcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          sport: featuredReplay.sport,
          gameId: featuredReplay.gameId,
          mode: "replay",
          intervalSecs: replaySpeed,
          autoPost,
          label: featuredReplay.label,
        }),
      });
      const data = await res.json();
      setWatcher(data.status ?? null);
    } finally {
      setWatcherBusy(false);
    }
  };

  const handleStopWatcher = async () => {
    setWatcherBusy(true);
    try {
      const res = await fetch("/api/watcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      const data = await res.json();
      setWatcher(data.status ?? null);
    } finally {
      setWatcherBusy(false);
    }
  };

  const handleRedeem = async () => {
    const code = redeemInput.trim();
    if (!code || redeeming) return;
    setRedeeming(true);
    setRedeemResult(null);
    try {
      const res = await fetch("/api/codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redeem: true }),
      });
      const data = await res.json();
      setRedeemResult(data.valid ? `✅ ${data.message}` : `❌ ${data.message ?? "Invalid code"}`);
      if (data.valid) setRedeemInput("");
    } catch {
      setRedeemResult("❌ Something went wrong");
    } finally {
      setRedeeming(false);
    }
  };

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) setSelectedEventId(events[0].id);
  }, [events, selectedEventId]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await fetch("/api/simulate-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: eventType }),
      });
      await fetchEvents();
    } finally {
      setSimulating(false);
    }
  };

  const handleGeneratePost = async () => {
    const eventId = selectedEventId || events[0]?.id;
    if (!eventId) return;
    const selectedEvent = events.find((e) => e.id === eventId);
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          ...(selectedEvent && {
            eventDescription: selectedEvent.description,
            eventType: selectedEvent.type,
          }),
        }),
      });
      const data = await res.json();
      if (data.prompt) setPrompt(data.prompt);
      if (data.caption) setCaption(data.caption);
    } finally {
      setGenerating(false);
    }
  };

  const handlePostToInstagram = async () => {
    const event = events.find((e) => e.id === selectedEventId) ?? events[0];
    if (!event || !caption.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          eventDescription: event.description,
          caption: caption.trim(),
          prompt: prompt.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      setCaption("");
      setPrompt("");
      if (res.ok && data?.post) {
        setPosts((prev) => [data.post, ...prev]);
        setPostSuccessMessage("Posted! Your post is live.");
        setTimeout(() => setPostSuccessMessage(null), 4000);
      }
      const postsRes = await fetch("/api/posts");
      const postsData = await postsRes.json();
      const list = postsData.posts ?? [];
      const hasNewPost = list.some((p: Post) => p.id === data?.post?.id);
      setPosts(hasNewPost ? list : [data?.post, ...list].filter(Boolean));
    } catch {
      // ignore
    } finally {
      setPosting(false);
    }
  };

  const openPostDetail = useCallback(async (postId: string) => {
    setSelectedPostId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}/stats`);
      const data = await res.json();
      setPostStats(data);
    } catch {
      setPostStats(null);
    }
  }, []);

  const formatTime = (ts: number) => {
    return new Date(ts * 1000).toLocaleTimeString("en-US", {
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)]/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-8 h-8 text-[var(--accent)]" />
              <div>
                <h1 className="text-xl font-semibold text-white">AdBlitz</h1>
                <p className="text-xs text-zinc-500">Admin Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Live Game Watcher */}
        <section className="mb-8 p-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5 text-red-500" />
            Live Game Watcher
            {watcher?.running && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse">
                ● LIVE
              </span>
            )}
          </h2>
          <p className="text-sm text-zinc-500 mb-4">
            Streams real ESPN play-by-play into your campaigns — every touchdown,
            field goal, and interception auto-triggers an event{autoPost ? " and posts the story" : ""}.
          </p>
          {watcher?.running ? (
            <div className="space-y-3">
              <div className="text-sm text-white">
                <span className="text-zinc-400">Watching:</span>{" "}
                {watcher.config?.label ?? `${watcher.config?.sport?.toUpperCase()} game ${watcher.config?.gameId}`}{" "}
                <span className="text-zinc-500">
                  ({watcher.config?.mode}, every {watcher.config?.intervalSecs}s
                  {watcher.config?.autoPost ? ", auto-posting" : ""})
                </span>
              </div>
              <div className="text-sm text-zinc-400">
                Moments fired: <span className="text-white font-semibold">{watcher.emittedCount}</span>
                {watcher.queueRemaining !== null && (
                  <> · remaining: <span className="text-white font-semibold">{watcher.queueRemaining}</span></>
                )}
              </div>
              {watcher.lastEvent && (
                <p className="text-sm text-emerald-400 line-clamp-2">{watcher.lastEvent.description}</p>
              )}
              {watcher.lastError && (
                <p className="text-sm text-amber-400">{watcher.lastError}</p>
              )}
              <button
                onClick={handleStopWatcher}
                disabled={watcherBusy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                Stop watching
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Moment interval
                </label>
                <select
                  value={replaySpeed}
                  onChange={(e) => setReplaySpeed(Number(e.target.value))}
                  className="px-4 py-2.5 rounded-lg bg-black/40 border border-[var(--card-border)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value={10}>Every 10s (fast demo)</option>
                  <option value={15}>Every 15s</option>
                  <option value={30}>Every 30s</option>
                  <option value={60}>Every 60s</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300 pb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPost}
                  onChange={(e) => setAutoPost(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent)]"
                />
                Auto-post stories (AI captions)
              </label>
              <button
                onClick={handleStartReplay}
                disabled={watcherBusy || !featuredReplay}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                <Radio className="w-5 h-5" />
                {watcherBusy ? "Starting…" : `▶ Replay ${featuredReplay?.label ?? "Super Bowl LX"}`}
              </button>
              {watcher?.lastError && (
                <p className="text-sm text-amber-400 w-full">{watcher.lastError}</p>
              )}
            </div>
          )}
        </section>

        {/* Simulate Event */}
        <section className="mb-8 p-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Simulate event
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-[var(--card-border)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="touchdown">Touchdown - Chiefs</option>
                <option value="touchdown-49ers">Touchdown - 49ers</option>
                <option value="interception">Interception - 49ers</option>
                <option value="interception-chiefs">Interception - Chiefs</option>
                <option value="field_goal">Field Goal - Chiefs</option>
              </select>
            </div>
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
            >
              <Zap className="w-5 h-5" />
              {simulating ? "Triggering…" : "Simulate Event"}
            </button>
          </div>
        </section>

        {/* Generate Post + Post to Instagram */}
        <section className="mb-8 p-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[var(--accent)]" />
            Create post from event
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full max-w-md px-4 py-2.5 rounded-lg bg-black/40 border border-[var(--card-border)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.description} — {formatTime(ev.timestamp)}
                  </option>
                ))}
                {events.length === 0 && (
                  <option value="">Simulate an event first</option>
                )}
              </select>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGeneratePost}
                disabled={generating || events.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-700 text-white font-medium hover:bg-zinc-600 disabled:opacity-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                {generating ? "Generating…" : "Generate Post"}
              </button>
              <button
                onClick={handlePostToInstagram}
                disabled={posting || !caption.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                {posting ? "Posting…" : "Post to Instagram"}
              </button>
            </div>
            {prompt && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-[var(--card-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  placeholder="Prompt used to generate caption"
                />
              </div>
            )}
            {caption && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Caption (editable)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-[var(--card-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  placeholder="Instagram caption"
                />
              </div>
            )}
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Live Game Feed */}
          <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-500" />
                Live Game Feed
              </h2>
              <button
                onClick={fetchEvents}
                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                aria-label="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {events.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-sm">
                  No events yet. Use Simulate Event to add one.
                </div>
              ) : (
                <ul className="divide-y divide-[var(--card-border)]">
                  {events.map((ev) => (
                    <li
                      key={ev.id}
                      className="px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <span className="text-white font-medium">
                        {ev.description}
                      </span>
                      <span className="text-xs text-zinc-500 tabular-nums">
                        {formatTime(ev.timestamp)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Campaign Manager */}
          <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--card-border)]">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                Campaign Manager
              </h2>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {scenarios.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-sm">
                  Loading campaigns…
                </div>
              ) : (
                <ul className="divide-y divide-[var(--card-border)]">
                  {scenarios.map((s) => (
                    <li key={s.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-white">
                          {s.title}
                        </span>
                        {s.active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        {s.description}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Redeem a code (simulated point-of-sale) */}
        <section className="mb-8 p-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-1">
            <Tag className="w-5 h-5 text-emerald-500" />
            Redeem a code
          </h2>
          <p className="text-sm text-zinc-500 mb-4">
            Simulates the register: paste a customer&apos;s code to validate and mark
            it redeemed. Redemptions feed the ROI stats on each post.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              value={redeemInput}
              onChange={(e) => setRedeemInput(e.target.value.toUpperCase())}
              placeholder="e.g. GOLD50-X7K2"
              className="px-4 py-2.5 rounded-lg bg-black/40 border border-[var(--card-border)] text-white font-mono placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              onClick={handleRedeem}
              disabled={redeeming || !redeemInput.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {redeeming ? "Checking…" : "Validate & redeem"}
            </button>
            {redeemResult && (
              <span className="text-sm text-zinc-300">{redeemResult}</span>
            )}
          </div>
        </section>

        {/* Past posts — grid + detail modal */}
        {postSuccessMessage && (
          <p className="mb-4 text-center text-sm font-medium text-emerald-400">
            {postSuccessMessage}
          </p>
        )}
        <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-violet-500" />
            <h2 className="font-semibold text-white">Past posts</h2>
          </div>
          <div className="p-4">
            {posts.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">
                No posts yet. Generate a post and click &quot;Post to
                Instagram&quot; to add one.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => openPostDetail(post.id)}
                    className="text-left rounded-lg border border-[var(--card-border)] bg-black/30 p-4 hover:border-zinc-500 hover:bg-black/50 transition-colors"
                  >
                    <p className="text-white font-medium text-sm line-clamp-2">
                      {post.eventDescription}
                    </p>
                    <p className="text-zinc-500 text-xs mt-2">
                      {formatDate(post.postedAt)}
                    </p>
                    <p className="text-zinc-600 text-xs mt-1 line-clamp-2">
                      {post.caption.length > 60
                        ? `${post.caption.slice(0, 60)}…`
                        : post.caption}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Post detail modal */}
        {selectedPostId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setSelectedPostId(null)}
          >
            <div
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]">
                <h3 className="font-semibold text-white">Post stats</h3>
                <button
                  onClick={() => setSelectedPostId(null)}
                  className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {postStats ? (
                  <>
                    <div className="flex items-center gap-3 text-white">
                      <div className="p-2 rounded-lg bg-zinc-800">
                        <Users className="w-5 h-5 text-[var(--accent)]" />
                      </div>
                      <div>
                        <p className="font-medium">Replies</p>
                        <p className="text-2xl font-bold">
                          {postStats.interactions}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {postStats.uniqueUsers} unique{" "}
                          {postStats.uniqueUsers === 1 ? "customer" : "customers"}
                          {postStats.medianReplyLatencySecs !== null &&
                            ` · median reply ${postStats.medianReplyLatencySecs}s`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <div className="p-2 rounded-lg bg-zinc-800">
                        <Gift className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-medium">Codes issued</p>
                        <p className="text-2xl font-bold">
                          {postStats.gotDiscount}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {postStats.winCount} gold (50%) ·{" "}
                          {postStats.lateCount} silver (10%)
                          {postStats.goldCap &&
                            ` · gold cap ${postStats.goldCap.used}/${postStats.goldCap.total}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <div className="p-2 rounded-lg bg-zinc-800">
                        <Tag className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium">Redeemed at register</p>
                        <p className="text-2xl font-bold">
                          {postStats.redeemed.total}
                          <span className="text-sm font-normal text-zinc-500">
                            {" "}
                            ({postStats.redemptionRatePct}% of issued)
                          </span>
                        </p>
                        <p className="text-xs text-zinc-500">
                          gold {postStats.redeemed.gold} · silver{" "}
                          {postStats.redeemed.silver}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-zinc-500 text-sm">Loading stats…</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/simulation"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Open User Simulation →
          </Link>
        </div>
      </div>
    </main>
  );
}
