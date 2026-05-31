# Google Cloud VM deploy + CI/CD

Prompt Clash runs as **one Node process** (Next.js + Socket.io, single RAM match,
single instance). All heavy work — image generation, scoring — is offloaded to
external APIs (Cloudflare / Gemini), Mongo lives on Atlas, images on GCS. So the
VM stays light at runtime; the only resource spike is the `next build` step.

## 1. Hardware / VM sizing

| Workload | Need |
|---|---|
| Runtime (1 match, ~dozens of phone sockets) | ~150–300 MB RAM, near-idle CPU |
| `next build` (in Docker, with `sharp`) | ~1.5–2 GB RAM, brief CPU burst |

**Recommended: `e2-small`** (2 shared vCPU, 2 GB) + **2 GB swap** (swap added by
`provision.sh` — it's what lets the 2 GB box finish the build). ~\$13/mo in
`europe-west1`. Boot disk **30 GB** (Docker images + build layers).

- Lighter: `e2-micro` (free tier, 1 GB) **won't build** — you'd need to switch the
  CI to build the image and push to Artifact Registry instead of building on the VM.
- Comfier: `e2-medium` (4 GB) builds without swap, ~\$27/mo.

### Create the VM

```bash
gcloud compute instances create prompt-clash \
  --zone=europe-west1-b \
  --machine-type=e2-small \
  --image-family=debian-12 --image-project=debian-cloud \
  --boot-disk-size=30GB \
  --tags=http-server,https-server

# Firewall (if the default rules aren't present):
gcloud compute firewall-rules create allow-http  --allow=tcp:80  --target-tags=http-server
gcloud compute firewall-rules create allow-https --allow=tcp:443 --target-tags=https-server
```

Point your domain's **A record** at the VM's external IP before running TLS setup.

## 2. One-time VM bootstrap

SSH in (`gcloud compute ssh prompt-clash --zone=europe-west1-b`) and run:

```bash
REPO_URL=https://github.com/<you>/prompt-clash.git \
DOMAIN=clash.example.com \
EMAIL=you@example.com \
bash <(curl -fsSL https://raw.githubusercontent.com/<you>/prompt-clash/main/deploy/provision.sh)
```

This installs Docker + Nginx, adds 2 GB swap, clones the repo to `/opt/prompt-clash`,
configures the Nginx reverse proxy (with WebSocket upgrade for Socket.io), and gets
a Let's Encrypt cert via certbot.

Then fill in real secrets:

```bash
nano /opt/prompt-clash/.env.production    # template was copied from deploy/env.production.example
```

First deploy by hand to confirm it works:

```bash
newgrp docker     # or log out/in so the docker group applies
APP_DIR=/opt/prompt-clash bash /opt/prompt-clash/deploy/deploy.sh
```

Open `https://clash.example.com` — phone, `/stage`, `/admin`.

## 3. CI/CD (GitHub Actions → VM)

`.github/workflows/deploy.yml` runs on every push to `main`:

1. **verify** — `npm ci` + `npm run typecheck` (gate; broken TS never deploys).
2. **deploy** — SSH into the VM and run `deploy/deploy.sh`, which:
   `git reset --hard origin/main` → `docker build` → swap the container → health-check.

The old container keeps serving until the new image finishes building, so downtime
is only the few-second stop/start swap.

### Required GitHub repo secrets

Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `VM_HOST` | VM external IP or domain |
| `VM_USER` | SSH user (the one that ran `provision.sh`, in the `docker` group) |
| `VM_SSH_KEY` | **Private** key whose public half is in the VM's `~/.ssh/authorized_keys` |
| `VM_SSH_PORT` | *(optional)* defaults to `22` |

Generate a dedicated deploy key:

```bash
ssh-keygen -t ed25519 -C "gha-deploy" -f gha_deploy -N ""
# Put gha_deploy.pub on the VM:
ssh-copy-id -i gha_deploy.pub <user>@<vm-ip>
# Paste the PRIVATE key (contents of gha_deploy) into the VM_SSH_KEY secret.
```

After that, every `git push origin main` builds and ships automatically. You can
also trigger it manually from the Actions tab (`workflow_dispatch`).

## 4. Operating notes

- **Logs:** `docker logs -f prompt-clash`
- **Restart:** `docker restart prompt-clash`
- **Manual redeploy:** re-run `deploy/deploy.sh` or click *Re-run* in Actions.
- **Env changes:** edit `/opt/prompt-clash/.env.production`, then run `deploy.sh`
  (the container is recreated with the new `--env-file`). Changing
  `NEXT_PUBLIC_APP_URL` also requires the rebuild that `deploy.sh` performs.
- **Uploads:** persisted at `/opt/prompt-clash/uploads` (mounted into the container).
  For multi-event durability prefer `STORAGE_PROVIDER=gcs`.
- **Cert renewal:** certbot installs a systemd timer; auto-renews. Test with
  `sudo certbot renew --dry-run`.
- **Cost control:** `gcloud compute instances stop prompt-clash` between events
  (you pay only for the disk while stopped).
