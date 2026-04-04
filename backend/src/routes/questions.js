/**
 * Questions Routes
 * Endpoints for generating adaptive questions
 */

import express from 'express';
import { getAdaptiveQuestions } from '../controllers/questionsController.js';

const router = express.Router();

/**
 * POST /api/questions
 * Generate adaptive questions based on skin analysis
 */
router.post('/', getAdaptiveQuestions);

export default router;
