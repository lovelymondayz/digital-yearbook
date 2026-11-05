# Dual-LXC Sync Plan (Hermes + Thamrin)

Both LXCs share `/mnt/shared/digital-yearbook`. GitHub is the single source of truth.
Each LXC runs its own Docker stack (db, backend, frontend) and its own auto-watcher.

## Architecture

```
                GitHub (origin/main)
                lovelymondayz/digital-yearbook
                      │                 │
            pull 10min│                 │pull 10min
                      ▼                 ▼
         Hermes LXC           Thamrin LXC
         /mnt/shared/         /mnt/shared/
         └─ same shared storage ┘
             │
      ┌──────┴──────┐
      │ Docker (local each)
      │ db/backend/frontend
      │ ports 3001/8081/5434
      │ own Cloudflare Tunnel
      └──────────────┘
```

## Update Flow

1. Developer pushes to `origin/main` from either LXC
2. Each LXC's watcher (`digital-yearbook-watcher.timer`, every 10 min):
   - `git fetch origin main`
   - If new commit → `git pull --ff-only`
   - If updated → `docker compose build --no-cache`
   - If build OK → `docker compose up -d --force-recreate`
   - Verify frontend HTTP 200 + backend `/health` OK
3. Logs append to `cron/output/digital-yearbook-auto-update/auto-update.log` (gitignored)

## Hermes LXC — Setup ✅ DONE

- Project: `/mnt/shared/digital-yearbook`
- Watcher script: `scripts/auto-update.sh` (executable, committed)
- Systemd user service: `~/.config/systemd/user/digital-yearbook-watcher.service`
- Systemd user timer: `~/.config/systemd/user/digital-yearbook-watcher.timer`
- Interval: 10 minutes, `AccuracySec=1min`
- Enabled: ✅ (`systemctl --user enable --now digital-yearbook-watcher.timer`)
- First run: within 2 minutes of boot, then every 10 min
- Lockfile: `/tmp/digital-yearbook-watcher.lock` (stale after 600s)
- Log file: `cron/output/digital-yearbook-auto-update/auto-update.log`

Verify:
```bash
systemctl --user status digital-yearbook-watcher.service
systemctl --user list-timers digital-yearbook-watcher.timer
tail -f /mnt/shared/digital-yearbook/cron/output/digital-yearbook-auto-update/auto-update.log
```

## Thamrin LXC — Setup (TO DO)

Run these commands on Thamrin LXC (it shares `/mnt/shared`):

```bash
# 1. Pull latest (includes scripts/auto-update.sh + systemd unit templates)
cd /mnt/shared/digital-yearbook
git fetch origin main
git pull --ff-only origin main
chmod +x scripts/auto-update.sh

# 2. Create systemd user service
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/digital-yearbook-watcher.service <<'SERVICE'
[Unit]
Description=Digital Yearbook Auto-Update Watcher
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/bin/bash /mnt/shared/digital-yearbook/scripts/auto-update.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
SERVICE

# 3. Create systemd user timer (10-min)
cat > ~/.config/systemd/user/digital-yearbook-watcher.timer <<'TIMER'
[Unit]
Description=Check Digital Yearbook for updates every 10 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=10min
AccuracySec=1min
Unit=digital-yearbook-watcher.service

[Install]
WantedBy=timers.target
TIMER

# 4. Enable and start
systemctl --user daemon-reload
systemctl --user enable --now digital-yearbook-watcher.timer
systemctl --user list-timers digital-yearbook-watcher.timer

# 5. Verify first run
sleep 15
tail -20 /mnt/shared/digital-yearbook/cron/output/digital-yearbook-auto-update/auto-update.log
```

If Thamrin uses `docker-compose` (v1) instead of `docker compose` (v2), edit `scripts/auto-update.sh` to use the right binary or add a symlink: `sudo ln -s $(which docker-compose) /usr/local/bin/docker`

## Operational Rules

| Rule | Why |
|---|---|
| Always commit before pushing | Watcher skips when working tree is dirty — prevents half-applied deploys |
| One commit per fix | Matches team convention |
| Never `git pull` mid-edit | Race between your edit and watcher’s pull causes merge conflicts |
| Test on Hermes first | Deploy to Hermes, verify, then push → Thamrin auto-syncs within 10 min |
| Keep `.env` per-LXC | Only `IMMICH_URL/KEY` are shared; passwords/secrets differ |
| Rollback = `git revert HEAD` + push | Both LXCs roll back automatically within 10 min |
| Manual override | Run `./scripts/update.sh` or `docker compose up -d --force-recreate` for immediate rebuild |

## Conflict Prevention

- **Concurrent builds:** Both LXCs may build simultaneously when a push lands. Docker images are local to each LXC, so no conflict.
- **Shared `/mnt/shared` git dir:** Both LXCs share the same `.git`. If one is mid-`git pull`, the other’s `git fetch` is safe (read-only). Only `git pull` writes, and pulling is fast enough that collision risk is negligible. The watcher’s lockfile is per-LXC (`/tmp`), not shared — so both LXCs could pull concurrently. This is acceptable because:
  - `git pull --ff-only` is idempotent
  - If one pull finishes first, the second becomes a no-op ("already up to date")
- **DB volume:** Each LXC has its own Docker volume `pgdata` — no shared DB. Migrations run on each LXC’s DB at `up` time.

## Monitoring

Check watcher health on either LXC:
```bash
# Last 20 log lines
tail -20 /mnt/shared/digital-yearbook/cron/output/digital-yearbook-auto-update/auto-update.log

# Watcher status
systemctl --user status digital-yearbook-watcher.service
systemctl --user list-timers digital-yearbook-watcher.timer

# Container health
cd /mnt/shared/digital-yearbook && docker compose ps
curl -sf http://localhost:3001/ && echo "frontend OK"
curl -sf http://localhost:8081/health && echo "backend OK"
```

## Emergency Stop

If the watcher misbehaves on an LXC:
```bash
systemctl --user stop digital-yearbook-watcher.timer
systemctl --user disable digital-yearbook-watcher.timer
```


Test commit for watcher docs-only skip check.
