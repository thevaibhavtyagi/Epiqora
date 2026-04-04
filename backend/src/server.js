import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/environment.js';
import corsMiddleware from './middleware/cors.js';
import errorHandler from './middleware/errorHandler.js';

import healthRoutes from './routes/health.js';
import analyzeRoutes from './routes/analyze.js';
import questionsRoutes from './routes/questions.js';
import reportRoutes from './routes/report.js';
import chatRoutes from './routes/chat.js';

const app = express();

/* -------------------------------------------------------
   PATH SETUP (ESM FIX)
------------------------------------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------------------------------------
   GLOBAL MIDDLEWARE
------------------------------------------------------- */
app.use(corsMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/* -------------------------------------------------------
   API ROUTES
------------------------------------------------------- */
app.use('/api/health', healthRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/chat', chatRoutes);

/* -------------------------------------------------------
   STATIC FRONTEND (CRITICAL)
------------------------------------------------------- */
const frontendPath = path.join(__dirname, '../../frontend/public');
app.use(express.static(frontendPath));

/* -------------------------------------------------------
   CLEAN FRONTEND ROUTES (NO .html)
------------------------------------------------------- */
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(frontendPath, 'upload.html'));
});

app.get('/analysis', (req, res) => {
  res.sendFile(path.join(frontendPath, 'analysis.html'));
});

app.get('/questions', (req, res) => {
  res.sendFile(path.join(frontendPath, 'questions.html'));
});

app.get('/report', (req, res) => {
  res.sendFile(path.join(frontendPath, 'report.html'));
});

/* -------------------------------------------------------
   API 404 HANDLER (IMPORTANT)
------------------------------------------------------- */
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'API route not found',
      path: req.originalUrl,
    },
  });
});

/* -------------------------------------------------------
   FRONTEND FALLBACK (OPTIONAL - FUTURE SPA SUPPORT)
------------------------------------------------------- */
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/* -------------------------------------------------------
   ERROR HANDLER
------------------------------------------------------- */
app.use(errorHandler);

/* -------------------------------------------------------
   SERVER START
------------------------------------------------------- */
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Frontend served from: ${frontendPath}`);
});