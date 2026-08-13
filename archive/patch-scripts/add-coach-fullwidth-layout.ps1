# add-coach-fullwidth-layout.ps1
# Makes Stream Coach mode use the full page width (single column) and hides the unused right panel + Thumbnail Studio while in coach mode.
$file = "D:\Coding\ViralAI\src\App.jsx"

if (-not (Test-Path $file)) { Write-Host "ERROR: File not found at $file" -ForegroundColor Red; exit 1 }
Copy-Item $file "$file.bak2" -Force
Write-Host "Backup written to $file.bak2" -ForegroundColor DarkGray

$content = [System.IO.File]::ReadAllText($file)
$content = $content.Replace("`r`n", "`n")

$gridOld = [System.Text.StringBuilder]::new()
[void]$gridOld.Append('      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">')
$gridOld = $gridOld.ToString()

$gridNew = [System.Text.StringBuilder]::new()
[void]$gridNew.Append('      <div className={`max-w-screen-xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 gap-6 ${inputMode === "coach" ? "" : "lg:grid-cols-[400px_1fr]"}`}>')
$gridNew = $gridNew.ToString()

$mainOld = [System.Text.StringBuilder]::new()
[void]$mainOld.Append('        <main className="space-y-5">')
$mainOld = $mainOld.ToString()

$mainNew = [System.Text.StringBuilder]::new()
[void]$mainNew.Append('        <main className={`space-y-5 ${inputMode === "coach" ? "hidden" : ""}`}>')
$mainNew = $mainNew.ToString()

$thumbOld = [System.Text.StringBuilder]::new()
[void]$thumbOld.Append('          <ThumbnailStudio frames={videoData?.frames || []} platform={platform} format={format} />')
$thumbOld = $thumbOld.ToString()

$thumbNew = [System.Text.StringBuilder]::new()
[void]$thumbNew.Append('          {inputMode !== "coach" && <ThumbnailStudio frames={videoData?.frames || []} platform={platform} format={format} />}')
$thumbNew = $thumbNew.ToString()

$marker = [System.Text.StringBuilder]::new()
[void]$marker.Append('inputMode === "coach" ? "" : "lg:grid-cols-[400px_1fr]"')
$marker = $marker.ToString()

if ($content.Contains($marker)) { Write-Host "Full-width coach layout already applied - nothing to do." -ForegroundColor Yellow; exit 0 }

if ($content.Contains($gridOld)) { $content = $content.Replace($gridOld, $gridNew); Write-Host "[1/3] Page grid goes full-width in coach mode" -ForegroundColor Green } else { Write-Host "[1/3] SKIP: grid anchor not found" -ForegroundColor Red }
if ($content.Contains($mainOld)) { $content = $content.Replace($mainOld, $mainNew); Write-Host "[2/3] Right dashboard hidden in coach mode" -ForegroundColor Green } else { Write-Host "[2/3] SKIP: main anchor not found" -ForegroundColor Red }
if ($content.Contains($thumbOld)) { $content = $content.Replace($thumbOld, $thumbNew); Write-Host "[3/3] Thumbnail Studio hidden in coach mode" -ForegroundColor Green } else { Write-Host "[3/3] SKIP: ThumbnailStudio anchor not found" -ForegroundColor Red }

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Host ""
Write-Host "Done. Vite should hot-reload. If not: pm2 restart viralai-dev" -ForegroundColor Cyan