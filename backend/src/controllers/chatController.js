/**
 * Chat Controller
 * Handles chat assistant requests with full context
 */

import { processChat } from '../services/chatService.js';

/**
 * POST /api/chat
 * Process user message with full skincare context
 */
export async function chat(req, res, next) {
  try {
    const { message, context, chatHistory } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Message must be a non-empty string',
          code: 'INVALID_MESSAGE',
        },
      });
    }

    // Validate message length
    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Message too long. Maximum 5000 characters allowed.',
          code: 'MESSAGE_TOO_LONG',
        },
      });
    }

    // Sanitize message (remove HTML tags to prevent prompt injection)
    const sanitizedMessage = message.replace(/<[^>]*>/g, '').trim();

    if (sanitizedMessage.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Message cannot be empty or contain only HTML tags',
          code: 'INVALID_MESSAGE',
        },
      });
    }

    if (!context || !context.analysis || !context.report) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required context: analysis and report',
          code: 'MISSING_CONTEXT',
        },
      });
    }

    // Validate chat history if provided
    if (chatHistory && !Array.isArray(chatHistory)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Chat history must be an array',
          code: 'INVALID_HISTORY',
        },
      });
    }

    // Process chat with sanitized message
    console.log('[Chat Controller] Processing message...');
    const result = await processChat(sanitizedMessage, context, chatHistory || []);

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
        error: {
          message: 'Chat service not configured',
          code: 'SERVICE_ERROR',
        },
      });
    }

    next(error);
  }
}

export default {
  chat,
};
