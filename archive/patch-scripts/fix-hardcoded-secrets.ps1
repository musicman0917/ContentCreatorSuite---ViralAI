# fix-hardcoded-secrets.ps1
# Moves the hardcoded Anthropic key + backend URL in App.jsx into Vite env vars.
# RUN THIS BEFORE THE FIRST GIT COMMIT. Then put the real values in .env (gitignored).
# Also: ROTATE the old key at console.anthropic.com - it has been exposed in the browser bundle.
$file = "D:\Coding\ViralAI\src\App.jsx"

if (-not (Test-Path $file)) { Write-Host "ERROR: File not found at $file" -ForegroundColor Red; exit 1 }
Copy-Item $file "$file.secretbak" -Force
Write-Host "Backup written to $file.secretbak (this backup STILL contains the key - delete it after verifying, and do not commit it)" -ForegroundColor DarkGray

$content = [System.IO.File]::ReadAllText($file)
$content = $content.Replace("`r`n", "`n")

if ($content.Contains("import.meta.env.VITE_ANTHROPIC_API_KEY")) { Write-Host "Secrets already externalized - nothing to do." -ForegroundColor Yellow; exit 0 }

$before = $content
# Replace the whole line regardless of the key value, so the secret is never in this script
$content = [regex]::Replace($content, 'const ANTHROPIC_API_KEY = "[^"]*";', 'const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";')
$content = [regex]::Replace($content, 'const BACKEND_URL = "[^"]*";', 'const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://192.168.6.228:3015";')

$keyDone = $content.Contains("VITE_ANTHROPIC_API_KEY")
$urlDone = $content.Contains("VITE_BACKEND_URL")
if ($keyDone) { Write-Host "[1/2] Anthropic key moved to VITE_ANTHROPIC_API_KEY" -ForegroundColor Green } else { Write-Host "[1/2] SKIP: ANTHROPIC_API_KEY line not matched" -ForegroundColor Red }
if ($urlDone) { Write-Host "[2/2] Backend URL moved to VITE_BACKEND_URL (with LAN fallback)" -ForegroundColor Green } else { Write-Host "[2/2] SKIP: BACKEND_URL line not matched" -ForegroundColor Red }

if ($content -eq $before) { Write-Host "No changes made - nothing written." -ForegroundColor Red; exit 1 }

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Host ""
Write-Host "Done. Now:" -ForegroundColor Cyan
Write-Host "  1. Put VITE_ANTHROPIC_API_KEY (your NEW rotated key) and VITE_BACKEND_URL in .env" -ForegroundColor Cyan
Write-Host "  2. pm2 restart viralai-dev" -ForegroundColor Cyan
Write-Host "  3. Delete $file.secretbak once the app works (it still has the old key)" -ForegroundColor Cyan