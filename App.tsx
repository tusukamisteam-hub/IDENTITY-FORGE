
import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, Zap, Command, Image as ImageIcon, ScanFace, Key, ExternalLink, ShieldCheck, Layers, Layout, Clock, Terminal } from 'lucide-react';
import { ReferenceUploader } from './components/ReferenceUploader';
import { Gallery } from './components/Gallery';
import { generateCharacterImage } from './services/geminiService';
import { loadSavedLibrary, saveLibraryToStorage } from './services/storage';
import { GeneratedItem, AspectRatio } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  
  const [library, setLibrary] = useState<GeneratedItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genPhase, setGenPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(false);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const saved = await loadSavedLibrary();
      if (isMounted) {
        if (saved && saved.length > 0) setLibrary(saved);
        setIsStorageLoaded(true);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (isStorageLoaded) saveLibraryToStorage(library);
  }, [library, isStorageLoaded]);

  // Loading phase messages for professional feel
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setGenPhase(p => (p + 1) % 4);
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setGenPhase(0);
    }
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (referenceImages.length === 0) {
      setError('Missing Identity references. Please upload 1-5 source images.');
      return;
    }
    if (!prompt.trim()) {
      setError('Scene description is required.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setIsQuotaExhausted(false);

    try {
      const resultUrls = await generateCharacterImage(referenceImages, prompt, aspectRatio);
      
      const newItems: GeneratedItem[] = resultUrls.map(url => ({
        id: generateId(),
        url: url,
        prompt: prompt,
        timestamp: Date.now(),
        aspectRatio: aspectRatio,
      }));

      setLibrary(prev => [...newItems, ...prev]);
    } catch (err: any) {
      const errStr = JSON.stringify(err);
      if (errStr.includes("403") || errStr.includes("PERMISSION_DENIED")) {
        setError("Synthesis Denied: The API request was rejected. This may be due to regional restrictions or service limitations.");
      } else if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
        setIsQuotaExhausted(true);
        setError("Compute Quota Exhausted. Please try again in a few moments.");
      } else {
        setError(err.message || "An unexpected error occurred during synthesis.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    setLibrary(prev => prev.filter(item => item.id !== id));
  };

  const genPhaseMessages = [
    "Analyzing Identity Matrix...",
    "Synthesizing Facial Landmarks...",
    "Extrapolating Scene Geometry...",
    "Finalizing Render Layers..."
  ];

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      
      {/* Sidebar - Control Panel */}
      <aside className="w-full md:w-[440px] flex-shrink-0 flex flex-col border-r border-white/10 bg-zinc-900/50 backdrop-blur-3xl h-full z-30">
        
        {/* Top Branding */}
        <div className="px-8 py-7 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Zap className="w-6 h-6 text-zinc-950 fill-zinc-950" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-extrabold tracking-tight leading-none uppercase">
                  Identity<span className="text-emerald-500">Forge</span>
                </h1>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                  <Terminal className="w-2.5 h-2.5" /> Engine 2.5 Pro
                </span>
              </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8 space-y-10">
          
          {/* Identity Sources */}
          <section className="space-y-4">
             <ReferenceUploader 
                images={referenceImages} 
                onImagesChange={setReferenceImages} 
             />
          </section>

          {/* Configuration Matrix */}
          <section className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Layout className="w-3 h-3" /> Canvas Dimensions
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(['1:1', '3:4', '4:3', '16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`
                      text-[11px] font-medium py-2 rounded-lg border transition-all mono
                      ${aspectRatio === ratio 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                        : 'bg-zinc-800/50 border-transparent text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}
                    `}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layers className="w-3 h-3" /> Scene Description
                </label>
                <span className="text-[10px] text-zinc-600 font-mono">{prompt.length}/500</span>
              </div>
              <div className="relative">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the environment, lighting, and action..."
                    className="w-full h-40 bg-zinc-950/50 border border-white/10 rounded-xl p-4 text-sm text-zinc-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none placeholder-zinc-700 transition-all"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
              <div className="space-y-2">
                <p className="text-xs text-red-200/80 leading-relaxed font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="pt-4">
            <button 
              onClick={handleGenerate} 
              disabled={isGenerating || referenceImages.length === 0 || !prompt.trim()}
              className={`
                w-full py-4 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all duration-500
                flex items-center justify-center gap-3 relative overflow-hidden
                ${isGenerating 
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_10px_30px_rgba(16,185,129,0.2)] hover:-translate-y-0.5'}
              `}
            >
              {isGenerating ? (
                 <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
                    <span>Processing Matrix</span>
                 </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Initiate Synthesis
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 h-full overflow-hidden relative flex flex-col bg-zinc-950">
        
        {/* Workspace Header */}
        <header className="h-20 border-b border-white/5 bg-zinc-900/20 backdrop-blur-md flex items-center justify-between px-10 z-20">
            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <h2 className="text-xs font-bold text-zinc-300 tracking-[0.2em] uppercase">Archive Library</h2>
                  <span className="text-[10px] text-zinc-600 font-mono mt-0.5">{library.length} ASSETS GENERATED</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,1)]"></div>
                    Engine Standby
                </div>
            </div>
        </header>

        {/* Gallery Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
            <div className="max-w-[1400px] mx-auto">
                {!isStorageLoaded ? (
                <div className="flex h-96 items-center justify-center">
                    <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
                ) : (
                <Gallery items={library} onDelete={handleDelete} />
                )}
            </div>
        </div>

        {/* Immersive Generation Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="w-full max-w-md space-y-8">
              <div className="relative flex justify-center">
                 <div className="w-32 h-32 rounded-full border border-emerald-500/20 flex items-center justify-center animate-pulse">
                    <div className="w-24 h-24 rounded-full border border-emerald-500/40 flex items-center justify-center">
                        <ScanFace className="w-10 h-10 text-emerald-500" />
                    </div>
                 </div>
                 {/* Decorative scanning lines */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-[1px] bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)] animate-[bounce_3s_infinite]"></div>
                 </div>
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-xl font-extrabold tracking-tight uppercase">Forging Identity</h3>
                <div className="space-y-1">
                  <p className="text-zinc-400 text-sm font-medium">{genPhaseMessages[genPhase]}</p>
                  <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">Variations in progress (2/2)</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-700 ease-out"
                  style={{ width: `${(genPhase + 1) * 25}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
