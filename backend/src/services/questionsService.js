/**
 * Questions Service
 * Generates adaptive questions based on skin analysis using Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/environment.js';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Generate adaptive questions based on skin analysis
 * @param {Object} analysisData - Skin analysis data from Gemini
 * @returns {Promise<Object>} Generated questions
 */
export async function generateQuestions(analysisData) {
  try {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // UPDATED: Use the modern model and force strict JSON output
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // Build context from analysis
    const analysisContext = formatAnalysisContext(analysisData);

    const questionPrompt = `You are a skincare expert. Based on this skin analysis data, generate 5 personalized follow-up questions to understand the user's skincare habits, concerns, and goals.

SKIN ANALYSIS:
${analysisContext}

Generate questions in this exact JSON format:
{
  "questions": [
    {
      "id": 1,
      "question": "string",
      "type": "single_choice|multiple_choice|text",
      "options": ["option1", "option2"] or null if text type,
      "required": true
    }
  ]
}

Requirements:
1. Each question must be relevant to the analyzed skin issues
2. Questions should help create a personalized skincare routine
3. Use appropriate question types (single_choice, multiple_choice, or text)
4. Make questions clear and actionable
5. Do not include markdown formatting.`;

    console.log('[Questions] Requesting questions from AI...');
    const response = await model.generateContent(questionPrompt);
    const responseText = response.response.text();

    // Parse JSON response safely
    const questionsData = parseQuestionsResponse(responseText);

    // Validate structure
    validateQuestionsStructure(questionsData);

    console.log('[Questions] Generated questions successfully');
    return {
      success: true,
      data: questionsData,
    };
  } catch (error) {
    console.error('[Questions] Generation error:', error.message);
    throw error;
  }
}

/**
 * Format analysis context for prompt
 * @param {Object} analysisData - Skin analysis data
 * @returns {string} Formatted context
 */
function formatAnalysisContext(analysisData) {
  return `
- Skin Type: ${analysisData.skin_type?.type} (${analysisData.skin_type?.confidence}% confidence)
- Acne: ${analysisData.acne?.present ? `Present (${analysisData.acne?.severity})` : 'Not detected'}
- Pigmentation: ${analysisData.pigmentation?.level}
- Dark Circles: ${analysisData.dark_circles?.present ? 'Present' : 'Not detected'}
- Pores: ${analysisData.pores?.visibility}
- Texture: ${analysisData.texture?.smoothness}
- Overall Score: ${analysisData.overall_score}/100
  `;
}

/**
 * Parse questions response
 * @param {string} responseText - Raw response from Gemini
 * @returns {Object} Parsed questions
 */
function parseQuestionsResponse(responseText) {
  try {
    // With responseMimeType enabled, this should be perfect JSON
    return JSON.parse(responseText);
  } catch (e) {
    // Fallback regex extraction if needed
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in questions response');
    }
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (fallbackError) {
      throw new Error(`Invalid JSON in questions response: ${fallbackError.message}`);
    }
  }
}

/**
 * Validate questions structure
 * @param {Object} data - Parsed questions data
 * @throws {Error} If structure is invalid
 */
function validateQuestionsStructure(data) {
  if (!data.questions || !Array.isArray(data.questions)) {
    throw new Error('Missing or invalid questions array');
  }

  if (data.questions.length === 0) {
    throw new Error('Questions array is empty');
  }

  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];

    if (!q.id || !q.question || !q.type) {
      throw new Error(`Question ${i} missing required fields`);
    }

    if (!['single_choice', 'multiple_choice', 'text'].includes(q.type)) {
      throw new Error(`Question ${i} has invalid type: ${q.type}`);
    }

    if (q.type !== 'text' && (!q.options || !Array.isArray(q.options))) {
      throw new Error(`Question ${i} must have options for type ${q.type}`);
    }
  }
}

export default {
  generateQuestions,
};