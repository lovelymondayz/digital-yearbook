# Digital Yearbook — Architecture

## Overview
A digital yearbook platform for schools/universities. Students browse yearbooks with a 3D flipbook experience, view galleries, and interact with classmate profiles. Admin panel for managing students, photos, and content. Integrates with Immich for photo storage.

## Tech Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + React Three Fiber (R3F) + drei + Three.js + Framer Motion + Zustand
- **Backend:** Go 1.22 + Chi router + pgx (PostgreSQL driver)
- **Database:** PostgreSQL 16
- **Photo Storage:** Immich (external service, connected via Docker network)
- **Deployment:** Docker Compose (3 services: db, backend, frontend)
- **Auth:** JWT (HMAC-SHA256)
- **Reverse Proxy:** nginx (port 80 → yearbook.thamrin.ac.id)
- **Tunnel:** Cloudflare Tunnel (yearbook.arjism.com → localhost:3001)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Tunnel                         │
│              yearbook.arjism.com → :3001                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              NGINX (frontend container, port 80)             │
│              Serves React SPA + proxies /api/*               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Go API (backend container, port 8080)           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Public Routes (no auth)                              │   │
│  │    GET  /api/v1/flipbook/years                        │   │
│  │    GET  /api/v1/flipbook/:yearId/pages                │   │
│  │    GET  /api/v1/students/:id                          │   │
│  │    GET  /api/v1/gallery/:studentId                    │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Auth Routes                                          │   │
│  │    POST /api/v1/auth/login                            │   │
│  │    GET  /api/v1/auth/me                               │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Admin Routes (JWT required)                          │   │
│  │    CRUD students, yearbooks, pages, galleries         │   │
│  │    Upload images, manage tags, bookmarks              │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              PostgreSQL 16 (db container, port 5432)         │
│  universities → campuses → faculties → departments          │
│  → users → yearbooks → yearbook_pages → students            │
│  → student_galleries → tags → bookmarks → sessions           │
│  → audit_logs → analytics_events → versions → image_assets   │
│  → permissions → functions                                  │
└─────────────────────────────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Immich (external)     │
              │   Photo storage via API │
              └─────────────────────────┘
```

## Directory Structure
```
digital-yearbook/
├── docker-compose.yml
├── Makefile
├── ARCHITECTURE.md
├── PLAN.md
├── .env / .env.example
├── scripts/
│   └── update.sh              # Manual deploy script
├── backend/
│   ├── main.go                # Entry point, route setup
│   ├── go.mod / go.sum
│   ├── Dockerfile
│   ├── migrations/            # 20+ SQL migration files (up/down)
│   └── internal/
│       ├── config/            # Env-based configuration
│       ├── database/          # pgxpool connection
│       ├── models/            # Domain structs
│       ├── handlers/          # HTTP handlers by domain
│       ├── middleware/        # JWT + CORS
│       ├── repository/        # DB query layer
│       └── pkg/               # Shared utilities
└── frontend/
    ├── package.json
    ├── vite.config.ts         # Manual chunks: three/r3f/vendor
    ├── tailwind.config.js
    ├── postcss.config.js      # Required for Tailwind in Vite
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── main.tsx / App.tsx
        ├── index.css
        ├── api/               # Axios client + typed services
        ├── components/        # Reusable UI components
        ├── pages/             # Route pages
        ├── lib/               # Utilities
        └── store/             # Zustand state management
```

## Data Flow
1. User visits `/` → frontend calls `GET /api/v1/flipbook/years` → returns Immich album thumbnails
2. User selects a year → `GET /api/v1/flipbook/:yearId/pages` → renders 3D flipbook via R3F
3. Student profile → `GET /api/v1/students/:id` + `GET /api/v1/gallery/:studentId`
4. Admin login → `POST /api/v1/auth/login` → JWT → stored in localStorage
5. All admin requests include `Authorization: Bearer <token>` header

## Vite Chunk Strategy
- `three` — Three.js core (~600KB)
- `r3f` — @react-three/fiber + @react-three/drei (~400KB)
- `vendor` — All other node_modules

## Texture Loading Pattern
Use `THREE.TextureLoader` directly with `useState` + `useEffect`. Do NOT use `useTexture` from drei (crashes silently) or `useLoader` from R3F (may be missing from chunk).

## Design Decisions
- **Chi over Gin** — Lightweight, stdlib-compatible, no magic
- **Zustand over Redux** — Simpler API, less boilerplate
- **R3F for 3D** — Declarative Three.js in React, flipbook animation
- **Immich integration** — External photo storage, accessed via API
- **Manual deploy only** — `./scripts/update.sh`, no cron auto-deploy
- **Separate Vite chunks** — Three.js is huge; splitting prevents monolithic bundle
