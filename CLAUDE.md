# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: ChainChaser

A web app for tracking visits to every location of restaurant chains. Users pick a chain, see all locations on a map, mark visited ones, and track completion progress. Initial focus: Dutch restaurant chains, starting with Loetje as proof of concept.

## Development Status

Phase 1 — project scaffolded with Vite + React. Core component structure is in place, ready for feature development.

## Technical Stack

- **Frontend:** React + Vite (dev server on `localhost:5173`)
- **Map library:** Leaflet / react-leaflet (to be installed)
- **Backend (Phase 2):** Node.js / Express + PostgreSQL
- **Hosting:** GitHub Pages (frontend), separate host for backend
- **Build output:** `/dist`

## Project Structure

```
src/
├── main.jsx                  # Entry point
├── App.jsx                   # Root component
├── App.css                   # Global styles
├── components/               # Reusable UI components
│   ├── Map/Map.jsx           # Leaflet map (core Phase 1)
│   ├── ProgressBar/ProgressBar.jsx
│   └── LocationCard/LocationCard.jsx
├── pages/                    # Route-level pages
│   └── Home/Home.jsx
├── data/                     # Hardcoded data (Phase 1)
│   └── loetje.json           # Loetje locations + coords
├── hooks/                    # Custom hooks
│   └── useVisited.js         # localStorage visited state
├── utils/                    # Pure helpers
│   └── geo.js                # Haversine distance, coord formatting
└── assets/                   # Static assets (images, icons)

backend/                      # Reserved for Phase 2
```

## Development Commands

```bash
npm install          # Install deps
npm run dev          # Start Vite dev server
npm run build        # Production build → /dist
npm run preview      # Preview prod build locally
```

## Development Phases

**Phase 1 (current):** Single chain (Loetje), hardcoded locations, interactive map, mark-as-visited, progress bar. Deploy it.

**Phase 2:** Multiple chains, user auth, persistent storage, dashboard overview.

**Phase 3:** Badges, leaderboards, social sharing, user-submitted content.

## Key Constraints

- Deployed to GitHub Pages (static hosting — backend will need separate hosting)
- Location data maintenance is an ongoing concern (locations open/close)
- Keep scope tight — phase 1 first, resist scope creep
- Phase 1 uses localStorage for state — no backend dependency
