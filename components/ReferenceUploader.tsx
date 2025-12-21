import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon, Plus, Scan } from 'lucide-react';

interface ReferenceUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export const ReferenceUploader: React.FC<ReferenceUploaderProps> = ({ images, onImagesChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 5;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
  };

  const processFiles = (files: File[]) => {
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) return;
    
    const filesToProcess = files.slice(0, remainingSlots);

    Promise.all(filesToProcess.map(file => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
    }))).then(newBase64s => {
        onImagesChange([...images, ...newBase64s]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Scan className="w-3 h-3 text-emerald-500" /> Identity Matrix
          </h3>
          <p className="text-[10px] text-zinc-600 mono">LOCKED: {images.length}/{MAX_IMAGES}</p>
        </div>
        {images.length > 0 && (
          <button 
            onClick={() => onImagesChange([])}
            className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors font-bold uppercase tracking-wider"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2 h-20">
        {/* Slot-based UI for professional tech feel */}
        {[...Array(MAX_IMAGES)].map((_, idx) => {
          const img = images[idx];
          return (
            <div 
              key={idx} 
              className={`
                relative group w-full h-full rounded-lg overflow-hidden border transition-all duration-300
                ${img ? 'border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'border-white/5 bg-zinc-950/50'}
              `}
            >
              {img ? (
                <>
                  <img src={img} alt="Ref" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex items-center justify-center text-zinc-700 hover:text-zinc-500 hover:bg-zinc-900 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};