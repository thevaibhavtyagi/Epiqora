/**
 * Analyze Routes
 * Handle image upload and analysis endpoints
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { analyzeImage } from '../controllers/analyzeController.js';

const router = express.Router();

// Configure multer for memory storage (no disk storage)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Broaden the initial filter because browser Blobs sometimes lose their MIME type.
    // We will do the STRICT "Magic Byte" validation in the service layer.
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/octet-stream'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    
    const ext = path.extname(file.originalname || '').toLowerCase();

    // Only reject if both the MIME type and the extension are completely unrecognizable
    if (!allowedMimes.includes(file.mimetype) && !allowedExts.includes(ext)) {
      const error = new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      error.status = 400;
      cb(error);
      return;
    }

    cb(null, true);
  },
});

/**
 * POST /api/analyze
 * Upload image for analysis
 */
router.post('/', upload.single('image'), analyzeImage);

export default router;