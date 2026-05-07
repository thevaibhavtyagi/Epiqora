/**
 * Report Generation Service
 * Combines analysis data with user answers to create a structured skincare report
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/environment.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateReport(analysis, questions, answers) {
  try {
    if (!config.geminiApiKey) throw new Error('GEMINI_API_KEY is not configured');

    const context = buildContext(analysis, questions, answers);

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const reportPrompt = `You are an expert clinical dermatologist. Create a highly concise, personalized skincare protocol.
    
    MEDICAL SAFETY PROTOCOL (CRITICAL):
    1. NO PRESCRIPTION DRUGS: NEVER recommend prescription-only medications. ONLY recommend over-the-counter (OTC) cosmetic ingredients.
    2. PREVENT CONTRAINDICATIONS: Do not mix conflicting active ingredients. 
    3. BRUTAL HONESTY ON HABITS: Read the "USER PREFERENCES & LIFESTYLE" section. Explicitly critique and correct bad habits in the 'root_cause_analysis' and 'strictly_avoid' sections.

    FORMATTING INSTRUCTIONS:
    - BE EXTREMELY CONCISE. Space is limited on the physical A4 report. Maximum 1-2 short sentences per point.
    - Focus on active ingredients, not brand names.
    - EXACT LIMITS: EXACTLY TWO items for 'strictly_avoid' and 'clinical_targets'.

    ANALYSIS DATA:
    ${JSON.stringify(analysis, null, 2)}

    USER PROFILE:
    ${context}

    Generate ONLY valid JSON matching this exact schema:
    {
      "root_cause_analysis": "A single 3-4 sentence paragraph explaining the 'why' based on biometric data AND explicitly critiquing bad habits.",
      "morning_protocol": [
        {"step": 1, "product": "Generic Product Name", "active_targets": "Key ingredients"}
      ],
      "evening_protocol": [
        {"step": 1, "product": "Generic Product Name", "active_targets": "Key ingredients"}
      ],
      "strictly_avoid": ["First habit/ingredient to avoid", "Second habit/ingredient to avoid"],
      "clinical_targets": ["First habit to build", "Second habit to build"]
    }`;

    let attempt = 0;
    const maxRetries = 4;
    let responseText = "";

    // Exponential Backoff Loop
    while (attempt < maxRetries) {
      try {
        console.log(`[ReportService] Requesting Report from AI (Attempt ${attempt + 1})...`);
        const response = await model.generateContent(reportPrompt);
        responseText = response.response ? response.response.text() : response.text();
        break; // Success
      } catch (error) {
        attempt++;
        const isRateLimit = error.message.includes('503') || error.message.includes('429');
        if (isRateLimit && attempt < maxRetries) {
          const waitTime = (Math.pow(2, attempt) * 1000) + (Math.random() * 500);
          console.warn(`[Report API] Server busy. Retrying in ${Math.round(waitTime/1000)}s...`);
          await delay(waitTime);
        } else {
          throw error;
        }
      }
    }

    let report = parseReportResponse(responseText);
    report = validateAndHealStructure(report);

    console.log('[ReportService] Generated successfully and healed schema.');
    return { success: true, data: { report } };
    
  } catch (error) {
    console.error('[Report] Generation error:', error.message);
    throw error;
  }
}

function buildContext(analysis, questions, answers) {
  let context = `Skin Analysis Results:\n`;
  context += `- Overall Score: ${analysis.overall_score || 0}/100\n`;
  context += `- Skin Type: ${analysis.skin_type?.type || 'Combination'}\n`;
  context += `- Acne: ${analysis.acne?.present ? `Present (${analysis.acne?.severity || 'Mild'})` : 'Not detected'}\n`;
  
  context += `USER PREFERENCES & LIFESTYLE:\n`;
  if (Array.isArray(answers) && answers.length > 0) {
    answers.forEach((item, index) => {
      const qText = (questions && questions[index] && (questions[index].question || questions[index])) || item.questionId || `Factor ${index + 1}`;
      let ansText = item.answer !== undefined ? item.answer : item;
      if (Array.isArray(ansText)) ansText = ansText.join(', ');
      context += `- ${qText}: ${ansText}\n`;
    });
  } else {
    context += `- No lifestyle data provided.\n`;
  }
  return context;
}

function parseReportResponse(responseText) {
  try {
    return JSON.parse(responseText);
  } catch (e) {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in response');
    return JSON.parse(jsonMatch[0]);
  }
}

function validateAndHealStructure(report) {
  const finalReport = report || {};
  const core = finalReport.report || finalReport.data || finalReport;

  return {
    root_cause_analysis: core.root_cause_analysis || "AI analysis indicates structural deviations requiring specialized protocol stabilization.",
    morning_protocol: Array.isArray(core.morning_protocol) ? core.morning_protocol : [],
    evening_protocol: Array.isArray(core.evening_protocol) ? core.evening_protocol : [],
    strictly_avoid: Array.isArray(core.strictly_avoid) ? core.strictly_avoid.slice(0, 2) : [],
    clinical_targets: Array.isArray(core.clinical_targets) ? core.clinical_targets.slice(0, 2) : []
  };
}

export default { generateReport };