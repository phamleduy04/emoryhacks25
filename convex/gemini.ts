import { GoogleGenAI } from "@google/genai";
import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from './_generated/api';

interface ParsedEmail {
  final_price: number | null;
  tax: number | null;
  fees: number | null;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || "",
});

async function fetchImageBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image ${url}: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Uint8Array -> base64 using btoa
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const selectImagesPrompt =
"You are an expert car photography evaluator. I will provide multiple images of a car. Your task is to analyze all the photos and select the best 3 exterior images that together give the most complete visual coverage of the vehicle.\n\n" +
"Selection criteria:\n" +
"- Only consider EXTERIOR photos of the car; ignore interior shots entirely.\n" +
"- Choose images from different angles (front, rear, side, or 3/4 views).\n" +
"- Prefer images that are sharp, well-lit, and unobstructed.\n" +
"- Avoid blurry, redundant, dark, or partial views.\n" +
"- If several images show the same angle, select only the best one.\n\n" +
"Output instructions:\n" +
"Return only the following JSON object:\n" +
"{\n" +
'  "selected_indices": [index1, index2, index3]\n' +
"}\n\n" +
"Where index1, index2, and index3 are the zero-based indices of the chosen images in the order they were provided.\n" +
"Do not include reasoning. Do not include any markdown, code blocks, comments, or extra text. Only return the JSON object.\n\n" +
"I will now upload the images.";

const videoGenerationPrompt = "Create a clean, cinematic showcase video using the car photos I provided. Display each image with smooth cross-fade transitions, subtle zoom-ins and zoom-outs, and soft ambient lighting. Keep the style professional and minimal. Do not generate or hallucinate new angles—use only the photos as they are."

export const generateVideo = action({
  args: {
    vin: v.string(),
    images: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    let contents = [];
    for (const imageUrl of args.images) {
      const dataBytes: string = await fetchImageBase64(imageUrl)
      contents.push({
        inlineData: {
          mimeType: "image/webp",
          data: dataBytes
        },
      })
    }
    contents.push({
      text: selectImagesPrompt
    });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });
    const indices = JSON.parse(response.text || "").selected_indices as number[];

    const referenceImages = await Promise.all(
      indices.map(async index => ({
        image: {
          imageBytes: await fetchImageBase64(args.images[index]),
          mimeType: "image/webp",
        },
      }))
    );

    let operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt: videoGenerationPrompt,
      config: {
        referenceImages: referenceImages
      }
    });

    while (!operation.done) {
      console.log("Waiting for video generation to complete...")
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }

    const video = operation.response?.generatedVideos?.[0];
    if (!video) {
      throw new Error("No video generated");
    }
  
    const fileUri = `${video?.video?.uri}&key=${process.env.GOOGLE_GENAI_API_KEY}` || "";
    // const fileUri = "https://generativelanguage.googleapis.com/download/v1beta/files/p2uyycotqncs:download?alt=media&key=" + process.env.GOOGLE_GENAI_API_KEY;
    const videoRes = await fetch(
      fileUri
    );

    if (!videoRes.ok) {
      throw new Error(`Failed to fetch video: ${videoRes.status}`);
    }

    const videoBlob = await videoRes.blob();
    const storageId = await ctx.storage.store(videoBlob);

    await ctx.runMutation(api.gemini.saveVideoMetadata, {
      storageId,
      vin: args.vin
    });

    return {
      storageId,
    };
  },
});

export const saveVideoMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    vin: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("videos", {
      storageId: args.storageId,
      vin: args.vin,
    });
  },
});