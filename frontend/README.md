# Skin Analysis Frontend

Vanilla HTML, CSS, and JavaScript frontend for the AI Skin Analysis and Personalized Skincare Recommendation System.

## Project Structure

```
frontend/
├── index.html          # Main landing page
├── styles/
│   └── main.css        # Global styles and design system
├── js/
│   └── main.js         # Core JavaScript functionality
└── README.md           # This file
```

## Getting Started

### Running Locally

1. Use any HTTP server to serve the frontend:

   **Using Python 3:**
   ```bash
   python -m http.server 3000
   ```

   **Using Node.js (http-server):**
   ```bash
   npm install -g http-server
   http-server -p 3000
   ```

   **Using VS Code Live Server:**
   - Install the Live Server extension
   - Right-click `index.html` and select "Open with Live Server"

2. The frontend will be available at `http://localhost:3000`

### Backend Connection

The frontend is configured to communicate with the backend at `http://localhost:5000`. Make sure the backend server is running:

```bash
cd backend
npm run dev
```

## Design System

### Colors
- **Primary**: #d4a574 (warm beige/gold)
- **Primary Dark**: #b8914c
- **Primary Light**: #e8dcc4
- **Neutral**: #f8f7f5, #1a1a1a (surface, text)
- **Accent**: #8b7355 (warm brown)

### Typography
- **Display Font**: Poppins (headings)
- **Body Font**: Inter (text content)
- **Responsive Font Sizes**: Scale from 2rem to 3.5rem for headings on desktop

### Spacing Scale
- XS: 0.5rem
- SM: 1rem
- MD: 1.5rem
- LG: 2rem
- XL: 3rem
- 2XL: 4rem

## Features (Phase 1)

✅ **Premium Landing Page**
- Clean, modern design
- Responsive mobile-first approach
- Smooth animations and transitions
- Professional color palette

✅ **Navigation**
- Fixed header with logo and navigation links
- Smooth scroll to sections
- Mobile-responsive nav

✅ **Sections**
1. **Hero**: Value proposition and CTA
2. **Features**: 6 key features of the system
3. **How It Works**: 3-step process
4. **About**: Why choose this system
5. **CTA**: Final call-to-action
6. **Footer**: Copyright information

✅ **API Integration**
- Backend health check
- API utility functions for Phase 2+
- Error handling and notifications

## Future Phases

- Phase 2: Image upload and validation
- Phase 3: AI analysis engine
- Phase 4: Visual overlay and UI enhancements
- Phase 5: Adaptive question system
- Phase 6: Report generation
- Phase 7: AI chat assistant
- Phase 8: Polish and refinement
