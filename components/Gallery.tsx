
import React, { useState } from 'react';
import { Download, Maximize2, Trash2, X, FileImage, Image as ImageIcon, ChevronDown, Sparkles, ExternalLink } from 'lucide-react';
import { GeneratedItem } from '../types';

interface GalleryProps {
  items: GeneratedItem[];
  onDelete: (id: string) => void;
}

type Resolution = 'Original' | '4K';

export const Gallery: React.FC<GalleryProps> = ({ items, onDelete }) => {
  const [selectedItem, setSelectedItem] = useState<GeneratedItem | null>(null);
  const [showDownloadOptions, setShowDownloadOptions] = useState<string | null>(null);

  const handleDownload = (e: React.MouseEvent, item: GeneratedItem, resolution: Resolution) => {
    e.stopPropagation();
    const filename = `id-forge-${item.id.slice(0,4)}-${resolution}`;
    const image = new Image();
    image.src = item.url;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      let targetWidth = image.width;
      let targetHeight = image.height;
      if (resolution === '4K') {
        const scale = 3840 / Math.max(image.width, image.height);
        targetWidth = image.width * scale;
        targetHeight = image.height * scale;
      }
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
      setShowDownloadOptions(null);
    };
  };

  if (items.length === 0) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-zinc-600 border border-white/5 bg-zinc-900/10 rounded-3xl p-12">
        <div className="w-24 h-24 rounded-3xl bg-zinc-900 flex items-center justify-center mb-8 shadow-inner border border-white/5">
            <ImageIcon className="w-10 h-10 opacity-10" />
        </div>
        <h3 className="text-xl font-bold text-zinc-300">Archive Offline</h3>
        <p className="text-sm text-zinc-500 mt-2 max-w-xs text-center leading-relaxed">Identity Matrix is ready for synthesis. Upload references to begin asset generation.</p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6 pb-20">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-500 hover:border-emerald-500/30 shadow-sm"
          >
            <img 
              src={item.url} 
              alt={item.prompt} 
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              loading="lazy"
            />
            
            {/* Professional Info Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase mono">Ready</span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase mono">{item.aspectRatio}</span>
                </div>
                <span className="text-[9px] text-zinc-600 mono">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <p className="text-zinc-300 text-xs line-clamp-2 font-medium leading-relaxed">{item.prompt}</p>
              
              <div className="flex gap-2">
                {/* Fixed: Removed duplicate onClick and corrected function call to setSelectedItem */}
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  <Maximize2 className="w-3 h-3" /> Inspect
                </button>
                
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDownloadOptions(showDownloadOptions === item.id ? null : item.id);
                    }}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  {showDownloadOptions === item.id && (
                    <div className="absolute bottom-full right-0 mb-2 w-40 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                       <button onClick={(e) => handleDownload(e, item, 'Original')} className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/5 transition-colors flex justify-between items-center">
                          Standard <span>PNG</span>
                       </button>
                       <button onClick={(e) => handleDownload(e, item, '4K')} className="w-full text-left px-4 py-2.5 text-xs text-emerald-400 hover:bg-white/5 transition-colors font-bold flex justify-between items-center">
                          UHD <span>4K</span>
                       </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => onDelete(item.id)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-red-950/30 text-zinc-500 hover:text-red-400 border border-zinc-700 hover:border-red-900/30 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/98 p-8 animate-in fade-in duration-500 backdrop-blur-xl">
            <div className="absolute inset-0" onClick={() => setSelectedItem(null)}></div>
            <div className="relative max-w-6xl w-full flex flex-col items-center">
                <div className="w-full mb-6 flex justify-between items-center px-4">
                  <div className="flex items-center gap-4">
                     <h3 className="text-zinc-100 font-bold uppercase tracking-[0.2em] text-xs">Asset Inspection</h3>
                     <span className="px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-500 mono">{selectedItem.aspectRatio}</span>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="p-3 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <img 
                    src={selectedItem.url} 
                    alt={selectedItem.prompt}
                    className="max-h-[75vh] w-auto rounded-3xl shadow-2xl border border-white/5 pointer-events-auto" 
                />
                
                <div className="mt-10 flex items-center gap-4 w-full max-w-2xl bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
                   <div className="flex-1 space-y-2">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Prompt</p>
                      <p className="text-sm text-zinc-300 leading-relaxed italic">"{selectedItem.prompt}"</p>
                   </div>
                   <button 
                      onClick={(e) => handleDownload(e, selectedItem, '4K')}
                      className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-3"
                    >
                      <Download className="w-4 h-4" /> 4K Download
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};
