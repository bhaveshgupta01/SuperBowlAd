
import React, { useState } from 'react';
import { PostStyle, Platform, ContentType, GeneratorOptions, GeneratedPost, EngagementMode } from '../types';
import { POST_STYLES, PLATFORMS, CONTENT_TYPES, GAME_EVENTS } from '../constants';
import { GeminiService } from '../services/geminiService';

interface Props {
  onPostGenerated: (post: GeneratedPost) => void;
}

export const PostGenerator: React.FC<Props> = ({ onPostGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<GeneratorOptions>({
    prompt: '',
    style: 'Hype',
    platform: 'Instagram',
    contentType: 'Image',
    gameEvent: 'touchdown',
    engagementMode: 'Viral'
  });
  const [statusMessage, setStatusMessage] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setStatusMessage('Analyzing game flow...');

    try {
      // Video generation requires a paid API key via aistudio.
      if (options.contentType === 'Video') {
        const aistudio = (window as any).aistudio;
        if (aistudio) {
          const hasKey = await aistudio.hasSelectedApiKey();
          if (!hasKey) {
            await aistudio.openSelectKey();
            // Proceed assuming success after triggering dialog.
          }
        }
      }

      const { caption, hashtags, chatbotKeyword } = await GeminiService.generateCaption(options);
      
      let imageUrl, videoUrl;
      if (options.contentType === 'Image') {
        setStatusMessage('Painting the play...');
        imageUrl = await GeminiService.generateImage(options);
      } else if (options.contentType === 'Video') {
        setStatusMessage('Processing cinematic motion...');
        videoUrl = await GeminiService.generateVideo(options);
      }

      const eventLabel = GAME_EVENTS.find(e => e.value === options.gameEvent)?.label;

      const newPost: GeneratedPost = {
        id: Math.random().toString(36).substr(2, 9),
        caption,
        hashtags,
        imageUrl,
        videoUrl,
        style: options.style,
        platform: options.platform,
        timestamp: Date.now(),
        eventLabel,
        engagementMode: options.engagementMode,
        chatbotKeyword
      };

      onPostGenerated(newPost);
      // Reset prompt but keep event
      setOptions(prev => ({ ...prev, prompt: '' }));
    } catch (error: any) {
      console.error(error);
      // Specifically handle the "Requested entity was not found" error by prompting for key again.
      if (error?.message?.includes("Requested entity was not found")) {
        alert('API key verification failed. Please select a valid paid project key.');
        const aistudio = (window as any).aistudio;
        if (aistudio) await aistudio.openSelectKey();
      } else {
        alert('The blitz got us! Check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="glass rounded-3xl p-8 shadow-2xl border-white/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-oswald font-bold flex items-center gap-3">
            <span className="bg-red-600 px-3 py-1 rounded-lg text-white italic animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.5)]">LIVE</span>
            COMMAND CENTER
          </h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-bold">LIX Broadcaster Tool</p>
        </div>
        
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/10">
          {(['Viral', 'Prediction'] as EngagementMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setOptions({ ...options, engagementMode: mode })}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${
                options.engagementMode === mode 
                  ? 'bg-red-600 text-white shadow-xl scale-105' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {mode === 'Viral' ? '🔥 Viral Hype' : '🎯 Next 30s Prediction'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Event Selection */}
          <div className="space-y-8">
            <div className="relative group">
              <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] ml-1">Current Game Event</label>
              <select
                value={options.gameEvent}
                onChange={(e) => setOptions({ ...options, gameEvent: e.target.value })}
                className="w-full bg-slate-900 border-2 border-white/5 rounded-2xl px-6 py-5 text-white font-oswald text-xl uppercase tracking-wider focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer transition-all"
              >
                {GAME_EVENTS.map((event) => (
                  <option key={event.value} value={event.value}>
                    {event.emoji} {event.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-6 bottom-5 pointer-events-none text-slate-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] ml-1">Play Modification (Optional)</label>
              <textarea
                value={options.prompt}
                onChange={(e) => setOptions({ ...options, prompt: e.target.value })}
                placeholder="e.g. Add Mahomes jersey number, or mention the Kelce-Swift effect..."
                className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-5 text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-all min-h-[120px] text-sm font-medium"
              />
            </div>
          </div>

          {/* Right Column: Style & Format */}
          <div className="space-y-8">
             <div className="grid grid-cols-2 gap-6">
               <div>
                 <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] ml-1">Post Style</label>
                 <select 
                   className="w-full bg-slate-900/50 border-2 border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                   value={options.style}
                   onChange={(e) => setOptions({...options, style: e.target.value as PostStyle})}
                 >
                   {POST_STYLES.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] ml-1">Platform</label>
                 <select 
                   className="w-full bg-slate-900/50 border-2 border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                   value={options.platform}
                   onChange={(e) => setOptions({...options, platform: e.target.value as Platform})}
                 >
                   {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                 </select>
               </div>
             </div>

             <div>
                <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] ml-1">Visual Format</label>
                <div className="grid grid-cols-2 gap-4">
                  {CONTENT_TYPES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setOptions({...options, contentType: c.value as ContentType})}
                      className={`py-4 rounded-2xl border-2 font-black uppercase tracking-widest text-xs transition-all ${
                        options.contentType === c.value 
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                        : 'border-white/5 bg-white/5 text-slate-500 hover:border-white/10'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
             </div>

             <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={`w-full py-6 rounded-2xl font-oswald font-bold text-2xl tracking-[0.1em] flex items-center justify-center gap-4 transition-all shadow-2xl relative overflow-hidden group ${
                    loading
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-500 hover:shadow-red-500/30 active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>{statusMessage}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl group-hover:rotate-12 transition-transform">🏈</span>
                      GENERATE GAME PLAY
                      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
