"use client";

import { useState, useEffect } from "react";
import { DEMO_GAMES, demoDemoAdapters } from "@/lib/sports/demo-data";
import { AlertCircle, Send, Zap, Play, RotateCcw } from "lucide-react";

type Sport = "nfl" | "nba" | "soccer" | "cricket";

interface DemoEvent {
  eventType: string;
  description: string;
  homeScore: number;
  awayScore: number;
}

export default function DemoPage() {
  const [selectedSport, setSelectedSport] = useState<Sport>("nfl");
  const [isSimulating, setIsSimulating] = useState(false);
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [currentCaption, setCurrentCaption] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [predictions, setPredictions] = useState<
    Array<{
      id: string;
      prediction: string;
      timestamp: number;
      result?: string;
    }>
  >([]);
  const [predictionInput, setPredictionInput] = useState("");
  const [discountCode, setDiscountCode] = useState<string>("");
  const [simSpeed, setSimSpeed] = useState(1);

  const game = DEMO_GAMES[selectedSport];
  const adapter = demoDemoAdapters[selectedSport];

  const runSimulation = async () => {
    setIsSimulating(true);
    setEvents([]);
    setPredictions([]);
    setDiscountCode("");
    setCurrentCaption("");
    adapter.resetEvents();

    const demoEvents: (DemoEvent & { delaySeconds: number })[] = [];

    // Load all events from adapter
    let event;
    while ((event = adapter.getNextEvent())) {
      demoEvents.push(event);
    }

    // Trigger events with delays
    let captionGenerated = false;
    for (const demoEvent of demoEvents) {
      await new Promise((resolve) =>
        setTimeout(resolve, demoEvent.delaySeconds * (1000 / simSpeed))
      );

      setEvents((prev) => [
        ...prev,
        {
          eventType: demoEvent.eventType,
          description: demoEvent.description,
          homeScore: demoEvent.homeScore,
          awayScore: demoEvent.awayScore,
        },
      ]);

      // Auto-generate caption for first event
      if (!captionGenerated) {
        captionGenerated = true;
        generateCaptionForEvent(demoEvent);
      }
    }

    setIsSimulating(false);
  };

  const generateCaptionForEvent = async (
    event: (DemoEvent & { delaySeconds: number }) | DemoEvent
  ) => {
    setGenerating(true);
    try {
      // Caption generation runs server-side (GEMINI_API_KEY is not exposed to
      // the browser); falls back to templates when the key is missing.
      const res = await fetch("/api/posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport: selectedSport,
          eventType: event.eventType,
          eventDescription: event.description,
          businessName: "Test Business",
          discountPercent: 20,
          timingWindowSecs: 45,
        }),
      });
      const data = await res.json();
      if (!data?.data?.caption) {
        throw new Error(data?.error || "Caption generation failed");
      }
      setCurrentCaption(data.data.caption);
    } catch (error) {
      console.error("Caption generation error:", error);
      setCurrentCaption(
        `🎉 ${event.description}\n\nReply YES or NO within 45s to win 20% off! ⚡`
      );
    } finally {
      setGenerating(false);
    }
  };

  const submitPrediction = () => {
    if (!predictionInput.trim() || !events.length) return;

    const prediction = {
      id: `pred_${Date.now()}`,
      prediction: predictionInput,
      timestamp: Date.now(),
    };

    setPredictions((prev) => [...prev, prediction]);
    setPredictionInput("");

    // Simulate instant win/loss
    setTimeout(() => {
      const isWin = Math.random() > 0.3;
      const code = isWin
        ? `GOLD${Math.floor(Math.random() * 1000)}`
        : `SILVER${Math.floor(Math.random() * 1000)}`;

      setPredictions((prev) =>
        prev.map((p) =>
          p.id === prediction.id
            ? {
                ...p,
                result: isWin
                  ? `✅ Correct! Code: ${code} (50% off)`
                  : `⏱️ Late reply. Code: ${code} (10% off)`,
              }
            : p
        )
      );

      setDiscountCode(code);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">AdBlitz Demo</h1>
              <p className="text-sm text-slate-400">Test prediction campaigns in real-time</p>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Back Home
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sport Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 sticky top-20">
              <h2 className="text-xl font-bold text-white mb-4">Demo Control Panel</h2>

              <div className="space-y-4">
                {/* Sport Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Sport
                  </label>
                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value as Sport)}
                    disabled={isSimulating}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="nfl">🏈 NFL (American Football)</option>
                    <option value="nba">🏀 NBA (Basketball)</option>
                    <option value="soccer">⚽ Soccer</option>
                    <option value="cricket">🏏 Cricket</option>
                  </select>
                </div>

                {/* Game Info */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">LIVE GAME</p>
                  <p className="text-white font-semibold">
                    {game.homeTeam} vs {game.awayTeam}
                  </p>
                  <p className="text-slate-400 text-sm mt-2">{game.venue}</p>
                </div>

                {/* Speed Control */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Simulation Speed
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.5"
                      value={simSpeed}
                      onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
                      disabled={isSimulating}
                      className="flex-1"
                    />
                    <span className="text-white font-semibold min-w-[3rem]">{simSpeed}x</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t border-slate-700">
                  <button
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSimulating ? (
                      <>
                        <Zap className="w-4 h-4 animate-pulse" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start Simulation
                      </>
                    )}
                  </button>

                  {events.length > 0 && (
                    <button
                      onClick={() => {
                        setEvents([]);
                        setPredictions([]);
                        setDiscountCode("");
                        setCurrentCaption("");
                        adapter.resetEvents();
                      }}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Live Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generated Post */}
            {currentCaption && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">Generated Post</h3>
                <div className="bg-slate-700/50 rounded-lg p-6 mb-4 border border-slate-600">
                  <p className="text-white whitespace-pre-wrap text-sm leading-relaxed">
                    {currentCaption}
                  </p>
                </div>

                {generating && (
                  <p className="text-sm text-slate-400">✨ Generating with AI...</p>
                )}
              </div>
            )}

            {/* Events Feed */}
            {events.length > 0 && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">Live Events</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {events.map((event, i) => (
                    <div key={i} className="bg-slate-700/50 rounded-lg p-4 border-l-4 border-blue-500">
                      <p className="text-white font-semibold">{event.description}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {event.homeScore} - {event.awayScore}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prediction Interface */}
            {currentCaption && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">Make Your Prediction</h3>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={predictionInput}
                    onChange={(e) => setPredictionInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && submitPrediction()}
                    placeholder="Type YES or NO..."
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={submitPrediction}
                    disabled={!predictionInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>

                {/* Predictions List */}
                {predictions.length > 0 && (
                  <div className="space-y-2">
                    {predictions.map((pred) => (
                      <div key={pred.id} className="bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-white font-semibold">{pred.prediction}</p>
                            {pred.result && (
                              <p className="text-sm font-semibold mt-1">{pred.result}</p>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(pred.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Discount Code Display */}
            {discountCode && (
              <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-2xl p-6 border border-green-500/50">
                <h3 className="text-lg font-bold text-green-400 mb-2">🎉 You Won!</h3>
                <p className="text-slate-300 mb-4">Here&apos;s your discount code:</p>
                <div className="bg-slate-700 rounded-lg p-4 border border-green-500/30 font-mono text-center">
                  <p className="text-2xl font-bold text-white">{discountCode}</p>
                </div>
                <p className="text-sm text-slate-400 mt-4">
                  Valid for 5 minutes. Use at checkout for instant discount!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        {!events.length && (
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-6">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-200 mb-2">How to use this demo</h3>
                <ol className="text-sm text-blue-100/80 space-y-1">
                  <li>1. Select a sport from the dropdown</li>
                  <li>2. Click &quot;Start Simulation&quot; to trigger game events</li>
                  <li>3. Watch as AI-generated predictions appear automatically</li>
                  <li>4. Make a prediction (&quot;YES&quot; or &quot;NO&quot;) to get a discount code</li>
                  <li>
                    5. Try other sports - each has unique events (touchdowns, goals, wickets,
                    etc.)
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
