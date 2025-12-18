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
  if (!process.env.API_KEY) throw new Error("API Key is missing.");
  if (referenceImages.length === 0) throw new Error("No reference images provided.");

  // Resize images to ensure we don't hit payload limits (Gemini has request size caps)
  const resizedReferences = await Promise.all(referenceImages.map(img => resizeImage(img)));

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imageParts = resizedReferences.map(img => {
    const { data, mimeType } = extractBase64(img);
    return {
      inlineData: { mimeType, data }
    };
  });

  const basePrompt = `
    CONTEXT: Character-consistent photorealistic portraiture.
    TASK: Generate a single high-quality image based on the provided reference photos.
    IDENTITY: The person in the generated image MUST have identical facial features and identity as the references.
    SCENE: ${prompt || "Professional studio portrait with clean lighting."}
    QUALITY: Photorealistic, sharp focus, 8k textures, cinematic lighting.
  `.trim();

  // Define 2 distinct facial expressions for the variations
  const variations = [
    "EXPRESSION: Confident, professional, and composed. Direct eye contact.",
    "EXPRESSION: Warm, happy, and engaging smile. Approachable and friendly energy."
  ];

  const results: string[] = [];

  // Sequential execution ensures we don't hit 429 rate limits on standard API tiers
  for (const expressionInstruction of variations) {
    try {
      const fullPrompt = `${basePrompt}\n\n${expressionInstruction}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            ...imageParts,
            { text: fullPrompt }
          ],
        },
        config: {
          imageConfig: { aspectRatio: aspectRatio },
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
        console.warn("No image part found in model response for variation.");
      }

      // Small delay to prevent rate limiting
      if (results.length < variations.length) {
        await new Promise(r => setTimeout(r, 600));
      }
    } catch (error: any) {
      console.error("Single generation attempt failed:", error);
    }
  }

  if (results.length === 0) {
    throw new Error("Failed to generate any images. This may be due to safety filters or connection issues. Please try adjusting your prompt or reference photos.");
  }

  return results;
};