import cors from 'cors';
import { config } from '../config/environment.js';

const corsOptions = {
  origin: function (origin, callback) {
    // 1. Allow local development
    const isLocal = !origin || origin.includes('localhost') || origin.includes('127.0.0.1');
    
    // 2. Allow your specific production frontend (set in Render dashboard)
    const isProduction = origin === process.env.FRONTEND_URL;

    if (isLocal || isProduction) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Unauthorized traffic attempted from: ${origin}`);
      callback(new Error('Not allowed by CORS security policy.'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export const corsMiddleware = cors(corsOptions);

export default corsMiddleware;