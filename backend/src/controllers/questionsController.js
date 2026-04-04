/**
 * Questions Controller
 * Handles generation of adaptive follow-up questions
 */

import { generateQuestions } from '../services/questionsService.js';

/**
 * POST /api/questions
 * Generate adaptive questions based on skin analysis
 */
export async function getAdaptiveQuestions(req, res, next) {
  try {
    // Get analysis data from request body
    const { analysis } = req.body;

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
