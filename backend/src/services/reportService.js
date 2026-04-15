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

    const context = buildContext(analysis, questions, answers);

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const reportPrompt = `You are an expert clinical dermatologist. Create a highly concise, personalized skincare protocol.
    
    MEDICAL SAFETY PROTOCOL (CRITICAL):
    1. NO PRESCRIPTION DRUGS: NEVER recommend prescription-only medications (e.g., Tretinoin, oral Isotretinoin, oral antibiotics, Spironolactone). ONLY recommend over-the-counter (OTC) cosmetic ingredients.
    2. PREVENT CONTRAINDICATIONS: Do not mix conflicting active ingredients. 
       - Example: Do not mix strong AHA/BHA with Retinol in the same routine. 
       - Example: If the user has active acne or highly sensitive skin, strictly avoid irritating high-strength Vitamin C or physical scrubs. Prioritize barrier repair.
    3. BRUTAL HONESTY ON HABITS: Read the "USER PREFERENCES & LIFESTYLE" section. If they mention bad habits (e.g., poor diet, lack of sleep, no sunscreen, picking skin), you MUST explicitly call them out and correct them in the 'root_cause_analysis' and 'strictly_avoid' sections.

    FORMATTING INSTRUCTIONS:
    - BE EXTREMELY CONCISE. Space is limited on the physical A4 report. Maximum 1-2 short sentences per point.
    - Focus on active ingredients, not brand names.
    - NO TIMELINES.
    - EXACT LIMITS: You MUST provide EXACTLY TWO items for 'strictly_avoid' and EXACTLY TWO items for 'clinical_targets'. No more, no less.

    ANALYSIS DATA:
    ${JSON.stringify(analysis, null, 2)}

    USER PROFILE:
    ${context}

    Generate ONLY valid JSON matching this exact schema:
    {
      "root_cause_analysis": "A single 3-4 sentence paragraph explaining the 'why' based on their biometric data AND explicitly critiquing any bad habits from their user profile.",
      "morning_protocol": [
        {"step": 1, "product": "Generic Product Name", "active_targets": "Key ingredients"}
      ],
      "evening_protocol": [
        {"step": 1, "product": "Generic Product Name", "active_targets": "Key ingredients"}
      ],
      "strictly_avoid": [
        "First specific bad habit or ingredient to avoid (maximum 2 items)",
        "Second specific bad habit or ingredient to avoid"
      ],
      "clinical_targets": [
        "First habit to build (maximum 2 items)",
        "Second habit to build"
      ]
    }`;

    console.log('[ReportService] Sending Prompt to AI...');
    
    const response = await model.generateContent(reportPrompt);
    const responseText = response.response ? response.response.text() : response.text();

    let report = parseReportResponse(responseText);
    report = validateAndHealStructure(report);

    console.log('[ReportService] Generated successfully and healed schema.');
    return {
      success: true,
      data: { report }, 
    };
  } catch (error) {
    console.error('[Report] Generation error:', error.message);
    throw error;
  }
}

function buildContext(analysis, questions, answers) {
  let context = `Skin Analysis Results:\n`;
  context += `- Overall Score: ${analysis.overall_score || 0}/100\n`;
  context += `- Skin Type: ${analysis.skin_type?.type || 'Combination'} (${analysis.skin_type?.confidence || 80}% confidence)\n`;
  context += `- Acne: ${analysis.acne?.present ? `Present (${analysis.acne?.severity || 'Mild'})` : 'Not detected'}\n`;
  context += `- Dark Circles: ${analysis.dark_circles?.present ? 'Present' : 'Not detected'}\n`;
  context += `- Texture: ${analysis.texture?.smoothness || 'Normal'}\n`;
  context += `- Pores: ${analysis.pores?.visibility || 'Normal'}\n\n`;

  context += `USER PREFERENCES & LIFESTYLE (YOU MUST CRITIQUE BAD HABITS):\n`;
  
  // FIX: Properly extract answers even if the 'questions' array is empty from the frontend
  if (Array.isArray(answers) && answers.length > 0) {
    answers.forEach((item, index) => {
      // Support frontend structure: { questionId: '...', answer: '...' }
      const qText = (questions && questions[index] && (questions[index].question || questions[index])) 
                    || item.questionId 
                    || `Factor ${index + 1}`;
      
      let ansText = item.answer !== undefined ? item.answer : item;
      if (Array.isArray(ansText)) ansText = ansText.join(', ');
      
      context += `- ${qText}: ${ansText}\n`;
    });
  } else if (answers && typeof answers === 'object') {
    // Fallback if frontend sends a flat object instead of an array
    Object.entries(answers).forEach(([key, val]) => {
      context += `- ${key}: ${Array.isArray(val) ? val.join(', ') : val}\n`;
    });
  } else {
    context += `- No lifestyle data provided.\n`;
  }

  // DIAGNOSTIC LOG: Print this to your server terminal so you can verify the AI is seeing your bad habits!
  console.log("\n--- [Diagnostic] Final AI Context String ---\n" + context + "\n--------------------------------------------\n");
  
  return context;
}

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

function validateAndHealStructure(report) {
  const finalReport = report || {};
  const core = finalReport.report || finalReport.data || finalReport;

  // Enforce the "Exactly Two" rule securely on the backend
  const strictlyAvoid = Array.isArray(core.strictly_avoid) ? core.strictly_avoid.slice(0, 2) : [];
  const clinicalTargets = Array.isArray(core.clinical_targets) ? core.clinical_targets.slice(0, 2) : [];

  return {
    root_cause_analysis: core.root_cause_analysis || "AI analysis indicates structural deviations requiring specialized protocol stabilization.",
    morning_protocol: Array.isArray(core.morning_protocol) ? core.morning_protocol : [],
    evening_protocol: Array.isArray(core.evening_protocol) ? core.evening_protocol : [],
    strictly_avoid: strictlyAvoid,
    clinical_targets: clinicalTargets,
    systemic_factors: Array.isArray(core.systemic_factors) ? core.systemic_factors.slice(0, 2) : []
  };
}

export default {
  generateReport,
};