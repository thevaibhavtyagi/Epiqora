# AI Skin Analysis & Personalized Skincare Assistant

A complete AI-powered skin analysis application with real-time face detection, personalized skincare recommendations, and intelligent chat assistant.

## Features

✓ **AI Skin Analysis** - Analyzes face images using Google Gemini AI  
✓ **Face Detection** - Real-time face detection and validation  
✓ **Personalized Questions** - Adaptive questions based on skin analysis  
✓ **Smart Report** - Generates detailed skincare routine recommendations  
✓ **Chat Assistant** - AI-powered skincare advice chatbot  
✓ **Visual Overlay** - Highlights key skin analysis areas  

## Project Structure

```
AI_PROJECT/
├── backend/                          # Express.js server
│   ├── node_modules/
│   ├── src/
│   │   ├── config/
│   │   │   └── environment.js
│   │   ├── controllers/
│   │   │   ├── analyzeController.js
│   │   │   ├── chatController.js
│   │   │   ├── healthController.js
│   │   │   ├── questionsController.js
│   │   │   └── reportController.js
│   │   ├── middleware/
│   │   │   ├── cors.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── analyze.js
│   │   │   ├── chat.js
│   │   │   ├── health.js
│   │   │   ├── questions.js
│   │   │   └── report.js
│   │   ├── services/
│   │   │   ├── chatService.js
│   │   │   ├── geminiService.js
│   │   │   ├── imageValidator.js
│   │   │   ├── questionsService.js
│   │   │   └── reportService.js
│   │   └── server.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── README.md
│
├── frontend/                         # Vanilla HTML/CSS/JS
│   ├── public/
│   │   ├── js/
│   │   │   ├── components/
│   │   │   │   ├── chat-sidebar.html
│   │   │   │   ├── chat-sidebar.js
│   │   │   │   └── header.js
│   │   │   ├── core/
│   │   │   │   ├── api.js
│   │   │   │   ├── routerGuard.js
│   │   │   │   └── storage.js
│   │   │   └── pages/
│   │   │       ├── analysis.js
│   │   │       ├── home.js
│   │   │       ├── questions.js
│   │   │       ├── report.js
│   │   │       └── upload.js
│   │   ├── styles/
│   │   │   ├── analysis.css
│   │   │   ├── chat.css
│   │   │   ├── main.css
│   │   │   ├── questions.css
│   │   │   ├── report.css
│   │   │   └── upload.css
│   │   ├── analysis.html
│   │   ├── index.html
│   │   ├── questions.html
│   │   ├── report.html
│   │   └── upload.html
│   └── README.md
│
├── .gitignore
├── LOCAL_SETUP_GUIDE.md
├── README.md
├── README_SETUP.md
├── SETUP_CHECKLIST.md
└── YOUR_SETUP_INSTRUCTIONS.txt
```

## Quick Start

### 1. Setup Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

Start backend:
```bash
npm start
```

### 2. Setup Frontend

```bash
cd frontend
python -m http.server 3000
```

### 3. Open in Browser

```
http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/analyze` | Upload image and get skin analysis |
| POST | `/api/questions` | Generate personalized questions |
| POST | `/api/report` | Generate skincare report |
| POST | `/api/chat` | Chat with skincare assistant |
| GET | `/api/health` | Health check |

## Requirements

- Node.js 18+ (for backend)
- Python 3.x (for serving frontend)
- Google Gemini API key
- Modern web browser

## Key Technologies

- **Backend**: Express.js, Google Generative AI, Multer
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Face Detection**: face-api.js
- **AI**: Google Gemini 2.5 Flash

## Documentation

- `LOCAL_SETUP_GUIDE.md` - Complete setup with troubleshooting
- `SETUP_CHECKLIST.md` - Step-by-step verification checklist
- `YOUR_SETUP_INSTRUCTIONS.txt` - Quick reference guide
- `README_SETUP.md` - Setup overview
- `backend/README.md` - Backend documentation
- `frontend/README.md` - Frontend documentation

## Support

For issues or questions:
1. Check `LOCAL_SETUP_GUIDE.md` troubleshooting section
2. Verify `.env` file is created correctly
3. Ensure backend is running on port 5000
4. Check browser console (F12) for errors