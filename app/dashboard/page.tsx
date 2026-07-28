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
  gotDiscount: number;
  winCount: number;
  lateCount: number;
  usedPromoCode: { GOLD50: number; SILVER10: number };
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

  useEffect(() => {
    fetchEvents();
    fetchScenarios();
    fetchPosts();
    const t = setInterval(fetchEvents, 3000);
    return () => clearInterval(t);
  }, [fetchEvents, fetchScenarios, fetchPosts]);

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
                        <p className="font-medium">Users interacted</p>
                        <p className="text-2xl font-bold">
                          {postStats.interactions}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <div className="p-2 rounded-lg bg-zinc-800">
                        <Gift className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-medium">Got discount (replied)</p>
                        <p className="text-2xl font-bold">
                          {postStats.gotDiscount}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {postStats.winCount} on time (GOLD50) ·{" "}
                          {postStats.lateCount} late (SILVER10)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <div className="p-2 rounded-lg bg-zinc-800">
                        <Tag className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium">Promo code used</p>
                        <p className="text-sm">
                          GOLD50:{" "}
                          <span className="font-bold text-emerald-400">
                            {postStats.usedPromoCode.GOLD50}
                          </span>
                          {" · "}
                          SILVER10:{" "}
                          <span className="font-bold text-zinc-400">
                            {postStats.usedPromoCode.SILVER10}
                          </span>
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
