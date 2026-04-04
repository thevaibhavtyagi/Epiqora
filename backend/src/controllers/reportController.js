/**
 * Report Controller
 * Handles report generation requests
 */

import { generateReport } from '../services/reportService.js';

/**
 * POST /api/report
 * Generate personalized skincare report
 */
export async function createReport(req, res, next) {
  try {
    const { analysis, questions, answers } = req.body;

    // Validate input
    if (!analysis || !questions || !answers) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: analysis, questions, answers',
          code: 'MISSING_FIELDS',
        },
      });
    }

    if (!Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Questions and answers must be arrays',
          code: 'INVALID_FORMAT',
        },
      });
    }

    // Generate report
    console.log('[Report Controller] Generating report...');
    const result = await generateReport(analysis, questions, answers);

    res.status(200).json({
      success: true,
      message: 'Report generated successfully',
      data: {
        report: result.data,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Report Controller] Error:', error.message);

    if (error.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Report service not configured',
          code: 'SERVICE_ERROR',
        },
      });
    }

    next(error);
  }
}

export default {
  createReport,
};
