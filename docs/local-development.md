# Local Development Guide

How to run Digital Yearbook on your own machine from a fresh clone — either as a
Docker stack (matches production) or as native processes with hot reload.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Git | any | |
| Go | 1.22+ | backend |
| Node.js | 20+ (22 verified) | frontend |
| Docker + Compose | v2 | for the database / full stack |
| psql client | optional | only if you want to inspect the DB by hand |

## 1. Clone

```bash
git clone https://github.com/lovelymondayz/digital-yearbook.git
cd digital-yearbook
```

## 2. Create `.env`

`.env` is gitignored, so it is never in the clone. Create it **manually** from
this template — `.env.example` does not contain everything the app needs:

```bash
# --- Database (used by docker-compose) ---
DB_USER=yearbook
DB_PASSWORD=choose-a-strong-password
DB_NAME=yearbook
DB_PORT=5434

# --- Backend ---
ENVIRONMENT=development
API_PORT=8081
JWT_SECRET=at-least-32-characters-of-random
LOG_LEVEL=info

# --- Frontend ---
FRONTEND_PORT=3001

# --- Immich (required for flipbook pages) ---
IMMICH_URL=http://192.168.88.103:2283
IMMICH_API_KEY=<your-immich-api-key>
```

Generate a secret: `openssl rand -hex 32`

---

## Path A — Docker (recommended)

Closest to production. Everything (DB + backend + frontend) runs in containers.

```bash
docker compose build --no-cache
docker compose up -d --force-recreate
```

Then open:

- Frontend: <http://localhost:3001>
- Backend health: <http://localhost:8081/health>
- Database: `localhost:5434`

Stop: `docker compose down` · Wipe data: `docker compose down -v`

> Compose publishes the DB on **5434**, the API on **8081** and the frontend on
> **3001**. The containers themselves use 5432 / 8080 / 80.

---

## Path B — Native dev (hot reload)

Run Postgres in Docker and the app on the host so Vite and Go reload on save.

### 1. Start the database

```bash
docker compose up -d db
```

This publishes Postgres on `localhost:5434`.

### 2. Backend

**Important:** `godotenv` reads `.env` from the *current working directory*, and
migrations are read relative to it too. So put `.env` inside `backend/` and run
from there.

```bash
cd backend
cp ../.env .env

# Point the backend at the Docker Postgres:
#   DATABASE_URL=postgres://yearbook:<DB_PASSWORD>@localhost:5434/yearbook?sslmode=disable
# Also confirm IMMICH_URL / IMMICH_API_KEY / JWT_SECRET are set.

go mod download
go run ./cmd/server
```

- Listens on **http://localhost:8080**
- Runs all SQL migrations automatically on startup (from `./migrations`)
- Override the migration location with `MIGRATIONS_DIR` if you run from elsewhere

> `make dev` is broken — it runs `go run .` but there is no main package at
> `backend/`. Use `go run ./cmd/server`.

### 3. Frontend

```bash
cd frontend
npm ci
npm run dev
```

Opens **http://localhost:5173**. Vite proxies `/api` to `http://localhost:8080`,
which is exactly where the native backend listens — so no extra config needed.

> The dev server is on **5173**, not 3001. Port 3001 is the *container* port.

### Verify

```bash
curl -s http://localhost:8080/health          # {"status":"ok", ...}
curl -s http://localhost:5173/ | head          # HTML
```

---

## Immich is required for pages

The flipbook does **not** read page images from PostgreSQL. It pulls them from
an Immich album named `Thamrin Graduate <year>`.

- `IMMICH_URL` must be reachable from the machine you develop on.
- If it is not, `/api/v1/flipbook/years` returns `[]` and `/yearbook/<year>`
  shows *"No pages available for this yearbook."* — this is not an error, it
  just means no album was found.
- To develop fully offline, run your own Immich instance and point
  `IMMICH_URL` at it.

---

## Ports

| Port | What | Used by |
|------|------|---------|
| 5432 | PostgreSQL | a host-installed Postgres |
| 5434 | PostgreSQL | `docker compose up -d db` |
| 8080 | Backend | native `go run` (and the container internally) |
| 8081 | Backend | `docker compose` published port |
| 3001 | Frontend | `docker compose` published port |
| 5173 | Frontend | Vite dev server |

Running Path A and Path B at the same time will collide on 8080/3001 — stop one
first.

---

## Common pitfalls

- **Blank page / no pages:** Immich unreachable, or the album is not named
  exactly `Thamrin Graduate <year>`.
- **`relation "schema_migrations" does not exist` or missing tables:** you ran
  the backend from the wrong directory so migrations were not found. Run from
  `backend/`, or set `MIGRATIONS_DIR=backend/migrations`.
- **`make dev` fails with "no Go files":** known issue, use
  `go run ./cmd/server`.
- **Frontend can't reach the API:** you are on 5173 and the backend is not on
  8080. The Vite proxy target is hardcoded to `http://localhost:8080`.
- **Editing the yearbook offline:** Postgres holds users, students, bookmarks
  and audit logs. Yearbook *pages* live in Immich, not in Postgres.
