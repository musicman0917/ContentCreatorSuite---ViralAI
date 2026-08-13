# add-category-awareness-frontend.ps1
# Adds a category override field to the Stream Coach setup panel and shows
# the detected content context on the report card.
$file = "D:\Coding\ViralAI\src\App.jsx"

if (-not (Test-Path $file)) { Write-Host "ERROR: File not found at $file" -ForegroundColor Red; exit 1 }
Copy-Item $file "$file.catbak" -Force
Write-Host "Backup written to $file.catbak" -ForegroundColor DarkGray

$content = [System.IO.File]::ReadAllText($file)
$content = $content.Replace("`r`n", "`n")

$o0 = [System.Text.StringBuilder]::new()
[void]$o0.Append('  const [streamerName, setStreamerName] = useState("");')
$o0 = $o0.ToString()

$n0 = [System.Text.StringBuilder]::new()
[void]$n0.Append('  const [streamerName, setStreamerName] = useState("");')
[void]$n0.Append("`n")
[void]$n0.Append('  const [category, setCategory] = useState("");')
$n0 = $n0.ToString()

$o1 = [System.Text.StringBuilder]::new()
[void]$o1.Append('      if (streamerName) formData.append("streamerName", streamerName);')
$o1 = $o1.ToString()

$n1 = [System.Text.StringBuilder]::new()
[void]$n1.Append('      if (streamerName) formData.append("streamerName", streamerName);')
[void]$n1.Append("`n")
[void]$n1.Append('      if (category.trim()) formData.append("category", category.trim());')
$n1 = $n1.ToString()

$o2 = [System.Text.StringBuilder]::new()
[void]$o2.Append('          <input type="text" placeholder="Your streamer name (optional)"')
[void]$o2.Append("`n")
[void]$o2.Append('            value={streamerName} onChange={e => setStreamerName(e.target.value)}')
[void]$o2.Append("`n")
[void]$o2.Append('            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/50"/>')
$o2 = $o2.ToString()

$n2 = [System.Text.StringBuilder]::new()
[void]$n2.Append('          <input type="text" placeholder="Your streamer name (optional)"')
[void]$n2.Append("`n")
[void]$n2.Append('            value={streamerName} onChange={e => setStreamerName(e.target.value)}')
[void]$n2.Append("`n")
[void]$n2.Append('            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/50"/>')
[void]$n2.Append("`n")
[void]$n2.Append('')
[void]$n2.Append("`n")
[void]$n2.Append('          <div className="space-y-1">')
[void]$n2.Append("`n")
[void]$n2.Append('            <input type="text" list="coach-categories" placeholder="Category / game (optional - auto-detected from URL)"')
[void]$n2.Append("`n")
[void]$n2.Append('              value={category} onChange={e => setCategory(e.target.value)}')
[void]$n2.Append("`n")
[void]$n2.Append('              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/50"/>')
[void]$n2.Append("`n")
[void]$n2.Append('            <datalist id="coach-categories">')
[void]$n2.Append("`n")
[void]$n2.Append('              {["Just Chatting","Stardew Valley","Minecraft","VALORANT","League of Legends","Call of Duty","Elden Ring","Resident Evil","Art","Music","Software and Game Development","Talk Shows &amp; Podcasts"].map(c => <option key={c} value={c}/>)}')
[void]$n2.Append("`n")
[void]$n2.Append('            </datalist>')
[void]$n2.Append("`n")
[void]$n2.Append('            <p className="text-xs text-slate-600 leading-relaxed">Sets grading norms. Silence during a horror game is tension; the same gap in Just Chatting is a viewer leaving.</p>')
[void]$n2.Append("`n")
[void]$n2.Append('          </div>')
$n2 = $n2.ToString()

$o3 = [System.Text.StringBuilder]::new()
[void]$o3.Append('            {report.overallSummary && <p className="text-xs text-amber-300 mt-3 leading-relaxed italic">"{report.overallSummary}"</p>}')
$o3 = $o3.ToString()

$n3 = [System.Text.StringBuilder]::new()
[void]$n3.Append('            {report.overallSummary && <p className="text-xs text-amber-300 mt-3 leading-relaxed italic">"{report.overallSummary}"</p>}')
[void]$n3.Append("`n")
[void]$n3.Append('            {report.contentContext && (')
[void]$n3.Append("`n")
[void]$n3.Append('              <div className="mt-3 space-y-1.5">')
[void]$n3.Append("`n")
[void]$n3.Append('                <div className="flex flex-wrap items-center gap-2">')
[void]$n3.Append("`n")
[void]$n3.Append('                  {report.contentContext.category && <Tag variant="accent"><Layers size={10}/>{report.contentContext.category}</Tag>}')
[void]$n3.Append("`n")
[void]$n3.Append('                  {report.contentContext.profileLabel && <Tag variant="blue">{report.contentContext.profileLabel}</Tag>}')
[void]$n3.Append("`n")
[void]$n3.Append('                  {report.contentContext.deadAirThresholdSecs && <Tag variant="default">Dead air &gt; {report.contentContext.deadAirThresholdSecs}s</Tag>}')
[void]$n3.Append("`n")
[void]$n3.Append('                  {report.contentContext.chapters?.length > 1 && <Tag variant="warning">{report.contentContext.chapters.length} content switches</Tag>}')
[void]$n3.Append("`n")
[void]$n3.Append('                  {report.contentContext.source === "manual" && <Tag variant="default">manual</Tag>}')
[void]$n3.Append("`n")
[void]$n3.Append('                </div>')
[void]$n3.Append("`n")
[void]$n3.Append('                {report.contentContext.title && <p className="text-xs text-slate-500 leading-relaxed">{report.contentContext.title}</p>}')
[void]$n3.Append("`n")
[void]$n3.Append('                {report.contentContext.chapters?.length > 1 && (')
[void]$n3.Append("`n")
[void]$n3.Append('                  <p className="text-xs text-slate-600 leading-relaxed">')
[void]$n3.Append("`n")
[void]$n3.Append('                    {report.contentContext.chapters.slice(0, 6).map((c, i) => (')
[void]$n3.Append("`n")
[void]$n3.Append('                      <span key={i}><span className="font-mono text-violet-400">{c.at}</span> {c.title}{i < Math.min(5, report.contentContext.chapters.length - 1) ? " · " : ""}</span>')
[void]$n3.Append("`n")
[void]$n3.Append('                    ))}')
[void]$n3.Append("`n")
[void]$n3.Append('                  </p>')
[void]$n3.Append("`n")
[void]$n3.Append('                )}')
[void]$n3.Append("`n")
[void]$n3.Append('              </div>')
[void]$n3.Append("`n")
[void]$n3.Append('            )}')
$n3 = $n3.ToString()

if ($content.Contains("coach-categories")) { Write-Host "Category UI already present - nothing to do." -ForegroundColor Yellow; exit 0 }

if ($content.Contains(${o0})) { $content = $content.Replace(${o0}, ${n0}); Write-Host "[1/4] category state" -ForegroundColor Green } else { Write-Host "[1/4] SKIP: category state anchor not found" -ForegroundColor Red }
if ($content.Contains(${o1})) { $content = $content.Replace(${o1}, ${n1}); Write-Host "[2/4] category in form data" -ForegroundColor Green } else { Write-Host "[2/4] SKIP: category in form data anchor not found" -ForegroundColor Red }
if ($content.Contains(${o2})) { $content = $content.Replace(${o2}, ${n2}); Write-Host "[3/4] category input field" -ForegroundColor Green } else { Write-Host "[3/4] SKIP: category input field anchor not found" -ForegroundColor Red }
if ($content.Contains(${o3})) { $content = $content.Replace(${o3}, ${n3}); Write-Host "[4/4] content context chips" -ForegroundColor Green } else { Write-Host "[4/4] SKIP: content context chips anchor not found" -ForegroundColor Red }

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Host ""
Write-Host "Done. Vite should hot-reload. If not: pm2 restart viralai-dev" -ForegroundColor Cyan