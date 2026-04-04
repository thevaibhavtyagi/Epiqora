import express from 'express';
import { getHealth } from '../controllers/healthController.js';

const router = express.Router();

/**
 * GET /api/health
 * Returns server health status
 */
router.get('/', getHealth);

export default router;
