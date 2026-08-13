# write-appjsx.ps1
$outFile = "D:\Coding\ViralAI\src\App.jsx"
$sb = [System.Text.StringBuilder]::new(70000)
[void]$sb.Append('import { useState, useEffect, useMemo, useRef, useCallback } from "react";
')
[void]$sb.Append('import {
')
[void]$sb.Append('  Zap, Target, Clock, CheckSquare, Play, Loader2,
')
[void]$sb.Append('  TrendingUp, AlertTriangle, CheckCircle, XCircle, RefreshCw,
')
[void]$sb.Append('  Scissors, BarChart3, ListChecks, Star, Radio, Eye, Heart,
')
[void]$sb.Append('  Share2, Bookmark, Volume2, Hash, Layers, Info,
')
[void]$sb.Append('  Flame, Shield, Award, Cpu, Upload, Film, Mic,
')
[void]$sb.Append('  Image, ChevronRight, X, FileVideo, Wifi
')
[void]$sb.Append('} from "lucide-react";
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── CONFIG ──────────────────────────────────────────────────────────────────
')
[void]$sb.Append('// Point this at your PM2 server
')
[void]$sb.Append('const BACKEND_URL = "http://localhost:3015";
')
[void]$sb.Append('// Your Anthropic API key for Claude Vision (called directly from browser)
')
[void]$sb.Append('const ANTHROPIC_API_KEY = ""; // set via VITE_ANTHROPIC_API_KEY in later versions
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── HEURISTICS ENGINE ───────────────────────────────────────────────────────
')
[void]$sb.Append('
')
[void]$sb.Append('const PLATFORM_CONFIG = {
')
[void]$sb.Append('  "yt-long": {
')
[void]$sb.Append('    label: "YouTube Long-form", icon: "▶", color: "#FF0000",
')
[void]$sb.Append('    accentClass: "text-red-400", bgClass: "bg-red-500/10 border-red-500/20",
')
[void]$sb.Append('    idealWordCount: [600, 2000], hookWindow: "First 30 seconds",
')
[void]$sb.Append('    loopStrategy: false, thumbnailTitle: true,
')
[void]$sb.Append('  },
')
[void]$sb.Append('  "yt-short": {
')
[void]$sb.Append('    label: "YouTube Shorts", icon: "⚡", color: "#FF6B6B",
')
[void]$sb.Append('    accentClass: "text-orange-400", bgClass: "bg-orange-500/10 border-orange-500/20",
')
[void]$sb.Append('    idealWordCount: [60, 150], hookWindow: "First 3 seconds",
')
[void]$sb.Append('    loopStrategy: true, thumbnailTitle: false,
')
[void]$sb.Append('  },
')
[void]$sb.Append('  "tiktok": {
')
[void]$sb.Append('    label: "TikTok", icon: "♪", color: "#69C9D0",
')
[void]$sb.Append('    accentClass: "text-cyan-400", bgClass: "bg-cyan-500/10 border-cyan-500/20",
')
[void]$sb.Append('    idealWordCount: [50, 200], hookWindow: "First 1-2 seconds",
')
[void]$sb.Append('    loopStrategy: true, thumbnailTitle: false,
')
[void]$sb.Append('  },
')
[void]$sb.Append('  "reels": {
')
[void]$sb.Append('    label: "Instagram Reels", icon: "◈", color: "#E1306C",
')
[void]$sb.Append('    accentClass: "text-pink-400", bgClass: "bg-pink-500/10 border-pink-500/20",
')
[void]$sb.Append('    idealWordCount: [40, 150], hookWindow: "First 3 seconds",
')
[void]$sb.Append('    loopStrategy: false, thumbnailTitle: false,
')
[void]$sb.Append('  },
')
[void]$sb.Append('};
')
[void]$sb.Append('
')
[void]$sb.Append('const NICHE_CONFIG = {
')
[void]$sb.Append('  tech: { label: "Tech", keywords: ["tutorial","how to","review","vs","best","ai","build"] },
')
[void]$sb.Append('  music: { label: "Music", keywords: ["cover","original","beat","melody","chord","song","performance"] },
')
[void]$sb.Append('  story: { label: "Storytelling", keywords: ["then","suddenly","but","plot twist","you won''t believe","story time"] },
')
[void]$sb.Append('  education: { label: "Education", keywords: ["learn","explain","why","what","fact","study","tip","mistake"] },
')
[void]$sb.Append('  comedy: { label: "Comedy", keywords: ["imagine","when you","relatable","nobody","literally","okay but"] },
')
[void]$sb.Append('};
')
[void]$sb.Append('
')
[void]$sb.Append('const PLATFORM_CHECKLIST = {
')
[void]$sb.Append('  "yt-long": [
')
[void]$sb.Append('    { id: "title", label: "Title contains a power word or number", critical: true },
')
[void]$sb.Append('    { id: "thumbnail", label: "Thumbnail concept is described or implied", critical: true },
')
[void]$sb.Append('    { id: "hook30", label: "Hook is front-loaded within first 30 seconds", critical: true },
')
[void]$sb.Append('    { id: "chapters", label: "Script has clear chapter/segment transitions", critical: false },
')
[void]$sb.Append('    { id: "cta", label: "Subscribe/like CTA placed at emotional peak", critical: false },
')
[void]$sb.Append('    { id: "seo", label: "Primary keyword used in first 15 seconds", critical: true },
')
[void]$sb.Append('    { id: "endscreen", label: "End screen or outro references next video", critical: false },
')
[void]$sb.Append('    { id: "retention", label: "Pattern interrupt every 60-90 seconds", critical: false },
')
[void]$sb.Append('  ],
')
[void]$sb.Append('  "yt-short": [
')
[void]$sb.Append('    { id: "loop", label: "Final line loops back to opening phrase", critical: true },
')
[void]$sb.Append('    { id: "hook3", label: "First sentence grabs attention instantly", critical: true },
')
[void]$sb.Append('    { id: "length", label: "Script is under 150 words (60 seconds)", critical: true },
')
[void]$sb.Append('    { id: "overlay", label: "Text overlays mentioned or implied", critical: false },
')
[void]$sb.Append('    { id: "nohang", label: "No dead air or filler words", critical: true },
')
[void]$sb.Append('    { id: "subscribe", label: "Verbal CTA to subscribe included", critical: false },
')
[void]$sb.Append('  ],
')
[void]$sb.Append('  "tiktok": [
')
[void]$sb.Append('    { id: "sound", label: "References or implies trending sound usage", critical: false },
')
[void]$sb.Append('    { id: "spoken-seo", label: "SEO keywords spoken out loud naturally", critical: true },
')
[void]$sb.Append('    { id: "overlay", label: "On-screen text/captions planned", critical: true },
')
[void]$sb.Append('    { id: "hook2", label: "Hook fires in first 1-2 seconds", critical: true },
')
[void]$sb.Append('    { id: "pattern", label: "Pattern interrupt within first 5 seconds", critical: true },
')
[void]$sb.Append('    { id: "duet", label: "Duet/stitch-friendly moment included", critical: false },
')
[void]$sb.Append('    { id: "loop", label: "Seamless loop ending planned", critical: false },
')
[void]$sb.Append('  ],
')
[void]$sb.Append('  "reels": [
')
[void]$sb.Append('    { id: "share", label: "Script has a ''shareable'' moment or insight", critical: true },
')
[void]$sb.Append('    { id: "save", label: "Contains a ''save-worthy'' tip or list", critical: true },
')
[void]$sb.Append('    { id: "collab", label: "Collaboration or tag moment included", critical: false },
')
[void]$sb.Append('    { id: "hook3", label: "First frame is visually arresting", critical: true },
')
[void]$sb.Append('    { id: "audio", label: "Original audio or trending audio referenced", critical: false },
')
[void]$sb.Append('    { id: "caption", label: "Caption hook in first line planned", critical: true },
')
[void]$sb.Append('    { id: "cta-comment", label: "CTA asks a debate-worthy question", critical: false },
')
[void]$sb.Append('  ],
')
[void]$sb.Append('};
')
[void]$sb.Append('
')
[void]$sb.Append('const HOOK_TEMPLATES = {
')
[void]$sb.Append('  "yt-long": [
')
[void]$sb.Append('    "Start with a bold, counter-intuitive claim: ''Everyone told me [X] was impossible — here''s how I proved them wrong in 30 days.''",
')
[void]$sb.Append('    "Use the ''failure-to-formula'' arc: ''I wasted $10,000 on [topic] before I discovered the 3 rules that changed everything.''",
')
[void]$sb.Append('    "Open with a visual promise: ''By the end of this video, you''ll know exactly how to [outcome] — even if you''ve never tried before.''",
')
[void]$sb.Append('  ],
')
[void]$sb.Append('  "yt-short": [
')
[void]$sb.Append('    "One-line curiosity gap: ''Nobody talks about the [X] trick that 10x''d my [result] overnight.''",
')
[void]$sb.Append('    "Scroll-stopper directive: ''Stop scrolling. If you do [X], you''re losing [Y] every single day.''",
')
[void]$sb.Append('    "Pattern-breaker opener: ''Here''s the brutal truth about [niche topic] they don''t teach you...''",
')
[void]$sb.Append('  ],
')
[void]$sb.Append('  "tiktok": [
')
[void]$sb.Append('    "POV bait: ''POV: you finally understand why [common thing] actually works like this.''",
')
[void]$sb.Append('    "Controversy + curiosity: ''[Common belief] is completely wrong — and I''ll prove it in 20 seconds.''",
')
[void]$sb.Append('    "Visual promise + speed: ''Watch me [impressive action] in under 60 seconds. For real.''",
')
[void]$sb.Append('  ],
')
[void]$sb.Append('  "reels": [
')
[void]$sb.Append('    "Save-trigger opener: ''5 things I wish I knew before [relatable milestone] — save this.''",
')
[void]$sb.Append('    "Community-first hook: ''If you''re into [niche], you NEED to hear this. Trust me.''",
')
[void]$sb.Append('    "Transformation bait: ''This one change went from [bad result] to [dream result] in [timeframe].''",
')
[void]$sb.Append('  ],
')
[void]$sb.Append('};
')
[void]$sb.Append('
')
[void]$sb.Append('const PLATFORM_CALIBRATION = {
')
[void]$sb.Append('  "yt-long": {
')
[void]$sb.Append('    "horizontal": { title: "Long-form Horizontal Algorithm Profile", rules: [
')
[void]$sb.Append('      { icon: Eye, text: "CTR drives initial exposure — title + thumbnail must be a unified promise." },
')
[void]$sb.Append('      { icon: Clock, text: "Average View Duration (AVD) above 40% signals ''recommended'' status." },
')
[void]$sb.Append('      { icon: TrendingUp, text: "First 48h velocity determines long-tail recommendation shelf life." },
')
[void]$sb.Append('      { icon: BarChart3, text: "Chapter markers reduce drop-off by giving viewers navigation control." },
')
[void]$sb.Append('    ]},
')
[void]$sb.Append('    "vertical": { title: "Long-form Vertical Algorithm Profile", rules: [
')
[void]$sb.Append('      { icon: AlertTriangle, text: "Vertical long-form is a niche format — mobile-first framing is non-negotiable." },
')
[void]$sb.Append('      { icon: Eye, text: "Thumbnail still matters, but it renders smaller in Shorts feed — use bold text." },
')
[void]$sb.Append('      { icon: Clock, text: "Higher drop-off tolerance since format is uncommon — but hook must still fire fast." },
')
[void]$sb.Append('      { icon: Layers, text: "Segment with tight cuts; vertical viewers have shorter patience windows." },
')
[void]$sb.Append('    ]},
')
[void]$sb.Append('  },
')
[void]$sb.Append('  "yt-short": {
')
[void]$sb.Append('    "vertical": { title: "YouTube Shorts Algorithm Profile", rules: [
')
[void]$sb.Append('      { icon: RefreshCw, text: "Loop completion rate is the #1 signal — engineer a seamless ending-to-beginning bridge." },
')
[void]$sb.Append('      { icon: Zap, text: "Under 60 seconds earns Shorts shelf; over 60 seconds falls into standard feed with no loop benefit." },
')
[void]$sb.Append('      { icon: Heart, text: "Like velocity in first hour signals breakout potential — CTA must be immediate." },
')
[void]$sb.Append('      { icon: Share2, text: "Shorts don''t require subscribers to reach new viewers — go broad, not niche." },
')
[void]$sb.Append('    ]},
')
[void]$sb.Append('    "horizontal": { title: "YouTube Shorts (Horizontal) — Warning", rules: [
')
[void]$sb.Append('      { icon: AlertTriangle, text: "Horizontal Shorts receive significantly reduced algorithmic distribution — vertical is strongly advised." },
')
[void]$sb.Append('      { icon: Eye, text: "Content still renders in Shorts feed but with black bars — perceived quality drops sharply." },
')
[void]$sb.Append('      { icon: Shield, text: "This configuration is suboptimal. Only use if the visual content demands it (e.g., cinematic footage)." },
')
[void]$sb.Append('    ]},
')
[void]$sb.Append('  },
')
[void]$sb.Append('  "tiktok": {
')
[void]$sb.Append('    "vertical": { title: "TikTok FYP Algorithm Profile", rules: [
')
[void]$sb.Append('      { icon: Zap, text: "Completion rate + replays dominate FYP scoring above everything else." },
')
[void]$sb.Append('      { icon: Volume2, text: "Original audio or trending sound boosts discoverability by 2-3x." },
')
[void]$sb.Append('      { icon: Hash, text: "Spoken keywords are transcribed — SEO happens at the audio layer, not just caption." },
')
[void]$sb.Append('      { icon: Share2, text: "Shares to DMs are the highest-value signal for explosive growth velocity." },
')
[void]$sb.Append('    ]},
')
[void]$sb.Append('    "horizontal": { title: "TikTok Horizontal — Non-Standard", rules: [
')
[void]$sb.Append('      { icon: AlertTriangle, text: "TikTok is natively vertical — horizontal content faces a distribution penalty." },
')
[void]$sb.Append('      { icon: Eye, text: "If horizontal, ensure the center 9:16 crop is visually self-contained." },
')
[void]$sb.Append('      { icon: Info, text: "Gaming, reaction, or cinematic content may justify horizontal, but reach will be limited." },
')
[void]$sb.Append('    ]},
')
[void]$sb.Append('  },
')
[void]$sb.Append('  "reels": {
')
[void]$sb.Append('    "vertical": { title: "Instagram Reels Algorithm Profile", rules: [
')
[void]$sb.Append('      { icon: Bookmark, text: "Saves are the highest-value engagement signal — engineer a ''save-worthy'' moment explicitly." },
')
[void]$sb.Append('      { icon: Share2, text: "Story reshares from followers amplify Explore page reach significantly." },
')
[void]$sb.Append('      { icon: Eye, text: "Watch-through rate at 3 seconds and 50% are key thresholds for Explore distribution." },
')
[void]$sb.Append('      { icon: Heart, text: "Comment triggers (asks, debates, completions) extend algorithmic lifespan by days." },
')
[void]$sb.Append('    ]},
')
[void]$sb.Append('    "horizontal": { title: "Instagram Reels (Horizontal) — Warning", rules: [
')
[void]$sb.Append('      { icon: AlertTriangle, text: "Horizontal Reels receive reduced Explore distribution — Instagram enforces vertical-first norms." },
')
[void]$sb.Append('      { icon: Eye, text: "Feed preview crops to 4:5 — a horizontal Reel loses context in the feed thumbnail." },
')
[void]$sb.Append('      { icon: Shield, text: "Strongly recommend re-shooting or re-framing vertically for maximum algorithmic reach." },
')
[void]$sb.Append('    ]},
')
[void]$sb.Append('  },
')
[void]$sb.Append('};
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── HEURISTICS ──────────────────────────────────────────────────────────────
')
[void]$sb.Append('
')
[void]$sb.Append('function analyzeScript(script, platform, format, niche) {
')
[void]$sb.Append('  const words = script.trim().split(/\s+/).filter(Boolean);
')
[void]$sb.Append('  const wordCount = words.length;
')
[void]$sb.Append('  const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 3);
')
[void]$sb.Append('  const questionMarks = (script.match(/\?/g) || []).length;
')
[void]$sb.Append('  const exclamations = (script.match(/!/g) || []).length;
')
[void]$sb.Append('  const avgSentenceLen = sentences.length > 0 ? wordCount / sentences.length : 0;
')
[void]$sb.Append('  const hasHook = /^.{0,200}(you|imagine|what if|stop|wait|here''s|nobody|the truth|secret|mistake|wrong|this)/i.test(script);
')
[void]$sb.Append('  const hasCTA = /(subscribe|follow|like|share|comment|save|click|link in bio)/i.test(script);
')
[void]$sb.Append('  const hasLoopEnd = sentences.length > 1 && sentences[sentences.length - 1].split(/\s+/).length < 15;
')
[void]$sb.Append('  const nicheKeywords = NICHE_CONFIG[niche]?.keywords || [];
')
[void]$sb.Append('  const nicheMatches = nicheKeywords.filter(kw => script.toLowerCase().includes(kw)).length;
')
[void]$sb.Append('  const config = PLATFORM_CONFIG[platform];
')
[void]$sb.Append('  const [minWords, maxWords] = config.idealWordCount;
')
[void]$sb.Append('
')
[void]$sb.Append('  let score = 50, hookScore = 50;
')
[void]$sb.Append('  const flags = [], positives = [];
')
[void]$sb.Append('
')
[void]$sb.Append('  if (wordCount === 0) return null;
')
[void]$sb.Append('  if (wordCount < minWords) { score -= 15; flags.push({ severity:"high", msg:`Script is too short (${wordCount} words). Minimum recommended: ${minWords} words for ${config.label}.` }); }
')
[void]$sb.Append('  else if (wordCount > maxWords) { score -= 12; flags.push({ severity:"high", msg:`Script is too long (${wordCount} words). Maximum for ${config.label}: ~${maxWords} words. Risk: viewer drop-off.` }); }
')
[void]$sb.Append('  else { score += 15; positives.push(`Word count (${wordCount}) is optimal for ${config.label}.`); }
')
[void]$sb.Append('
')
[void]$sb.Append('  if (hasHook) { hookScore += 25; score += 8; positives.push("Opening line uses a recognized hook pattern."); }
')
[void]$sb.Append('  else { hookScore -= 20; flags.push({ severity:"high", msg:"No detectable hook in the first sentence. The algorithm rewards immediate pattern interrupts." }); }
')
[void]$sb.Append('
')
[void]$sb.Append('  if (questionMarks > 0) { hookScore += 10; score += 5; positives.push(`${questionMarks} question(s) found — good for engagement and curiosity loops.`); }
')
[void]$sb.Append('  else { flags.push({ severity:"medium", msg:"No questions detected. Questions increase comment engagement." }); }
')
[void]$sb.Append('
')
[void]$sb.Append('  if (exclamations > 3) { score += 3; positives.push("Emotional punctuation present — good for energy and pacing."); }
')
[void]$sb.Append('
')
[void]$sb.Append('  if (hasCTA) { score += 8; positives.push("Call-to-action detected."); }
')
[void]$sb.Append('  else { score -= 8; flags.push({ severity:"medium", msg:"No CTA found. Missing subscribe/follow/save/share directive." }); }
')
[void]$sb.Append('
')
[void]$sb.Append('  if (config.loopStrategy) {
')
[void]$sb.Append('    if (hasLoopEnd) { score += 10; positives.push("Short ending detected — good for loop potential."); }
')
[void]$sb.Append('    else { score -= 8; flags.push({ severity:"high", msg:"No loop-back ending detected. Short-form platforms prioritize re-watch rate." }); }
')
[void]$sb.Append('  }
')
[void]$sb.Append('
')
[void]$sb.Append('  if (nicheMatches >= 3) { score += 8; positives.push(`Strong niche keyword density (${nicheMatches} matches).`); }
')
[void]$sb.Append('  else if (nicheMatches === 0) { score -= 5; flags.push({ severity:"low", msg:`No ${NICHE_CONFIG[niche]?.label} niche keywords detected.` }); }
')
[void]$sb.Append('
')
[void]$sb.Append('  if (avgSentenceLen > 25) { score -= 8; flags.push({ severity:"medium", msg:`Average sentence length is ${Math.round(avgSentenceLen)} words — too long for short-form pacing.` }); }
')
[void]$sb.Append('  else if (avgSentenceLen < 10 && avgSentenceLen > 0) { score += 5; positives.push("Tight sentence structure — great for punchy delivery."); }
')
[void]$sb.Append('
')
[void]$sb.Append('  hookScore = Math.min(100, Math.max(10, hookScore));
')
[void]$sb.Append('  score = Math.min(99, Math.max(8, score));
')
[void]$sb.Append('
')
[void]$sb.Append('  const timeline = generateTimeline(sentences, wordCount);
')
[void]$sb.Append('  const checklist = (PLATFORM_CHECKLIST[platform] || []).map(item => {
')
[void]$sb.Append('    let checked = false;
')
[void]$sb.Append('    if (["hook3","hook30","hook2"].includes(item.id)) checked = hasHook;
')
[void]$sb.Append('    if (["cta","subscribe"].includes(item.id)) checked = hasCTA;
')
[void]$sb.Append('    if (["loop","nohang"].includes(item.id)) checked = hasLoopEnd;
')
[void]$sb.Append('    if (item.id === "spoken-seo") checked = nicheMatches >= 2;
')
[void]$sb.Append('    if (item.id === "length") checked = wordCount <= maxWords;
')
[void]$sb.Append('    if (item.id === "seo") checked = nicheMatches >= 1;
')
[void]$sb.Append('    if (["share","save"].includes(item.id)) checked = hasCTA;
')
[void]$sb.Append('    return { ...item, checked };
')
[void]$sb.Append('  });
')
[void]$sb.Append('
')
[void]$sb.Append('  return {
')
[void]$sb.Append('    score, hookScore, wordCount, flags, positives, timeline, checklist,
')
[void]$sb.Append('    hookAlternatives: HOOK_TEMPLATES[platform] || HOOK_TEMPLATES["yt-long"],
')
[void]$sb.Append('    calibration: PLATFORM_CALIBRATION[platform]?.[format] || PLATFORM_CALIBRATION[platform]?.["vertical"],
')
[void]$sb.Append('  };
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('function generateTimeline(sentences) {
')
[void]$sb.Append('  const wpm = 140;
')
[void]$sb.Append('  const points = [];
')
[void]$sb.Append('  let cumWords = 0;
')
[void]$sb.Append('  sentences.slice(0, 12).forEach((sentence, i) => {
')
[void]$sb.Append('    const sw = sentence.trim().split(/\s+/).filter(Boolean).length;
')
[void]$sb.Append('    cumWords += sw;
')
[void]$sb.Append('    const sec = Math.round((cumWords / wpm) * 60);
')
[void]$sb.Append('    const timeStr = sec < 60 ? `0:${String(sec).padStart(2,"0")}` : `${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`;
')
[void]$sb.Append('    const s = sentence.toLowerCase();
')
[void]$sb.Append('    let type = "neutral", note = "";
')
[void]$sb.Append('    if (i === 0) {
')
[void]$sb.Append('      type = s.match(/(you|stop|wait|imagine|secret|truth|nobody|mistake)/) ? "positive" : "warning";
')
[void]$sb.Append('      note = type === "positive" ? "Strong hook — algorithm rewards immediate pattern interrupt." : "Weak opening — no hook trigger detected.";
')
[void]$sb.Append('    } else if (sw > 30) { type = "warning"; note = "Long sentence — risk of monotone pacing. Insert visual cut here."; }
')
[void]$sb.Append('    else if (s.includes("?")) { type = "positive"; note = "Question creates curiosity gap — good for retention."; }
')
[void]$sb.Append('    else if (s.match(/(but|however|twist|actually|wait|plot)/)) { type = "positive"; note = "Narrative pivot — strong pattern interrupt."; }
')
[void]$sb.Append('    else if (i % 3 === 0) { type = "warning"; note = "Predicted drop-off zone. Inject visual element or emotional escalation."; }
')
[void]$sb.Append('    else { note = "Standard pacing — monitor with analytics after publish."; }
')
[void]$sb.Append('    points.push({ time: timeStr, sentence: sentence.trim().slice(0, 80) + (sentence.trim().length > 80 ? "…" : ""), type, note });
')
[void]$sb.Append('  });
')
[void]$sb.Append('  return points;
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── CLAUDE VISION ───────────────────────────────────────────────────────────
')
[void]$sb.Append('
')
[void]$sb.Append('async function analyzeFrameWithClaude(base64, timestamp, platform, niche) {
')
[void]$sb.Append('  if (!ANTHROPIC_API_KEY) {
')
[void]$sb.Append('    return `[Claude Vision not configured — add your ANTHROPIC_API_KEY to the app] Frame at ${timestamp} could not be analyzed.`;
')
[void]$sb.Append('  }
')
[void]$sb.Append('  const platformCfg = PLATFORM_CONFIG[platform];
')
[void]$sb.Append('  const prompt = `You are a social media algorithm expert and video content strategist. Analyze this video frame captured at timestamp ${timestamp} from a ${platformCfg.label} video in the ${NICHE_CONFIG[niche]?.label || niche} niche.
')
[void]$sb.Append('
')
[void]$sb.Append('Provide a SHORT, punchy audit (3-4 sentences max) covering:
')
[void]$sb.Append('1. Visual hook strength — does this frame stop the scroll?
')
[void]$sb.Append('2. On-screen text, captions, or overlays present and their effectiveness
')
[void]$sb.Append('3. Framing, composition, and lighting quality for this platform
')
[void]$sb.Append('4. One specific, actionable improvement
')
[void]$sb.Append('
')
[void]$sb.Append('Be direct, specific, and use creator language. Format as plain prose, no bullet points.`;
')
[void]$sb.Append('
')
[void]$sb.Append('  const res = await fetch("https://api.anthropic.com/v1/messages", {
')
[void]$sb.Append('    method: "POST",
')
[void]$sb.Append('    headers: {
')
[void]$sb.Append('      "Content-Type": "application/json",
')
[void]$sb.Append('      "x-api-key": ANTHROPIC_API_KEY,
')
[void]$sb.Append('      "anthropic-version": "2023-06-01",
')
[void]$sb.Append('      "anthropic-dangerous-direct-browser-access": "true",
')
[void]$sb.Append('    },
')
[void]$sb.Append('    body: JSON.stringify({
')
[void]$sb.Append('      model: "claude-sonnet-4-20250514",
')
[void]$sb.Append('      max_tokens: 200,
')
[void]$sb.Append('      messages: [{
')
[void]$sb.Append('        role: "user",
')
[void]$sb.Append('        content: [
')
[void]$sb.Append('          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
')
[void]$sb.Append('          { type: "text", text: prompt },
')
[void]$sb.Append('        ],
')
[void]$sb.Append('      }],
')
[void]$sb.Append('    }),
')
[void]$sb.Append('  });
')
[void]$sb.Append('  const data = await res.json();
')
[void]$sb.Append('  if (!res.ok) throw new Error(data.error?.message || "Claude Vision error");
')
[void]$sb.Append('  return data.content?.[0]?.text || "No analysis returned.";
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── UI COMPONENTS ───────────────────────────────────────────────────────────
')
[void]$sb.Append('
')
[void]$sb.Append('function CircularScore({ score }) {
')
[void]$sb.Append('  const r = 52, circ = 2 * Math.PI * r, pct = Math.min(100, Math.max(0, score));
')
[void]$sb.Append('  const dash = (pct / 100) * circ;
')
[void]$sb.Append('  const color = pct < 50 ? "#ef4444" : pct < 75 ? "#f59e0b" : "#22c55e";
')
[void]$sb.Append('  const glow = pct < 50 ? "rgba(239,68,68,0.4)" : pct < 75 ? "rgba(245,158,11,0.4)" : "rgba(34,197,94,0.4)";
')
[void]$sb.Append('  const label = pct < 50 ? "Needs Work" : pct < 75 ? "Promising" : "Viral-Ready";
')
[void]$sb.Append('  return (
')
[void]$sb.Append('    <div className="flex flex-col items-center gap-2">
')
[void]$sb.Append('      <div className="relative" style={{ filter: `drop-shadow(0 0 16px ${glow})` }}>
')
[void]$sb.Append('        <svg width="128" height="128" viewBox="0 0 128 128">
')
[void]$sb.Append('          <circle cx="64" cy="64" r={r} fill="none" stroke="#1e2433" strokeWidth="10" />
')
[void]$sb.Append('          <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
')
[void]$sb.Append('            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 64 64)"
')
[void]$sb.Append('            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
')
[void]$sb.Append('          <text x="64" y="60" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="monospace">{pct}</text>
')
[void]$sb.Append('          <text x="64" y="76" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">/ 100</text>
')
[void]$sb.Append('        </svg>
')
[void]$sb.Append('      </div>
')
[void]$sb.Append('      <span className="text-xs font-bold tracking-widest uppercase" style={{ color }}>{label}</span>
')
[void]$sb.Append('    </div>
')
[void]$sb.Append('  );
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('function ScoreBar({ label, value, color }) {
')
[void]$sb.Append('  return (
')
[void]$sb.Append('    <div className="space-y-1">
')
[void]$sb.Append('      <div className="flex justify-between text-xs text-slate-400">
')
[void]$sb.Append('        <span>{label}</span><span className="font-mono" style={{ color }}>{value}/100</span>
')
[void]$sb.Append('      </div>
')
[void]$sb.Append('      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
')
[void]$sb.Append('        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
')
[void]$sb.Append('      </div>
')
[void]$sb.Append('    </div>
')
[void]$sb.Append('  );
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('function Tag({ children, variant = "default" }) {
')
[void]$sb.Append('  const cls = {
')
[void]$sb.Append('    default: "bg-slate-700/50 text-slate-300 border-slate-600/40",
')
[void]$sb.Append('    positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
')
[void]$sb.Append('    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
')
[void]$sb.Append('    danger: "bg-red-500/10 text-red-400 border-red-500/20",
')
[void]$sb.Append('    accent: "bg-violet-500/10 text-violet-400 border-violet-500/20",
')
[void]$sb.Append('    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
')
[void]$sb.Append('  }[variant];
')
[void]$sb.Append('  return (
')
[void]$sb.Append('    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border font-medium ${cls}`}>
')
[void]$sb.Append('      {children}
')
[void]$sb.Append('    </span>
')
[void]$sb.Append('  );
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── VIDEO UPLOAD PANEL ──────────────────────────────────────────────────────
')
[void]$sb.Append('
')
[void]$sb.Append('const PIPELINE_STEPS = [
')
[void]$sb.Append('  { id: "upload",      icon: Upload,   label: "Uploading video" },
')
[void]$sb.Append('  { id: "extract",     icon: Film,     label: "Extracting audio" },
')
[void]$sb.Append('  { id: "transcribe",  icon: Mic,      label: "Transcribing with Whisper" },
')
[void]$sb.Append('  { id: "frames",      icon: Image,    label: "Extracting keyframes" },
')
[void]$sb.Append('  { id: "vision",      icon: Eye,      label: "Claude Vision analyzing frames" },
')
[void]$sb.Append('];
')
[void]$sb.Append('
')
[void]$sb.Append('function VideoUploadPanel({ onAnalysisComplete, platform, niche }) {
')
[void]$sb.Append('  const [dragOver, setDragOver] = useState(false);
')
[void]$sb.Append('  const [file, setFile] = useState(null);
')
[void]$sb.Append('  const [preview, setPreview] = useState(null);
')
[void]$sb.Append('  const [pipelineStep, setPipelineStep] = useState(null); // null | step id
')
[void]$sb.Append('  const [error, setError] = useState(null);
')
[void]$sb.Append('  const [progress, setProgress] = useState(0);
')
[void]$sb.Append('  const fileInputRef = useRef(null);
')
[void]$sb.Append('
')
[void]$sb.Append('  const handleFile = useCallback((f) => {
')
[void]$sb.Append('    if (!f || !f.type.startsWith("video/")) { setError("Please upload a valid video file."); return; }
')
[void]$sb.Append('    if (f.size > 500 * 1024 * 1024) { setError("File must be under 500MB."); return; }
')
[void]$sb.Append('    setFile(f);
')
[void]$sb.Append('    setError(null);
')
[void]$sb.Append('    setPreview(URL.createObjectURL(f));
')
[void]$sb.Append('  }, []);
')
[void]$sb.Append('
')
[void]$sb.Append('  const handleDrop = useCallback((e) => {
')
[void]$sb.Append('    e.preventDefault(); setDragOver(false);
')
[void]$sb.Append('    handleFile(e.dataTransfer.files[0]);
')
[void]$sb.Append('  }, [handleFile]);
')
[void]$sb.Append('
')
[void]$sb.Append('  const runPipeline = useCallback(async () => {
')
[void]$sb.Append('    if (!file) return;
')
[void]$sb.Append('    setError(null);
')
[void]$sb.Append('    setProgress(0);
')
[void]$sb.Append('
')
[void]$sb.Append('    try {
')
[void]$sb.Append('      // Step 1: Upload + server processing (transcription + frames)
')
[void]$sb.Append('      setPipelineStep("upload");
')
[void]$sb.Append('      const formData = new FormData();
')
[void]$sb.Append('      formData.append("video", file);
')
[void]$sb.Append('
')
[void]$sb.Append('      // XHR for upload progress
')
[void]$sb.Append('      const serverResponse = await new Promise((resolve, reject) => {
')
[void]$sb.Append('        const xhr = new XMLHttpRequest();
')
[void]$sb.Append('        xhr.open("POST", `${BACKEND_URL}/analyze`);
')
[void]$sb.Append('        xhr.upload.onprogress = (e) => {
')
[void]$sb.Append('          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 40));
')
[void]$sb.Append('        };
')
[void]$sb.Append('        xhr.onload = () => {
')
[void]$sb.Append('          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
')
[void]$sb.Append('          else reject(new Error(JSON.parse(xhr.responseText)?.error || "Server error"));
')
[void]$sb.Append('        };
')
[void]$sb.Append('        xhr.onerror = () => reject(new Error("Network error — is the server running?"));
')
[void]$sb.Append('        xhr.send(formData);
')
[void]$sb.Append('      });
')
[void]$sb.Append('
')
[void]$sb.Append('      setPipelineStep("extract");
')
[void]$sb.Append('      await delay(400);
')
[void]$sb.Append('      setProgress(50);
')
[void]$sb.Append('
')
[void]$sb.Append('      setPipelineStep("transcribe");
')
[void]$sb.Append('      await delay(600);
')
[void]$sb.Append('      setProgress(65);
')
[void]$sb.Append('
')
[void]$sb.Append('      setPipelineStep("frames");
')
[void]$sb.Append('      await delay(400);
')
[void]$sb.Append('      setProgress(75);
')
[void]$sb.Append('
')
[void]$sb.Append('      // Step 2: Claude Vision on each frame
')
[void]$sb.Append('      setPipelineStep("vision");
')
[void]$sb.Append('      const frames = serverResponse.frames || [];
')
[void]$sb.Append('      const analyzedFrames = [];
')
[void]$sb.Append('      for (let i = 0; i < frames.length; i++) {
')
[void]$sb.Append('        const frame = frames[i];
')
[void]$sb.Append('        let analysis = "";
')
[void]$sb.Append('        try {
')
[void]$sb.Append('          analysis = await analyzeFrameWithClaude(frame.base64, frame.label, platform, niche);
')
[void]$sb.Append('        } catch (e) {
')
[void]$sb.Append('          analysis = `Vision analysis unavailable: ${e.message}`;
')
[void]$sb.Append('        }
')
[void]$sb.Append('        analyzedFrames.push({ ...frame, analysis });
')
[void]$sb.Append('        setProgress(75 + Math.round(((i + 1) / frames.length) * 24));
')
[void]$sb.Append('      }
')
[void]$sb.Append('
')
[void]$sb.Append('      setProgress(100);
')
[void]$sb.Append('      setPipelineStep(null);
')
[void]$sb.Append('
')
[void]$sb.Append('      onAnalysisComplete({
')
[void]$sb.Append('        transcript: serverResponse.transcription?.text || "",
')
[void]$sb.Append('        duration: serverResponse.duration,
')
[void]$sb.Append('        durationLabel: serverResponse.durationLabel,
')
[void]$sb.Append('        filename: serverResponse.filename,
')
[void]$sb.Append('        frames: analyzedFrames,
')
[void]$sb.Append('        segments: serverResponse.transcription?.segments || [],
')
[void]$sb.Append('      });
')
[void]$sb.Append('
')
[void]$sb.Append('    } catch (e) {
')
[void]$sb.Append('      setError(e.message);
')
[void]$sb.Append('      setPipelineStep(null);
')
[void]$sb.Append('      setProgress(0);
')
[void]$sb.Append('    }
')
[void]$sb.Append('  }, [file, platform, niche, onAnalysisComplete]);
')
[void]$sb.Append('
')
[void]$sb.Append('  const clear = () => { setFile(null); setPreview(null); setError(null); setPipelineStep(null); setProgress(0); };
')
[void]$sb.Append('
')
[void]$sb.Append('  if (pipelineStep) {
')
[void]$sb.Append('    return (
')
[void]$sb.Append('      <div className="rounded-xl border border-violet-500/20 bg-[#0d1120] p-6 space-y-5">
')
[void]$sb.Append('        <div className="flex items-center gap-2 mb-2">
')
[void]$sb.Append('          <Cpu size={14} className="text-violet-400 animate-pulse" />
')
[void]$sb.Append('          <span className="heading text-sm font-semibold text-slate-200">Processing Pipeline</span>
')
[void]$sb.Append('        </div>
')
[void]$sb.Append('        {PIPELINE_STEPS.map((step, i) => {
')
[void]$sb.Append('          const stepIdx = PIPELINE_STEPS.findIndex(s => s.id === pipelineStep);
')
[void]$sb.Append('          const myIdx = i;
')
[void]$sb.Append('          const done = myIdx < stepIdx;
')
[void]$sb.Append('          const active = myIdx === stepIdx;
')
[void]$sb.Append('          return (
')
[void]$sb.Append('            <div key={step.id} className={`flex items-center gap-3 transition-opacity duration-300 ${active || done ? "opacity-100" : "opacity-25"}`}>
')
[void]$sb.Append('              <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${done ? "bg-emerald-500/20 border-emerald-500/30" : active ? "bg-violet-500/20 border-violet-500/30" : "bg-slate-800 border-slate-700"}`}>
')
[void]$sb.Append('                {done ? <CheckCircle size={13} className="text-emerald-400" /> :
')
[void]$sb.Append('                  active ? <Loader2 size={13} className="text-violet-400 animate-spin" /> :
')
[void]$sb.Append('                  <step.icon size={13} className="text-slate-600" />}
')
[void]$sb.Append('              </div>
')
[void]$sb.Append('              <span className={`text-xs ${active ? "text-slate-200 font-medium" : done ? "text-slate-500 line-through" : "text-slate-600"}`}>{step.label}</span>
')
[void]$sb.Append('              {active && <span className="text-xs text-violet-400 font-mono ml-auto">{progress}%</span>}
')
[void]$sb.Append('            </div>
')
[void]$sb.Append('          );
')
[void]$sb.Append('        })}
')
[void]$sb.Append('        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
')
[void]$sb.Append('          <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
')
[void]$sb.Append('        </div>
')
[void]$sb.Append('      </div>
')
[void]$sb.Append('    );
')
[void]$sb.Append('  }
')
[void]$sb.Append('
')
[void]$sb.Append('  return (
')
[void]$sb.Append('    <div className="rounded-xl border border-slate-800 bg-[#0d1120] overflow-hidden">
')
[void]$sb.Append('      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
')
[void]$sb.Append('        <span className="heading text-sm font-semibold text-slate-300 flex items-center gap-2">
')
[void]$sb.Append('          <FileVideo size={13} className="text-violet-400" />Video Upload
')
[void]$sb.Append('        </span>
')
[void]$sb.Append('        <Tag variant="blue"><Wifi size={9} />Server: {BACKEND_URL.split("//")[1]}</Tag>
')
[void]$sb.Append('      </div>
')
[void]$sb.Append('
')
[void]$sb.Append('      {!file ? (
')
[void]$sb.Append('        <div
')
[void]$sb.Append('          className={`m-3 rounded-lg border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-8 cursor-pointer ${dragOver ? "border-violet-500 bg-violet-500/5" : "border-slate-700 hover:border-slate-600"}`}
')
[void]$sb.Append('          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
')
[void]$sb.Append('          onDragLeave={() => setDragOver(false)}
')
[void]$sb.Append('          onDrop={handleDrop}
')
[void]$sb.Append('          onClick={() => fileInputRef.current?.click()}
')
[void]$sb.Append('        >
')
[void]$sb.Append('          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
')
[void]$sb.Append('          <Upload size={24} className={`mb-3 ${dragOver ? "text-violet-400" : "text-slate-600"}`} />
')
[void]$sb.Append('          <p className="text-xs text-slate-400 text-center leading-relaxed">
')
[void]$sb.Append('            Drop a video here or <span className="text-violet-400">click to browse</span>
')
[void]$sb.Append('          </p>
')
[void]$sb.Append('          <p className="text-xs text-slate-600 mt-1">MP4, MOV, AVI, WebM · Max 500MB</p>
')
[void]$sb.Append('        </div>
')
[void]$sb.Append('      ) : (
')
[void]$sb.Append('        <div className="p-3 space-y-3">
')
[void]$sb.Append('          <div className="relative rounded-lg overflow-hidden bg-slate-900">
')
[void]$sb.Append('            <video src={preview} className="w-full max-h-36 object-contain" controls />
')
[void]$sb.Append('            <button onClick={clear} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/40 transition-colors">
')
[void]$sb.Append('              <X size={11} className="text-slate-400" />
')
[void]$sb.Append('            </button>
')
[void]$sb.Append('          </div>
')
[void]$sb.Append('          <div className="flex items-center gap-2">
')
[void]$sb.Append('            <FileVideo size={12} className="text-slate-500 shrink-0" />
')
[void]$sb.Append('            <span className="text-xs text-slate-400 truncate flex-1">{file.name}</span>
')
[void]$sb.Append('            <Tag variant="default">{(file.size / 1e6).toFixed(1)} MB</Tag>
')
[void]$sb.Append('          </div>
')
[void]$sb.Append('        </div>
')
[void]$sb.Append('      )}
')
[void]$sb.Append('
')
[void]$sb.Append('      {error && (
')
[void]$sb.Append('        <div className="mx-3 mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
')
[void]$sb.Append('          <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
')
[void]$sb.Append('          <p className="text-xs text-red-400">{error}</p>
')
[void]$sb.Append('        </div>
')
[void]$sb.Append('      )}
')
[void]$sb.Append('
')
[void]$sb.Append('      {file && (
')
[void]$sb.Append('        <div className="px-3 pb-3">
')
[void]$sb.Append('          <button
')
[void]$sb.Append('            onClick={runPipeline}
')
[void]$sb.Append('            className="w-full py-2.5 rounded-lg text-xs font-bold heading flex items-center justify-center gap-2 transition-all duration-200"
')
[void]$sb.Append('            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", boxShadow: "0 0 20px rgba(124,58,237,0.25)" }}
')
[void]$sb.Append('          >
')
[void]$sb.Append('            <Play size={12} />Analyze Video
')
[void]$sb.Append('          </button>
')
[void]$sb.Append('        </div>
')
[void]$sb.Append('      )}
')
[void]$sb.Append('    </div>
')
[void]$sb.Append('  );
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('const delay = (ms) => new Promise(r => setTimeout(r, ms));
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── FRAME STRIP ─────────────────────────────────────────────────────────────
')
[void]$sb.Append('
')
[void]$sb.Append('function FrameStrip({ frames }) {
')
[void]$sb.Append('  const [selected, setSelected] = useState(0);
')
[void]$sb.Append('  if (!frames || frames.length === 0) return null;
')
[void]$sb.Append('  const frame = frames[selected];
')
[void]$sb.Append('
')
[void]$sb.Append('  return (
')
[void]$sb.Append('    <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
')
[void]$sb.Append('      <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
')
[void]$sb.Append('        <Eye size={14} className="text-cyan-400" />Claude Vision · Frame Analysis
')
[void]$sb.Append('        <Tag variant="blue"><Film size={9} />{frames.length} frames</Tag>
')
[void]$sb.Append('      </h3>
')
[void]$sb.Append('
')
[void]$sb.Append('      {/* Filmstrip */}
')
[void]$sb.Append('      <div className="flex gap-2 overflow-x-auto pb-1">
')
[void]$sb.Append('        {frames.map((f, i) => (
')
[void]$sb.Append('          <button
')
[void]$sb.Append('            key={i}
')
[void]$sb.Append('            onClick={() => setSelected(i)}
')
[void]$sb.Append('            className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-150 ${selected === i ? "border-cyan-500" : "border-slate-700 hover:border-slate-500"}`}
')
[void]$sb.Append('          >
')
[void]$sb.Append('            <div className="relative">
')
[void]$sb.Append('              <img src={`data:image/jpeg;base64,${f.base64}`} alt={`Frame ${f.label}`} className="w-20 h-12 object-cover" />
')
[void]$sb.Append('              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center py-0.5">
')
[void]$sb.Append('                <span className="text-[9px] font-mono text-slate-300">{f.label}</span>
')
[void]$sb.Append('              </div>
')
[void]$sb.Append('            </div>
')
[void]$sb.Append('          </button>
')
[void]$sb.Append('        ))}
')
[void]$sb.Append('      </div>
')
[void]$sb.Append('
')
[void]$sb.Append('      {/* Selected frame detail */}
')
[void]$sb.Append('      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
')
[void]$sb.Append('        <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
')
[void]$sb.Append('          <img src={`data:image/jpeg;base64,${frame.base64}`} alt={`Frame at ${frame.label}`} className="w-full object-contain max-h-52" />
')
[void]$sb.Append('          <div className="px-3 py-2 flex items-center gap-2">
')
[void]$sb.Append('            <Clock size={10} className="text-slate-500" />
')
[void]$sb.Append('            <span className="text-xs font-mono text-slate-400">{frame.label}</span>
')
[void]$sb.Append('            {selected === 0 && <Tag variant="danger"><Flame size={9} />Hook Frame</Tag>}
')
[void]$sb.Append('            {selected === 1 && <Tag variant="warning"><Zap size={9} />3-sec Test</Tag>}
')
[void]$sb.Append('          </div>
')
[void]$sb.Append('        </div>
')
[void]$sb.Append('        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
')
[void]$sb.Append('          <div>
')
[void]$sb.Append('            <div className="flex items-center gap-2 mb-3">
')
[void]$sb.Append('              <Cpu size={12} className="text-cyan-400" />
')
[void]$sb.Append('              <span className="text-xs font-semibold text-slate-300">Claude Vision Analysis</span>
')
[void]$sb.Append('            </div>
')
[void]$sb.Append('            {frame.analysis ? (
')
[void]$sb.Append('              <p className="text-xs text-slate-400 leading-relaxed">{frame.analysis}</p>
')
[void]$sb.Append('            ) : (
')
[void]$sb.Append('              <div className="flex items-center gap-2 text-xs text-slate-600">
')
[void]$sb.Append('                <Loader2 size={11} className="animate-spin" />Analyzing...
')
[void]$sb.Append('              </div>
')
[void]$sb.Append('            )}
')
[void]$sb.Append('          </div>
')
[void]$sb.Append('          <div className="flex gap-2 mt-4">
')
[void]$sb.Append('            <button onClick={() => setSelected(Math.max(0, selected - 1))} disabled={selected === 0} className="flex-1 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 disabled:opacity-30 hover:border-slate-500 transition-colors">← Prev</button>
')
[void]$sb.Append('            <button onClick={() => setSelected(Math.min(frames.length - 1, selected + 1))} disabled={selected === frames.length - 1} className="flex-1 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 disabled:opacity-30 hover:border-slate-500 transition-colors">Next →</button>
')
[void]$sb.Append('          </div>
')
[void]$sb.Append('        </div>
')
[void]$sb.Append('      </div>
')
[void]$sb.Append('    </div>
')
[void]$sb.Append('  );
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── MAIN APP ────────────────────────────────────────────────────────────────
')
[void]$sb.Append('
')
[void]$sb.Append('export default function ViralAuditAI() {
')
[void]$sb.Append('  const [script, setScript] = useState("");
')
[void]$sb.Append('  const [platform, setPlatform] = useState("tiktok");
')
[void]$sb.Append('  const [format, setFormat] = useState("vertical");
')
[void]$sb.Append('  const [niche, setNiche] = useState("tech");
')
[void]$sb.Append('  const [loading, setLoading] = useState(false);
')
[void]$sb.Append('  const [results, setResults] = useState(null);
')
[void]$sb.Append('  const [activeTab, setActiveTab] = useState("hook");
')
[void]$sb.Append('  const [checklistState, setChecklistState] = useState({});
')
[void]$sb.Append('  const [animIn, setAnimIn] = useState(false);
')
[void]$sb.Append('  const [videoData, setVideoData] = useState(null); // frames + metadata from pipeline
')
[void]$sb.Append('  const [inputMode, setInputMode] = useState("text"); // "text" | "video"
')
[void]$sb.Append('
')
[void]$sb.Append('  const wordCount = useMemo(() => script.trim().split(/\s+/).filter(Boolean).length, [script]);
')
[void]$sb.Append('  const platformCfg = PLATFORM_CONFIG[platform];
')
[void]$sb.Append('
')
[void]$sb.Append('  const handleVideoAnalysisComplete = useCallback((data) => {
')
[void]$sb.Append('    setVideoData(data);
')
[void]$sb.Append('    if (data.transcript) {
')
[void]$sb.Append('      setScript(data.transcript);
')
[void]$sb.Append('    }
')
[void]$sb.Append('  }, []);
')
[void]$sb.Append('
')
[void]$sb.Append('  function runAudit() {
')
[void]$sb.Append('    if (!script.trim()) return;
')
[void]$sb.Append('    setLoading(true);
')
[void]$sb.Append('    setResults(null);
')
[void]$sb.Append('    setAnimIn(false);
')
[void]$sb.Append('    setTimeout(() => {
')
[void]$sb.Append('      const r = analyzeScript(script, platform, format, niche);
')
[void]$sb.Append('      const initialChecklist = {};
')
[void]$sb.Append('      r.checklist.forEach(item => { initialChecklist[item.id] = item.checked; });
')
[void]$sb.Append('      setChecklistState(initialChecklist);
')
[void]$sb.Append('      setResults(r);
')
[void]$sb.Append('      setLoading(false);
')
[void]$sb.Append('      setActiveTab("hook");
')
[void]$sb.Append('      setTimeout(() => setAnimIn(true), 50);
')
[void]$sb.Append('    }, 1800);
')
[void]$sb.Append('  }
')
[void]$sb.Append('
')
[void]$sb.Append('  return (
')
[void]$sb.Append('    <div className="min-h-screen bg-[#090c14] text-slate-100" style={{ fontFamily: "''DM Mono'',''Fira Code'',monospace" }}>
')
[void]$sb.Append('      <style>{`
')
[void]$sb.Append('        @import url(''https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Space+Grotesk:wght@400;500;600;700;800&display=swap'');
')
[void]$sb.Append('        .heading { font-family: ''Space Grotesk'', sans-serif; }
')
[void]$sb.Append('        .fade-up { opacity:0; transform:translateY(16px); transition:opacity .5s ease,transform .5s ease; }
')
[void]$sb.Append('        .fade-up.in { opacity:1; transform:translateY(0); }
')
[void]$sb.Append('        .fade-up.in.d1 { transition-delay:.05s; } .fade-up.in.d2 { transition-delay:.12s; }
')
[void]$sb.Append('        .fade-up.in.d3 { transition-delay:.2s; }  .fade-up.in.d4 { transition-delay:.28s; }
')
[void]$sb.Append('        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0f1320} ::-webkit-scrollbar-thumb{background:#2a3050;border-radius:2px}
')
[void]$sb.Append('        .grid-bg{background-image:linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px);background-size:32px 32px}
')
[void]$sb.Append('      `}</style>
')
[void]$sb.Append('
')
[void]$sb.Append('      {/* Header */}
')
[void]$sb.Append('      <header className="border-b border-slate-800/60 bg-[#090c14]/80 backdrop-blur-sm sticky top-0 z-50">
')
[void]$sb.Append('        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
')
[void]$sb.Append('          <div className="flex items-center gap-3">
')
[void]$sb.Append('            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
')
[void]$sb.Append('              <Cpu size={14} className="text-violet-400" />
')
[void]$sb.Append('            </div>
')
[void]$sb.Append('            <span className="heading font-bold text-lg tracking-tight text-white">ViralAudit <span className="text-violet-400">AI</span></span>
')
[void]$sb.Append('            <Tag variant="accent"><Zap size={10} />v3.0</Tag>
')
[void]$sb.Append('          </div>
')
[void]$sb.Append('          <div className="flex items-center gap-3 text-xs text-slate-500">
')
[void]$sb.Append('            <span className="hidden sm:inline">Vision + Whisper Engine</span>
')
[void]$sb.Append('            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
')
[void]$sb.Append('            <span className="text-emerald-400 font-medium">ONLINE</span>
')
[void]$sb.Append('          </div>
')
[void]$sb.Append('        </div>
')
[void]$sb.Append('      </header>
')
[void]$sb.Append('
')
[void]$sb.Append('      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
')
[void]$sb.Append('
')
[void]$sb.Append('        {/* ── SIDEBAR ── */}
')
[void]$sb.Append('        <aside className="space-y-4">
')
[void]$sb.Append('
')
[void]$sb.Append('          {/* Input mode toggle */}
')
[void]$sb.Append('          <div className="flex gap-1 bg-[#0d1120] border border-slate-800 rounded-xl p-1">
')
[void]$sb.Append('            {[["text","Script / Text", Scissors], ["video","Video Upload", FileVideo]].map(([mode, label, Icon]) => (
')
[void]$sb.Append('              <button key={mode} onClick={() => setInputMode(mode)}
')
[void]$sb.Append('                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${inputMode === mode ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-slate-500 hover:text-slate-300"}`}>
')
[void]$sb.Append('                <Icon size={12} />{label}
')
[void]$sb.Append('              </button>
')
[void]$sb.Append('            ))}
')
[void]$sb.Append('          </div>
')
[void]$sb.Append('
')
[void]$sb.Append('          {/* Script Input */}
')
[void]$sb.Append('          {inputMode === "text" && (
')
[void]$sb.Append('            <div className="rounded-xl border border-slate-800 bg-[#0d1120] overflow-hidden">
')
[void]$sb.Append('              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
')
[void]$sb.Append('                <span className="heading text-sm font-semibold text-slate-300">Script / Transcript</span>
')
[void]$sb.Append('                <span className="text-xs font-mono text-slate-500">{wordCount} words</span>
')
[void]$sb.Append('              </div>
')
[void]$sb.Append('              <textarea
')
[void]$sb.Append('                className="w-full bg-transparent p-4 text-sm text-slate-300 placeholder:text-slate-600 resize-none outline-none leading-relaxed"
')
[void]$sb.Append('                rows={12}
')
[void]$sb.Append('                placeholder={"Paste your script, or switch to Video Upload to auto-transcribe...\n\nExample:\n\"Wait — before you close this tab, what if I told you there''s a way to grow 10k followers in 30 days?\""}
')
[void]$sb.Append('                value={script}
')
[void]$sb.Append('                onChange={e => setScript(e.target.value)}
')
[void]$sb.Append('              />
')
[void]$sb.Append('              {wordCount > 0 && (
')
[void]$sb.Append('                <div className="px-4 pb-3">
')
[void]$sb.Append('                  <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
')
[void]$sb.Append('                    <div className="h-full rounded-full transition-all duration-300"
')
[void]$sb.Append('                      style={{ width: `${Math.min(100, (wordCount / PLATFORM_CONFIG[platform].idealWordCount[1]) * 100)}%`,
')
[void]$sb.Append('                        backgroundColor: wordCount > PLATFORM_CONFIG[platform].idealWordCount[1] ? "#ef4444" : wordCount < PLATFORM_CONFIG[platform].idealWordCount[0] ? "#f59e0b" : "#22c55e" }} />
')
[void]$sb.Append('                  </div>
')
[void]$sb.Append('                  <p className="text-xs text-slate-600 mt-1">Ideal: {PLATFORM_CONFIG[platform].idealWordCount[0]}–{PLATFORM_CONFIG[platform].idealWordCount[1]} words for {platformCfg.label}</p>
')
[void]$sb.Append('                </div>
')
[void]$sb.Append('              )}
')
[void]$sb.Append('            </div>
')
[void]$sb.Append('          )}
')
[void]$sb.Append('
')
[void]$sb.Append('          {/* Video Upload */}
')
[void]$sb.Append('          {inputMode === "video" && (
')
[void]$sb.Append('            <>
')
[void]$sb.Append('              <VideoUploadPanel onAnalysisComplete={handleVideoAnalysisComplete} platform={platform} niche={niche} />
')
[void]$sb.Append('              {videoData && (
')
[void]$sb.Append('                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
')
[void]$sb.Append('                  <div className="flex items-center gap-2">
')
[void]$sb.Append('                    <CheckCircle size={13} className="text-emerald-400" />
')
[void]$sb.Append('                    <span className="heading text-sm font-semibold text-emerald-300">Video Processed</span>
')
[void]$sb.Append('                  </div>
')
[void]$sb.Append('                  <div className="grid grid-cols-2 gap-2 text-xs">
')
[void]$sb.Append('                    <div className="text-slate-400">Duration <span className="text-slate-200 font-mono ml-1">{videoData.durationLabel}</span></div>
')
[void]$sb.Append('                    <div className="text-slate-400">Frames <span className="text-slate-200 font-mono ml-1">{videoData.frames?.length || 0}</span></div>
')
[void]$sb.Append('                  </div>
')
[void]$sb.Append('                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 italic">"{videoData.transcript?.slice(0, 100)}…"</p>
')
[void]$sb.Append('                  <div className="flex gap-2 pt-1">
')
[void]$sb.Append('                    <button onClick={() => setInputMode("text")} className="flex-1 text-xs py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-500 transition-colors flex items-center justify-center gap-1">
')
[void]$sb.Append('                      <Scissors size={10} />Edit Transcript
')
[void]$sb.Append('                    </button>
')
[void]$sb.Append('                  </div>
')
[void]$sb.Append('                </div>
')
[void]$sb.Append('              )}
')
[void]$sb.Append('            </>
')
[void]$sb.Append('          )}
')
[void]$sb.Append('
')
[void]$sb.Append('          {/* Platform */}
')
[void]$sb.Append('          <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-4 space-y-3">
')
[void]$sb.Append('            <span className="heading text-sm font-semibold text-slate-300 block">Platform</span>
')
[void]$sb.Append('            <div className="grid grid-cols-2 gap-2">
')
[void]$sb.Append('              {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
')
[void]$sb.Append('                <button key={key} onClick={() => setPlatform(key)}
')
[void]$sb.Append('                  className={`rounded-lg px-3 py-2.5 text-xs font-medium border transition-all duration-200 text-left ${platform === key ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600"}`}>
')
[void]$sb.Append('                  <span className="block text-base leading-none mb-1">{cfg.icon}</span>{cfg.label}
')
[void]$sb.Append('                </button>
')
[void]$sb.Append('              ))}
')
[void]$sb.Append('            </div>
')
[void]$sb.Append('          </div>
')
[void]$sb.Append('
')
[void]$sb.Append('          {/* Format */}
')
[void]$sb.Append('          <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-4 space-y-3">
')
[void]$sb.Append('            <span className="heading text-sm font-semibold text-slate-300 block">Format</span>
')
[void]$sb.Append('            <div className="flex gap-2">
')
[void]$sb.Append('              {[["vertical","Vertical 9:16","▯"],["horizontal","Horizontal 16:9","▭"]].map(([val, label, icon]) => (
')
[void]$sb.Append('                <button key={val} onClick={() => setFormat(val)}
')
[void]$sb.Append('                  className={`flex-1 rounded-lg py-2.5 text-xs font-medium border transition-all duration-200 ${format === val ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600"}`}>
')
[void]$sb.Append('                  <span className="block text-lg leading-none mb-0.5">{icon}</span>{label}
')
[void]$sb.Append('                </button>
')
[void]$sb.Append('              ))}
')
[void]$sb.Append('            </div>
')
[void]$sb.Append('          </div>
')
[void]$sb.Append('
')
[void]$sb.Append('          {/* Niche */}
')
[void]$sb.Append('          <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-4 space-y-3">
')
[void]$sb.Append('            <span className="heading text-sm font-semibold text-slate-300 block">Content Niche</span>
')
[void]$sb.Append('            <div className="flex flex-wrap gap-2">
')
[void]$sb.Append('              {Object.entries(NICHE_CONFIG).map(([key, cfg]) => (
')
[void]$sb.Append('                <button key={key} onClick={() => setNiche(key)}
')
[void]$sb.Append('                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${niche === key ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600"}`}>
')
[void]$sb.Append('                  {cfg.label}
')
[void]$sb.Append('                </button>
')
[void]$sb.Append('              ))}
')
[void]$sb.Append('            </div>
')
[void]$sb.Append('          </div>
')
[void]$sb.Append('
')
[void]$sb.Append('          {/* Run Audit */}
')
[void]$sb.Append('          <button onClick={runAudit} disabled={!script.trim() || loading}
')
[void]$sb.Append('            className="w-full rounded-xl py-4 font-bold text-sm tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 heading"
')
[void]$sb.Append('            style={{ background: script.trim() && !loading ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : undefined, backgroundColor: !script.trim() || loading ? "#1e2433" : undefined, color:"white", boxShadow: script.trim() && !loading ? "0 0 24px rgba(124,58,237,0.3)" : undefined }}>
')
[void]$sb.Append('            {loading ? <><Loader2 size={16} className="animate-spin" />Running Audit...</> : <><Zap size={16} />Run Algorithmic Audit</>}
')
[void]$sb.Append('          </button>
')
[void]$sb.Append('
')
[void]$sb.Append('          {loading && (
')
[void]$sb.Append('            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-2">
')
[void]$sb.Append('              {["Parsing script structure...","Calibrating platform heuristics...","Running hook analysis...","Generating retention timeline..."].map((step, i) => (
')
[void]$sb.Append('                <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
')
[void]$sb.Append('                  <Loader2 size={10} className="animate-spin text-violet-400" style={{ animationDelay:`${i*0.2}s` }} />
')
[void]$sb.Append('                  {step}
')
[void]$sb.Append('                </div>
')
[void]$sb.Append('              ))}
')
[void]$sb.Append('            </div>
')
[void]$sb.Append('          )}
')
[void]$sb.Append('        </aside>
')
[void]$sb.Append('
')
[void]$sb.Append('        {/* ── MAIN ── */}
')
[void]$sb.Append('        <main className="space-y-5">
')
[void]$sb.Append('          {!results && !loading && (
')
[void]$sb.Append('            <div className="grid-bg rounded-2xl border border-slate-800/50 min-h-[600px] flex flex-col items-center justify-center text-center p-12">
')
[void]$sb.Append('              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
')
[void]$sb.Append('                <BarChart3 size={28} className="text-violet-400" />
')
[void]$sb.Append('              </div>
')
[void]$sb.Append('              <h2 className="heading text-2xl font-bold text-slate-300 mb-3">Awaiting Audit Input</h2>
')
[void]$sb.Append('              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">Paste a script or upload a video. The AI will transcribe, analyze key frames with Claude Vision, and run a full algorithmic audit.</p>
')
[void]$sb.Append('              <div className="mt-8 flex flex-wrap gap-3 justify-center">
')
[void]$sb.Append('                {["Hook Surgery","Retention Timeline","Platform Calibration","Frame-by-Frame Vision","Whisper Transcription"].map(f => (
')
[void]$sb.Append('                  <Tag key={f} variant="accent"><Zap size={10} />{f}</Tag>
')
[void]$sb.Append('                ))}
')
[void]$sb.Append('              </div>
')
[void]$sb.Append('            </div>
')
[void]$sb.Append('          )}
')
[void]$sb.Append('
')
[void]$sb.Append('          {results && (
')
[void]$sb.Append('            <div className="space-y-5">
')
[void]$sb.Append('              {/* Score Header */}
')
[void]$sb.Append('              <div className={`fade-up ${animIn?"in d1":""} rounded-xl border border-slate-800 bg-[#0d1120] p-6`}>
')
[void]$sb.Append('                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
')
[void]$sb.Append('                  <CircularScore score={results.score} />
')
[void]$sb.Append('                  <div className="flex-1 space-y-4">
')
[void]$sb.Append('                    <div>
')
[void]$sb.Append('                      <h2 className="heading text-xl font-bold text-white">Virality Score: {results.score}/100</h2>
')
[void]$sb.Append('                      <p className="text-sm text-slate-400 mt-1">
')
[void]$sb.Append('                        {results.score < 50 ? "Significant structural issues detected. High drop-off risk." :
')
[void]$sb.Append('                         results.score < 75 ? "Solid foundation with key optimization opportunities remaining." :
')
[void]$sb.Append('                         "Strong algorithmic alignment. Minor polish needed for peak performance."}
')
[void]$sb.Append('                      </p>
')
[void]$sb.Append('                      {videoData && (
')
[void]$sb.Append('                        <div className="flex items-center gap-2 mt-2">
')
[void]$sb.Append('                          <Tag variant="blue"><Film size={9} />{videoData.filename}</Tag>
')
[void]$sb.Append('                          <Tag variant="blue"><Clock size={9} />{videoData.durationLabel}</Tag>
')
[void]$sb.Append('                          <Tag variant="positive"><Mic size={9} />Whisper transcribed</Tag>
')
[void]$sb.Append('                        </div>
')
[void]$sb.Append('                      )}
')
[void]$sb.Append('                    </div>
')
[void]$sb.Append('                    <div className="space-y-2">
')
[void]$sb.Append('                      <ScoreBar label="Hook Strength" value={results.hookScore} color={results.hookScore < 50 ? "#ef4444" : results.hookScore < 75 ? "#f59e0b" : "#22c55e"} />
')
[void]$sb.Append('                      <ScoreBar label="Pacing & Structure" value={Math.min(100, 40 + results.positives.length * 10)} color="#818cf8" />
')
[void]$sb.Append('                      <ScoreBar label="Platform Alignment" value={Math.min(100, 35 + results.checklist.filter(c => checklistState[c.id]).length * 8)} color="#22d3ee" />
')
[void]$sb.Append('                    </div>
')
[void]$sb.Append('                    <div className="flex flex-wrap gap-2">
')
[void]$sb.Append('                      <Tag variant={results.flags.some(f=>f.severity==="high")?"danger":"warning"}>
')
[void]$sb.Append('                        <AlertTriangle size={10} />{results.flags.filter(f=>f.severity==="high").length} Critical Issues
')
[void]$sb.Append('                      </Tag>
')
[void]$sb.Append('                      <Tag variant="positive"><CheckCircle size={10} />{results.positives.length} Strengths</Tag>
')
[void]$sb.Append('                      <Tag variant="default"><Target size={10} />{platformCfg.label} · {format === "vertical"?"9:16":"16:9"}</Tag>
')
[void]$sb.Append('                    </div>
')
[void]$sb.Append('                  </div>
')
[void]$sb.Append('                </div>
')
[void]$sb.Append('              </div>
')
[void]$sb.Append('
')
[void]$sb.Append('              {/* Frame Strip — only if video was uploaded */}
')
[void]$sb.Append('              {videoData?.frames?.length > 0 && (
')
[void]$sb.Append('                <div className={`fade-up ${animIn?"in d2":""}`}>
')
[void]$sb.Append('                  <FrameStrip frames={videoData.frames} />
')
[void]$sb.Append('                </div>
')
[void]$sb.Append('              )}
')
[void]$sb.Append('
')
[void]$sb.Append('              {/* Platform Calibration */}
')
[void]$sb.Append('              {results.calibration && (
')
[void]$sb.Append('                <div className={`fade-up ${animIn?"in d2":""} rounded-xl border bg-[#0d1120] p-5 ${platformCfg.bgClass}`}>
')
[void]$sb.Append('                  <div className="flex items-center gap-2 mb-4">
')
[void]$sb.Append('                    <Radio size={14} className={platformCfg.accentClass} />
')
[void]$sb.Append('                    <h3 className="heading text-sm font-semibold text-slate-200">{results.calibration.title}</h3>
')
[void]$sb.Append('                  </div>
')
[void]$sb.Append('                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
')
[void]$sb.Append('                    {results.calibration.rules.map((rule, i) => (
')
[void]$sb.Append('                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
')
[void]$sb.Append('                        <rule.icon size={14} className={`mt-0.5 shrink-0 ${platformCfg.accentClass}`} />
')
[void]$sb.Append('                        <p className="text-xs text-slate-400 leading-relaxed">{rule.text}</p>
')
[void]$sb.Append('                      </div>
')
[void]$sb.Append('                    ))}
')
[void]$sb.Append('                  </div>
')
[void]$sb.Append('                </div>
')
[void]$sb.Append('              )}
')
[void]$sb.Append('
')
[void]$sb.Append('              {/* Tab Bar */}
')
[void]$sb.Append('              <div className={`fade-up ${animIn?"in d3":""} flex gap-1 bg-[#0d1120] border border-slate-800 rounded-xl p-1`}>
')
[void]$sb.Append('                {[
')
[void]$sb.Append('                  { id:"hook", icon:Scissors, label:"Hook Surgery" },
')
[void]$sb.Append('                  { id:"timeline", icon:Clock, label:"Retention Timeline" },
')
[void]$sb.Append('                  { id:"checklist", icon:ListChecks, label:"Checklist" },
')
[void]$sb.Append('                ].map(tab => (
')
[void]$sb.Append('                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
')
[void]$sb.Append('                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${activeTab===tab.id ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-slate-500 hover:text-slate-300"}`}>
')
[void]$sb.Append('                    <tab.icon size={12} /><span className="hidden sm:inline">{tab.label}</span>
')
[void]$sb.Append('                  </button>
')
[void]$sb.Append('                ))}
')
[void]$sb.Append('              </div>
')
[void]$sb.Append('
')
[void]$sb.Append('              {/* Tab Content */}
')
[void]$sb.Append('              <div className={`fade-up ${animIn?"in d4":""}`}>
')
[void]$sb.Append('
')
[void]$sb.Append('                {activeTab === "hook" && (
')
[void]$sb.Append('                  <div className="space-y-4">
')
[void]$sb.Append('                    <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
')
[void]$sb.Append('                      <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
')
[void]$sb.Append('                        <Scissors size={14} className="text-violet-400" />Hook Analysis · {platformCfg.hookWindow}
')
[void]$sb.Append('                      </h3>
')
[void]$sb.Append('                      <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
')
[void]$sb.Append('                        <div className="text-center">
')
[void]$sb.Append('                          <div className="text-2xl font-bold font-mono" style={{ color: results.hookScore < 50 ? "#ef4444" : results.hookScore < 75 ? "#f59e0b" : "#22c55e" }}>{results.hookScore}</div>
')
[void]$sb.Append('                          <div className="text-xs text-slate-500">Hook Score</div>
')
[void]$sb.Append('                        </div>
')
[void]$sb.Append('                        <div className="flex-1 space-y-2">
')
[void]$sb.Append('                          {results.flags.filter(f=>f.severity==="high").slice(0,2).map((f,i)=>(
')
[void]$sb.Append('                            <div key={i} className="flex items-start gap-2 text-xs text-red-400"><XCircle size={11} className="mt-0.5 shrink-0" />{f.msg}</div>
')
[void]$sb.Append('                          ))}
')
[void]$sb.Append('                          {results.positives.slice(0,2).map((p,i)=>(
')
[void]$sb.Append('                            <div key={i} className="flex items-start gap-2 text-xs text-emerald-400"><CheckCircle size={11} className="mt-0.5 shrink-0" />{p}</div>
')
[void]$sb.Append('                          ))}
')
[void]$sb.Append('                        </div>
')
[void]$sb.Append('                      </div>
')
[void]$sb.Append('                      <div className="space-y-3">
')
[void]$sb.Append('                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
')
[void]$sb.Append('                          <Star size={11} className="text-amber-400" />3 Optimized Hook Alternatives
')
[void]$sb.Append('                        </h4>
')
[void]$sb.Append('                        {results.hookAlternatives.map((hook,i)=>(
')
[void]$sb.Append('                          <div key={i} className="p-4 rounded-lg border border-slate-700/50 bg-slate-900/40 hover:border-violet-500/30 transition-colors duration-200">
')
[void]$sb.Append('                            <div className="flex items-start gap-3">
')
[void]$sb.Append('                              <span className="text-xs font-mono text-violet-400 mt-0.5 shrink-0">#{i+1}</span>
')
[void]$sb.Append('                              <p className="text-xs text-slate-300 leading-relaxed">{hook}</p>
')
[void]$sb.Append('                            </div>
')
[void]$sb.Append('                          </div>
')
[void]$sb.Append('                        ))}
')
[void]$sb.Append('                      </div>
')
[void]$sb.Append('                    </div>
')
[void]$sb.Append('                    {results.flags.length > 0 && (
')
[void]$sb.Append('                      <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-3">
')
[void]$sb.Append('                        <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
')
[void]$sb.Append('                          <AlertTriangle size={14} className="text-amber-400" />Detected Issues
')
[void]$sb.Append('                        </h3>
')
[void]$sb.Append('                        {results.flags.map((flag,i)=>(
')
[void]$sb.Append('                          <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-xs border ${flag.severity==="high"?"bg-red-500/5 border-red-500/20 text-red-300":flag.severity==="medium"?"bg-amber-500/5 border-amber-500/20 text-amber-300":"bg-slate-800/40 border-slate-700/40 text-slate-400"}`}>
')
[void]$sb.Append('                            <span className={`uppercase font-bold text-xs shrink-0 font-mono ${flag.severity==="high"?"text-red-400":flag.severity==="medium"?"text-amber-400":"text-slate-500"}`}>{flag.severity}</span>
')
[void]$sb.Append('                            <span className="leading-relaxed">{flag.msg}</span>
')
[void]$sb.Append('                          </div>
')
[void]$sb.Append('                        ))}
')
[void]$sb.Append('                      </div>
')
[void]$sb.Append('                    )}
')
[void]$sb.Append('                  </div>
')
[void]$sb.Append('                )}
')
[void]$sb.Append('
')
[void]$sb.Append('                {activeTab === "timeline" && (
')
[void]$sb.Append('                  <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
')
[void]$sb.Append('                    <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
')
[void]$sb.Append('                      <Clock size={14} className="text-cyan-400" />Retention & Pacing Timeline
')
[void]$sb.Append('                    </h3>
')
[void]$sb.Append('                    <p className="text-xs text-slate-500">Predicted viewer behavior mapped to your script at ~140 WPM delivery.</p>
')
[void]$sb.Append('                    <div className="relative space-y-0">
')
[void]$sb.Append('                      {results.timeline.map((point,i)=>(
')
[void]$sb.Append('                        <div key={i} className="flex gap-4 group">
')
[void]$sb.Append('                          <div className="flex flex-col items-center">
')
[void]$sb.Append('                            <div className={`w-2.5 h-2.5 rounded-full mt-3 shrink-0 border-2 ${point.type==="positive"?"bg-emerald-500 border-emerald-400":point.type==="warning"?"bg-amber-500 border-amber-400":"bg-slate-600 border-slate-500"}`} />
')
[void]$sb.Append('                            {i < results.timeline.length-1 && <div className="w-px flex-1 bg-slate-800 my-1" />}
')
[void]$sb.Append('                          </div>
')
[void]$sb.Append('                          <div className="flex-1 pb-4">
')
[void]$sb.Append('                            <div className="flex items-start gap-3">
')
[void]$sb.Append('                              <span className="font-mono text-xs text-slate-500 mt-2.5 shrink-0 w-10">{point.time}</span>
')
[void]$sb.Append('                              <div className={`flex-1 p-3 rounded-lg border transition-colors duration-200 ${point.type==="positive"?"bg-emerald-500/5 border-emerald-500/20 group-hover:border-emerald-500/40":point.type==="warning"?"bg-amber-500/5 border-amber-500/20 group-hover:border-amber-500/40":"bg-slate-900/40 border-slate-800 group-hover:border-slate-700"}`}>
')
[void]$sb.Append('                                <p className="text-xs text-slate-400 italic mb-1.5 leading-relaxed">"{point.sentence}"</p>
')
[void]$sb.Append('                                <p className={`text-xs font-medium ${point.type==="positive"?"text-emerald-400":point.type==="warning"?"text-amber-400":"text-slate-500"}`}>{point.note}</p>
')
[void]$sb.Append('                              </div>
')
[void]$sb.Append('                            </div>
')
[void]$sb.Append('                          </div>
')
[void]$sb.Append('                        </div>
')
[void]$sb.Append('                      ))}
')
[void]$sb.Append('                    </div>
')
[void]$sb.Append('                  </div>
')
[void]$sb.Append('                )}
')
[void]$sb.Append('
')
[void]$sb.Append('                {activeTab === "checklist" && (
')
[void]$sb.Append('                  <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
')
[void]$sb.Append('                    <div className="flex items-center justify-between">
')
[void]$sb.Append('                      <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
')
[void]$sb.Append('                        <ListChecks size={14} className="text-emerald-400" />Platform Checklist · {platformCfg.label}
')
[void]$sb.Append('                      </h3>
')
[void]$sb.Append('                      <span className="text-xs font-mono text-slate-500">
')
[void]$sb.Append('                        {Object.values(checklistState).filter(Boolean).length}/{results.checklist.length} complete
')
[void]$sb.Append('                      </span>
')
[void]$sb.Append('                    </div>
')
[void]$sb.Append('                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
')
[void]$sb.Append('                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
')
[void]$sb.Append('                        style={{ width:`${(Object.values(checklistState).filter(Boolean).length/results.checklist.length)*100}%` }} />
')
[void]$sb.Append('                    </div>
')
[void]$sb.Append('                    <div className="space-y-2">
')
[void]$sb.Append('                      {results.checklist.map(item=>(
')
[void]$sb.Append('                        <button key={item.id} onClick={()=>setChecklistState(prev=>({...prev,[item.id]:!prev[item.id]}))}
')
[void]$sb.Append('                          className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all duration-200 ${checklistState[item.id]?"bg-emerald-500/5 border-emerald-500/20":"bg-slate-900/30 border-slate-800 hover:border-slate-700"}`}>
')
[void]$sb.Append('                          <div className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-colors ${checklistState[item.id]?"bg-emerald-500 border-emerald-500":"border-slate-600"}`}>
')
[void]$sb.Append('                            {checklistState[item.id] && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
')
[void]$sb.Append('                          </div>
')
[void]$sb.Append('                          <span className={`text-xs leading-relaxed flex-1 ${checklistState[item.id]?"text-slate-400 line-through":"text-slate-300"}`}>{item.label}</span>
')
[void]$sb.Append('                          {item.critical && !checklistState[item.id] && <Tag variant="danger"><Flame size={9} />Critical</Tag>}
')
[void]$sb.Append('                        </button>
')
[void]$sb.Append('                      ))}
')
[void]$sb.Append('                    </div>
')
[void]$sb.Append('                    {results.positives.length > 0 && (
')
[void]$sb.Append('                      <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
')
[void]$sb.Append('                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
')
[void]$sb.Append('                          <Award size={11} className="text-emerald-400" />Detected Strengths
')
[void]$sb.Append('                        </h4>
')
[void]$sb.Append('                        {results.positives.map((p,i)=>(
')
[void]$sb.Append('                          <div key={i} className="flex items-start gap-2 text-xs text-emerald-400">
')
[void]$sb.Append('                            <CheckCircle size={11} className="mt-0.5 shrink-0" />{p}
')
[void]$sb.Append('                          </div>
')
[void]$sb.Append('                        ))}
')
[void]$sb.Append('                      </div>
')
[void]$sb.Append('                    )}
')
[void]$sb.Append('                  </div>
')
[void]$sb.Append('                )}
')
[void]$sb.Append('              </div>
')
[void]$sb.Append('            </div>
')
[void]$sb.Append('          )}
')
[void]$sb.Append('        </main>
')
[void]$sb.Append('      </div>
')
[void]$sb.Append('    </div>
')
[void]$sb.Append('  );
')
[void]$sb.Append('}
')
[System.IO.File]::WriteAllText($outFile, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "App.jsx written! Lines: $(($sb.ToString().Split("`n")).Count)" -ForegroundColor Green