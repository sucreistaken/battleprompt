#!/usr/bin/env bash
# Runs ON THE VM. Triggered by GitHub Actions over SSH on every push to main.
# Pulls latest main, rebuilds the image, and recreates the stack via compose.
# Mongo + app are managed by docker-compose.yml; the old containers keep
# serving until the new image is built, so downtime is just the recreate swap.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/prompt-clash}"
ENV_FILE="$APP_DIR/.env.production"

cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "!! $ENV_FILE missing. Create it from deploy/env.production.example first."
  exit 1
fi

echo "==> Fetching latest main"
git fetch --depth 1 origin main
git reset --hard origin/main

# NEXT_PUBLIC_* is baked at build time -> expose it for the compose build arg.
export NEXT_PUBLIC_APP_URL="$(grep -E '^NEXT_PUBLIC_APP_URL=' "$ENV_FILE" | cut -d= -f2- || true)"

echo "==> Build + recreate"
docker compose up -d --build

echo "==> Waiting for health"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:3000/" >/dev/null 2>&1; then
    echo "==> Healthy after ${i}s"
    docker image prune -f >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 1
done

echo "!! Health check failed — last 50 app log lines:"
docker compose logs --tail 50 app || true
exit 1
