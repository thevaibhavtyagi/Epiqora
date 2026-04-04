/**
 * Report Generation Service
 * Combines analysis data with user answers to create a structured skincare report
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/environment.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Generate comprehensive skincare report
 * @param {Object} analysis - Skin analysis data from Phase 3
 * @param {Array} questions - Array of questions from Phase 5
 * @param {Array} answers - Array of user answers from Phase 5
 * @returns {Promise<Object>} Generated report
 */
export async function generateReport(analysis, questions, answers) {
  try {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Build context from analysis and answers
    const context = buildContext(analysis, questions, answers);

    // UPDATED: Use the modern model and strict JSON output
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const reportPrompt = `You are an expert dermatologist creating a personalized skincare report. 
Based on the following skin analysis and user responses, create a comprehensive skincare routine and recommendations.

ANALYSIS DATA:
${JSON.stringify(analysis, null, 2)}

USER PROFILE:
${context}

Generate a structured report in JSON format with ONLY valid JSON:
{
  "summary": "Brief overall assessment (2-3 sentences)",
  "skinProfile": {
    "type": "Skin type with characteristics",
    "mainConcerns": ["concern 1", "concern 2", "concern 3"],
    "strengths": ["strength 1", "strength 2"]
  },
  "morningRoutine": [
    {"step": 1, "product_type": "string", "recommendation": "specific recommendation", "reason": "why this is recommended"}
  ],
  "eveningRoutine": [
    {"step": 1, "product_type": "string", "recommendation": "specific recommendation", "reason": "why this is recommended"}
  ],
  "weeklyTreatments": [
    {"treatment": "string", "frequency": "times per week", "benefit": "expected benefit"}
  ],
  "lifestyle": [
    {"category": "string", "tip": "actionable tip"}
  ],
  "expectedResults": {
    "timeline": "4-8 weeks",
    "improvements": ["improvement 1", "improvement 2", "improvement 3"]
  },
  "scoreBreakdown": {
    "currentScore": ${analysis.overall_score || 0},
    "targetScore": 85,
    "improvementAreas": ["area 1", "area 2"]
  }
}`;

    const response = await model.generateContent(reportPrompt);
    const responseText = response.response.text();

    // Parse and validate report safely
    const report = parseReportResponse(responseText);
    validateReportStructure(report);

    console.log('[Report] Generated successfully');
    return {
      success: true,
      data: { report }, // Wrapped to match your frontend expectation
    };
  } catch (error) {
    console.error('[Report] Generation error:', error.message);
    throw error;
  }
}

/**
 * Build user profile context from answers
 */
function buildContext(analysis, questions, answers) {
  let context = `Skin Analysis Results:\n`;
  context += `- Overall Score: ${analysis.overall_score || 0}/100\n`;
  context += `- Skin Type: ${analysis.skin_type?.type} (${analysis.skin_type?.confidence}% confidence)\n`;
  context += `- Acne: ${analysis.acne?.present ? `Present (${analysis.acne?.severity})` : 'Not detected'}\n`;
  context += `- Dark Circles: ${analysis.dark_circles?.present ? 'Present' : 'Not detected'}\n`;
  context += `- Texture: ${analysis.texture?.smoothness}\n`;
  context += `- Pores: ${analysis.pores?.visibility}\n\n`;

  context += `User Preferences & Lifestyle:\n`;
  if (questions && answers) {
    questions.forEach((question, index) => {
      const answer = answers[index];
      if (answer) {
        context += `- ${question.question}: ${Array.isArray(answer) ? answer.join(', ') : answer}\n`;
      }
    });
  }

  return context;
}

/**
 * Parse report response safely
 */
function parseReportResponse(responseText) {
  try {
    return JSON.parse(responseText);
  } catch (e) {
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
 * Validate report structure
 */
function validateReportStructure(report) {
  const required = [
    'summary',
    'skinProfile',
    'morningRoutine',
    'eveningRoutine',
    'weeklyTreatments',
    'lifestyle',
    'expectedResults',
    'scoreBreakdown',
  ];

  for (const field of required) {
    if (!(field in report)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

export default {
  generateReport,
};