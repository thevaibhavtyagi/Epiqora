# 🚀 COMPLETE LOCAL SETUP GUIDE - Step by Step

## Prerequisites Check

Before starting, verify you have these installed on your PC:

### Step 1: Check Node.js Installation
Open your terminal/PowerShell and run:
```bash
node --version
npm --version
```

You should see version numbers (e.g., v18.0.0 and 9.0.0)

**If not installed:**
- Download from https://nodejs.org/ (LTS version recommended)
- Install it (follow the installer)
- Restart terminal/VSCode

---

## PROJECT STRUCTURE

After extracting, your project folder should look like:
```
v0-project/
├── backend/                 # Backend Node.js + Express
│   ├── src/
│   │   ├── server.js
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── services/
│   ├── package.json         # Backend dependencies
│   ├── .env.example         # Example environment variables
│   └── .env                 # Your actual API keys (KEEP PRIVATE!)
│
├── frontend/                # Frontend HTML + CSS + JavaScript
│   ├── index.html
│   ├── styles/
│   │   └── main.css
│   ├── js/
│   │   └── main.js
│   └── README.md
│
└── Documentation files...
```

---

## STEP-BY-STEP SETUP

### PART A: BACKEND SETUP (Port 5000)

#### Step 1: Navigate to Backend Directory
```bash
# Open terminal in VSCode (Ctrl + ` on Windows/Mac) or use command prompt
# Navigate to backend folder
cd backend
```

You should now be in the `backend` directory.

#### Step 2: Create Environment File with Your API Key
You need to create a `.env` file with your API key.

**Method 1: Using VSCode (Recommended)**
1. Right-click on the `backend` folder in the file explorer
2. Click "New File"
3. Name it `.env`
4. Copy this content and replace `YOUR_API_KEY_HERE` with your actual Gemini API key:
```
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

Save the file (Ctrl+S)

**Method 2: Using Command Line**
If you're comfortable with terminal:
```bash
# Create .env file
echo PORT=5000 > .env
echo NODE_ENV=development >> .env
echo GEMINI_API_KEY=YOUR_API_KEY_HERE >> .env
```

#### Step 3: Verify .env File Created
In VSCode, you should see `.env` file in the backend folder.
**IMPORTANT:** Check that `NODE_ENV=development` is set (this is critical for API URL to work correctly)

#### Step 4: Install Backend Dependencies
Still in the `backend` directory, run:
```bash
npm install
```

This will download all required packages. Wait for it to complete (2-3 minutes).

You should see a `node_modules` folder appear and a `package-lock.json` file.

#### Step 5: Test Backend Start (Optional)
To verify backend starts without errors:
```bash
npm start
```

You should see output like:
```
[Server] Listening on port 5000
[Server] Environment: development
[Server] GEMINI_API_KEY configured: true
```

If you see these messages, the backend is working! 

**Stop the backend** (press Ctrl+C in the terminal) - you'll start it again in the full setup.

---

### PART B: FRONTEND SETUP (Port 3000)

#### Step 1: Navigate to Frontend Directory
Open a **NEW terminal** (don't close the backend one).

In VSCode:
- Click the `+` icon next to the terminal tab to open a second terminal
- Or use Ctrl+Shift+` to open another terminal

Navigate to frontend:
```bash
cd frontend
```

#### Step 2: Create a Simple Python Server
The frontend uses a simple HTTP server. You need Python installed.

**Check if Python is installed:**
```bash
python --version
```

or 

```bash
python3 --version
```

You should see Python 3.x version.

**If not installed:**
- Download from https://www.python.org/ (any version 3.6+)
- Install it
- Restart terminal

#### Step 3: Start Frontend Server
In the `frontend` directory, run:
```bash
python -m http.server 3000
```

or if that doesn't work:

```bash
python3 -m http.server 3000
```

You should see:
```
Serving HTTP on 0.0.0.0 port 3000 (http://0.0.0.0:3000/) ...
```

Great! Frontend is running on port 3000.

---

## RUNNING BOTH TOGETHER

Now you have:
- **Terminal 1:** Backend running on port 5000 (npm start)
- **Terminal 2:** Frontend running on port 3000 (python http.server)

### Step 1: Open Browser
Open your web browser (Chrome, Firefox, Edge, Safari)

### Step 2: Go to Frontend
Navigate to:
```
http://localhost:3000
```

You should see the beautiful landing page with:
- Logo and navigation
- "Start Your Analysis" buttons
- Features section
- etc.

### Step 3: Verify Backend Connection
Scroll down and look for any error messages in the browser console.

To check browser console:
- Press F12 or Ctrl+Shift+I
- Click "Console" tab
- Look for any red error messages

If you see no errors, backend is connected!

---

## COMPLETE USER FLOW TEST

Let's test the entire application:

### 1. Click "Start Your Analysis"
- Button on the hero section
- Should open an upload modal

### 2. Upload or Take a Photo
- Click "Choose Photo" to upload an image from your computer
- Or click "Take Photo" to use your camera (if permitted)
- Select a face photo (must be clear, well-lit)

### 3. Wait for Face Detection
- You should see validation message
- "Face validated successfully" = good to proceed

### 4. Click "Proceed to Analysis"
- Backend processes image with Gemini AI
- You'll see a progress indicator (3 steps)
- Wait 10-30 seconds for analysis

### 5. View Results
- You should see a skin analysis report
- Overall score (0-100)
- Six analysis cards (Skin Type, Acne, Pigmentation, etc.)
- Overlay on the uploaded image showing analyzed regions

### 6. Continue to Questions
- Click "Continue to Questions"
- You'll see 5 personalized questions
- Answer them (single choice, multiple choice, or text)
- Click "Next" to proceed

### 7. View Report
- After questions, you'll see a comprehensive skincare report
- 8 detailed sections:
  - Overall score card
  - Skin profile
  - Morning routine
  - Evening routine
  - Weekly treatments
  - Lifestyle tips
  - Expected results
  - Action buttons

### 8. Chat with Assistant
- Click "Chat with Assistant" button
- Ask questions about your skincare routine
- Chat maintains context from your analysis

### 9. Export Report
- Click "Export to PNG" to download your personalized report
- Or close and start over with new analysis

---

## TROUBLESHOOTING

### Issue: "Cannot find module" error in backend

**Solution:**
```bash
cd backend
npm install
```

Then restart backend.

---

### Issue: "Port 5000 already in use"

**Solution - Option 1:** Find what's using port 5000 and stop it
```bash
# Windows PowerShell (as Admin):
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

**Solution - Option 2:** Use a different port
Edit `backend/.env`:
```
PORT=5001
```
Then update frontend `main.js` line 6-14 to use port 5001.

---

### Issue: "Port 3000 already in use"

**Solution - Option 1:** Use a different port
```bash
python -m http.server 3001
```
Then visit `http://localhost:3001`

**Solution - Option 2:** Kill the process
```bash
# Windows PowerShell (as Admin):
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

---

### Issue: "GEMINI_API_KEY not found" in backend logs

**Solution:**
1. Check that `.env` file exists in backend folder
2. Verify it contains: `GEMINI_API_KEY=your_actual_key`
3. Restart backend (Ctrl+C, then npm start)

---

### Issue: Image upload fails with "No face detected"

**Solution:**
- Upload a clearer photo
- Make sure your face is clearly visible
- Good lighting helps
- Face should take up 30-70% of image

---

### Issue: Chat responses not showing

**Solution:**
1. Open browser console (F12)
2. Check for errors in red
3. Ensure backend is running
4. Check that GEMINI_API_KEY is valid

---

## TERMINAL COMMANDS REFERENCE

### Backend (Terminal 1)
```bash
# Navigate to backend
cd backend

# Install dependencies (first time only)
npm install

# Start the server
npm start

# Stop the server
Ctrl+C
```

### Frontend (Terminal 2)
```bash
# Navigate to frontend
cd frontend

# Start Python server (port 3000)
python -m http.server 3000

# Or use port 3001 if 3000 is busy
python -m http.server 3001

# Stop the server
Ctrl+C
```

---

## WHAT HAPPENS BEHIND THE SCENES

When you use the app:

1. **Upload Photo**
   - Browser reads image file
   - Sends to backend: `POST /api/analyze`
   - Backend validates image
   - Gemini AI analyzes image
   - Returns analysis JSON

2. **Answer Questions**
   - Browser sends questions: `POST /api/questions`
   - Gemini generates 5 personalized questions
   - User answers questions
   - Answers stored in browser session

3. **Generate Report**
   - Browser sends: `POST /api/report`
   - Combines analysis + answers
   - Gemini creates detailed recommendations
   - Returns beautiful report JSON

4. **Chat**
   - Browser sends: `POST /api/chat`
   - Includes full context (analysis, report, answers)
   - Gemini responds with personalized answers
   - Chat history maintained in browser

**Note:** No data is stored on server. Everything resets when you close the browser. Data stays only in your browser session (memory).

---

## MONITORING & DEBUGGING

### View Backend Logs
Terminal 1 (backend) shows all API requests:
```
[Analyze] Starting AI skin analysis...
[Questions] Loaded: 5 questions
[Report] Generated successfully
[Chat] Response received
```

### View Frontend Logs
Open browser console (F12 → Console tab):
```
[Analysis] Results received
[Questions] Displayed question 1
[Report] Started generation
[Chat] Message sent
```

These help you understand what's happening.

---

## IMPORTANT NOTES

1. **Keep .env Private:** Never commit `.env` file to GitHub
2. **API Key Cost:** Each API call costs a small amount. Test wisely
3. **Data Privacy:** No user data is stored on servers
4. **Session Only:** All data resets when you close browser
5. **Local Only:** This setup works only on `localhost`

---

## MOVING TO PRODUCTION (Future)

When you want to deploy to the internet:

1. Push code to GitHub
2. Connect Vercel (for frontend)
3. Connect backend to service (Railway, Render, Heroku)
4. Set environment variables on those services
5. Update API URL in frontend config

---

## NEXT STEPS

1. ✅ Follow this guide completely
2. ✅ Verify both terminal tabs show "running"
3. ✅ Test complete user flow
4. ✅ Check browser console for any errors
5. ✅ Try uploading different images
6. ✅ Test chat assistant

Once everything works locally, you can:
- Make code changes and they auto-reload
- Test new features
- Debug issues
- Plan deployment

---

## QUICK START (TL;DR)

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
python -m http.server 3000

# Browser
http://localhost:3000
```

---

Need help? Check the browser console (F12) for error messages. They'll give you clues about what's wrong.

Good luck! 🚀
