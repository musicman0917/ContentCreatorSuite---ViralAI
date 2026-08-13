# fix-duplicate-cco-review.ps1
# Removes duplicated "Full Video Analysis" (CCO Review) blocks from the audit results.
# The original block, commented "Holistic Video Analysis", is preserved.
$file = "D:\Coding\ViralAI\src\App.jsx"

if (-not (Test-Path $file)) { Write-Host "ERROR: File not found at $file" -ForegroundColor Red; exit 1 }
Copy-Item $file "$file.dupbak" -Force
Write-Host "Backup written to $file.dupbak" -ForegroundColor DarkGray

$content = [System.IO.File]::ReadAllText($file)
$content = $content.Replace("`r`n", "`n")

$dup = [System.Text.StringBuilder]::new()
[void]$dup.Append('              {/* Full Video Analysis */}')
[void]$dup.Append("`n")
[void]$dup.Append('              {videoData?.holisticAnalysis && (')
[void]$dup.Append("`n")
[void]$dup.Append('                <div className={`fade-up ${animIn ? "in d2" : ""} rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3`}>')
[void]$dup.Append("`n")
[void]$dup.Append('                  <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">')
[void]$dup.Append("`n")
[void]$dup.Append('                    <Cpu size={14} className="text-amber-400"/>Full Video Analysis')
[void]$dup.Append("`n")
[void]$dup.Append('                    <Tag variant="warning">CCO Review</Tag>')
[void]$dup.Append("`n")
[void]$dup.Append('                  </h3>')
[void]$dup.Append("`n")
[void]$dup.Append('                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{videoData.holisticAnalysis}</p>')
[void]$dup.Append("`n")
[void]$dup.Append('                </div>')
[void]$dup.Append("`n")
[void]$dup.Append('              )}')
$dup = $dup.ToString()
$dup = $dup + "`n"

$marker = "{videoData?.holisticAnalysis && ("
$before = ([regex]::Matches($content, [regex]::Escape($marker))).Count
Write-Host "CCO Review blocks found: $before" -ForegroundColor Cyan

if ($before -le 1) { Write-Host "No duplicates present - nothing to do." -ForegroundColor Yellow; exit 0 }

$removed = 0
while ($content.Contains($dup)) {
  $idx = $content.IndexOf($dup)
  $content = $content.Remove($idx, $dup.Length)
  $removed++
  if ($removed -gt 20) { Write-Host "Aborting: removal loop exceeded 20 iterations." -ForegroundColor Red; exit 1 }
}

$after = ([regex]::Matches($content, [regex]::Escape($marker))).Count
Write-Host "Removed $removed duplicate block(s). Remaining: $after" -ForegroundColor Green

if ($after -lt 1) {
  Write-Host "SAFETY STOP: that would leave zero CCO Review blocks. Nothing written - your file is untouched." -ForegroundColor Red
  exit 1
}
if ($after -gt 1) {
  Write-Host "NOTE: $after blocks still remain - some copies differ in whitespace. Send me the file region and I will widen the match." -ForegroundColor Yellow
}

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Host ""
Write-Host "Done. Vite should hot-reload. If not: pm2 restart viralai-dev" -ForegroundColor Cyan