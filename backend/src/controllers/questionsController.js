/**
 * Questions Controller
 * Handles generation of adaptive follow-up questions
 */

import { generateQuestions } from '../services/questionsService.js';
import Session from '../models/Session.js'; // NEW: Telemetry Model

/**
 * POST /api/questions
 * Generate adaptive questions based on skin analysis
 */
export async function getAdaptiveQuestions(req, res, next) {
  try {
    // NEW: Added sessionId extraction
    const { analysis, sessionId } = req.body;

    if (!analysis) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No analysis data provided',
          code: 'NO_ANALYSIS_DATA',
        },
      });
    }

    // Generate questions using Gemini
    console.log('[Questions] Generating adaptive questions...');
    const questionsResult = await generateQuestions(analysis);

    if (!questionsResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate questions',
          code: 'QUESTIONS_GENERATION_FAILED',
        },
      });
    }

    // --- NEW: SILENT TELEMETRY TOUCH ---
    // The user hasn't answered yet, so we just touch the document 
    // to update the timestamp and show they are still active.
    if (sessionId) {
      try {
        await Session.findOneAndUpdate(
          { sessionId: sessionId },
          { $set: { updatedAt: new Date() } },
          { upsert: true } // Creates it just in case analyze failed
        );
      } catch (dbError) {
        console.error(`⚠️ [Telemetry Warning] DB Touch Failed: ${dbError.message}`);
      }
    }
    // ------------------------------------

    // Return questions
    res.status(200).json({
      success: true,
      message: 'Questions generated successfully',
      data: questionsResult.data,
    });
  } catch (error) {
    console.error('[Questions] Controller error:', error.message);

    if (error.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'AI service not configured. Please check server configuration.',
          code: 'API_KEY_NOT_CONFIGURED',
        },
      });
    }

    next(error);
  }
}

export default {
  getAdaptiveQuestions,
};