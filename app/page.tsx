import Link from "next/link";
import { Zap, MessageCircle, LayoutDashboard, Play, LogIn } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-950/30 text-sm text-blue-300">
          <Zap className="w-4 h-4" />
          Real-Time Sports Marketing for Small Businesses
        </div>

        <h1 className="text-6xl font-bold tracking-tight text-white">
          AdBlitz
        </h1>

        <p className="text-xl text-slate-300 max-w-xl mx-auto">
          Engage customers with live sports predictions. Create instant discount campaigns triggered by game events—no coding required.
        </p>

        {/* Main CTA */}
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-lg"
            >
              <LogIn className="w-5 h-5" />
              Get Started Free
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold transition-colors"
            >
              <Play className="w-5 h-5" />
              Try Live Demo
            </Link>
          </div>

          <p className="text-sm text-slate-400">No credit card required • Works with all sports • Demo mode available</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          {[
            {
              icon: "⚽",
              title: "4 Sports",
              desc: "NFL, NBA, Soccer, Cricket - and more coming",
            },
            {
              icon: "🎯",
              title: "Smart Predictions",
              desc: "AI-generated questions matching game events",
            },
            {
              icon: "💰",
              title: "Instant Discounts",
              desc: "Auto-generate codes, manage expiry per campaign",
            },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
              <p className="text-3xl mb-3">{feature.icon}</p>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer Links */}
        <div className="pt-12 border-t border-slate-700 flex flex-wrap justify-center gap-6 text-sm text-slate-400">
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Admin Dashboard
          </Link>
          <Link href="/simulation" className="hover:text-white transition-colors">
            User Simulation
          </Link>
          <Link href="/demo" className="hover:text-white transition-colors">
            Demo
          </Link>
          <Link href="/auth/signin" className="hover:text-white transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
