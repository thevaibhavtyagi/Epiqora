/**
 * Gemini Service
 * Handles AI skin analysis using Google Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/environment.js';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Expected JSON structure for skin analysis
 */
const ANALYSIS_JSON_SCHEMA = {
  skin_type: { type: 'string', confidence: 'number' },
  acne: { present: 'boolean', severity: 'string' },
  pigmentation: { level: 'string' },
  dark_circles: { present: 'boolean' },
  pores: { visibility: 'string' },
  texture: { smoothness: 'string' },
  overall_score: 'number',
};

/**
 * Analyze skin from image using Gemini
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} mimeType - Image MIME type
 * @param {number} maxRetries - Maximum retry attempts for JSON parsing
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzeSkin(imageBuffer, mimeType, maxRetries = 3) {
  try {
    // Validate API key
    if (!config.geminiApiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured. Please set it in your environment variables.'
      );
    }

    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');

    // Get the generative model and force JSON output
    // UPDATED: Using the active gemini-2.0-flash model to resolve the 404 error
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // Create the prompt for skin analysis
    const analysisPrompt = `You are an expert dermatologist and skincare analyst. Analyze the face in this image and provide a detailed skin analysis.

Analyze the following aspects:
1. Skin Type (oily, combination, dry, normal) with confidence 0-100
2. Acne (present: true/false, severity: none/mild/moderate/severe if present)
3. Pigmentation (level: even/mild/moderate/significant)
4. Dark Circles (present: true/false)
5. Pores (visibility: minimal/normal/large/very large)
6. Texture (smoothness: smooth/slightly textured/textured/very textured)
7. Overall Skin Health Score (0-100)

Respond with this exact JSON structure:
{
  "skin_type": {"type": "string value", "confidence": number},
  "acne": {"present": boolean, "severity": "string value or null"},
  "pigmentation": {"level": "string value"},
  "dark_circles": {"present": boolean},
  "pores": {"visibility": "string value"},
  "texture": {"smoothness": "string value"},
  "overall_score": number
}`;

    let analysisData = null;
    let lastError = null;

    // Retry logic for JSON parsing
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Call Gemini API with image
        const response = await model.generateContent([
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          analysisPrompt,
        ]);

        const responseText = response.response.text();

        // Parse JSON response
        analysisData = parseAnalysisResponse(responseText);

        // Validate structure
        validateAnalysisStructure(analysisData);

        console.log(`[Gemini] Analysis successful on attempt ${attempt}`);
        return {
          success: true,
          data: analysisData,
          attempt,
        };
      } catch (error) {
        lastError = error;
        console.warn(`[Gemini] Attempt ${attempt} failed: ${error.message}`);

        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to get valid analysis after ${maxRetries} attempts. Last error: ${lastError.message}`
    );
  } catch (error) {
    console.error('[Gemini] Analysis error:', error.message);
    throw error;
  }
}

/**
 * Parse and extract JSON from Gemini response
 * @param {string} responseText - Raw response text from Gemini
 * @returns {Object} Parsed JSON object
 */
function parseAnalysisResponse(responseText) {
  try {
    // Try direct parsing first
    return JSON.parse(responseText);
  } catch (e) {
    // Fallback to regex extraction if direct parsing fails
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (fallbackError) {
      throw new Error(`Invalid JSON in response: ${fallbackError.message}`);
    }
  }
}

/**
 * Validate analysis JSON structure
 * @param {Object} data - Parsed analysis data
 * @throws {Error} If structure is invalid
 */
function validateAnalysisStructure(data) {
  const required = ['skin_type', 'acne', 'pigmentation', 'dark_circles', 'pores', 'texture', 'overall_score'];

  for (const field of required) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate types
  if (!data.skin_type || typeof data.skin_type !== 'object') {
    throw new Error('Invalid skin_type structure');
  }

  if (!data.acne || typeof data.acne !== 'object') {
    throw new Error('Invalid acne structure');
  }

  if (typeof data.overall_score !== 'number' || data.overall_score < 0 || data.overall_score > 100) {
    throw new Error('Invalid overall_score: must be a number between 0 and 100');
  }
}

export default {
  analyzeSkin,
};