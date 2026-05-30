# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

**Prompt Clash** — QR-join 1v1 AI image-generation party game for live events. Three surfaces share one Node process:

| Route | Surface |
|---|---|
| `/` | Mobile join + spectator + player view (`MobileShell` routes by phase + role) |
| `/stage` | Big-screen broadcast at fixed 1920×1080, scaled to fit any projector (`StageShell`) |
| `/admin` | Operator panel (settings, force-skip, history) |

## Commands

```bash
npm run dev        # custom node server.js (Next + Socket.io on same port)
npm run build      # next build
npm start          # NODE_ENV=production node server.js
npm run typecheck  # tsc --noEmit (no separate frontend/backend split)
npm run lint       # next lint

# End-to-end smoke (server must be running):
node scripts/matchSmoke.js              # simulates 2 players, asserts winner
node scripts/demo-match.js              # keeps fake players connected for screenshots
```

Dev-time UI inspection without a live socket (uses `app/preview/mock.ts` fixtures, no AI calls):

```
/preview/stage?phase=IDLE|VS_INTRO|PROMPTING|GENERATING|SCORING|VOTING|RESULT
/preview/phone?phase=...&slot=A|B            # omit slot for audience view
/preview/stage?...&theme=light               # dark default, light optional
```

`/demo` auto-cycles every phase end-to-end.

## High-level architecture

### One process, one match, no rooms

- `server.js` hosts Next.js (App Router) AND Socket.io on the same port. Backend runtime is plain JS (`.js`) so it can `require()` without a transpile step; frontend is TS/TSX.
- The match is a **global RAM singleton** in `lib/game/state.js`. There are no rooms; every socket event broadcasts to everyone and the **client filters by role** (player / audience / stage / admin). Role is given in socket auth at connect time. The state snapshot is already role-safe before broadcast.
- This is intentional: the app is meant to deploy as **one Cloud Run instance** (`--min-instances=1 --max-instances=1 --session-affinity --cpu-throttling=disabled`). Don't introduce multi-instance state without rebuilding the assumption.

### Phase lifecycle is the source of truth

`lib/game/state.js` exports a frozen `PHASES` enum and the singleton `state`. **All phase transitions go through `lib/game/matchLifecycle.js`** — every transition ends with `broadcastState()`. Phases:

```
IDLE → PLAYER_1_JOINED → VS_INTRO → PROMPTING → GENERATING → SCORING
     → (VOTING | TIEBREAK_VOTE) → RESULT → IDLE
```

Per round, image generation runs **3+ times**: 1 target reference + 2 player outputs, plus a **prefetched next-round target** (`nextReferenceImageUrl`). This matters for provider quota planning.

`bumpOperationEpoch()` / `isCurrentEpoch()` guards async results: when a match is reset or skipped mid-flight, in-flight `generateImage` / scoring promises check the epoch on resolve and drop themselves if stale. Always preserve this when adding new async work in lifecycle.

### Provider switchers (env-driven)

Two thin selectors pick implementations at require-time from env:

- `lib/image.js` → `IMAGE_PROVIDER=cloudflare | pollinations | gemini` (Cloudflare flux-1-schnell is the cheapest reliable; Pollinations is keyless/free but 402s on bursts).
- `lib/storage.js` → `STORAGE_PROVIDER=local | gcs` (local writes to `public/uploads/`, accessed via `/uploads/...`).

When adding a new provider, mirror the existing module shape (`module.exports = { generateImage }` or `{ uploadBuffer }`) and register the switch case.

`DEMO_MODE=1` bypasses real image generation and AI scoring with placeholder fixtures — use it to test UI/flow without burning quota.

### Stage rendering: fixed canvas + smart scaler

`components/stage/atmosphere.tsx` defines the design system: palette via CSS vars (`--pc-*` in `styles/globals.css`, dark default + light via `data-pc-theme` on `<html>` — `useStageTheme()` syncs it from server state), three font stacks (Silkscreen pixel, Inter Tight body, JetBrains Mono), and **`STAGE_W = 1920`, `STAGE_H = 1080`**.

Every stage phase board is built as a fixed 1920×1080 absolute layout. `StageScaler` `transform: scale()`s the whole board to fit the viewport. The scaler **refits on any viewport change** — `resize`, `visualViewport` resize/scroll, `orientationchange`, and the host element's `ResizeObserver`. Browser zoom (Ctrl+/-) is treated the same as a resize — the board grows/shrinks to match the new CSS viewport, which is the expected behavior on phones, tablets and projector windows. Don't reintroduce DPR-based zoom suppression or a path-based "preview only" branch.

`StageGenerating` is shared between GENERATING and SCORING phases via a `scoringMode` prop (true = images filled, false = render portal). Do not split it.

### Mobile / audience views

`MobileShell` routes by `mySlot` (player) vs no slot (audience). `AudienceView` is mobile-first (single column) but responsive at `md:` (side-by-side cards). All client views share `atmosphere.tsx`'s `C`/`FONT` so phone and stage stay visually coherent.

### Sockets

`lib/socket/server.js` has one namespace, no rooms. Events are rate-limited per `(ip, event)` + `(deviceId, event)` via `lib/rateLimit.js`. The admin role is identified by a signed cookie (`lib/adminAuth.js`) read off the handshake. Device identity persists via `pc_device_id` cookie (used to reattach players across reconnects).

### MongoDB

`lib/db.js` connects on boot but the app degrades gracefully if Mongo is down: `validateEnv` only warns in dev, the settings loader falls back to defaults, and matches just don't persist. **Don't add hard Mongo dependencies in hot paths.** Models live in `models/` (`Match.js`, `Settings.js`, `Vote.js`).

### i18n

`i18n/dict.ts` has flat TR + EN dictionaries, accessed via `useI18n().t(key)`. When adding a key, **add it to both `tr` and `en` blocks** in the same edit. Stage uses TR by default; preview pages force TR (`forceLang="tr"`).

## Working in this repo

- **Brand & SEO assets**: master logo `public/logo.svg` (full lockup), `public/logo-mark.svg` (axolotl only), `public/logo-wordmark.svg` (wordmark only). PNG/ICO assets generated by `scripts/build-icons.js` (run after logo SVG changes; needs `sharp` + `png-to-ico`). Next.js metadata file convention: `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.png`, `app/twitter-image.png` are auto-served. SEO routes: `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`. Per-page metadata is in route's server component (`page.tsx`), `*PageClient.tsx` holds the `'use client'` body. Brand brief: `mockups/brand-design.md`.
- After backend (`lib/`, `server.js`, `models/`) changes, the dev server **must be restarted** — Next's HMR only watches the Next side.
- After changing `.env`, restart the dev server (env is loaded at boot via `@next/env`).
- When stopping a dev server in this codebase, prefer stopping the npm parent task — orphaned child `node` may hold port 3000; on Windows, kill by PID via PowerShell `Stop-Process -Id <pid> -Force`.
- Use `npm run typecheck` to verify after edits — there is no separate test suite for the frontend; `scripts/matchSmoke.js` is the closest thing to an integration test and requires a running server.
- The `mockups/` directory holds standalone HTML mockups used as design-spec artifacts. They are not built by Next; serve via `python -m http.server` from inside `mockups/` if you need to view them.
- `public/uploads/` is the local STORAGE_PROVIDER target — generated images land here in dev; gitignored aside from the directory marker.
- Cloud Run deploy is single-instance with session affinity and CPU throttling **disabled** (sockets need a hot CPU). See README for the exact `gcloud run deploy` flags.
