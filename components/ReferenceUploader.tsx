import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';

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

    // Bulk reader helper ensures state is only updated once with the full new set
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
    <div className="w-full space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <ImageIcon className="w-3 h-3 text-brand-400" />
          Identity Matrix ({images.length}/{MAX_IMAGES})
        </h3>
        {images.length > 0 && (
          <button 
            onClick={() => onImagesChange([])}
            className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-bold uppercase"
          >
            Clear Matrix
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2 h-24">
        {/* Existing Images */}
        {images.map((img, idx) => (
          <div key={idx} className="relative group w-full h-full rounded-lg overflow-hidden border border-brand-500/30 bg-dark-800 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
            <img 
              src={img} 
              alt={`Ref ${idx}`} 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" 
            />
            <button
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute bottom-0 inset-x-0 h-1 bg-brand-500"></div>
          </div>
        ))}

        {/* Upload Button */}
        {images.length < MAX_IMAGES && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="col-span-1 border-2 border-dashed border-dark-600 bg-dark-800/30 hover:bg-dark-700/50 hover:border-brand-500/50 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all group"
          >
            <div className="p-1.5 rounded-full bg-dark-700 group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
              <Plus className="w-4 h-4 text-gray-500 group-hover:text-brand-400" />
            </div>
            <span className="text-[9px] text-gray-500 mt-1 font-medium group-hover:text-gray-300">ADD</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      
      <p className="text-[10px] text-gray-500 font-mono text-center">
        Upload 1-5 angles for maximum character consistency.
      </p>
    </div>
  );
};