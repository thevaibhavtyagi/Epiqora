/**
 * Report Routes
 * Routes for report generation
 */

import express from 'express';
import { createReport } from '../controllers/reportController.js';

const router = express.Router();

/**
 * POST /api/report
 * Generate personalized skincare report from analysis and questions
 */
router.post('/', createReport);

export default router;
