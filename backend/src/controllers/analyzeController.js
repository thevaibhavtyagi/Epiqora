/**
 * Analyze Controller
 * Handles image upload and AI analysis for skin
 */

import { validateImage } from '../services/imageValidator.js';
import { analyzeSkin } from '../services/geminiService.js';

/**
 * POST /api/analyze
 * Handle image upload and perform AI skin analysis
 */
export async function analyzeImage(req, res, next) {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No image file provided',
          code: 'NO_FILE_PROVIDED',
        },
      });
    }

    const { buffer, mimetype } = req.file;

    // Validate image
    const validation = await validateImage(buffer, mimetype);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: validation.error,
          code: validation.code,
        },
      });
    }

    // Perform AI analysis using Gemini
    console.log('[Analyze] Starting AI skin analysis...');
    const analysisResult = await analyzeSkin(buffer, mimetype);

    if (!analysisResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'AI analysis failed',
          code: 'ANALYSIS_FAILED',
        },
      });
    }

    // Return analysis results
    res.status(200).json({
      success: true,
      message: 'Skin analysis completed successfully',
      data: {
        analysis: analysisResult.data,
        analyzedAt: new Date().toISOString(),
        attempt: analysisResult.attempt,
      },
    });
  } catch (error) {
    console.error('[Analyze] Controller error:', error.message);

    // Handle specific error cases
    if (error.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'AI service not configured. Please check server configuration.',
          code: 'API_KEY_NOT_CONFIGURED',
        },
      });
    }

    // Generic error handling
    next(error);
  }
}
