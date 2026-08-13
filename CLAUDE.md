# ViralAudit AI — Project Guide for Claude Code

Self-hosted content-analysis suite for a multi-platform streamer/creator. Analyzes short-form videos, live VODs, and thumbnails for retention, packaging, and technical quality — deliberately not an engagement-bait optimizer.

## Architecture

Two processes, one repo:

* **Backend** — `viral-audit-server.cjs`. Node/Express, CommonJS (`.cjs` on purpose, the project is otherwise ESM/Vite). Port 3015. PM2 name `viral-audit-server`. Handles transcription, frame extraction, VOD chat, and all the heavy ffmpeg/yt-dlp work.
* **Frontend** — `src/App.jsx`. React + Vite + Tailwind. Dev port 5173. PM2 name `viralai-dev`. Currently a single large component file.

Runs on a Windows host (LAN `192.168.6.228`).

## Run / restart

```
pm2 restart viral-audit-server   # after backend changes
pm2 restart viralai-dev          # if Vite HMR doesn't pick up a change
```

## External tools (must be installed on the host)

`ffmpeg`, `yt-dlp`, and TwitchDownloaderCLI (VOD chat replay). Loudness uses ffmpeg `ebur128`; silence/dead-air uses `silencedetect`.

## Services

* Groq Whisper (`whisper-large-v3-turbo`) — transcription.
* Groq Llama — semantic scoring and the Stream Coach report cards.
* Claude Vision — frame analysis + the CCO Review, called directly from the browser.

## Key endpoints

`/analyze` (upload), `/analyze-url` (yt-dlp), `/scan-vod` (clip finder), `/coach-vod` (Stream Coach), `/extract-clip`, `/vod-stream/:id`, `/content/*` (version history).

## Conventions & hard-won rules

* Shorts and long-form are analyzed separately. Never average them together.
* Normalize performance by video age (views-per-hour) before comparing.
* Music / singing niche uses an artistic-integrity prompt, not algorithm-hacking — branch on `niche === "music" || niche === "singing"`. Do not regress this.
* Live-clip and TikTok-Shop flags must flow into the AI prompts, not just the heuristics. The CCO Review recomputes at Analyze time so late-set toggles apply.
* Patch idempotency: historically edits were applied via repeated scripts; guard against duplicate insertions. (Git makes this mostly moot now.)
* Analysis limits: transcript input ~15k chars, holistic output ~4k tokens.

## Security (address before any public release)

* The Anthropic key is read from `VITE_ANTHROPIC_API_KEY`. Because it is a `VITE_` var, it is bundled into the client and visible to anyone using the app. Acceptable for a private LAN tool; not acceptable if this is ever exposed publicly.
* Proper fix: proxy all `api.anthropic.com` calls through the Express backend so the key never leaves the server. This is the #1 thing to do before productizing.
* Never commit `.env`. Rotate any key that has ever been hardcoded in source.

## Setup

1. `cp .env.example .env` and fill in values.
2. Backend: `node viral-audit-server.cjs` (or via PM2).
3. Frontend: `npm install && npm run dev`.
