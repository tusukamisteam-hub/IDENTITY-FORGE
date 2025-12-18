export interface GeneratedItem {
  id: string;
  url: string; // Base64 for images
  prompt: string;
  timestamp: number;
  aspectRatio: string;
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '16:9' | '9:16';

export interface GenerationConfig {
  prompt: string;
  aspectRatio: AspectRatio;
  referenceImages: string[]; // Array of Base64 strings
}
