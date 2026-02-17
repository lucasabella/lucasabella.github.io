# 🍽️ ChainChaser

A web app for tracking visits to every location of restaurant chains. Pick a chain, see all locations on a map, mark the ones you've visited, and track your completion progress.

**Initial focus:** Dutch restaurant chains, starting with [Loetje](https://loetje.com) as proof of concept.

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
├── src/
│   ├── main.jsx                    # App entry point
│   ├── App.jsx                     # Root component
│   ├── App.css                     # Global styles
│   ├── components/                 # Reusable UI components
│   │   ├── Map/Map.jsx             # Leaflet map wrapper
│   │   ├── ProgressBar/ProgressBar.jsx
│   │   └── LocationCard/LocationCard.jsx
│   ├── pages/                      # Route-level pages
│   │   └── Home/Home.jsx           # Main landing page
│   ├── data/                       # Static data (Phase 1)
│   │   └── loetje.json             # Loetje locations
│   ├── hooks/                      # Custom React hooks
│   │   └── useVisited.js           # LocalStorage visited state
│   ├── utils/                      # Helper functions
│   │   └── geo.js                  # Distance & coord utilities
│   └── assets/                     # Static assets
├── backend/                        # Reserved for Phase 2
├── public/                         # Static public files
└── index.html                      # HTML entry
```

## Development Phases

| Phase | Focus |
|-------|-------|
| **1** (current) | Single chain (Loetje), hardcoded locations, interactive map, mark-as-visited, progress bar |
| **2** | Multiple chains, user auth, persistent storage, dashboard |
| **3** | Badges, leaderboards, social sharing, user-submitted content |

## Tech Stack

- **Frontend:** React + Vite
- **Map:** Leaflet (via react-leaflet)
- **Backend (Phase 2):** Node.js / Express + PostgreSQL
- **Hosting:** GitHub Pages (frontend), separate host for backend
