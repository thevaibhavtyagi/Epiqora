# Epiqora 

A high-fidelity, full-stack AI skincare assistant. Epiqora analyzes facial imagery, pairs it with an adaptive lifestyle questionnaire, and generates highly personalized, over-the-counter (OTC) cosmetic routines. 

Built with a strict focus on data privacy, API rate-limit resilience, and zero-retention stateless processing.

**Author:** Vaibhav Tyagi | [vaibhavtyagi.me](https://vaibhavtyagi.me)

---
## 💡 Why I Built Epiqora

Skincare advice on the internet is overwhelmingly generic, heavily marketed, and rarely accounts for an individual's actual visual data or lifestyle constraints. I noticed that most AI tools attempting to solve this were either thin API wrappers prone to hallucinations, or they required users to surrender sensitive facial data to permanent databases. 

I built Epiqora to solve two distinct problems:

1. **The User Experience Gap:** I wanted to create a system that acts as a structured, privacy-first concierge. A tool that actually "looks" at the user's skin, asks the right contextual questions, and provides a clean, unbiased, over-the-counter routine without retaining any of their personal data.
2. **The Engineering Challenge:** As a Computer Science Engineering student, I wanted to move beyond basic local projects and tackle the friction of deploying a live, full-stack application. Epiqora served as my proving ground for real-world system design. It forced me to figure out how to engineer a zero-retention data pipeline, orchestrate multi-model LLM routing to optimize token usage, and build custom exponential backoff systems to prevent server crashes during third-party API spikes. 

Epiqora was about proving I could build a resilient, production-ready system, not just a cool feature.

---

## 🏗️ Technical Architecture & Core Features

Epiqora is not just a basic API wrapper; it features a production-ready architecture designed to survive real-world traffic spikes on a split cloud deployment.

* **Zero-Retention Privacy (Stateless Processing):** Facial data is handled with strict privacy. Images uploaded to Epiqora are processed in a transient backend buffer, analyzed, and instantly destroyed. No user photos are ever saved to a database or file system.
* **Strategic LLM Routing:** AI workloads are split to optimize token consumption and speed. 
  * `gemini-2.5-flash` is utilized strictly for complex multimodal vision tasks (texture and feature analysis).
  * `gemini-2.5-flash-lite` is utilized for text-to-JSON generation and the chat UI, leveraging high-concurrency quotas and rapid response times.
* **Jittered Exponential Backoff:** Custom backend middleware intercepts 503 (High Demand) and 429 (Quota) errors from third-party APIs. Instead of crashing, the server initiates a randomized delay-and-retry loop, ensuring a seamless user experience during traffic spikes.
* **Strict Safety Guardrails:** The interactive chatbar (EpiqAI) utilizes rigorous system prompting to maintain a professional cosmetic persona, cross-reference the user's scan data, and explicitly refuse to recommend prescription medications.
* **Transient State Management:** The frontend is built in pure Vanilla JavaScript operating as a Single Page Application (SPA). `sessionStorage` acts as an active cache layer, preventing redundant API calls if a user refreshes the browser mid-consultation.

---

## 🛠️ Tech Stack

**Frontend (Deployed on Vercel)**
* Vanilla JavaScript (ES6+)
* HTML5 & CSS3 (Custom responsive minimal UI)
* Native Web Storage API (State Management)

**Backend (Deployed on Render)**
* Node.js & Express.js (REST API)
* Google Generative AI SDK (Gemini API)
* Multer (In-memory multipart/form-data processing)
* CORS & Helmet (Security Headers)

**Database & Telemetry**
* MongoDB Atlas (Used strictly for anonymous telemetry and session tracking—no PII or images).

---

## 📂 Project Structure

```text
EPIQORA/
├── backend/                  # Node.js REST API
│   ├── src/
│   │   ├── config/           # Environment & DB configurations
│   │   ├── controllers/      # Route logic (Analyze, Chat, Report, Health)
│   │   ├── middleware/       # Custom CORS and Error Handling
│   │   ├── routes/           # API Endpoints
│   │   ├── services/         # Gemini Integration & Backoff Logic
│   │   └── server.js         # Express Application Entry Point
│   ├── package.json
│   └── .env.example
│
├── frontend/                 # Vanilla JS SPA
│   ├── public/
│   │   ├── js/
│   │   │   ├── components/   # Modular UI elements (Header, Sidebar)
│   │   │   ├── core/         # API Bridge & Router Guards
│   │   │   └── pages/        # Page-specific logic controllers
│   │   ├── styles/           # Component-scoped CSS
│   │   ├── index.html        # Landing Page
│   │   ├── upload.html       # Image Capture
│   │   ├── analysis.html     # Real-time Scanning HUD
│   │   ├── questions.html    # Adaptive Questionnaire
│   │   └── report.html       # Final Routine Output
│   └── vercel.json           # Cloud deployment configurations (Clean URLs)
│
├── .gitignore
└── README.md
```

## 🔗 Internal API Reference

*Note: Epiqora is a closed-loop system. The backend API is strictly locked via CORS to the Vercel frontend domain to protect API quotas and prevent unauthorized external access.*

| Method | Endpoint | Core Function |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Processes a multipart/form-data image buffer in memory via Gemini Vision. Returns a JSON analysis map. |
| `POST` | `/api/questions` | Generates a dynamic array of multiple-choice lifestyle factors based on the visual scan. |
| `POST` | `/api/report` | Cross-references lifestyle answers with visual data to generate a structured morning/evening protocol. |
| `POST` | `/api/chat` | Stateful conversational endpoint for out-of-protocol queries. |
| `GET`  | `/api/health` | Lightweight 200 OK endpoint utilized for Render keep-alive cron jobs. |

---

## ⚠️ Disclaimer
Epiqora is an engineering portfolio project. It is not a medical device. The AI is explicitly constrained to provide over-the-counter (OTC) cosmetic suggestions based on visual data and user input. It is not designed to diagnose, treat, or cure dermatological diseases.