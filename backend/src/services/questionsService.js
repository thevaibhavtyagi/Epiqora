/**
 * Questions Service
 * Generates adaptive questions based on skin analysis using Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/environment.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateQuestions(analysisData) {
  try {
    if (!config.geminiApiKey) throw new Error('GEMINI_API_KEY is not configured');

    // UPDATED: Shifted to flash-lite. Generating text JSON doesn't require full vision models.
    // This saves massive quota and avoids 503 limits.
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: "application/json" }
    });

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
      "type": "single_choice|multiple_choice",
      "options": ["option1", "option2"],
      "required": true
    }
  ]
}

CRITICAL REQUIREMENTS:
1. MAX 4 OPTIONS PER QUESTION: For multiple/single choice, you MUST limit options to a maximum of 4 broad categories. Do not overwhelm the user with long lists of ingredients. Group them (e.g., "Chemical Exfoliants (AHA/BHA)" instead of listing 5 different acids).
2. Always include a "None / Not Sure" option if applicable.
3. Keep questions clear, concise, and actionable.`;

    let attempt = 0;
    const maxRetries = 4;
    let responseText = "";

    // Exponential Backoff Loop
    while (attempt < maxRetries) {
      try {
        console.log('[Questions] Requesting questions from AI...');
        const response = await model.generateContent(questionPrompt);
        responseText = response.response.text();
        break;
      } catch (error) {
        attempt++;
        const isRateLimit = error.message.includes('503') || error.message.includes('429');
        if (isRateLimit && attempt < maxRetries) {
          const waitTime = (Math.pow(2, attempt) * 1000) + (Math.random() * 500);
          console.warn(`[Questions API] Server busy. Retrying in ${Math.round(waitTime/1000)}s...`);
          await delay(waitTime);
        } else {
          throw error;
        }
      }
    }

    const questionsData = parseQuestionsResponse(responseText);
    
    // Safely enforce the option limit on the backend just in case AI disobeys
    questionsData.questions.forEach(q => {
      if (q.options && q.options.length > 5) {
        q.options = q.options.slice(0, 4);
        q.options.push("Other / Not listed");
      }
    });

    validateQuestionsStructure(questionsData);

    console.log('[Questions] Generated questions successfully');
    return { success: true, data: questionsData };
    
  } catch (error) {
    console.error('[Questions] Generation error:', error.message);
    throw error;
  }
}

function formatAnalysisContext(analysisData) {
  return `
- Skin Type: ${analysisData.skin_type?.type}
- Acne: ${analysisData.acne?.present ? `Present (${analysisData.acne?.severity})` : 'Not detected'}
- Pigmentation: ${analysisData.pigmentation?.level}
- Dark Circles: ${analysisData.dark_circles?.present ? 'Present' : 'Not detected'}
- Overall Score: ${analysisData.overall_score}/100`;
}

function parseQuestionsResponse(responseText) {
  try {
    return JSON.parse(responseText);
  } catch (e) {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in questions response');
    return JSON.parse(jsonMatch[0]);
  }
}

function validateQuestionsStructure(data) {
  if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('Invalid questions array');
  }
}

export default { generateQuestions };