# fix-cco-review-stale-toggles.ps1
# The CCO Review (holistic analysis) was generated once at UPLOAD time, so any
# toggle set afterwards (Livestream Clip, TikTok Shop) or niche correction was
# ignored by it. This recomputes the review when you click Analyze, using current state.
# NOTE: for the Live-clip / Shop CONTENT to change, add-mode-aware-ai.ps1 must also be applied
# (that patch is what teaches analyzeVideoHolistically to use those two flags).
$file = "D:\Coding\ViralAI\src\App.jsx"

if (-not (Test-Path $file)) { Write-Host "ERROR: File not found at $file" -ForegroundColor Red; exit 1 }
Copy-Item $file "$file.rerunbak" -Force
Write-Host "Backup written to $file.rerunbak" -ForegroundColor DarkGray

$content = [System.IO.File]::ReadAllText($file)
$content = $content.Replace("`r`n", "`n")

$old = [System.Text.StringBuilder]::new()
[void]$old.Append('      const r = analyzeScript(script, platform, format, niche, isTikTokShop, isLiveClip);')
$old = $old.ToString()

$new = [System.Text.StringBuilder]::new()
[void]$new.Append('      const r = analyzeScript(script, platform, format, niche, isTikTokShop, isLiveClip);')
[void]$new.Append("`n")
[void]$new.Append('      // Recompute the CCO Review with CURRENT toggle/niche state — it was first')
[void]$new.Append("`n")
[void]$new.Append('      // generated at upload time, before Shop / Live-clip / niche may have been set.')
[void]$new.Append("`n")
[void]$new.Append('      if (videoData?.transcript) {')
[void]$new.Append("`n")
[void]$new.Append('        try {')
[void]$new.Append("`n")
[void]$new.Append('          const freshReview = await analyzeVideoHolistically(')
[void]$new.Append("`n")
[void]$new.Append('            videoData.transcript,')
[void]$new.Append("`n")
[void]$new.Append('            videoData.frames || [],')
[void]$new.Append("`n")
[void]$new.Append('            platform,')
[void]$new.Append("`n")
[void]$new.Append('            niche,')
[void]$new.Append("`n")
[void]$new.Append('            videoData.duration || 0,')
[void]$new.Append("`n")
[void]$new.Append('            isTikTokShop,')
[void]$new.Append("`n")
[void]$new.Append('            isLiveClip')
[void]$new.Append("`n")
[void]$new.Append('          );')
[void]$new.Append("`n")
[void]$new.Append('          if (freshReview) setVideoData(prev => ({ ...prev, holisticAnalysis: freshReview }));')
[void]$new.Append("`n")
[void]$new.Append('        } catch (e) { console.warn("CCO Review re-run failed:", e.message); }')
[void]$new.Append("`n")
[void]$new.Append('      }')
$new = $new.ToString()

if ($content.Contains("CCO Review re-run failed")) { Write-Host "Re-run fix already applied - nothing to do." -ForegroundColor Yellow; exit 0 }

if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
  Write-Host "[1/1] CCO Review now recomputes on Analyze with current toggles" -ForegroundColor Green
} else {
  Write-Host "[1/1] SKIP: analyzeScript call anchor not found - nothing written" -ForegroundColor Red
  exit 1
}

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Host ""
Write-Host "Done. Vite should hot-reload. If not: pm2 restart viralai-dev" -ForegroundColor Cyan