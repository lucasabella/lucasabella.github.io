# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: ChainChaser

A web app for tracking visits to every location of restaurant chains. Users pick a chain, see all locations on a map, mark visited ones, and track completion progress. Initial focus: Dutch restaurant chains, starting with Loetje as proof of concept.

## Development Status

Phase 2 — multi-chain support, user auth (email+password & Google OAuth), PostgreSQL backend, dashboard. Frontend uses HashRouter for GitHub Pages compatibility.

## Technical Stack

- **Frontend:** React + Vite (dev server on `localhost:5173`) with react-router-dom (HashRouter)
- **Map library:** Leaflet / react-leaflet
- **Backend:** Node.js / Express + PostgreSQL (port 3001)
- **Auth:** JWT access tokens (15min, in-memory) + refresh tokens (7-day, httpOnly cookie)
- **Hosting:** GitHub Pages (frontend), Railway/Render/Fly.io (backend)
- **Build output:** `/dist`

## Project Structure

```
src/
├── main.jsx                  # Entry point (HashRouter wrapper)
├── App.jsx                   # Route definitions + AuthProvider
├── App.css                   # Panel & layout styles (reused in ChainDetail)
├── index.css                 # Global styles, design tokens, animations
├── contexts/
│   └── AuthContext.jsx       # Auth state, login/register/google/logout, localStorage migration
├── components/
│   ├── Map/Map.jsx           # Leaflet map with markers
│   ├── ProgressBar/ProgressBar.jsx
│   ├── LocationCard/LocationCard.jsx
│   ├── ProtectedRoute.jsx    # Redirects to /login if unauthenticated
│   └── Layout/Layout.jsx     # Nav bar + Outlet
├── pages/
│   ├── Login/LoginPage.jsx   # Email+password + Google OAuth
│   ├── Register/RegisterPage.jsx
│   ├── Dashboard/DashboardPage.jsx + ChainCard.jsx
│   └── ChainDetail/ChainDetailPage.jsx  # Map + panel (from Phase 1 App.jsx)
├── hooks/
│   ├── useApi.js             # Fetch wrapper with auth + 401 retry
│   ├── useVisits.js          # API-backed visit toggling (optimistic)
│   └── useVisited.js         # Legacy localStorage hook (Phase 1)
├── data/
│   └── loetje.json           # Kept for reference (canonical data in backend/seeds/)
├── utils/
│   └── geo.js                # Haversine distance, coord formatting
└── assets/

backend/
├── package.json
├── .env.example
├── src/
│   ├── index.js              # Express entry
│   ├── config/db.js          # pg Pool
│   ├── config/env.js         # dotenv config
│   ├── middleware/auth.js     # JWT verification
│   ├── middleware/cors.js
│   ├── middleware/errorHandler.js
│   ├── middleware/validate.js # express-validator wrapper
│   ├── routes/auth.js        # register, login, google, refresh, logout, me
│   ├── routes/chains.js      # GET /chains, GET /chains/:slug
│   ├── routes/visits.js      # POST/DELETE /visits/:id, POST /visits/bulk, GET /visits/stats
│   ├── models/user.model.js
│   ├── models/chain.model.js
│   ├── models/visit.model.js
│   └── services/auth.service.js  # password hashing, JWT, Google OAuth, refresh tokens
├── migrations/               # 001-005 SQL files
├── scripts/
│   ├── migrate.js            # Run pending migrations
│   └── seed.js               # Seed chains from JSON files
└── seeds/chains/
    └── loetje.json           # Canonical Loetje data with slug field
```

## Development Commands

```bash
# Frontend
npm install          # Install frontend deps
npm run dev          # Start Vite dev server (proxies /api → localhost:3001)
npm run build        # Production build → /dist
npm run preview      # Preview prod build locally

# Backend
cd backend
npm install          # Install backend deps
npm run dev          # Start with nodemon
npm start            # Start production
npm run migrate      # Run database migrations
npm run seed         # Seed chains from seeds/chains/*.json
```

## Routes (Frontend)

| Hash path | Component | Auth required |
|-----------|-----------|---------------|
| `/#/login` | LoginPage | No |
| `/#/register` | RegisterPage | No |
| `/#/dashboard` | DashboardPage | Yes |
| `/#/chains/:slug` | ChainDetailPage | Yes |

## API Endpoints

### Auth (`/api/auth/`)
- `POST /register` — email+password signup
- `POST /login` — email+password login
- `POST /google` — Google ID token login
- `POST /refresh` — refresh access token (via cookie)
- `POST /logout` — invalidate refresh token
- `GET /me` — current user

### Chains (`/api/chains/`)
- `GET /` — all chains with user's visited count
- `GET /:slug` — chain + locations with visited boolean

### Visits (`/api/visits/`)
- `POST /:locationId` — mark visited
- `DELETE /:locationId` — unmark visited
- `POST /bulk` — bulk mark by source_ids (localStorage migration)
- `GET /stats` — dashboard stats

## Database

PostgreSQL with tables: `users`, `chains`, `locations`, `visits`, `refresh_tokens`. Migrations tracked in `_migrations` table.

## Key Constraints

- **Local testing is not possible** — the backend cannot run locally (no local PostgreSQL / env config). All testing must be done against the deployed production site.
- Frontend deployed to GitHub Pages (static hosting — backend needs separate hosting)
- CORS configured for cross-origin cookies (`SameSite=None; Secure`)
- Vite dev proxy: `/api` → `http://localhost:3001`
- Location data seeded from JSON files — source_id enables localStorage migration
- Phase 1 localStorage data (`chaincaser-visited`) auto-migrated on first login

## Known Gotchas

- **CSS animation fill-mode:** `animation-fill-mode: both` (or `forwards`) locks the final keyframe transform, overriding any subsequent CSS class-applied `transform`. Entrance animations on toggled elements (e.g. `.app__panel`) must use `backwards` instead. Symptom: clicking a toggle/close button appears to do nothing.
- **JSX HTML entities:** HTML entities like `&#10003;` are not parsed in JSX string literals — use Unicode escapes (`'\u2713'`) instead.

## Development Phases

**Phase 1 (complete):** Single chain (Loetje), hardcoded locations, interactive map, mark-as-visited, progress bar.

**Phase 2 (current):** Multiple chains, user auth, persistent storage, dashboard overview.

**Phase 3:** Badges, leaderboards, social sharing, user-submitted content.
