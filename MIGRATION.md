# Migration Guide — Digital Yearbook

## Overview
This document describes how to migrate the Digital Yearbook application to a new server.

## Architecture
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Cloudflare  │────▶│  Nginx (FE)  │────▶│  Go (BE)    │
│  Tunnel      │     │  Port 3001   │     │  Port 8081  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                 │
                                          ┌──────▼──────┐
                                          │ PostgreSQL  │
                                          │ Port 5434   │
                                          └─────────────┘
                                                 │
                                          ┌──────▼──────┐
                                          │   Immich    │
                                          │ Port 2283   │
                                          └─────────────┘
```

## Prerequisites
- Docker + Docker Compose
- Cloudflare Tunnel (for public access)
- Immich instance (for photo storage)
- Domain: `yearbook.arjism.com`

## Step 1: Clone & Configure

```bash
git clone https://github.com/lovelymondayz/digital-yearbook.git
cd digital-yearbook
```

Create `.env` file:
```env
# Database
DB_USER=yearbook
DB_PASSWORD=yearbook_secret
DB_NAME=yearbook
DB_PORT=5434

# Backend
ENVIRONMENT=production
API_PORT=8081
JWT_SECRET=<generate-a-random-secret>
IMMICH_URL=http://immich_server:2283
IMMICH_API_KEY=<your-immich-api-key>

# Frontend
FRONTEND_PORT=3001
```

## Step 2: Start Services

```bash
docker compose up -d
```

This starts:
- `yearbook-db` — PostgreSQL 16
- `yearbook-backend` — Go API server
- `yearbook-frontend` — Nginx serving React SPA

## Step 3: Verify

```bash
# Backend health
curl http://localhost:8081/health

# Frontend
curl http://localhost:3001/

# API
curl http://localhost:8081/api/v1/flipbook/years
```

## Step 4: Connect Immich

Ensure the Immich Docker network is accessible:
```bash
docker network connect immich_default yearbook-backend
```

## Step 5: Cloudflare Tunnel

```bash
cloudflared tunnel --hostname yearbook.arjism.com --url http://localhost:3001
```

## Database Migrations

Migrations run automatically on backend startup. To manually run:
```bash
cd backend
go run ./cmd/server  # migrations run on startup
```

Migration files are in `backend/migrations/` — numbered 000-200 with `.up.sql` and `.down.sql`.

## Backup & Restore

### Backup
```bash
docker exec yearbook-db pg_dump -U yearbook yearbook > backup.sql
```

### Restore
```bash
docker exec -i yearbook-db psql -U yearbook yearbook < backup.sql
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_USER` | `yearbook` | PostgreSQL username |
| `DB_PASSWORD` | `yearbook_secret` | PostgreSQL password |
| `DB_NAME` | `yearbook` | Database name |
| `DB_PORT` | `5434` | External PostgreSQL port |
| `API_PORT` | `8081` | External backend port |
| `FRONTEND_PORT` | `3001` | External frontend port |
| `JWT_SECRET` | `change-me` | JWT signing secret |
| `IMMICH_URL` | `http://immich_server:2283` | Immich server URL |
| `IMMICH_API_KEY` | (empty) | Immich API key |
| `ENVIRONMENT` | `production` | `development` or `production` |

## Troubleshooting

### Backend can't connect to DB
- Check `DATABASE_URL` in docker-compose.yml uses `db:5432` (internal Docker network)
- Verify DB container is healthy: `docker compose ps`

### Images not loading
- Verify `IMMICH_API_KEY` is set
- Check Immich network: `docker network ls | grep immich`
- Test proxy: `curl http://localhost:8081/api/v1/flipbook/asset/<asset_id>`

### Frontend shows 404 on refresh
- This is expected for SPA routes — nginx `try_files` handles it
- Ensure `VITE_API_URL` is empty (uses relative paths through nginx proxy)
