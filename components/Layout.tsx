
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed top-0 -left-20 w-96 h-96 bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 -right-20 w-96 h-96 bg-red-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <header className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-nfl-red p-2 rounded-lg rotate-3 shadow-lg shadow-red-900/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-oswald font-bold tracking-tight">
              SUPERBOWL<span className="text-red-500">VIRAL</span>
            </h1>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Campaigns</a>
            <a href="#" className="hover:text-white transition-colors">Analytics</a>
            <a href="#" className="hover:text-white transition-colors">Resources</a>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      <footer className="mt-20 border-t border-white/10 py-10 px-6 text-center text-slate-500 text-sm">
        <p>&copy; 2025 SuperBowl Viral. Powered by Gemini Flash 3.0</p>
      </footer>
    </div>
  );
};
