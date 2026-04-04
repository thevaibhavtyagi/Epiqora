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
.
├── backend/                 # Express.js server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # Configuration
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/               # Vanilla HTML/CSS/JS
│   ├── index.html         # Main page
│   ├── js/
│   │   └── main.js        # All JavaScript logic
│   ├── styles/
│   │   └── main.css       # All styling
│   ├── README.md
│   └── .env.example
│
├── LOCAL_SETUP_GUIDE.md   # Complete setup instructions
├── SETUP_CHECKLIST.md     # Step-by-step checklist
├── YOUR_SETUP_INSTRUCTIONS.txt  # Quick reference
└── README_SETUP.md        # Setup overview
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
- **AI**: Google Gemini 1.5 Flash

## Documentation

- `LOCAL_SETUP_GUIDE.md` - Complete setup with troubleshooting
- `SETUP_CHECKLIST.md` - Step-by-step verification checklist
- `YOUR_SETUP_INSTRUCTIONS.txt` - Quick reference guide
- `backend/README.md` - Backend documentation
- `frontend/README.md` - Frontend documentation

## Support

For issues or questions:
1. Check `LOCAL_SETUP_GUIDE.md` troubleshooting section
2. Verify `.env` file is created correctly
3. Ensure backend is running on port 5000
4. Check browser console (F12) for errors

## License

MIT
