import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit to handle base64 image uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Helper to initialize GoogleGenAI client lazily to avoid startup crashes if key is missing
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please configure your API key in the Settings > Secrets panel of Google AI Studio.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Parse base64 data URI
function parseBase64Image(dataUri: string) {
  const matches = dataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      data: matches[2],
    };
  }
  // Fallback
  return {
    mimeType: "image/jpeg",
    data: dataUri.replace(/^data:image\/[a-z]+;base64,/, ""),
  };
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint: Analyze selfie and extract physical features for prompt creation
app.post("/api/analyze-selfie", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image provided. Please upload a valid selfie." });
    }

    const { mimeType, data } = parseBase64Image(image);
    const ai = getGeminiClient();

    const promptText = `
      Analyze this casual selfie. Your task is to extract the person's key physical and demographic features to create a highly accurate, neutral, respectful physical description. This description will be used to generate a professional studio headshot that matches the user's actual features.
      
      Extract the following details precisely:
      1. Approximate gender presentation (Masculine, Feminine, or Neutral)
      2. Age range (e.g. 20s, 30s, 40s, 50s, etc.)
      3. Hair style, texture, and length (e.g., short neat crop, curly shoulder-length, long straight, bald)
      4. Hair color (e.g., dark brown, blonde, salt-and-pepper, black)
      5. Eye color and shape (e.g., brown almond-shaped, blue round, hooded green)
      6. Key facial features (e.g., strong jawline, light beard, clean-shaven, soft features)
      7. Skin tone (e.g., fair, olive, warm bronze, deep brown)
      8. Glasses or accessories (e.g., thin-rimmed black glasses, stud earrings, none)
      9. Ethnic presentation or facial structure (to preserve authentic facial bone structure and details, e.g. South Asian, East Asian, Caucasian, Latino, African-American, Middle Eastern)
      10. Generate a 1-2 sentence detailed summary of all these physical characteristics (excluding their casual clothing or casual background in the original selfie) that can be passed directly as the base character description to an image generation model.
      
      Do NOT describe their casual clothing, facial expression (unless extremely prominent), or casual background. Focus entirely on their physical face and hair so we can dress them in professional attire later.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data,
          },
        },
        {
          text: promptText,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            genderPresentation: { type: Type.STRING, description: "Gender presentation: Masculine, Feminine, or Neutral" },
            ageRange: { type: Type.STRING, description: "Age range, e.g., 20s, 30s, 40s, 50s" },
            hairStyle: { type: Type.STRING, description: "Hair style, length and texture, e.g. shoulder-length wavy" },
            hairColor: { type: Type.STRING, description: "Hair color, e.g., brunette, blonde, black" },
            eyeColor: { type: Type.STRING, description: "Eye description, e.g., hazel eyes" },
            facialFeatures: { type: Type.STRING, description: "Facial features, e.g., defined jawline, clean-shaven" },
            skinTone: { type: Type.STRING, description: "Skin tone description, e.g., medium olive" },
            glassesOrAccessories: { type: Type.STRING, description: "Eye glasses or accessories, or 'none'" },
            ethnicityOrAesthetic: { type: Type.STRING, description: "Facial structure or ethnicity description, e.g., East Asian" },
            suggestedFeaturesPrompt: { type: Type.STRING, description: "A detailed 1-2 sentence physical description of the person's face and hair to recreate them in a portrait." },
          },
          required: [
            "genderPresentation",
            "ageRange",
            "hairStyle",
            "hairColor",
            "eyeColor",
            "facialFeatures",
            "skinTone",
            "glassesOrAccessories",
            "ethnicityOrAesthetic",
            "suggestedFeaturesPrompt",
          ],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Failed to extract features from the selfie.");
    }

    const parsedResult = JSON.parse(resultText.trim());
    return res.json(parsedResult);
  } catch (error: any) {
    console.error("Error analyzing selfie:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during selfie analysis.",
    });
  }
});

// Endpoint: Generate Professional Headshot
app.post("/api/generate-headshot", async (req, res) => {
  try {
    const { style, featuresPrompt, gender, aspectRatio, customAdjustments, modelName } = req.body;

    if (!featuresPrompt) {
      return res.status(400).json({ error: "Physical characteristics description is required to generate a headshot." });
    }

    const ai = getGeminiClient();

    // Style map with detailed backdrop, lighting, and attire instructions
    const stylesMap: Record<string, { backdrop: string; clothing: string; lighting: string }> = {
      "corporate-grey": {
        backdrop: "professional solid studio grey textured backdrop, subtle vignette, corporate portrait studio",
        clothing: gender === "Feminine" 
          ? "executive charcoal grey tailored blazer over a crisp silk white blouse, professional executive attire" 
          : gender === "Masculine"
            ? "modern navy blue business suit, perfectly fitted dark grey blazer, crisp white button-down shirt with a neatly knotted necktie"
            : "professional corporate blazer over a clean button-down shirt",
        lighting: "classic high-end studio photography lighting, soft key light from the side, fill light, clean studio lighting with bright eye catchlights",
      },
      "modern-office": {
        backdrop: "bright, modern high-tech startup office, sleek interior with giant windows, soft natural depth of field background blur, warm ambient office plants in distance",
        clothing: gender === "Feminine"
          ? "smart casual high-quality knit sweater under a sharp tailored blazer, modern tech professional"
          : gender === "Masculine"
            ? "sharp casual smart blazer over a clean solid color t-shirt, tech entrepreneur style"
            : "stylish modern business-casual smart blazer over a solid color top",
        lighting: "soft and natural office window lighting, warm ambient room light, soft golden catchlights, beautiful soft shadows",
      },
      "outdoor-natural": {
        backdrop: "gorgeous outdoor park or city walkway at golden hour, blurred lush green trees and warm architectural bokeh in background, dreamy depth of field",
        clothing: gender === "Feminine"
          ? "elegant linen blazer over a cream-colored top, natural and stylish"
          : gender === "Masculine"
            ? "unbuttoned professional linen shirt under a lightweight casual blazer, relaxed business portrait"
            : "light business-casual blazer, fresh natural summer attire",
        lighting: "spectacular natural golden hour sunlight, soft backlighting creating a gentle hair glow, warm sun flare, gorgeous natural studio-like exposure",
      },
      "creative-studio": {
        backdrop: "contemporary photography dark studio backdrop, soft dark indigo canvas with a subtle colored neon ambient glow (teal and magenta rim lights) wrapping the silhouette",
        clothing: "high-fashion minimalist black blazer or tailored modern jacket, sophisticated creative director aesthetic",
        lighting: "artistic dramatic split lighting, high-contrast studio portrait, vibrant colored rim light, sparkling reflective eye details",
      },
      "executive-library": {
        backdrop: "classic executive office library, warm mahogany wooden bookshelves filled with books in the background, soft warm lamps, luxurious and premium cozy workspace, out-of-focus leather armchair",
        clothing: gender === "Feminine"
          ? "prestigious tweed blazer, elegant business executive suit with premium details"
          : gender === "Masculine"
            ? "charcoal grey wool blazer over a crisp light-blue shirt with a silk burgundy tie, elegant elite professional"
            : "prestigious tailored wool blazer over a professional buttoned shirt",
        lighting: "warm fireplace amber glow mixed with soft professional warm portrait light, dignified corporate illumination",
      }
    };

    const selectedStyle = stylesMap[style] || stylesMap["corporate-grey"];

    // Incorporate custom adjustments if provided
    let clothesPrompt = selectedStyle.clothing;
    if (customAdjustments && customAdjustments.toLowerCase().includes("wear") || customAdjustments && customAdjustments.toLowerCase().includes("clothing") || customAdjustments && customAdjustments.toLowerCase().includes("suit")) {
      clothesPrompt = `${customAdjustments}, matching a premium professional wardrobe`;
    }

    const basePrompt = `
      High-end professional studio headshot photograph of a person with the following physical traits: ${featuresPrompt}.
      
      Pose: Confident, professional, friendly posture. Facing the camera, body slightly angled with head looking directly at the camera. A warm, pleasant, and genuine smile with eyes looking directly into the lens.
      
      Wardrobe & Attire: Wearing a ${clothesPrompt}.
      
      Setting & Background: Set against a ${selectedStyle.backdrop}.
      
      Lighting: ${selectedStyle.lighting}.
      
      Photography Specs: Photorealistic, cinematic portrait photography. Ultra-realistic skin textures with visible pores, sharp details, captured on an 85mm f/1.4 prime lens, high-end professional DSLR camera, shallow depth of field, sharp focus on the face and eyes, perfectly exposed, elegant color grading, masterpieces quality.
      
      Additional directions: ${customAdjustments ? `Integrate these custom requests seamlessly: ${customAdjustments}.` : ""} Do NOT display any text, watermarks, frame borders, or extra individuals.
    `.trim();

    // Model selection based on client preference or default
    // We use gemini-3.1-flash-lite-image by default or gemini-3.1-flash-image
    const finalModel = modelName || "gemini-3.1-flash-lite-image";

    console.log(`Generating headshot using model: ${finalModel}`);
    console.log(`Prompt: ${basePrompt}`);

    const response = await ai.models.generateContent({
      model: finalModel,
      contents: {
        parts: [
          {
            text: basePrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
          imageSize: finalModel === "gemini-3.1-flash-image" ? "1K" : undefined, // Size config is supported on high-quality model
        },
      },
    });

    // Extract base64 image data
    let base64Image = "";
    let responseText = "";

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Image = part.inlineData.data;
        } else if (part.text) {
          responseText += part.text;
        }
      }
    }

    if (!base64Image) {
      console.error("Gemini Response text parts if any:", responseText);
      throw new Error(responseText || "The image generation model did not return any image data. Ensure your API key has appropriate quota and access.");
    }

    return res.json({
      imageUrl: `data:image/png;base64,${base64Image}`,
      promptUsed: basePrompt,
      modelUsed: finalModel,
    });
  } catch (error: any) {
    console.error("Error generating headshot:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate headshot. Please check your API key status and try again.",
    });
  }
});

// Start server
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
