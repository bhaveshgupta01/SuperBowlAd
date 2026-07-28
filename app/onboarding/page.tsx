"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"profile" | "social" | "done">("profile");

  const [profile, setProfile] = useState({
    instagram_handle: "",
    whatsapp_number: "",
  });

  const handleProfileUpdate = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        throw new Error("No authenticated user");
      }

      // Update business profile
      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          instagram_handle: profile.instagram_handle,
          whatsapp_number: profile.whatsapp_number,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setStep("social");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to AdBlitz!</h1>
          <p className="text-xl text-slate-300">Let&apos;s set up your social media accounts</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-12">
          {[
            { name: "Profile", active: true },
            { name: "Social", active: step === "social" || step === "done" },
            { name: "Done", active: step === "done" },
          ].map((s, i) => (
            <div key={s.name} className="flex items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  (s.active && step !== "done") || step === "done"
                    ? "bg-blue-600 text-white"
                    : step === "profile"
                    ? "bg-slate-700 text-slate-400"
                    : "bg-blue-600 text-white"
                }`}
              >
                {step === "done" && s.active ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  i + 1
                )}
              </div>
              <p className="ml-3 font-medium text-slate-300">{s.name}</p>
              {i < 2 && (
                <div
                  className={`w-24 h-1 ml-6 rounded ${
                    (step === "done" && i < 2) || (step === "social" && i === 0)
                      ? "bg-blue-600"
                      : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-12 border border-slate-700">
          {error && (
            <div className="mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {step === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Connect Your Instagram Account
                </h2>
                <p className="text-slate-400 mb-6">
                  Enter your Instagram handle. This is where we&apos;ll post prediction
                  campaigns.
                </p>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Instagram Handle
                </label>
                <div className="flex items-center">
                  <span className="bg-slate-700 text-slate-400 px-4 py-2 rounded-l-lg border border-r-0 border-slate-600">
                    @
                  </span>
                  <input
                    type="text"
                    value={profile.instagram_handle}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        instagram_handle: e.target.value,
                      }))
                    }
                    placeholder="yourbusiness"
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-r-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  WhatsApp Business Number (Optional)
                </label>
                <input
                  type="tel"
                  value={profile.whatsapp_number}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      whatsapp_number: e.target.value,
                    }))
                  }
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 mt-2">
                  If you have a WhatsApp Business account, we can send predictions there too
                </p>
              </div>

              <button
                onClick={handleProfileUpdate}
                disabled={loading || !profile.instagram_handle}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-8"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? "Connecting..." : "Continue"}
              </button>
            </div>
          )}

          {step === "social" && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-4">All Set!</h2>
                <p className="text-slate-400 mb-6">
                  Your business account is now connected. You&apos;re ready to start creating
                  prediction campaigns!
                </p>

                <div className="bg-slate-700/50 rounded-lg p-6 text-left mb-8">
                  <h3 className="font-semibold text-white mb-4">What&apos;s next?</h3>
                  <ul className="space-y-3 text-slate-300">
                    <li className="flex items-start gap-3">
                      <span className="text-blue-400 font-bold">1.</span>
                      <span>Go to the Dashboard to select a live game</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-400 font-bold">2.</span>
                      <span>Create a campaign with prediction rules</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-400 font-bold">3.</span>
                      <span>Watch predictions roll in and engage with customers!</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
