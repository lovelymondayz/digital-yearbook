#!/bin/bash
# Auto-update watcher for digital-yearbook
# Checks git for new commits and rebuilds Docker if needed
# Designed to run every 10 minutes via systemd timer

set -euo pipefail

PROJECT_DIR="/mnt/shared/digital-yearbook"
LOCKFILE="/tmp/digital-yearbook-watcher.lock"
LOG_DIR="$PROJECT_DIR/cron/output/digital-yearbook-auto-update"
LOG_FILE="$LOG_DIR/auto-update.log"
MAX_LOCK_AGE=600  # 10 minutes — force unlock if stale
GIT_REMOTE="origin"
GIT_BRANCH="main"

mkdir -p "$LOG_DIR"

# Acquire lock
if [ -f "$LOCKFILE" ]; then
  lock_age=$(( $(date +%s) - $(stat -c %Y "$LOCKFILE") ))
  if [ "$lock_age" -lt "$MAX_LOCK_AGE" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') SKIP: previous run still active (${lock_age}s old)" >> "$LOG_FILE"
    exit 0
  else
    echo "$(date '+%Y-%m-%d %H:%M:%S') WARN: removing stale lock (${lock_age}s old)" >> "$LOG_FILE"
    rm -f "$LOCKFILE"
  fi
fi
echo $$ > "$LOCKFILE"
trap 'rm -f "$LOCKFILE"' EXIT

cd "$PROJECT_DIR"

# Ensure we have a clean working tree
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') WARN: uncommitted changes in working tree, skipping" >> "$LOG_FILE"
  exit 0
fi

# Fetch latest
git fetch "$GIT_REMOTE" "$GIT_BRANCH" 2>&1 | tail -1 >> "$LOG_FILE" || true

LOCAL=$(git rev-parse "refs/heads/$GIT_BRANCH" 2>/dev/null || echo "")
REMOTE=$(git rev-parse "refs/remotes/$GIT_REMOTE/$GIT_BRANCH" 2>/dev/null || echo "")

if [ -z "$LOCAL" ] || [ -z "$REMOTE" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: failed to read git refs" >> "$LOG_FILE"
  exit 1
fi

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') OK: up to date ($LOCAL)" >> "$LOG_FILE"
  exit 0
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') UPDATE: $LOCAL -> $REMOTE" >> "$LOG_FILE"

# Only rebuild if Docker-relevant files changed
CHANGED=$(git diff --name-only "$LOCAL" "$REMOTE" 2>/dev/null || echo "")
if ! echo "$CHANGED" | grep -qE '^(frontend/|backend/|docker-compose\.yml|Dockerfile|backend/Dockerfile|frontend/Dockerfile)'; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') SKIP: no Docker-relevant files changed" >> "$LOG_FILE"
  # Still pull so docs/scripts stay current
  git pull --ff-only "$GIT_REMOTE" "$GIT_BRANCH" >> "$LOG_FILE" 2>&1 || {
    echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: git pull failed" >> "$LOG_FILE"
    exit 1
  }
  echo "$(date '+%Y-%m-%d %H:%M:%S') OK: pulled docs/scripts only, no rebuild needed" >> "$LOG_FILE"
  exit 0
fi

# Pull
git pull --ff-only "$GIT_REMOTE" "$GIT_BRANCH" >> "$LOG_FILE" 2>&1 || {
  echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: git pull failed" >> "$LOG_FILE"
  exit 1
}

# Build
docker compose build --no-cache >> "$LOG_FILE" 2>&1 || {
  echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: docker build failed" >> "$LOG_FILE"
  exit 1
}

# Recreate
docker compose up -d --force-recreate >> "$LOG_FILE" 2>&1 || {
  echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: docker recreate failed" >> "$LOG_FILE"
  exit 1
}

# Wait for services
sleep 10

# Verify
FRONTEND_OK=false
BACKEND_OK=false

if curl -sf http://localhost:3001/ > /dev/null 2>&1; then
  FRONTEND_OK=true
fi

if curl -sf http://localhost:8081/health > /dev/null 2>&1; then
  BACKEND_OK=true
fi

if [ "$FRONTEND_OK" = true ] && [ "$BACKEND_OK" = true ]; then
  # Clean up dangling images and build cache
  echo "$(date '+%Y-%m-%d %H:%M:%S') INFO: pruning Docker cache..." >> "$LOG_FILE"
  docker image prune -f >> "$LOG_FILE" 2>&1 || true
  docker builder prune -f >> "$LOG_FILE" 2>&1 || true
  echo "$(date '+%Y-%m-%d %H:%M:%S') SUCCESS: update deployed and healthy, cache pruned" >> "$LOG_FILE"
else
  echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: health check failed (frontend=$FRONTEND_OK backend=$BACKEND_OK)" >> "$LOG_FILE"
  exit 1
fi
