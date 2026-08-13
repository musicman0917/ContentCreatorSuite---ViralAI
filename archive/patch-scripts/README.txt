ViralAudit AI — generated files
================================

REPO SETUP (drop into D:\Coding\ViralAI\, then migrate to Claude Code)
  fix-hardcoded-secrets.ps1   Run FIRST. Pulls the Anthropic key + backend URL
                              out of App.jsx into Vite env vars. ROTATE the key
                              afterward — it was exposed in the browser bundle.
  .gitignore                  Excludes .env, node_modules, *.bak backups, media.
  .env.example                Template — copy to .env and fill in (never commit .env).
  CLAUDE.md                   Project guide Claude Code reads for context.

FEATURE PATCHES — recommended apply order
(each is idempotent: re-running says "already applied" and does nothing)

  1.  add-coach-verdict-server.ps1        Head Coach's Verdict (Stream Coach)
      add-coach-verdict-frontend.ps1
  2.  add-coach-fullwidth-layout.ps1      Full-width coach report
  3.  add-chat-correlation-server.ps1     Twitch VOD chat correlation
      add-chat-correlation-frontend.ps1   (needs TwitchDownloaderCLI installed)
  4.  add-category-awareness-server.ps1   Per-category grading + chapters
      add-category-awareness-frontend.ps1
  5.  add-technical-audit-server.ps1      Multi-signal technical issue audit
      add-technical-audit-frontend.ps1    (chat patch first for viewer-report signal)
  6.  add-mode-aware-ai.ps1               TikTok Shop / Livestream Clip -> AI prompts
  7.  add-version-history-server.ps1      Re-upload comparison + progress review
      add-version-history-frontend.ps1
  8.  add-music-integrity-prompts.ps1     Artistic-integrity music/singing prompts

FIXES (apply after the features above)
  fix-duplicate-cco-review.ps1     Removes duplicated CCO Review blocks
  fix-analysis-truncation.ps1      Raises output cap + full transcript to the model
  fix-cco-review-stale-toggles.ps1 CCO Review recomputes on Analyze (needs mode-aware)

NOTES
- server patches   -> viral-audit-server.cjs, then: pm2 restart viral-audit-server
- frontend patches -> src\App.jsx, Vite hot-reloads (else: pm2 restart viralai-dev)
- every script backs up its target before writing and reports each step green/red.
- Once you're on Claude Code + git, these one-time patch scripts can be archived.
