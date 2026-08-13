# fix-analysis-truncation.ps1
# Fixes two truncation bugs in the video audit:
#  1. OUTPUT was capped at 600 tokens, cutting the CCO review off mid-sentence.
#  2. INPUT transcript was capped at 1000 characters, so the model saw a truncated
#     transcript and penalised the VIDEO for "cutting off mid-sentence".
$file = "D:\Coding\ViralAI\src\App.jsx"

if (-not (Test-Path $file)) { Write-Host "ERROR: File not found at $file" -ForegroundColor Red; exit 1 }
Copy-Item $file "$file.truncbak" -Force
Write-Host "Backup written to $file.truncbak" -ForegroundColor DarkGray

$content = [System.IO.File]::ReadAllText($file)
$content = $content.Replace("`r`n", "`n")

$o0 = [System.Text.StringBuilder]::new()
[void]$o0.Append('    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 600,')
[void]$o0.Append("`n")
[void]$o0.Append('      messages: [{ role: "user", content: `You are the Chief Creative Officer')
$o0 = $o0.ToString()

$n0 = [System.Text.StringBuilder]::new()
[void]$n0.Append('    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 4000,')
[void]$n0.Append("`n")
[void]$n0.Append('      messages: [{ role: "user", content: `You are the Chief Creative Officer')
$n0 = $n0.ToString()

$o1 = [System.Text.StringBuilder]::new()
[void]$o1.Append('  const frameContext = frameSummaries.slice(0, 4).map((f, i) => `Frame at ${f.label}: ${f.analysis?.slice(0, 120) || "no analysis"}`).join("\n");')
$o1 = $o1.ToString()

$n1 = [System.Text.StringBuilder]::new()
[void]$n1.Append('  const frameContext = frameSummaries.slice(0, 8).map((f, i) => `Frame at ${f.label}: ${f.analysis?.slice(0, 400) || "no analysis"}`).join("\n");')
[void]$n1.Append("`n")
[void]$n1.Append('  const TRANSCRIPT_LIMIT = 15000;')
[void]$n1.Append("`n")
[void]$n1.Append('  const transcriptTruncated = String(transcript || "").length > TRANSCRIPT_LIMIT;')
[void]$n1.Append("`n")
[void]$n1.Append('  const transcriptForPrompt = String(transcript || "").slice(0, TRANSCRIPT_LIMIT) + (transcriptTruncated ? "\n\n[SYSTEM NOTE: the transcript above was cut off here by the analysis tool to fit the request. This is a limitation of OUR pipeline, not a flaw in the video. Do NOT treat this cutoff as a missing payoff, an unfinished ending, a buried conclusion, or any kind of structural problem, and do not penalise the creator for it. Judge only the content you can actually see.]" : "");')
$n1 = $n1.ToString()

$o2 = [System.Text.StringBuilder]::new()
[void]$o2.Append('${transcript.slice(0, 1000)}')
$o2 = $o2.ToString()

$n2 = [System.Text.StringBuilder]::new()
[void]$n2.Append('${transcriptForPrompt}')
$n2 = $n2.ToString()

$o3 = [System.Text.StringBuilder]::new()
[void]$o3.Append('    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 400,')
[void]$o3.Append("`n")
[void]$o3.Append('      messages: [{ role: "user", content: `You are the Head of Creative Strategy')
$o3 = $o3.ToString()

$n3 = [System.Text.StringBuilder]::new()
[void]$n3.Append('    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 900,')
[void]$n3.Append("`n")
[void]$n3.Append('      messages: [{ role: "user", content: `You are the Head of Creative Strategy')
$n3 = $n3.ToString()

$o4 = [System.Text.StringBuilder]::new()
[void]$o4.Append('    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 200,')
$o4 = $o4.ToString()

$n4 = [System.Text.StringBuilder]::new()
[void]$n4.Append('    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 500,')
$n4 = $n4.ToString()

if ($content.Contains("transcriptForPrompt")) { Write-Host "Truncation fix already applied - nothing to do." -ForegroundColor Yellow; exit 0 }

$fail = 0
if ($content.Contains(${o0})) { $content = $content.Replace(${o0}, ${n0}); Write-Host "[1/5] holistic output limit 600 -> 4000" -ForegroundColor Green } else { $fail++; Write-Host "[1/5] SKIP: holistic output limit 600 -> 4000 anchor not found" -ForegroundColor Red }
if ($content.Contains(${o1})) { $content = $content.Replace(${o1}, ${n1}); Write-Host "[2/5] transcript input 1000 chars -> 15000 + no-penalty note" -ForegroundColor Green } else { $fail++; Write-Host "[2/5] SKIP: transcript input 1000 chars -> 15000 + no-penalty note anchor not found" -ForegroundColor Red }
if ($content.Contains(${o2})) { $content = $content.Replace(${o2}, ${n2}); Write-Host "[3/5] use full transcript in prompt" -ForegroundColor Green } else { $fail++; Write-Host "[3/5] SKIP: use full transcript in prompt anchor not found" -ForegroundColor Red }
if ($content.Contains(${o3})) { $content = $content.Replace(${o3}, ${n3}); Write-Host "[4/5] hook gen 400 -> 900" -ForegroundColor Green } else { $fail++; Write-Host "[4/5] SKIP: hook gen 400 -> 900 anchor not found" -ForegroundColor Red }
if ($content.Contains(${o4})) { $content = $content.Replace(${o4}, ${n4}); Write-Host "[5/5] frame analysis 200 -> 500" -ForegroundColor Green } else { $fail++; Write-Host "[5/5] SKIP: frame analysis 200 -> 500 anchor not found" -ForegroundColor Red }

if ($fail -gt 0) { Write-Host ""; Write-Host "$fail patch(es) failed - NOT writing file." -ForegroundColor Red; exit 1 }

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Host ""
Write-Host "Done. Vite should hot-reload. If not: pm2 restart viralai-dev" -ForegroundColor Cyan