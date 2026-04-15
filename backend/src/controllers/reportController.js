/**
 * Report Controller
 * Handles report generation requests
 */

import { generateReport } from '../services/reportService.js';
import Session from '../models/Session.js'; // NEW: Telemetry Model

/**
 * POST /api/report
 * Generate personalized skincare report
 */
export async function createReport(req, res, next) {
  try {
    // NEW: Added sessionId extraction
    const { analysis, questions, answers, sessionId } = req.body;

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

    // --- NEW: SILENT TELEMETRY UPSERT ---
    // Now that the user has completed everything, we save the answers 
    // and the final regimen to MongoDB securely.
    if (sessionId) {
      try {
        // Map the questions and answers together perfectly
        const consultationLog = questions.map((q, index) => ({
          question: q.question || q,
          answer: answers[index] || 'No answer provided'
        }));

        await Session.findOneAndUpdate(
          { sessionId: sessionId },
          {
            dropoffPoint: 'FINISHED_REPORT',
            consultationLog: consultationLog,
            finalRegimen: result.data
          },
          { upsert: true, new: true }
        );
        console.log(`🛡️ [Telemetry] Session ${sessionId} saved -> FINISHED_REPORT`);
      } catch (dbError) {
        console.error(`⚠️ [Telemetry Warning] DB Save Failed: ${dbError.message}`);
      }
    }
    // ------------------------------------

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