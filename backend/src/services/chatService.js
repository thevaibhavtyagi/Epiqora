/**
 * Chat Service
 * Upgraded EpiqAI Engine utilizing Native System Instructions, precise data mapping,
 * and robust safe unwrapping to prevent data loss from nested payloads.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/environment.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export async function processChat(userMessage, context, chatHistory = []) {
  try {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // 1. Build the unbreakable System Persona
    const systemInstructionText = buildSystemPersona(context);

    // 2. Initialize model with Native System Instructions (Gemini Subconscious)
    // This forces the AI to strictly adhere to the rules.
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      }
    });

    // 3. Format the active chat history
    const formattedHistory = formatChatHistory(chatHistory);

    // 4. Append the new user message
    formattedHistory.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    // 5. Generate Response
    const response = await model.generateContent({
      contents: formattedHistory,
    });

    const assistantMessage = response.response.text();

    console.log('[Chat Service] EpiqAI Response generated successfully.');
    return {
      success: true,
      message: assistantMessage,
    };
  } catch (error) {
    console.error('[Chat Service] Error:', error.message);
    throw error;
  }
}

/**
 * Builds the strict EpiqAI Persona and maps the data perfectly to the frontend schema.
 */
function buildSystemPersona(context) {
  // --- 1. SAFE UNWRAP LAYER ---
  // The frontend often sends data wrapped in extra 'data' or 'report'/'analysis' keys.
  // We must recursively dig to the actual core object before trying to read it.
  
  let analysis = context?.analysis || {};
  if (analysis?.data?.analysis) analysis = analysis.data.analysis;
  else if (analysis?.analysis) analysis = analysis.analysis;
  else if (analysis?.data) analysis = analysis.data;

  let report = context?.report || {};
  if (report?.data?.report) report = report.data.report;
  else if (report?.report) report = report.report;
  else if (report?.data) report = report.data;

  let answers = context?.answers || {};
  if (answers?.data) answers = answers.data;

  // --- 2. DATA EXTRACTION ---
  // Safely extract nested data to prevent "undefined" errors now that we are unwrapped
  const overallScore = analysis?.overall_score || analysis?.overallScore || 'Pending';
  const skinType = analysis?.skin_type?.type || analysis?.skin_type || 'Unknown';
  
  const rootCause = report?.root_cause_analysis || 'No root cause established.';
  const morningData = Array.isArray(report?.morning_protocol) ? report.morning_protocol : [];
  const eveningData = Array.isArray(report?.evening_protocol) ? report.evening_protocol : [];
  const avoidData = Array.isArray(report?.strictly_avoid) ? report.strictly_avoid : [];

  // Map the specific protocol items to readable strings
  const morningRoutine = morningData.map(i => `${i.product || i.product_type} (${i.active_targets || i.recommendation})`).join(', ') || 'None assigned';
  const eveningRoutine = eveningData.map(i => `${i.product || i.product_type} (${i.active_targets || i.recommendation})`).join(', ') || 'None assigned';
  const strictlyAvoid = avoidData.map(i => typeof i === 'string' ? i : (i.category || i.tip)).join(', ') || 'None assigned';

  // Format user answers
  let answersText = "No lifestyle data provided.";
  if (answers && Object.keys(answers).length > 0) {
     answersText = Object.entries(answers).map(([key, val]) => `- ${key}: ${Array.isArray(val) ? val.join(', ') : val}`).join('\n');
  }

  // --- 3. THE UNBREAKABLE PROMPT ---
  return `You are EpiqAI, an elite, highly professional clinical skincare concierge for the Epiqora platform.

CRITICAL RULES - DO NOT BREAK:
1. YOU ALREADY HAVE THE USER'S DATA. Do NOT ask the user for their skin type, concerns, routines, or goals. You must rely on the "CLIENT BIOMETRIC DATA" provided below to answer their questions.
2. CONCISENESS: Keep responses extremely brief. 1 to 2 short paragraphs maximum. Use bullet points if listing multiple items.
3. HANDLING GREETINGS: If the user says "hi", "hello", "hey", etc., simply reply: "Hello! I have your clinical report loaded. Which step of your routine would you like to discuss?" Do not say anything else.
4. STAY ON TOPIC: You are a skincare expert. If asked about coding, math, sports, or anything unrelated to skincare, politely decline and redirect to their skincare routine.
5. TONE: Premium, clinical, empathetic, and authoritative. Do not use emojis. Use Markdown (**bolding**) to highlight key ingredients or products.

---
CLIENT BIOMETRIC DATA (TREAT AS FACT):
- Skin Health Score: ${overallScore}/100
- Base Skin Type: ${skinType}
- AI Root Cause Analysis: ${rootCause}

CLIENT CLINICAL PROTOCOL:
- Morning Protocol: ${morningRoutine}
- Evening Protocol: ${eveningRoutine}
- Ingredients/Habits to Strictly Avoid: ${strictlyAvoid}

USER LIFESTYLE (Context):
${answersText}
---

When answering the user, refer specifically to the products in their protocol if relevant. Do not suggest products that conflict with their "Strictly Avoid" list.`;
}

/**
 * Format chat history exactly how Gemini requires it.
 */
function formatChatHistory(chatHistory) {
  if (!chatHistory || !Array.isArray(chatHistory)) return [];
  
  return chatHistory.map((msg) => {
    // Ensure the role is either 'user' or 'model' (Gemini SDK requirement)
    const role = msg.role === 'assistant' ? 'model' : 'user';
    return {
      role: role,
      parts: [{ text: msg.content || '' }],
    };
  });
}

export default {
  processChat,
};