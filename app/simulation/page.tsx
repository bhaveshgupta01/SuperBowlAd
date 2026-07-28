"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { MessageCircle, ArrowLeft, Send } from "lucide-react";

interface GameEvent {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  createdAt: number;
}

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  time: number;
};

const SIMULATION_USER_ID = "sim_user_" + Math.random().toString(36).slice(2, 9);

export default function SimulationPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [lastSeenEventId, setLastSeenEventId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const pollLatest = useCallback(async () => {
    const res = await fetch("/api/events?latest=1");
    const data = await res.json();
    const event = data.event as GameEvent | null;
    if (event && event.id !== lastSeenEventId) {
      setLastSeenEventId(event.id);
      setToast("New Story! Reply now!");
      const t = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(t);
    }
  }, [lastSeenEventId]);

  useEffect(() => {
    const interval = setInterval(pollLatest, 2000);
    return () => clearInterval(interval);
  }, [pollLatest]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const replyTime = Math.floor(Date.now() / 1000);
    const userMsg: ChatMessage = {
      id: "m_" + Date.now(),
      role: "user",
      text,
      time: replyTime,
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    try {
      const res = await fetch("/api/instagram-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: SIMULATION_USER_ID,
          message: text,
          timestamp: replyTime,
        }),
      });
      const data = await res.json();
      const botText =
        data.message ??
        (data.code
          ? `You got code: ${data.code}`
          : data.error || "No active campaign for the latest event.");
      setMessages((prev) => [
        ...prev,
        {
          id: "b_" + Date.now(),
          role: "bot",
          text: botText,
          time: Math.floor(Date.now() / 1000),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "b_" + Date.now(),
          role: "bot",
          text: "Something went wrong. Try again.",
          time: Math.floor(Date.now() / 1000),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-medium shadow-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {toast}
          </div>
        </div>
      )}

      <header className="border-b border-[var(--card-border)] bg-[var(--card)]/50 backdrop-blur shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-[var(--accent)]" />
            <span className="font-semibold text-white">Instagram User</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
        <p className="text-sm text-zinc-500 text-center mb-4">
          Simulate an Instagram user. When a story drops, reply within 45
          seconds — the first 10 fast replies win a <strong>GOLD</strong> code
          (50% off); everyone else gets <strong>SILVER</strong> (10% off). One
          play per story, codes are unique to you and expire in 24h.
        </p>

        {/* Chat area */}
        <div className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--card)] flex flex-col min-h-[320px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-zinc-500 text-sm py-8">
                Send a message to &quot;reply&quot; to the latest story. Your
                reply time will be evaluated against the last game event.
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    m.role === "user"
                      ? "bg-[var(--accent)] text-white rounded-br-md"
                      : "bg-zinc-800 text-zinc-200 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm">{m.text}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md px-4 py-2 bg-zinc-800 text-zinc-400 text-sm">
                  …
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 border-t border-[var(--card-border)] flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a reply..."
              className="flex-1 px-4 py-2.5 rounded-full bg-black/40 border border-[var(--card-border)] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="p-2.5 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
              aria-label="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/dashboard"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Open Admin Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
