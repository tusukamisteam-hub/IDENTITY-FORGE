import React, { useState } from 'react';
import { Download, Maximize2, Trash2, X, FileImage, Image as ImageIcon, ChevronDown, Sparkles } from 'lucide-react';
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
    
    const filename = `identity-forge-${item.id}-${resolution}`;
    
    const image = new Image();
    image.src = item.url;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      let targetWidth = image.width;
      let targetHeight = image.height;

      // Determine Resolution
      // Base logic: 4K is roughly 3840 on the long edge.
      if (resolution === '4K') {
        const scale = 3840 / Math.max(image.width, image.height);
        targetWidth = image.width * scale;
        targetHeight = image.height * scale;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // High quality scaling
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
      <div className="h-full flex flex-col items-center justify-center text-gray-600 border border-dashed border-dark-700/50 rounded-3xl p-8 bg-dark-800/20 backdrop-blur-sm">
        <div className="w-20 h-20 rounded-full bg-dark-800/50 flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/5">
            <ImageIcon className="w-8 h-8 opacity-20" />
        </div>
        <p className="text-xl font-light text-gray-400">Gallery Empty</p>
        <p className="text-sm text-gray-600 mt-2">Upload images to start merging.</p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4 pb-20">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-dark-800 border border-white/5 shadow-2xl hover:shadow-brand-500/10 transition-all duration-300"
          >
            <img 
              src={item.url} 
              alt={item.prompt} 
              className="w-full h-auto object-cover"
              loading="lazy"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
              <p className="text-gray-200 text-xs line-clamp-2 mb-4 font-light italic">{item.prompt}</p>
              
              <div className="flex gap-2 justify-end items-center">
                <button 
                  onClick={() => setSelectedItem(item)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-transform hover:scale-105"
                  title="View Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                
                {/* Download Dropdown */}
                <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDownloadOptions(showDownloadOptions === item.id ? null : item.id);
                      }}
                      className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    
                    {/* Popup Menu */}
                    {showDownloadOptions === item.id && (
                        <div className="absolute bottom-full right-0 mb-2 w-32 bg-dark-800 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                             <div className="text-[10px] text-gray-500 font-bold px-3 py-2 bg-dark-900/50 uppercase tracking-wider">Quality</div>
                             <button onClick={(e) => handleDownload(e, item, 'Original')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors">Original</button>
                             <button onClick={(e) => handleDownload(e, item, '4K')} className="w-full text-left px-3 py-2 text-xs text-brand-400 hover:bg-white/10 transition-colors font-medium">4K Ultra HD</button>
                        </div>
                    )}
                </div>

                <button 
                  onClick={() => onDelete(item.id)}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/30 text-red-200 border border-red-500/20 transition-transform hover:scale-105"
                  title="Delete"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-300 backdrop-blur-md">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setSelectedItem(null)}></div>

            <div className="relative max-w-7xl w-full flex flex-col items-center pointer-events-none">
                <img 
                    src={selectedItem.url} 
                    alt={selectedItem.prompt}
                    className="max-h-[85vh] w-auto rounded-xl shadow-[0_0_50px_rgba(34,197,94,0.1)] border border-dark-700 pointer-events-auto" 
                />
                
                <div className="mt-8 flex items-center gap-4 pointer-events-auto">
                     <button 
                        onClick={(e) => handleDownload(e, selectedItem, '4K')}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-1"
                    >
                        <Download className="w-4 h-4" />
                        DOWNLOAD 4K
                    </button>
                </div>
                
                <button 
                    onClick={() => setSelectedItem(null)}
                    className="absolute -top-12 right-0 md:top-0 md:-right-16 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors pointer-events-auto"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>
      )}
    </>
  );
};