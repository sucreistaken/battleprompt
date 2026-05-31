#!/usr/bin/env bash
# One-time VM bootstrap for prompt-clash on a fresh Debian/Ubuntu GCE instance.
# Run once as a sudo-capable user. Idempotent where practical.
#
#   REPO_URL=https://github.com/<you>/prompt-clash.git \
#   DOMAIN=clash.example.com \
#   EMAIL=you@example.com \
#   bash provision.sh
set -euo pipefail

APP_DIR="/opt/prompt-clash"
REPO_URL="${REPO_URL:?set REPO_URL=https://github.com/<you>/prompt-clash.git}"
DOMAIN="${DOMAIN:?set DOMAIN=clash.example.com}"
EMAIL="${EMAIL:?set EMAIL=you@example.com for the Lets Encrypt cert}"

echo "==> 1/6 Swap (2GB) — next build needs >1.5GB and a 2GB VM doesn't have it"
if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "==> 2/6 Base packages + Docker + Nginx"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl git nginx
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
fi
# Let the deploy user run docker without sudo (GitHub Actions SSH needs this).
sudo usermod -aG docker "$USER"

echo "==> 3/6 Clone repo"
sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi
mkdir -p "$APP_DIR/uploads"

echo "==> 4/6 .env.production"
if [ ! -f "$APP_DIR/.env.production" ]; then
  cp "$APP_DIR/deploy/env.production.example" "$APP_DIR/.env.production"
  echo "   -> EDIT $APP_DIR/.env.production with real secrets before deploying."
fi

echo "==> 5/6 Nginx reverse proxy"
sudo cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/prompt-clash
sudo sed -i "s/__DOMAIN__/$DOMAIN/g" /etc/nginx/sites-available/prompt-clash
sudo ln -sf /etc/nginx/sites-available/prompt-clash /etc/nginx/sites-enabled/prompt-clash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo "==> 6/6 TLS via certbot (needs DNS A record for $DOMAIN -> this VM, ports 80/443 open)"
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

cat <<EOF

Done. Next steps:
  1) Log out and back in (or 'newgrp docker') so the docker group applies.
  2) Make sure $APP_DIR/.env.production has real secrets.
  3) First deploy:  APP_DIR=$APP_DIR bash $APP_DIR/deploy/deploy.sh
  4) Add the GitHub secrets (VM_HOST, VM_USER, VM_SSH_KEY) — see docs/DEPLOY-VM.md.
EOF

