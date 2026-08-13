# add-coach-verdict-server.ps1
# Adds the Head Coach''s Verdict (fullReview) to the /coach-vod endpoint.
# VERIFY this path points at your actual server file before running:
$file = "D:\Coding\ViralAI\viral-audit-server.cjs"

if (-not (Test-Path $file)) { Write-Host "ERROR: File not found at $file - fix the path at the top of this script." -ForegroundColor Red; exit 1 }

# Back up first
Copy-Item $file "$file.bak" -Force
Write-Host "Backup written to $file.bak" -ForegroundColor DarkGray

# Read raw and normalize line endings to LF so anchors match regardless of CRLF
$content = [System.IO.File]::ReadAllText($file)
$content = $content.Replace("`r`n", "`n")

$sigOld = [System.Text.StringBuilder]::new()
[void]$sigOld.Append('async function runCoachLLM(promptText, sessionId, label) {')
$sigOld = $sigOld.ToString()

$sigNew = [System.Text.StringBuilder]::new()
[void]$sigNew.Append('async function runCoachLLM(promptText, sessionId, label, maxTokens = 600) {')
$sigNew = $sigNew.ToString()

$maxtokOld = [System.Text.StringBuilder]::new()
[void]$maxtokOld.Append('      max_tokens: 600,')
$maxtokOld = $maxtokOld.ToString()

$maxtokNew = [System.Text.StringBuilder]::new()
[void]$maxtokNew.Append('      max_tokens: maxTokens,')
$maxtokNew = $maxtokNew.ToString()

$anchorLog = [System.Text.StringBuilder]::new()
[void]$anchorLog.Append('    console.log(`[${sessionId}] Coach report complete. Overall grade: ${overallGrade}`);')
$anchorLog = $anchorLog.ToString()

$verdictBlock = [System.Text.StringBuilder]::new()
[void]$verdictBlock.Append('    // ── Step 7.5: Head Coach''s Verdict (narrative synthesis) ────────────────')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('    console.log(`[${sessionId}] Generating Head Coach''s Verdict...`);')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('    await new Promise(r => setTimeout(r, 800));')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('    const deadAirMoments = (deadAirAnalysis.worstMoments || [])')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      .map(m => `${m.duration} of silence at ${m.at}`).join("; ") || "none significant";')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('    const fillerSampleMoments = (fillerAnalysis.worstInstances || [])')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      .slice(0, 5).map(i => `"${i.word}" at ${i.at}`).join("; ") || "none significant";')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('    const topFillerList = Object.entries(fillerAnalysis.topOffenders || {})')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      .map(([w, c]) => `"${w}" x${c}`).join(", ") || "none";')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('    const repetitivePhrases = (vocalResult?.repetitive_phrases || [])')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      .map(p => `"${p.phrase}" (~${p.approximate_count}x)`).join(", ") || "none";')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('    const verdictBrief = [')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      `STREAMER: ${streamerName}`,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      `STREAM LENGTH (active): ${formatTimestamp(Math.round(duration - trueStart.trueStartSec))}`,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      `OVERALL GRADE: ${overallGrade}`,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      `SPEAKING PACE: ${wordsPerMinute} WPM`,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      ``,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      `INTRO (grade ${introResult?.overall_intro_grade || "N/A"}): opened with "${(trueStart.firstWords || "").slice(0, 120)}". Hook feedback: ${introResult?.hook_feedback || "N/A"}. Energy grade: ${introResult?.energy_grade || "N/A"}. Value prop present: ${introResult?.value_proposition_present}. Self-introduced: ${introResult?.self_introduced}.`,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      ``,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      `DEAD AIR (grade ${deadAirAnalysis.grade}): ${deadAirAnalysis.totalInstances} gaps over 15s, ${deadAirAnalysis.percentage}% of active stream. Worst moments: ${deadAirMoments}.`,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      ``,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      `FILLER WORDS (grade ${fillerAnalysis.grade}): rate ${fillerAnalysis.fillerRate}%. Top offenders: ${topFillerList}. Sample moments: ${fillerSampleMoments}.`,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      ``,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      `ENGAGEMENT (grade ${engagementResult?.overall_engagement_grade || "N/A"}): ${engagementResult?.questions_to_chat?.count ?? "?"} questions to chat, ${engagementResult?.calls_to_action?.count ?? "?"} CTAs, ${engagementResult?.chat_acknowledgments?.count ?? "?"} chat acknowledgments. Top engagement tip: ${engagementResult?.top_coaching_tip || "N/A"}.`,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      ``,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('      `VOCAL HABITS (grade ${vocalResult?.overall_vocal_grade || "N/A"}): pace ${vocalResult?.pace_grade || "N/A"}, variety ${vocalResult?.variety_grade || "N/A"}. Strongest habit: ${vocalResult?.strongest_habit || "N/A"}. Repetitive phrases: ${repetitivePhrases}.`,')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('    ].join("\n");')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('    await new Promise(r => setTimeout(r, 800));')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('    const fullReview = await runCoachLLM(`You are ${streamerName}''s personal head streaming coach delivering the final post-stream verdict. You have already graded every category individually. Now write the human summary that ties everything together into something that actually makes them a better streamer.')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('Speak directly to them using "you", like a real coach who watched the entire stream start to finish. Warm but honest — do not flatter and do not pile on. Reference SPECIFIC timestamps and moments from the data below so they can go back and rewatch. NEVER invent a timestamp; only use timestamps that appear in the data. Do not use bullet points or lists inside the verdict paragraphs.')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('STREAM DATA:')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('${verdictBrief}')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('Return ONLY valid JSON (no markdown):')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('{')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('  "verdict": "3 to 4 flowing paragraphs. Open with the arc of the stream (how it started, how it developed, where it peaked or dipped). Call out the 1-2 habits costing the most retention, each tied to a specific timestamp from the data. Genuinely acknowledge what worked. Close with the single most important change for next stream.",')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('  "did_well": ["specific strength 1", "specific strength 2", "specific strength 3"],')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('  "work_on_next": [')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('    { "focus": "the specific fix to make next stream", "where": "a real timestamp/moment from the data, or ''throughout'' if it is a global habit", "why": "one sentence on the payoff" },')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('    { "focus": "second fix", "where": "timestamp or ''throughout''", "why": "payoff" },')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('    { "focus": "third fix", "where": "timestamp or ''throughout''", "why": "payoff" }')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('  ],')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('  "one_liner": "a single punchy coaching sentence they can screenshot and remember"')
[void]$verdictBlock.Append("`n")
[void]$verdictBlock.Append('}`, sessionId, "verdict", 1200);')
$verdictBlock = $verdictBlock.ToString()

$resOld = [System.Text.StringBuilder]::new()
[void]$resOld.Append('      overallSummary: engagementResult?.top_coaching_tip || "Review your report card for detailed feedback on each category.",')
[void]$resOld.Append("`n")
[void]$resOld.Append('      reportCards: {')
$resOld = $resOld.ToString()

$resNew = [System.Text.StringBuilder]::new()
[void]$resNew.Append('      overallSummary: engagementResult?.top_coaching_tip || "Review your report card for detailed feedback on each category.",')
[void]$resNew.Append("`n")
[void]$resNew.Append('      fullReview,')
[void]$resNew.Append("`n")
[void]$resNew.Append('      reportCards: {')
$resNew = $resNew.ToString()

if ($content.Contains("Head Coach's Verdict")) { Write-Host "Verdict block already present - nothing to do." -ForegroundColor Yellow; exit 0 }

if ($content.Contains($sigOld)) { $content = $content.Replace($sigOld, $sigNew); Write-Host "[1/4] runCoachLLM signature patched (maxTokens param)" -ForegroundColor Green } else { Write-Host "[1/4] SKIP: runCoachLLM signature not found" -ForegroundColor Red }

if ($content.Contains($maxtokOld)) { $content = $content.Replace($maxtokOld, $maxtokNew); Write-Host "[2/4] max_tokens now honors maxTokens param" -ForegroundColor Green } else { Write-Host "[2/4] SKIP: max_tokens line not found" -ForegroundColor Red }

if ($content.Contains($anchorLog)) { $content = $content.Replace($anchorLog, $verdictBlock + "`n`n" + $anchorLog); Write-Host "[3/4] Head Coach Verdict generation inserted" -ForegroundColor Green } else { Write-Host "[3/4] SKIP: console.log anchor not found" -ForegroundColor Red }

if ($content.Contains($resOld)) { $content = $content.Replace($resOld, $resNew); Write-Host "[4/4] fullReview added to /coach-vod response" -ForegroundColor Green } else { Write-Host "[4/4] SKIP: res.json anchor not found" -ForegroundColor Red }

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Host "" 
Write-Host "Done. Now restart the backend:" -ForegroundColor Cyan
Write-Host "  pm2 restart viral-audit-server" -ForegroundColor Cyan