# Digital Yearbook — LXC Migration Plan

Move ONLY the `digital-yearbook` project from the current Hermes LXC to a dedicated LXC container, with its own Cloudflare Tunnel and isolated `.env`.

---

## 1. Pre-Migration Checklist

- [ ] **Backup current database**
  ```bash
  docker compose exec -T db pg_dump -U yearbook yearbook > /root/backups/yearbook-$(date +%Y%m%d).sql
  ```
- [ ] **Create new LXC container**
  - OS: Debian 12 / Ubuntu 22.04
  - Resources: 2 CPU / 2 GB RAM / 20 GB disk
  - Set a static IP or reserve a DHCP lease
- [ ] **Install prerequisites on new LXC**
  ```bash
  apt update && apt install -y docker.io docker-compose-plugin git curl nginx
  systemctl enable --now docker
  ```
- [ ] **Verify ports are free on new LXC**
  ```bash
  ss -tlnp | grep -E '3001|8081|5434' || echo "ports free"
  ```
- [ ] **Decide the public hostname**
  - Example: `yearbook.arjism.com`
  - Must be added to Cloudflare DNS as a CNAME or A record before tunnel setup

---

## 2. Project Transfer

### 2.1 Clone repo on new LXC
```bash
mkdir -p /opt/selfhosted && cd /opt/selfhosted
git clone https://github.com/lovelymondayz/digital-yearbook.git
cd digital-yearbook
```

### 2.2 Create `.env` from template
```bash
cp .env.example .env
```

Edit `.env` with the values in Section 3 below.

---

## 3. Adjustable `.env` for Migration

All values that change per environment are listed here. Copy this block into the new LXC’s `.env` and change only the flagged values.

```env
# ============================================
# DATABASE
# ============================================
DB_USER=yearbook
DB_PASSWORD=<CHOOSE_STRONG_PASSWORD>
DB_NAME=yearbook
DB_PORT=5434

# ============================================
# BACKEND
# ============================================
ENVIRONMENT=production
API_PORT=8081
JWT_SECRET=<GENERATE_WITH: openssl rand -hex 32>
LOG_LEVEL=info

# ============================================
# FRONTEND
# ============================================
FRONTEND_PORT=3001

# ============================================
# CORS / PUBLIC URLS
# ============================================
# Change ONLY if your public hostname differs
FRONTEND_URL=http://localhost:3001
FRONTEND_URL_PROD=https://yearbook.arjism.com

# ============================================
# IMMICH (flipbook pages)
# ============================================
# Keep the same Immich server URL + API key
IMMICH_URL=http://192.168.88.103:2283
IMMICH_API_KEY=<YOUR_IMMICH_API_KEY>

# ============================================
# OPTIONAL — only if you move the database
# ============================================
# DATABASE_URL=postgres://yearbook:<CHOOSE_STRONG_PASSWORD>@localhost:5434/yearbook?sslmode=disable
```

### What to change when migrating
| Variable | When to change |
|---|---|
| `DB_PASSWORD` | Every new deployment — choose a new strong password |
| `JWT_SECRET` | Every new deployment — rotate for isolation |
| `FRONTEND_URL_PROD` | Only if the public domain changes |
| `IMMICH_URL` / `IMMICH_API_KEY` | Keep the same if Immich stays on the same server |
| `DB_PORT` / `API_PORT` / `FRONTEND_PORT` | Change if the new LXC already uses these ports |

---

## 4. Database Migration

### Option A — Fresh database (recommended if data can be re-synced from Immich)
The flipbook pages come from Immich albums, so you can start with a fresh database and let the app re-index.

```bash
cd /opt/selfhosted/digital-yearbook
docker compose up -d db
sleep 5
docker compose exec db psql -U yearbook -c "CREATE DATABASE yearbook;" || true
docker compose exec -T db psql -U yearbook yearbook < /root/backups/yearbook-YYYYMMDD.sql
```

### Option B — Reuse existing database
If the new LXC can reach the old database IP, skip the dump and just point `.env` to the old DB host. Not recommended for long-term isolation.

---

## 5. Cloudflare Tunnel Setup (New LXC)

### 5.1 Authenticate cloudflared
```bash
cloudflared tunnel login
# This opens a browser; log in with the domain owner account
```

### 5.2 Create a dedicated tunnel for yearbook
```bash
cloudflared tunnel create yearbook
# Note the Tunnel UUID returned
```

### 5.3 Create tunnel config
File: `/root/.cloudflared/config.yml`

```yaml
tunnel: <YEARBOOK_TUNNEL_UUID>
credentials-file: /root/.cloudflared/<YEARBOOK_TUNNEL_UUID>.json

ingress:
  - hostname: yearbook.arjism.com
    service: http://localhost:3001
    # OR if you want the backend exposed directly:
    # service: http://localhost:8081
  - service: http_status:404
```

### 5.4 Run the tunnel
```bash
cloudflared tunnel run yearbook
```

### 5.5 Enable systemd service
```bash
cloudflared service install
systemctl enable --now cloudflared
```

---

## 6. DNS Update

In Cloudflare DNS for `arjism.com`:

| Type | Name | Content / Target | Proxy |
|---|---|---|---|
| CNAME | `yearbook` | `<new-lxc-ip-or-tunnel-name>` | Proxied |

If using a tunnel-created CNAME, set it to the tunnel ID or the tunnel’s built-in hostname.

Propagation is near-instant because Cloudflare proxies it.

---

## 7. Nginx on New LXC

The project’s `frontend/nginx.conf` already proxies `/api/` to the backend container. You have two choices:

**Option A — Use docker-compose internal nginx only**
- Frontend container already includes nginx on port 80 inside the container
- Expose `3001:80` in docker-compose
- Cloudflare Tunnel points to `localhost:3001`
- No host-level nginx needed

**Option B — Host nginx as reverse proxy**
- If you need SSL termination or additional paths on the host
- Point host nginx to `localhost:3001`
- Cloudflare Tunnel points to host nginx `localhost:80`

For isolation and simplicity, use **Option A**.

---

## 8. Docker Compose on New LXC

Run from `/opt/selfhosted/digital-yearbook`:

```bash
docker compose build --no-cache
docker compose up -d --force-recreate
```

Verify:
```bash
curl -sf http://localhost:3001/ && echo "frontend ok"
curl -sf http://localhost:8081/health && echo "backend ok"
docker compose ps
```

---

## 9. Cutover Steps

1. **Final DB sync** (if using Option A fresh DB, skip)
   ```bash
   docker compose exec -T db pg_dump -U yearbook yearbook > /root/backups/yearbook-final.sql
   scp /root/backups/yearbook-final.sql new-lxc:/opt/selfhosted/
   ssh new-lxc "docker compose exec -T db psql -U yearbook yearbook < /opt/selfhosted/yearbook-final.sql"
   ```

2. **Start services on new LXC**
   ```bash
   ssh new-lxc "cd /opt/selfhosted/digital-yearbook && docker compose up -d --force-recreate"
   ```

3. **Test on new LXC**
   ```bash
   ssh new-lxc "curl -sf http://localhost:3001/ && curl -sf http://localhost:8081/health"
   ```

4. **Update DNS / tunnel**
   - Point `yearbook.arjism.com` to the new tunnel
   - Old tunnel can be paused or deleted after verification

5. **Verify live**
   ```bash
   curl -I https://yearbook.arjism.com
   ```

---

## 10. Post-Migration Cleanup (Old LXC)

- [ ] Stop old containers:
  ```bash
  cd /root/hermes/projects/digital-yearbook
  docker compose down
  ```
- [ ] Do NOT delete the repo or `.env` yet — keep for 7 days as rollback
- [ ] Remove old tunnel route if it existed

---

## 11. Rollback Plan

If the new LXC fails, revert in minutes:

```bash
# On old LXC
cd /root/hermes/projects/digital-yearbook
docker compose up -d --force-recreate

# In Cloudflare DNS, point yearbook.arjism.com back to old tunnel
```

Database was not modified in a destructive way, so rollback is safe as long as the old DB volume was preserved.

---

## 12. Why This Structure

| Decision | Reason |
|---|---|
| Separate LXC | Isolation — if another project crashes or rebuilds, yearbook stays up |
| Dedicated tunnel | Tunnel limits / routing are per-tunnel; one tunnel per service = cleaner logs and auth |
| Immutable `.env` values | You can copy `.env` between machines and only change the flagged fields |
| Fresh DB option | Yearbook pages are sourced from Immich, not Postgres — data loss risk is low |
| Host-level nginx not required | Docker’s internal nginx + Cloudflare Tunnel is enough and simpler |

---

## 13. Files to Copy Manually

| Source | Destination on new LXC |
|---|---|
| `/root/hermes/projects/digital-yearbook/.env` | `/opt/selfhosted/digital-yearbook/.env` |
| `/root/backups/yearbook-*.sql` | `/opt/selfhosted/` |
| `Thamrin-Assets/` inside repo | Already in git; no manual copy needed |

---

## 14. Quick-Start Script for New LXC

Save this as `/opt/selfhosted/setup-yearbook.sh` on the new LXC:

```bash
#!/bin/bash
set -e
cd /opt/selfhosted/digital-yearbook
cp .env.example .env
echo "Edit .env with DB password, JWT secret, and Immich key, then press Enter"
read
docker compose build --no-cache
docker compose up -d --force-recreate
sleep 10
docker compose ps
curl -sf http://localhost:3001/ && echo "FRONTEND OK" || echo "FRONTEND FAIL"
curl -sf http://localhost:8081/health && echo "BACKEND OK" || echo "BACKEND FAIL"
```

Make executable:
```bash
chmod +x /opt/selfhosted/setup-yearbook.sh
```

---

*Plan created for digital-yearbook only. Other projects remain on the Hermes LXC.*
