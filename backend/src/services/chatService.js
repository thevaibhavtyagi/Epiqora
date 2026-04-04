/**
 * Chat Service
 * Handles AI chat assistant with full context from analysis, questions, and report
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/environment.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Process chat message with full context
 * @param {string} userMessage - User's message
 * @param {Object} context - Full analysis/report/questions context
 * @param {Array} chatHistory - Previous chat messages
 * @returns {Promise<Object>} Assistant response
 */
export async function processChat(userMessage, context, chatHistory = []) {
  try {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // UPDATED: Use the modern active model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);

    // Build conversation history for context
    const messages = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I will provide personalized skincare advice based on this analysis and report.' }],
      },
      ...formatChatHistory(chatHistory),
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];

    // Get response
    const response = await model.generateContent({
      contents: messages,
    });

    const assistantMessage = response.response.text();

    console.log('[Chat] Response generated successfully');
    return {
      success: true,
      message: assistantMessage, // Wrapped correctly
    };
  } catch (error) {
    console.error('[Chat] Error:', error.message);
    throw error;
  }
}

/**
 * Build system prompt with full context
 */
function buildSystemPrompt(context) {
  // Add safety fallbacks empty objects in case something is missing
  const analysis = context?.analysis || {};
  const report = context?.report || {};
  const questions = context?.questions || [];
  const answers = context?.answers || [];

  let prompt = `You are an expert dermatologist and skincare consultant. You have access to a client's personalized skincare analysis and report. 
Provide helpful, specific, and actionable skincare advice based on their profile.

ANALYSIS SUMMARY:
- Overall Skin Score: ${analysis?.overall_score || 'N/A'}/100
- Skin Type: ${analysis?.skin_type?.type || 'N/A'}
- Main Concerns: ${[
    analysis?.acne?.present && `Acne (${analysis.acne.severity})`,
    analysis?.dark_circles?.present && 'Dark Circles',
    analysis?.pigmentation?.level && analysis.pigmentation.level !== 'even' && `Pigmentation (${analysis.pigmentation.level})`,
  ].filter(Boolean).join(', ') || 'None identified'}

PERSONALIZED SKINCARE ROUTINE:
Morning Routine:
${report?.morningRoutine?.map((item, i) => `${i + 1}. ${item.product_type}: ${item.recommendation}`).join('\n') || 'No morning routine available'}

Evening Routine:
${report?.eveningRoutine?.map((item, i) => `${i + 1}. ${item.product_type}: ${item.recommendation}`).join('\n') || 'No evening routine available'}

LIFESTYLE RECOMMENDATIONS:
${report?.lifestyle?.map((item) => `- ${item.category}: ${item.tip}`).join('\n') || 'No lifestyle recommendations available'}

CLIENT PROFILE & PREFERENCES:
${buildClientProfile(questions, answers)}

Guidelines:
1. Always refer to their specific skin type and concerns
2. Provide actionable, specific advice
3. Explain the science behind recommendations
4. Address questions within their skincare context
5. Suggest adjustments if needed based on their feedback
6. Be encouraging and supportive
7. Recommend they consult a dermatologist for medical concerns`;

  return prompt;
}

/**
 * Build client profile from questions and answers
 */
function buildClientProfile(questions, answers) {
  if (!questions || !answers) return 'No profile data provided.';
  
  let profile = '';
  questions.forEach((question, index) => {
    const answer = answers[index];
    if (answer) {
      profile += `- ${question.question}: ${Array.isArray(answer) ? answer.join(', ') : answer}\n`;
    }
  });
  return profile || 'No profile data provided.';
}

/**
 * Format chat history for Gemini API
 */
function formatChatHistory(chatHistory) {
  if (!chatHistory) return [];
  return chatHistory.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
}

export default {
  processChat,
};