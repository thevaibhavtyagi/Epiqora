# Skin Analysis Backend

Node.js + Express backend for the AI Skin Analysis and Personalized Skincare Recommendation System.

## Project Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── routes/          # API routes
├── controllers/     # Route controllers
├── services/        # Business logic (future phases)
└── server.js        # Main server file
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Add your Google Gemini API key to `.env`

## Running

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

- **GET** `/api/health` - Server health check
