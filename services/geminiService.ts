import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

const extractBase64 = (dataUrl: string): { data: string; mimeType: string } => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 string");
  }
  const mimeType = matches[1];
  if (!mimeType.startsWith('image/')) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
  return { mimeType: matches[1], data: matches[2] };
};

/**
 * Resizes a base64 image to prevent large payload errors and improve performance.
 */
const resizeImage = (base64: string, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width *= maxWidth / height;
          height = maxWidth;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        resolve(base64);
      }
    };
    img.onerror = () => resolve(base64);
  });
};

// --- IMAGE GENERATION ---
export const generateCharacterImage = async (
  referenceImages: string[],
  prompt: string,
  aspectRatio: AspectRatio
): Promise<string[]> => {
  // Obtain key from environment and use mandatory named parameter initialization.
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing. Please select one using the key icon.");
  
  if (referenceImages.length === 0) throw new Error("No reference images provided.");

  // Resize images to ensure we don't hit payload limits
  const resizedReferences = await Promise.all(referenceImages.map(img => resizeImage(img)));

  // Instantiate client INSIDE the function to use the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const imageParts = resizedReferences.map(img => {
    const { data, mimeType } = extractBase64(img);
    return {
      inlineData: { mimeType, data }
    };
  });

  // Use Gemini 2.5 Flash for high compatibility and speed.
  // We switch back to Flash from Pro to avoid 403 errors for users on free/standard keys.
  const modelName = 'gemini-2.5-flash-image';

  const basePrompt = `
    CONTEXT: Character-consistent photorealistic portraiture.
    TASK: Generate a single high-quality image based on the provided reference photos.
    IDENTITY: The person in the generated image MUST have identical facial features, skin texture, and core identity as the references.
    SCENE: ${prompt || "Professional studio portrait with clean lighting."}
    QUALITY: Photorealistic, high-resolution, sharp focus, cinematic lighting.
  `.trim();

  const variations = [
    "EXPRESSION: Professional and confident. Subtle smile, direct gaze.",
    "EXPRESSION: Warm, cheerful, and approachable smile. Candid energy."
  ];

  const results: string[] = [];

  for (const expressionInstruction of variations) {
    try {
      const fullPrompt = `${basePrompt}\n\n${expressionInstruction}`;
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            ...imageParts,
            { text: fullPrompt }
          ],
        },
        config: {
          imageConfig: { 
            aspectRatio: aspectRatio
            // imageSize is NOT supported by gemini-2.5-flash-image, removed to avoid config errors.
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      let foundImage = false;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            results.push(`data:image/png;base64,${part.inlineData.data}`);
            foundImage = true;
            break;
          }
        }
      }
      
      if (!foundImage) {
        console.warn("No image data found in response parts.");
      }

      // Respect standard rate limits
      if (results.length < variations.length) {
        await new Promise(r => setTimeout(r, 1200));
      }
    } catch (error: any) {
      console.error("Variation generation failed:", error);
      // Re-throw specific errors for App.tsx to handle (403, 429, etc.)
      const errorStr = JSON.stringify(error);
      if (errorStr.includes("403") || errorStr.includes("PERMISSION_DENIED") || 
          errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || 
          errorStr.includes("Requested entity was not found")) {
        throw error;
      }
    }
  }

  if (results.length === 0) {
    throw new Error("Generation failed. This often happens due to API key restrictions or safety filters. Please try connecting a Paid API Key.");
  }

  return results;
};