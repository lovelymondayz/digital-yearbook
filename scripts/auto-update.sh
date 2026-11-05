#!/bin/bash
# Auto-update watcher for digital-yearbook
# Checks git for new commits and rebuilds Docker if needed
# Designed to run every 10 minutes via systemd timer
#
# NOTE: /mnt/shared is shared between LXCs, so the .git directory is shared too.
# That means another LXC's `git pull` updates *this* LXC's local HEAD silently.
# Comparing local HEAD vs remote therefore misses updates (this LXC would think
# it is "up to date" even though its Docker image is stale).
#
# Fix: track the commit this LXC has actually deployed in a per-LXC marker file
# (/tmp/digital-yearbook-deployed). Rebuild whenever remote != deployed.

set -euo pipefail

PROJECT_DIR="/mnt/shared/digital-yearbook"
LOCKFILE="/tmp/digital-yearbook-watcher.lock"
LOG_DIR="$PROJECT_DIR/cron/output/digital-yearbook-auto-update"
LOG_FILE="$LOG_DIR/auto-update.log"
MAX_LOCK_AGE=600  # 10 minutes — force unlock if stale
GIT_REMOTE="origin"
GIT_BRANCH="main"
DEPLOYED_FILE="/tmp/digital-yearbook-deployed"

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

REMOTE=$(git rev-parse "refs/remotes/$GIT_REMOTE/$GIT_BRANCH" 2>/dev/null || echo "")
DEPLOYED=""
[ -f "$DEPLOYED_FILE" ] && DEPLOYED=$(cat "$DEPLOYED_FILE" 2>/dev/null || echo "")

if [ -z "$REMOTE" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: failed to read git refs" >> "$LOG_FILE"
  exit 1
fi

# If this LXC already deployed the latest remote commit, nothing to do.
if [ -n "$DEPLOYED" ] && [ "$DEPLOYED" = "$REMOTE" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') OK: deployed ($DEPLOYED)" >> "$LOG_FILE"
  exit 0
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') UPDATE: deployed=${DEPLOYED:-none} -> $REMOTE" >> "$LOG_FILE"

# Only rebuild if Docker-relevant files changed since this LXC last deployed.
# On the first run (no marker) we rebuild unconditionally.
NEEDS_REBUILD=true
if [ -n "$DEPLOYED" ]; then
  if CHANGED=$(git diff --name-only "$DEPLOYED" "$REMOTE" 2>/dev/null); then
    if ! echo "$CHANGED" | grep -qE '^(frontend/|backend/|docker-compose\.yml|Dockerfile)'; then
      NEEDS_REBUILD=false
    fi
  fi
fi

if [ "$NEEDS_REBUILD" = false ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') SKIP: no Docker-relevant files changed" >> "$LOG_FILE"
  # Still pull so docs/scripts stay current
  git pull --ff-only "$GIT_REMOTE" "$GIT_BRANCH" >> "$LOG_FILE" 2>&1 || {
    echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: git pull failed" >> "$LOG_FILE"
    exit 1
  }
  echo "$REMOTE" > "$DEPLOYED_FILE"
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
  # Only mark as deployed after a healthy deploy, so failures retry next run.
  echo "$REMOTE" > "$DEPLOYED_FILE"
  echo "$(date '+%Y-%m-%d %H:%M:%S') INFO: pruning Docker cache..." >> "$LOG_FILE"
  docker image prune -f >> "$LOG_FILE" 2>&1 || true
  docker builder prune -f >> "$LOG_FILE" 2>&1 || true
  echo "$(date '+%Y-%m-%d %H:%M:%S') SUCCESS: update deployed and healthy, cache pruned" >> "$LOG_FILE"
else
  echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: health check failed (frontend=$FRONTEND_OK backend=$BACKEND_OK)" >> "$LOG_FILE"
  exit 1
fi
