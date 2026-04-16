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

    // 2. Initialize model with Native System Instructions
    // UPGRADED: Changed from 'gemini-2.5-flash-lite' to 'gemini-2.5-flash' for superior reasoning
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
  const overallScore = analysis?.overall_score || analysis?.overallScore || 'Pending';
  const skinType = analysis?.skin_type?.type || analysis?.skin_type || 'Unknown';
  
  const rootCause = report?.root_cause_analysis || 'No root cause established.';
  const morningData = Array.isArray(report?.morning_protocol) ? report.morning_protocol : [];
  const eveningData = Array.isArray(report?.evening_protocol) ? report.evening_protocol : [];
  const avoidData = Array.isArray(report?.strictly_avoid) ? report.strictly_avoid : [];

  const morningRoutine = morningData.map(i => `${i.product || i.product_type} (${i.active_targets || i.recommendation})`).join(', ') || 'None assigned';
  const eveningRoutine = eveningData.map(i => `${i.product || i.product_type} (${i.active_targets || i.recommendation})`).join(', ') || 'None assigned';
  const strictlyAvoid = avoidData.map(i => typeof i === 'string' ? i : (i.category || i.tip)).join(', ') || 'None assigned';

  let answersText = "No lifestyle data provided.";
  if (answers && Object.keys(answers).length > 0) {
     answersText = Object.entries(answers).map(([key, val]) => `- ${key}: ${Array.isArray(val) ? val.join(', ') : val}`).join('\n');
  }

  // --- 3. THE UNBREAKABLE PROMPT (UPGRADED) ---
  return `You are EpiqAI, an elite, highly professional clinical skincare concierge for the Epiqora platform.

CRITICAL RULES - DO NOT BREAK:
1. YOU ALREADY HAVE THE USER'S DATA. Do NOT ask the user for their skin type, concerns, routines, or goals. You must rely entirely on the "CLIENT BIOMETRIC DATA" provided below to answer their questions.
2. CONCISENESS: Keep responses extremely brief. 1 to 2 short paragraphs maximum. Use bullet points if listing multiple items.
3. GREETINGS ONLY: IF AND ONLY IF the user's message is solely a simple greeting (e.g., "hi", "hello"), reply: "Hello! I have your clinical report loaded. Which step of your routine would you like to discuss?"
4. DIRECT ANSWERS & OUT-OF-PROTOCOL: If the user asks a specific question about a product, ingredient, or practice (e.g., "can I use BP 2.5%", "tell me about my skin"), YOU MUST ANSWER IT DIRECTLY. If they ask about a product not in their protocol, evaluate its safety based on their Skin Type and Root Cause. Provide a clear, direct Yes/No clinical opinion. DO NOT deflect.
5. STAY ON TOPIC: You are a skincare expert. If asked about coding, math, sports, or anything unrelated to skincare, politely decline and redirect to their skincare routine.
6. TONE: Premium, clinical, empathetic, and authoritative. Do not use emojis. Use Markdown (**bolding**) to highlight key ingredients or products.

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

When answering, provide actionable clinical advice based on this exact data profile.`;
}

/**
 * Format chat history exactly how Gemini requires it.
 */
function formatChatHistory(chatHistory) {
  if (!chatHistory || !Array.isArray(chatHistory)) return [];
  
  return chatHistory
    .filter(msg => msg.content && msg.content.trim() !== '') // Strip empty messages
    .map((msg) => {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      return {
        role: role,
        parts: [{ text: msg.content.trim() }],
      };
    });
}

export default {
  processChat,
};