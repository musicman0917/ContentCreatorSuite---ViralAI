# add-mode-aware-ai.ps1
# Plumbs the TikTok Shop and Livestream Clip flags through to the Claude Vision /
# AI functions, which previously ignored both. Also marks Clip Scanner output as
# livestream clips automatically, since VOD clips always are.
$file = "D:\Coding\ViralAI\src\App.jsx"

if (-not (Test-Path $file)) { Write-Host "ERROR: File not found at $file" -ForegroundColor Red; exit 1 }
Copy-Item $file "$file.modebak" -Force
Write-Host "Backup written to $file.modebak" -ForegroundColor DarkGray

$content = [System.IO.File]::ReadAllText($file)
$content = $content.Replace("`r`n", "`n")

$o0 = [System.Text.StringBuilder]::new()
[void]$o0.Append('async function analyzeVideoHolistically(transcript, frameSummaries, platform, niche, duration) {')
$o0 = $o0.ToString()

$n0 = [System.Text.StringBuilder]::new()
[void]$n0.Append('async function analyzeVideoHolistically(transcript, frameSummaries, platform, niche, duration, isTikTokShop = false, isLiveClip = false) {')
$n0 = $n0.ToString()

$o1 = [System.Text.StringBuilder]::new()
[void]$o1.Append('  const frameContext = frameSummaries.slice(0, 4).map((f, i) => `Frame at ${f.label}: ${f.analysis?.slice(0, 120) || "no analysis"}`).join("\n");')
$o1 = $o1.ToString()

$n1 = [System.Text.StringBuilder]::new()
[void]$n1.Append('  const frameContext = frameSummaries.slice(0, 4).map((f, i) => `Frame at ${f.label}: ${f.analysis?.slice(0, 120) || "no analysis"}`).join("\n");')
[void]$n1.Append("`n")
[void]$n1.Append('  const shopBlock = isTikTokShop ? `')
[void]$n1.Append("`n")
[void]$n1.Append('CONTENT MODE: TIKTOK SHOP / PRODUCT SELL. This video exists to convert, not merely to be watched. Judge it on that basis:')
[void]$n1.Append("`n")
[void]$n1.Append('- Is the product on screen, and how early does it appear?')
[void]$n1.Append("`n")
[void]$n1.Append('- Is the product clearly visible at the exact moment the CTA lands?')
[void]$n1.Append("`n")
[void]$n1.Append('- Would price, discount, or offer text be legible at thumb size?')
[void]$n1.Append("`n")
[void]$n1.Append('- Does the video DEMONSTRATE the product''s claim, or only describe it?')
[void]$n1.Append("`n")
[void]$n1.Append('- Is there a credible reason to buy now rather than later?')
[void]$n1.Append("`n")
[void]$n1.Append('A video that holds attention perfectly but never shows the product has failed. Weight conversion intent above pure retention.` : "";')
[void]$n1.Append("`n")
[void]$n1.Append('  const liveBlock = isLiveClip ? `')
[void]$n1.Append("`n")
[void]$n1.Append('CONTENT MODE: LIVESTREAM CLIP. This was cut from a longer live broadcast — it was NOT purpose-shot short-form. Judge it accordingly:')
[void]$n1.Append("`n")
[void]$n1.Append('- Nothing can be re-shot or re-staged. The only available levers are the trim in-point and out-point, captions, crop, and overlays.')
[void]$n1.Append("`n")
[void]$n1.Append('- Never suggest re-filming, re-recording a line, or restaging a moment. Suggest a different trim point instead.')
[void]$n1.Append("`n")
[void]$n1.Append('- Raw reaction and authenticity ARE the product. Do not penalise unscripted speech, filler words, imperfect framing, or the absence of a written hook.')
[void]$n1.Append("`n")
[void]$n1.Append('- Judge the opening by whether the trim starts close enough to the payoff, not by whether it opens with a scripted hook.')
[void]$n1.Append("`n")
[void]$n1.Append('- Do not expect a loop-back ending. Clips do not loop.` : "";')
[void]$n1.Append("`n")
[void]$n1.Append('  const contentModeBlock = `${shopBlock}${liveBlock}`;')
$n1 = $n1.ToString()

$o2 = [System.Text.StringBuilder]::new()
[void]$o2.Append('HOOK WINDOW: ${platformCfg.hookWindow}')
[void]$o2.Append("`n")
[void]$o2.Append('')
[void]$o2.Append("`n")
[void]$o2.Append('TRANSCRIPT:')
$o2 = $o2.ToString()

$n2 = [System.Text.StringBuilder]::new()
[void]$n2.Append('HOOK WINDOW: ${platformCfg.hookWindow}')
[void]$n2.Append("`n")
[void]$n2.Append('${contentModeBlock}')
[void]$n2.Append("`n")
[void]$n2.Append('')
[void]$n2.Append("`n")
[void]$n2.Append('TRANSCRIPT:')
$n2 = $n2.ToString()

$o3 = [System.Text.StringBuilder]::new()
[void]$o3.Append('async function generateHookAlternatives(transcript, platform, niche, gameName = "") {')
$o3 = $o3.ToString()

$n3 = [System.Text.StringBuilder]::new()
[void]$n3.Append('async function generateHookAlternatives(transcript, platform, niche, gameName = "", isTikTokShop = false, isLiveClip = false) {')
$n3 = $n3.ToString()

$o4 = [System.Text.StringBuilder]::new()
[void]$o4.Append('  const gameCtx = niche === "gaming" && gameName ? ` The game is ${gameName}.` : "";')
$o4 = $o4.ToString()

$n4 = [System.Text.StringBuilder]::new()
[void]$n4.Append('  const gameCtx = niche === "gaming" && gameName ? ` The game is ${gameName}.` : "";')
[void]$n4.Append("`n")
[void]$n4.Append('  const hookShop = isTikTokShop ? `\n\nThis is a TikTok Shop product video. Every hook must create desire for the PRODUCT, not just curiosity about the video. Lead with the problem it solves, the result it delivers, or the price/value shock. Avoid hooks that entertain but never point at the product.` : "";')
[void]$n4.Append("`n")
[void]$n4.Append('  const hookLive = isLiveClip ? `\n\nCRITICAL — THIS IS A LIVESTREAM CLIP. Nothing can be re-recorded, so you CANNOT write a new spoken line. Each of your 3 suggestions must be either (a) an ON-SCREEN TEXT hook to overlay on the existing footage, or (b) a SPECIFIC TRIM POINT, described by quoting the words already spoken where the clip should start. Never suggest the creator say something new. Prefix each with either "TEXT:" or "TRIM:".` : "";')
[void]$n4.Append("`n")
[void]$n4.Append('  const hookModeBlock = `${hookShop}${hookLive}`;')
$n4 = $n4.ToString()

$o5 = [System.Text.StringBuilder]::new()
[void]$o5.Append('space.${gameCtx}\n\nSTRICT RULES:')
$o5 = $o5.ToString()

$n5 = [System.Text.StringBuilder]::new()
[void]$n5.Append('space.${gameCtx}${hookModeBlock}\n\nSTRICT RULES:')
$n5 = $n5.ToString()

$o6 = [System.Text.StringBuilder]::new()
[void]$o6.Append('async function analyzeFrameWithClaude(base64, timestamp, platform, niche, gameName = "") {')
[void]$o6.Append("`n")
[void]$o6.Append('  if (!ANTHROPIC_API_KEY) return `[Claude Vision not configured] Frame at ${timestamp} could not be analyzed.`;')
[void]$o6.Append("`n")
[void]$o6.Append('  const platformCfg = PLATFORM_CONFIG[platform];')
[void]$o6.Append("`n")
[void]$o6.Append('  const gameContext = niche === "gaming" && gameName ? ` The game being played is ${gameName}.` : "";')
[void]$o6.Append("`n")
[void]$o6.Append('  const prompt = `You are a social media algorithm expert. Analyze this video frame at ${timestamp} from a ${platformCfg.label} video in the ${NICHE_CONFIG[niche]?.label || niche} niche.${gameContext} Provide a SHORT audit (3-4 sentences): 1. Visual hook strength - does this frame stop the scroll? 2. On-screen text/overlays effectiveness. 3. Framing and lighting quality. 4. One actionable improvement. Plain prose, no bullets.`;')
$o6 = $o6.ToString()

$n6 = [System.Text.StringBuilder]::new()
[void]$n6.Append('async function analyzeFrameWithClaude(base64, timestamp, platform, niche, gameName = "", isTikTokShop = false, isLiveClip = false) {')
[void]$n6.Append("`n")
[void]$n6.Append('  if (!ANTHROPIC_API_KEY) return `[Claude Vision not configured] Frame at ${timestamp} could not be analyzed.`;')
[void]$n6.Append("`n")
[void]$n6.Append('  const platformCfg = PLATFORM_CONFIG[platform];')
[void]$n6.Append("`n")
[void]$n6.Append('  const gameContext = niche === "gaming" && gameName ? ` The game being played is ${gameName}.` : "";')
[void]$n6.Append("`n")
[void]$n6.Append('  const shopCtx = isTikTokShop ? ` This is a TikTok Shop product video, so also assess: is the product visible in this frame, is it lit and framed well enough to read, and would any price or offer text stay legible at thumbnail size? A frame with no product visible is a problem worth flagging.` : "";')
[void]$n6.Append("`n")
[void]$n6.Append('  const liveCtx = isLiveClip ? ` This frame is from a LIVESTREAM CLIP, so judge it against live-broadcast norms (webcam plus game capture), not studio short-form. Do not suggest re-shooting, relighting, or restaging — the only fixes available are crop, zoom, caption, and overlay changes.` : "";')
[void]$n6.Append("`n")
[void]$n6.Append('  const prompt = `You are a social media algorithm expert. Analyze this video frame at ${timestamp} from a ${platformCfg.label} video in the ${NICHE_CONFIG[niche]?.label || niche} niche.${gameContext}${shopCtx}${liveCtx} Provide a SHORT audit (3-4 sentences): 1. Visual hook strength - does this frame stop the scroll? 2. On-screen text/overlays effectiveness. 3. Framing and lighting quality. 4. One actionable improvement. Plain prose, no bullets.`;')
$n6 = $n6.ToString()

$o7 = [System.Text.StringBuilder]::new()
[void]$o7.Append('function VideoUploadPanel({ onAnalysisComplete, platform, niche, gameName = "" }) {')
$o7 = $o7.ToString()

$n7 = [System.Text.StringBuilder]::new()
[void]$n7.Append('function VideoUploadPanel({ onAnalysisComplete, platform, niche, gameName = "", isTikTokShop = false, isLiveClip = false }) {')
$n7 = $n7.ToString()

$o8 = [System.Text.StringBuilder]::new()
[void]$o8.Append('        try { analysis = await analyzeFrameWithClaude(frame.base64, frame.label, platform, niche, gameName); }')
$o8 = $o8.ToString()

$n8 = [System.Text.StringBuilder]::new()
[void]$n8.Append('        try { analysis = await analyzeFrameWithClaude(frame.base64, frame.label, platform, niche, gameName, isTikTokShop, isLiveClip); }')
$n8 = $n8.ToString()

$o9 = [System.Text.StringBuilder]::new()
[void]$o9.Append('      try { holisticAnalysis = await analyzeVideoHolistically(serverResponse.transcription?.text || "", analyzedFrames, platform, detectedNiche || niche, serverResponse.duration); } catch(e) { console.warn("Holistic analysis failed:", e.message); }')
$o9 = $o9.ToString()

$n9 = [System.Text.StringBuilder]::new()
[void]$n9.Append('      try { holisticAnalysis = await analyzeVideoHolistically(serverResponse.transcription?.text || "", analyzedFrames, platform, detectedNiche || niche, serverResponse.duration, isTikTokShop, isLiveClip); } catch(e) { console.warn("Holistic analysis failed:", e.message); }')
$n9 = $n9.ToString()

$o10 = [System.Text.StringBuilder]::new()
[void]$o10.Append('              <VideoUploadPanel onAnalysisComplete={handleVideoAnalysisComplete} platform={platform} niche={niche} gameName={gameName} />')
$o10 = $o10.ToString()

$n10 = [System.Text.StringBuilder]::new()
[void]$n10.Append('              <VideoUploadPanel onAnalysisComplete={handleVideoAnalysisComplete} platform={platform} niche={niche} gameName={gameName} isTikTokShop={isTikTokShop} isLiveClip={isLiveClip} />')
$n10 = $n10.ToString()

$o11 = [System.Text.StringBuilder]::new()
[void]$o11.Append('      const aiHooks = await generateHookAlternatives(script, platform, niche, gameName || "");')
$o11 = $o11.ToString()

$n11 = [System.Text.StringBuilder]::new()
[void]$n11.Append('      const aiHooks = await generateHookAlternatives(script, platform, niche, gameName || "", isTikTokShop, isLiveClip);')
$n11 = $n11.ToString()

$o12 = [System.Text.StringBuilder]::new()
[void]$o12.Append('                      try { analysis = await analyzeFrameWithClaude(frame.base64, frame.label, platform, niche, gameName || ""); }')
$o12 = $o12.ToString()

$n12 = [System.Text.StringBuilder]::new()
[void]$n12.Append('                      try { analysis = await analyzeFrameWithClaude(frame.base64, frame.label, platform, niche, gameName || "", isTikTokShop, isLiveClip); }')
$n12 = $n12.ToString()

$o13 = [System.Text.StringBuilder]::new()
[void]$o13.Append('      const analysis = await analyzeFrameWithClaude(clip.thumbnail, clip.startLabel, "tiktok", "streaming", "");')
$o13 = $o13.ToString()

$n13 = [System.Text.StringBuilder]::new()
[void]$n13.Append('      const analysis = await analyzeFrameWithClaude(clip.thumbnail, clip.startLabel, "tiktok", "streaming", "", false, true);')
$n13 = $n13.ToString()

$o14 = [System.Text.StringBuilder]::new()
[void]$o14.Append('      const hooks = await generateHookAlternatives(clip.transcript, "tiktok", "streaming", "");')
$o14 = $o14.ToString()

$n14 = [System.Text.StringBuilder]::new()
[void]$n14.Append('      const hooks = await generateHookAlternatives(clip.transcript, "tiktok", "streaming", "", false, true);')
$n14 = $n14.ToString()

if ($content.Contains("contentModeBlock")) { Write-Host "Mode-aware AI already installed - nothing to do." -ForegroundColor Yellow; exit 0 }

$fail = 0
if ($content.Contains(${o0})) { $content = $content.Replace(${o0}, ${n0}); Write-Host "[1/15] holistic signature" -ForegroundColor Green } else { $fail++; Write-Host "[1/15] SKIP: holistic signature anchor not found" -ForegroundColor Red }
if ($content.Contains(${o1})) { $content = $content.Replace(${o1}, ${n1}); Write-Host "[2/15] holistic mode blocks" -ForegroundColor Green } else { $fail++; Write-Host "[2/15] SKIP: holistic mode blocks anchor not found" -ForegroundColor Red }
if ($content.Contains(${o2})) { $content = $content.Replace(${o2}, ${n2}); Write-Host "[3/15] holistic prompt injection" -ForegroundColor Green } else { $fail++; Write-Host "[3/15] SKIP: holistic prompt injection anchor not found" -ForegroundColor Red }
if ($content.Contains(${o3})) { $content = $content.Replace(${o3}, ${n3}); Write-Host "[4/15] hook gen signature" -ForegroundColor Green } else { $fail++; Write-Host "[4/15] SKIP: hook gen signature anchor not found" -ForegroundColor Red }
if ($content.Contains(${o4})) { $content = $content.Replace(${o4}, ${n4}); Write-Host "[5/15] hook gen mode blocks" -ForegroundColor Green } else { $fail++; Write-Host "[5/15] SKIP: hook gen mode blocks anchor not found" -ForegroundColor Red }
if ($content.Contains(${o5})) { $content = $content.Replace(${o5}, ${n5}); Write-Host "[6/15] hook gen prompt injection" -ForegroundColor Green } else { $fail++; Write-Host "[6/15] SKIP: hook gen prompt injection anchor not found" -ForegroundColor Red }
if ($content.Contains(${o6})) { $content = $content.Replace(${o6}, ${n6}); Write-Host "[7/15] frame analysis prompt" -ForegroundColor Green } else { $fail++; Write-Host "[7/15] SKIP: frame analysis prompt anchor not found" -ForegroundColor Red }
if ($content.Contains(${o7})) { $content = $content.Replace(${o7}, ${n7}); Write-Host "[8/15] VideoUploadPanel props" -ForegroundColor Green } else { $fail++; Write-Host "[8/15] SKIP: VideoUploadPanel props anchor not found" -ForegroundColor Red }
if ($content.Contains(${o8})) { $content = $content.Replace(${o8}, ${n8}); Write-Host "[9/15] panel frame call" -ForegroundColor Green } else { $fail++; Write-Host "[9/15] SKIP: panel frame call anchor not found" -ForegroundColor Red }
if ($content.Contains(${o9})) { $content = $content.Replace(${o9}, ${n9}); Write-Host "[10/15] panel holistic call" -ForegroundColor Green } else { $fail++; Write-Host "[10/15] SKIP: panel holistic call anchor not found" -ForegroundColor Red }
if ($content.Contains(${o10})) { $content = $content.Replace(${o10}, ${n10}); Write-Host "[11/15] VideoUploadPanel mount" -ForegroundColor Green } else { $fail++; Write-Host "[11/15] SKIP: VideoUploadPanel mount anchor not found" -ForegroundColor Red }
if ($content.Contains(${o11})) { $content = $content.Replace(${o11}, ${n11}); Write-Host "[12/15] script path hook gen" -ForegroundColor Green } else { $fail++; Write-Host "[12/15] SKIP: script path hook gen anchor not found" -ForegroundColor Red }
if ($content.Contains(${o12})) { $content = $content.Replace(${o12}, ${n12}); Write-Host "[13/15] URL import frame call" -ForegroundColor Green } else { $fail++; Write-Host "[13/15] SKIP: URL import frame call anchor not found" -ForegroundColor Red }
if ($content.Contains(${o13})) { $content = $content.Replace(${o13}, ${n13}); Write-Host "[14/15] clip scanner frame call" -ForegroundColor Green } else { $fail++; Write-Host "[14/15] SKIP: clip scanner frame call anchor not found" -ForegroundColor Red }
if ($content.Contains(${o14})) { $content = $content.Replace(${o14}, ${n14}); Write-Host "[15/15] clip scanner hook gen" -ForegroundColor Green } else { $fail++; Write-Host "[15/15] SKIP: clip scanner hook gen anchor not found" -ForegroundColor Red }

if ($fail -gt 0) { Write-Host "" ; Write-Host "$fail patch(es) failed - NOT writing file. Send the red lines back for adjusted anchors." -ForegroundColor Red; exit 1 }

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Host ""
Write-Host "Done. Vite should hot-reload. If not: pm2 restart viralai-dev" -ForegroundColor Cyan