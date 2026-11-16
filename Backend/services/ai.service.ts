// services/ai.service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { AppError } from "../utils/AppError.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ─────────────────────────────────────────────────────────────
// 1. Generate Text (Fast & Resilient)
// ─────────────────────────────────────────────────────────────
export const generateText = async (
  prompt: string,
  tone: string,
  context: string = ""
): Promise<string> => {
  // Try the fastest model first
  try {
    return await callGemini("gemini-3.5-flash-lite", prompt, tone, context);
  } catch (error: any) {
    console.warn(`Primary model failed (${error.message}). Trying fallback...`);
    
    // Fallback to the previous generation Lite model
    try {
      return await callGemini("gemini-2.5-flash-lite", prompt, tone, context);
    } catch (fallbackError: any) {
      throw new AppError(
        `All AI models failed. Please try again later.`, 
        503, 
        "AI_SERVICE_UNAVAILABLE"
      );
    }
  }
};

// Helper function to handle the actual API call and timeout
const callGemini = async (modelName: string, prompt: string, tone: string, context: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ 
    model: modelName, 
    generationConfig: { 
      maxOutputTokens: 500, // Enough for a post, fast to generate
    }
  });
  
  const fullPrompt = context 
    ? `Previous conversation: ${context}\n\nNew request: "${prompt}"\nTone: ${tone}. Write the next response. Do not use hashtags.`
    : `Write a short, engaging social media post based on this prompt: "${prompt}". Tone: ${tone}. Do not use hashtags.`;

  // 12-second timeout to fail fast
  const timeoutPromise = new Promise<string>((_, reject) => {
    setTimeout(() => reject(new Error("AI_TIMEOUT")), 12000); 
  });

  const result = await Promise.race([
    model.generateContent(fullPrompt),
    timeoutPromise
  ]) as any;

  return result.response.text();
};

// // ─────────────────────────────────────────────────────────────
// // 2. Generate Image (Leonardo)
// // ─────────────────────────────────────────────────────────────
// export const generateImage = async (prompt: string): Promise<string> => {
//   try {
//     const apiKey = process.env.LEONARDO_API_KEY;
//     if (!apiKey) throw new AppError("Leonardo API key missing", 500, "CONFIG_ERROR");

//     const response = await axios.post(
//       "https://cloud.leonardo.ai/api/rest/v1/generations",
//       {
//         prompt: prompt,
//         // 👇 Flux Schnell model (Fast & Cost-Effective)
//         modelId: "1dd50843-d653-4516-a8e3-f0238ee453ff",
//         width: 512,  // Smaller size saves credits
//         height: 512, // Smaller size saves credits
//         num_images: 1,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${apiKey}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const generationId = response.data.sdGenerationJob.generationId;
//     let imageUrl = "";
//     let attempts = 0;
    
//     // Poll for result (Leonardo takes ~5-10s)
//     while (!imageUrl && attempts < 10) {
//       await new Promise((r) => setTimeout(r, 3000));
      
//       const statusRes = await axios.get(
//         `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
//         { headers: { Authorization: `Bearer ${apiKey}` } }
//       );
      
//       const generatedImages = statusRes.data.generations_by_pk?.generated_images;
//       if (generatedImages && generatedImages.length > 0) {
//         imageUrl = generatedImages[0].url;
//       }
//       attempts++;
//     }

//     if (!imageUrl) throw new AppError("Image generation timed out", 500, "IMAGE_TIMEOUT");
//     return imageUrl;
    
//   } catch (error: any) {
//     if (error instanceof AppError) throw error;
    
//     // Log the exact error from Leonardo if it fails
//     if (error.response && error.response.data) {
//       console.error("Leonardo API Detailed Error:", JSON.stringify(error.response.data, null, 2));
//     }
    
//     throw new AppError(`Leonardo AI Error: ${error.message}`, 500, "AI_IMAGE_ERROR");
//   }
// };

// ─────────────────────────────────────────────────────────────
// 2. Generate Image (100% FREE Pollinations AI)
// ─────────────────────────────────────────────────────────────
export const generateImage = async (prompt: string): Promise<string> => {
  try {
    // 1. URL-encode the prompt so it can be safely used in a URL
    const encodedPrompt = encodeURIComponent(prompt);
    
    // 2. Build the Pollinations URL
    // width/height set to 1024 for high quality
    // nologo=true removes the Pollinations watermark
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
    
    // 3. Return the URL instantly (no polling or waiting required)
    return imageUrl;
  } catch (error: any) {
    throw new AppError(`Image Generation Error: ${error.message}`, 500, "AI_IMAGE_ERROR");
  }
};