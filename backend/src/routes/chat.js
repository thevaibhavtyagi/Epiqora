/**
 * Chat Routes
 * Routes for chat assistant with full context
 */

import express from 'express';
import { chat } from '../controllers/chatController.js';

const router = express.Router();

/**
 * POST /api/chat
 * Process chat message with skincare analysis context
 */
router.post('/', chat);

export default router;
