# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: ChainChaser

A web app for tracking visits to every location of restaurant chains. Users pick a chain, see all locations on a map, mark visited ones, and track completion progress. Focus: Dutch restaurant chains.

## Architecture

Fully static frontend — no backend, no accounts. Chain/location data lives in JSON files under `src/data/chains/`, visits are stored in localStorage. Frontend uses HashRouter for GitHub Pages compatibility.

## Technical Stack

- **Frontend:** React + Vite (dev server on `localhost:5173`) with react-router-dom (HashRouter)
- **Map library:** Leaflet / react-leaflet
- **Storage:** localStorage (key `chainchaser-visits`, array of location ids; falls back to legacy `chaincaser-visited` key on first load)
- **Hosting:** GitHub Pages
- **Build output:** `/dist`

## Project Structure

```
src/
├── main.jsx                  # Entry point (HashRouter wrapper)
├── App.jsx                   # Route definitions + ThemeProvider
├── App.css                   # Panel & layout styles (reused in ChainDetail)
├── index.css                 # Global styles, design tokens, animations
├── contexts/
│   └── ThemeContext.jsx      # Light/dark theme toggle (localStorage)
├── components/
│   ├── Map/Map.jsx           # Leaflet map with markers
│   ├── ProgressBar/ProgressBar.jsx
│   ├── LocationCard/LocationCard.jsx
│   └── Layout/Layout.jsx     # Nav bar + Outlet
├── pages/
│   ├── Dashboard/DashboardPage.jsx + ChainCard.jsx  # Chain overview + badges
│   └── ChainDetail/ChainDetailPage.jsx  # Map + panel per chain
├── hooks/
│   ├── useVisits.js          # localStorage-backed visit toggling
│   ├── useGeolocation.js     # Lazy browser geolocation
│   └── useBottomSheet.js     # Mobile bottom sheet drag
├── data/
│   ├── chains.js             # Loads all chain JSONs, getChains()/getChain(slug)
│   └── chains/*.json         # Chain data (name, slug, locations with id/lat/lng)
└── utils/
    ├── geo.js                # Haversine distance, coord formatting
    └── confetti.js           # Visit & completion confetti
```

## Development Commands

```bash
npm install          # Install deps
npm run dev          # Start Vite dev server
npm run build        # Production build → /dist
npm run preview      # Preview prod build locally
npm run lint         # ESLint
```

## Routes

| Hash path | Component |
|-----------|-----------|
| `/#/dashboard` | DashboardPage |
| `/#/chains/:slug` | ChainDetailPage |

Everything else redirects to `/#/dashboard`.

## Adding a chain

Add a JSON file to `src/data/chains/` (fields: `chain`, `slug`, `description`, `website`, `logo_url`, `locations[]` with unique string `id`, `name`, `address`, `city`, `lat`, `lng`) and import it in `src/data/chains.js`.

## Key Constraints

- Fully static — everything runs client-side, `npm run dev` is all you need locally
- Location ids must stay stable; they are the localStorage visit keys
- Badges on the dashboard are computed client-side from visit counts

## Known Gotchas

- **CSS animation fill-mode:** `animation-fill-mode: both` (or `forwards`) locks the final keyframe transform, overriding any subsequent CSS class-applied `transform`. Entrance animations on toggled elements (e.g. `.app__panel`) must use `backwards` instead. Symptom: clicking a toggle/close button appears to do nothing.
- **JSX HTML entities:** HTML entities like `&#10003;` are not parsed in JSX string literals — use Unicode escapes (`'✓'`) instead.
