# add-music-integrity-prompts.ps1
# Gives the music and singing niches an artistic-integrity-first analysis and hook
# rewrite prompt, replacing the generic algorithm-hacking framing for those niches only.
# Saved with a UTF-8 BOM so the em-dashes in the anchors match on any PowerShell version.
$file = "D:\Coding\ViralAI\src\App.jsx"

if (-not (Test-Path $file)) { Write-Host "ERROR: File not found at $file" -ForegroundColor Red; exit 1 }
Copy-Item $file "$file.musicbak" -Force
Write-Host "Backup written to $file.musicbak" -ForegroundColor DarkGray

$content = [System.IO.File]::ReadAllText($file)
$content = $content.Replace("`r`n", "`n")

$o0 = [System.Text.StringBuilder]::new()
[void]$o0.Append('You are the Chief Creative Officer at a world-class social media agency. You have reviewed thousands of pieces of content and know exactly what the ${platformCfg.label} algorithm rewards.')
$o0 = $o0.ToString()

$n0 = [System.Text.StringBuilder]::new()
[void]$n0.Append('${(niche === "music" || niche === "singing")')
[void]$n0.Append("`n")
[void]$n0.Append('  ? "You are an expert music content strategist and professional video editor reviewing a short-form MUSICAL PERFORMANCE. Your goal is production-focused critique that maximizes audience retention WITHOUT compromising the creator''s artistic authenticity. You are deeply respectful of musical talent. You NEVER recommend cheap clickbait, forced facial expressions, unrelated visual gimmicks, aggressive calls-to-action, or comment bait — you trust that an authentic, high-quality performance drives its own community engagement."')
[void]$n0.Append("`n")
[void]$n0.Append('  : `You are the Chief Creative Officer at a world-class social media agency. You have reviewed thousands of pieces of content and know exactly what the ${platformCfg.label} algorithm rewards.`}')
$n0 = $n0.ToString()

$o1 = [System.Text.StringBuilder]::new()
[void]$o1.Append('Deliver a complete video analysis covering:')
[void]$o1.Append("`n")
[void]$o1.Append('1. NARRATIVE ARC: Does this video have a clear beginning, middle, and payoff? Does it earn its runtime?')
[void]$o1.Append("`n")
[void]$o1.Append('2. VIRAL POTENTIAL: What is the single most shareable/rewatch-worthy moment and why?')
[void]$o1.Append("`n")
[void]$o1.Append('3. ALGORITHM ALIGNMENT: How well does this video match what ${platformCfg.label} is currently rewarding?')
[void]$o1.Append("`n")
[void]$o1.Append('4. AUDIENCE RETENTION PREDICTION: Where will viewers drop off and why?')
[void]$o1.Append("`n")
[void]$o1.Append('5. VERDICT: One punchy paragraph — is this video ready to post, needs work, or needs a complete rethink?')
[void]$o1.Append("`n")
[void]$o1.Append('')
[void]$o1.Append("`n")
[void]$o1.Append('Be direct, specific, and ruthless. No softening. Write like the creator is paying you to tell the truth.')
$o1 = $o1.ToString()

$n1 = [System.Text.StringBuilder]::new()
[void]$n1.Append('${(niche === "music" || niche === "singing")')
[void]$n1.Append("`n")
[void]$n1.Append('  ? `Deliver a complete performance-content analysis covering:')
[void]$n1.Append("`n")
[void]$n1.Append('1. THE MUSICAL HOOK: Does the first 5-10 seconds showcase the creator''s strongest vocal or instrumental moment? The hook must honestly represent the music and give a real, tangible reason to keep watching — never a gimmick disconnected from the performance.')
[void]$n1.Append("`n")
[void]$n1.Append('2. STORYTELLING & CONTEXT: Would a thematic text overlay strengthen the opening — the story behind a lyric, the emotion, or the creative process? Emotion-first, not hype.')
[void]$n1.Append("`n")
[void]$n1.Append('3. AUDIO-VISUAL PACING: Do the visual changes (cuts, text pop-ups, camera moves) land on the natural beat drops and melody shifts? Name specific sync points where they should.')
[void]$n1.Append("`n")
[void]$n1.Append('4. VISUAL COHESION: Are the typography, captions, and styling uniform and reinforcing the genre and aesthetic this musician is aiming for?')
[void]$n1.Append("`n")
[void]$n1.Append('5. VERDICT: One honest paragraph — is this ready to post, does it need an editing pass, or a structural rethink? Judge the CRAFT of the video, never the raw talent.')
[void]$n1.Append("`n")
[void]$n1.Append('')
[void]$n1.Append("`n")
[void]$n1.Append('Be direct, technical, and highly respectful of the creator''s musical talent. Recommend structural editing craft — timeline restructuring, audio mixing, color grading — over algorithm-obsessed vanity metrics.`')
[void]$n1.Append("`n")
[void]$n1.Append('  : `Deliver a complete video analysis covering:')
[void]$n1.Append("`n")
[void]$n1.Append('1. NARRATIVE ARC: Does this video have a clear beginning, middle, and payoff? Does it earn its runtime?')
[void]$n1.Append("`n")
[void]$n1.Append('2. VIRAL POTENTIAL: What is the single most shareable/rewatch-worthy moment and why?')
[void]$n1.Append("`n")
[void]$n1.Append('3. ALGORITHM ALIGNMENT: How well does this video match what ${platformCfg.label} is currently rewarding?')
[void]$n1.Append("`n")
[void]$n1.Append('4. AUDIENCE RETENTION PREDICTION: Where will viewers drop off and why?')
[void]$n1.Append("`n")
[void]$n1.Append('5. VERDICT: One punchy paragraph — is this video ready to post, needs work, or needs a complete rethink?')
[void]$n1.Append("`n")
[void]$n1.Append('')
[void]$n1.Append("`n")
[void]$n1.Append('Be direct, specific, and ruthless. No softening. Write like the creator is paying you to tell the truth.`}')
$n1 = $n1.ToString()

$o2 = [System.Text.StringBuilder]::new()
[void]$o2.Append('- Each hook must be ripped directly from the actual content of this transcript — zero generic placeholders\n- Engineered specifically for the ${platformCfg.hookWindow} attention window on ${platformCfg.label}\n- Must create an immediate curiosity gap, emotional spike, or pattern interrupt\n- Written in the creator''s authentic voice — not corporate, not stiff\n- The kind of hook that makes someone stop mid-scroll and say "wait, what?"')
$o2 = $o2.ToString()

$n2 = [System.Text.StringBuilder]::new()
[void]$n2.Append('${(niche === "music" || niche === "singing")')
[void]$n2.Append("`n")
[void]$n2.Append('  ? "- Each hook must point to the creator''s strongest ACTUAL vocal or instrumental moment in this performance\n- Honestly represent the music — never clickbait, never a gimmick disconnected from the song\n- A hook may be a thematic text overlay: the story behind a lyric, the emotion, or the creative process\n- Written in the artist''s authentic voice, never corporate or stiff\n- Give a real, tangible reason to keep listening — trust the performance to earn the attention"')
[void]$n2.Append("`n")
[void]$n2.Append('  : `- Each hook must be ripped directly from the actual content of this transcript — zero generic placeholders\n- Engineered specifically for the ${platformCfg.hookWindow} attention window on ${platformCfg.label}\n- Must create an immediate curiosity gap, emotional spike, or pattern interrupt\n- Written in the creator''s authentic voice — not corporate, not stiff\n- The kind of hook that makes someone stop mid-scroll and say "wait, what?"`}')
$n2 = $n2.ToString()

if ($content.Contains("music content strategist")) { Write-Host "Music integrity prompts already applied - nothing to do." -ForegroundColor Yellow; exit 0 }

$fail = 0
if ($content.Contains(${o0})) { $content = $content.Replace(${o0}, ${n0}); Write-Host "[1/3] holistic intro persona" -ForegroundColor Green } else { $fail++; Write-Host "[1/3] SKIP: holistic intro persona anchor not found" -ForegroundColor Red }
if ($content.Contains(${o1})) { $content = $content.Replace(${o1}, ${n1}); Write-Host "[2/3] holistic criteria + tone" -ForegroundColor Green } else { $fail++; Write-Host "[2/3] SKIP: holistic criteria + tone anchor not found" -ForegroundColor Red }
if ($content.Contains(${o2})) { $content = $content.Replace(${o2}, ${n2}); Write-Host "[3/3] hook generation rules" -ForegroundColor Green } else { $fail++; Write-Host "[3/3] SKIP: hook generation rules anchor not found" -ForegroundColor Red }

if ($fail -gt 0) { Write-Host ""; Write-Host "$fail patch(es) failed - NOT writing file. Likely an encoding mismatch on the em-dashes; send this region back." -ForegroundColor Red; exit 1 }

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Host ""
Write-Host "Done. Vite should hot-reload. If not: pm2 restart viralai-dev" -ForegroundColor Cyan