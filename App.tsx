import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, Zap, Command, Image as ImageIcon, ScanFace } from 'lucide-react';
import { ReferenceUploader } from './components/ReferenceUploader';
import { Gallery } from './components/Gallery';
import { generateCharacterImage } from './services/geminiService';
import { loadSavedLibrary, saveLibraryToStorage } from './services/storage';
import { GeneratedItem, AspectRatio } from './types';

// Simple UUID generator fallback
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  
  const [library, setLibrary] = useState<GeneratedItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  // Load from IndexedDB
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

  // Save to IndexedDB
  useEffect(() => {
    if (isStorageLoaded) saveLibraryToStorage(library);
  }, [library, isStorageLoaded]);

  const handleGenerate = async () => {
    if (referenceImages.length === 0) {
      setError('Upload at least one reference image to start.');
      return;
    }
    if (!prompt.trim()) {
      setError('Please describe the scene (e.g. "Walking in a city", "Studio background").');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Expecting an array of images now
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
      console.error(err);
      setError(err.message || "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    setLibrary(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-gray-100 font-sans overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen animate-pulse-fast"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-900/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>

      {/* --- LEFT CONTROL PANEL --- */}
      <aside className="w-full md:w-[420px] flex-shrink-0 flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-2xl h-full z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        
        {/* Branding */}
        <div className="p-6 border-b border-white/5">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                IDENTITY<span className="text-brand-400">FORGE</span>
              </span>
            </h1>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* Reference Uploader */}
          <div className="space-y-3">
             <ReferenceUploader 
                images={referenceImages} 
                onImagesChange={setReferenceImages} 
             />
             <div className="bg-brand-900/20 border border-brand-500/10 rounded-lg p-3">
               <div className="flex items-center gap-2 mb-1 text-brand-400 font-bold text-[10px] uppercase tracking-wider">
                 <ScanFace className="w-3 h-3" />
                 Character Sync
               </div>
               <p className="text-[10px] text-gray-400 leading-relaxed">
                 Upload reference photos to lock identity. The AI will generate 
                 <strong> 2 Variations</strong> with different facial expressions.
               </p>
             </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          {/* Controls */}
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
                Canvas Ratio
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(['1:1', '3:4', '4:3', '16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`
                      text-[10px] font-mono py-2 rounded-lg border transition-all
                      ${aspectRatio === ratio 
                        ? 'bg-brand-500/10 border-brand-500 text-brand-400' 
                        : 'bg-dark-800/50 border-transparent text-gray-500 hover:border-white/10 hover:text-gray-300'}
                    `}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex justify-between">
                 <span>Style / Scene Prompt</span>
                 <span className="text-gray-600">{prompt.length} chars</span>
              </label>
              <div className="relative group">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g. Full body shot, walking on a modern city street, warm lighting..."
                    className="w-full h-32 bg-dark-900/80 border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 outline-none resize-none placeholder-gray-600 transition-all shadow-inner"
                />
                <div className="absolute bottom-3 right-3 p-1.5 rounded-md bg-dark-800 text-gray-500">
                    <Command className="w-3 h-3" />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-sm text-red-200 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" />
                <p className="flex-1">{error}</p>
              </div>
            )}

            <button 
              onClick={handleGenerate} 
              disabled={isGenerating || referenceImages.length === 0 || !prompt.trim()}
              className={`
                w-full py-4 rounded-xl font-bold text-sm tracking-wide uppercase transition-all duration-300
                flex items-center justify-center gap-2 relative overflow-hidden group
                ${isGenerating 
                    ? 'bg-dark-800 text-gray-500 cursor-wait' 
                    : 'bg-gradient-to-r from-brand-700 to-emerald-600 hover:from-brand-600 hover:to-emerald-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.2)]'}
              `}
            >
              {isGenerating && (
                <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
              )}
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Forging 2 Variants...' : 'Generate 2 Variants'}
            </button>
          </div>
        </div>
      </aside>

      {/* --- RIGHT GALLERY AREA --- */}
      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
         {/* Top Bar */}
        <header className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-sm flex items-center justify-between px-8 z-10">
            <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold text-gray-300 tracking-wide uppercase">Library</h2>
                <div className="h-4 w-px bg-white/10"></div>
                <span className="text-xs text-gray-600 font-mono">{library.length} ASSETS</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" />
                    <span>Gemini 2.5 Flash</span>
                </div>
            </div>
        </header>

        {/* Gallery Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="max-w-[1600px] mx-auto">
                {!isStorageLoaded ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                </div>
                ) : (
                <Gallery items={library} onDelete={handleDelete} />
                )}
            </div>
        </div>
      </main>

    </div>
  );
}