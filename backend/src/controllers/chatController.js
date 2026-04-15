/**
 * Chat Controller
 * Handles chat assistant requests with full context and strict validation
 */

import { processChat } from '../services/chatService.js';

/**
 * POST /api/chat
 * Process user message with full skincare context
 */
export async function chat(req, res, next) {
  try {
    // 1. Extract exact payload sent by the frontend
    const { message, analysis, answers, report, chatHistory } = req.body;

    // 2. Validate user message
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Message must be a non-empty string', code: 'INVALID_MESSAGE' },
      });
    }

    if (message.length > 500) { // Enforcing length limit on backend
      return res.status(400).json({
        success: false,
        error: { message: 'Message exceeds maximum length limits.', code: 'MESSAGE_TOO_LONG' },
      });
    }

    // 3. Sanitize message (basic HTML stripping)
    const sanitizedMessage = message.replace(/<[^>]*>/g, '').trim();

    if (sanitizedMessage.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message cannot be empty.', code: 'INVALID_MESSAGE' },
      });
    }

    if (chatHistory && !Array.isArray(chatHistory)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Chat history must be an array', code: 'INVALID_HISTORY' },
      });
    }

    // 4. Bundle the extracted frontend context correctly
    const chatContext = {
      analysis: analysis || null,
      report: report || null,
      answers: answers || null,
    };

    console.log('[Chat Controller] Processing message for EpiqAI...');
    
    // 5. Send to Service
    const result = await processChat(sanitizedMessage, chatContext, chatHistory || []);

    res.status(200).json({
      success: true,
      message: 'Response generated successfully',
      data: {
        response: result.message,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Chat Controller] Error:', error.message);

    if (error.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        success: false,
        error: { message: 'Chat service not configured', code: 'SERVICE_ERROR' },
      });
    }

    next(error);
  }
}

export default {
  chat,
};