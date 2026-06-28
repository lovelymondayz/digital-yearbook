# Digital Yearbook Platform

A production-grade digital yearbook platform for universities. Built with Go, React, TypeScript, and PostgreSQL.

## Features

- **Immersive Flipbook** — Realistic page-turning with Framer Motion animations
- **Powerful Search** — PostgreSQL full-text search across names, quotes, majors
- **Multi-Tenant** — One platform, many universities, each with branded experience
- **Role-Based Access** — Super admin, admin, editor, viewer roles
- **Audit Logging** — Every admin action tracked
- **Responsive** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Backend | Go 1.22 + Chi router + pgx |
| Database | PostgreSQL 16 |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |

## Quick Start

### Prerequisites

- Go 1.22+
- Node.js 20+
- Docker + Docker Compose
- PostgreSQL 16

### Local Development

```bash
# Clone
git clone https://github.com/lovelymondayz/digital-yearbook.git
cd digital-yearbook

# Start database
docker compose up -d db

# Backend
cd backend
cp .env.example .env
# Edit .env with your database credentials
go mod tidy
go run ./cmd/server

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` for the frontend and `http://localhost:8080/health` for the API.

### Docker Compose (Full Stack)

```bash
cp .env.example .env
# Edit .env with your credentials
docker compose up --build
```

## API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/auth/register` | POST | No | Register new user |
| `/api/v1/auth/login` | POST | No | Login |
| `/api/v1/auth/refresh` | POST | No | Refresh access token |
| `/api/v1/yearbooks` | GET | No | List published yearbooks |
| `/api/v1/yearbooks/{slug}` | GET | No | Get yearbook by slug |
| `/api/v1/yearbooks/{id}/students` | GET | No | List students |
| `/api/v1/search` | GET | No | Search students |
| `/api/v1/admin/yearbooks` | POST | Admin | Create yearbook |
| `/api/v1/admin/students` | POST | Admin | Add student |
| `/api/v1/admin/analytics` | GET | Admin | Dashboard stats |
| `/health` | GET | No | Health check |

## Project Structure

```
digital-yearbook/
├── backend/
│   ├── cmd/server/main.go     # Entry point
│   ├── internal/
│   │   ├── config/            # Environment config
│   │   ├── database/          # PostgreSQL connection + migrations
│   │   ├── handler/           # HTTP handlers
│   │   ├── middleware/        # Auth, CORS, rate limiting
│   │   ├── model/             # Domain types
│   │   └── service/           # Business logic
│   ├── migrations/            # SQL migrations (numbered)
│   ├── Dockerfile
│   ├── go.mod
│   └── Makefile
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Footer, Layout
│   │   ├── pages/             # All page components
│   │   ├── pages/admin/       # Admin pages
│   │   ├── store/             # Zustand state
│   │   ├── lib/               # API client
│   │   └── styles/            # Tailwind + custom CSS
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

## License

MIT
