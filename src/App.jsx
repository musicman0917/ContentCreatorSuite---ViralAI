import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Zap, Target, Clock, CheckSquare, Play, Loader2,
  TrendingUp, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Scissors, BarChart3, ListChecks, Star, Radio, Eye, Heart,
  Share2, Bookmark, Volume2, Hash, Layers, Info,
  Flame, Shield, Award, Cpu, Upload, Film, Mic,
  Image, ChevronRight, X, FileVideo, Wifi
} from "lucide-react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://192.168.6.228:3015";
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

// ─── PLATFORM CONFIG ─────────────────────────────────────────────────────────
const PLATFORM_CONFIG = {
  "yt-long": {
    label: "YouTube Long-form", icon: "▶", color: "#FF0000",
    accentClass: "text-red-400", bgClass: "bg-red-500/10 border-red-500/20",
    idealWordCount: [600, 2000], hookWindow: "First 30 seconds",
    loopStrategy: false, thumbnailTitle: true,
  },
  "yt-short": {
    label: "YouTube Shorts", icon: "⚡", color: "#FF6B6B",
    accentClass: "text-orange-400", bgClass: "bg-orange-500/10 border-orange-500/20",
    idealWordCount: [60, 150], hookWindow: "First 3 seconds",
    loopStrategy: true, thumbnailTitle: false,
  },
  "tiktok": {
    label: "TikTok", icon: "♪", color: "#69C9D0",
    accentClass: "text-cyan-400", bgClass: "bg-cyan-500/10 border-cyan-500/20",
    idealWordCount: [50, 200], hookWindow: "First 1-2 seconds",
    loopStrategy: true, thumbnailTitle: false,
  },
  "reels": {
    label: "Instagram Reels", icon: "◈", color: "#E1306C",
    accentClass: "text-pink-400", bgClass: "bg-pink-500/10 border-pink-500/20",
    idealWordCount: [40, 150], hookWindow: "First 3 seconds",
    loopStrategy: false, thumbnailTitle: false,
  },
};

// ─── NICHE CONFIG ─────────────────────────────────────────────────────────────
const NICHE_CONFIG = {
  tech: { label: "Tech", keywords: ["tutorial","how to","review","vs","best","ai","build"] },
  music: { label: "Music", keywords: ["cover","original","beat","melody","chord","song","performance"] },
  story: { label: "Storytelling", keywords: ["then","suddenly","but","plot twist","you won't believe","story time"] },
  education: { label: "Education", keywords: ["learn","explain","why","what","fact","study","tip","mistake"] },
  comedy: { label: "Comedy", keywords: ["imagine","when you","relatable","nobody","literally","okay but"] },
  streaming: { label: "Streaming / Creator", keywords: ["twitch","stream","live","chat","subscribers","viewers","clip","raid","donate","bits","channel"] },
  gaming: { label: "Gaming", keywords: ["gameplay","game","player","level","boss","glitch","speedrun","meta","build","fps","rpg","patch"] },
  fitness: { label: "Fitness / Health", keywords: ["workout","gym","reps","sets","protein","calories","cardio","gains","form","routine","meal prep","macros"] },
  finance: { label: "Finance / Business", keywords: ["invest","income","revenue","profit","stocks","crypto","budget","side hustle","passive","entrepreneur","money"] },
  food: { label: "Food / Cooking", keywords: ["recipe","cook","eat","taste","ingredient","kitchen","chef","meal","delicious","restaurant","flavor"] },
  travel: { label: "Travel / Lifestyle", keywords: ["travel","vlog","destination","hotel","flight","explore","city","country","trip","adventure","culture"] },
  beauty: { label: "Beauty / Fashion", keywords: ["makeup","skincare","outfit","style","haul","foundation","tutorial","brand","look","fashion","product"] },
  motivation: { label: "Motivation / Self-help", keywords: ["mindset","goal","success","discipline","growth","hustle","habit","confidence","positive","grind","manifest"] },
  news: { label: "News / Commentary", keywords: ["breaking","opinion","reaction","explained","update","politics","economy","viral","controversy","analysis"] },
  animals: { label: "Animals / Pets", keywords: ["dog","cat","pet","animal","puppy","kitten","wildlife","cute","training","rescue","bird","fish"] },
  irl: { label: "IRL / Vlog", keywords: ["irl","vlog","day in my life","come with me","park","disney","universal","theme park","downtown","mall","street","event","concert","festival","crowd","exploring"] },
  nature: { label: "Nature Streams", keywords: ["stream","wildlife","nature","outdoor","birds","forest","river","rain","relaxing","ambient","animals","scenic"] },
  singing: { label: "Singing / Music", keywords: ["sing","song","cover","lyrics","melody","chorus","verse","pitch","note","music","perform","original","acoustic","vocal"] },
};

// ─── PLATFORM CHECKLIST ───────────────────────────────────────────────────────
const PLATFORM_CHECKLIST = {
  "yt-long": [
    { id: "title", label: "Title contains a power word or number", critical: true },
    { id: "thumbnail", label: "Thumbnail concept is described or implied", critical: true },
    { id: "hook30", label: "Hook is front-loaded within first 30 seconds", critical: true },
    { id: "chapters", label: "Script has clear chapter/segment transitions", critical: false },
    { id: "cta", label: "Subscribe/like CTA placed at emotional peak", critical: false },
    { id: "seo", label: "Primary keyword used in first 15 seconds", critical: true },
    { id: "endscreen", label: "End screen or outro references next video", critical: false },
    { id: "retention", label: "Pattern interrupt every 60-90 seconds", critical: false },
  ],
  "yt-short": [
    { id: "loop", label: "Final line loops back to opening phrase", critical: true },
    { id: "hook3", label: "First sentence grabs attention instantly", critical: true },
    { id: "length", label: "Script is under 150 words (60 seconds)", critical: true },
    { id: "overlay", label: "Text overlays mentioned or implied", critical: false },
    { id: "nohang", label: "No dead air or filler words", critical: true },
    { id: "subscribe", label: "Verbal CTA to subscribe included", critical: false },
  ],
  "tiktok": [
    { id: "sound", label: "References or implies trending sound usage", critical: false },
    { id: "spoken-seo", label: "SEO keywords spoken out loud naturally", critical: true },
    { id: "overlay", label: "On-screen text/captions planned", critical: true },
    { id: "hook2", label: "Hook fires in first 1-2 seconds", critical: true },
    { id: "pattern", label: "Pattern interrupt within first 5 seconds", critical: true },
    { id: "duet", label: "Duet/stitch-friendly moment included", critical: false },
    { id: "loop", label: "Seamless loop ending planned", critical: false },
  ],
  "singing": [
    { id: "songchoice", label: "Song choice is recognizable or trending", critical: true },
    { id: "vocals", label: "Vocals are clear and not drowned by backing track", critical: true },
    { id: "emotion", label: "Emotional delivery — listener feels something", critical: true },
    { id: "fullsong", label: "Full song or complete section performed", critical: false },
    { id: "facecam", label: "Face cam visible for emotional connection", critical: false },
    { id: "caption", label: "Song title/artist shown on screen", critical: false },
    { id: "loop", label: "Clip starts at most impactful part of song", critical: true },
  ],
  "reels": [
    { id: "share", label: "Script has a 'shareable' moment or insight", critical: true },
    { id: "save", label: "Contains a 'save-worthy' tip or list", critical: true },
    { id: "collab", label: "Collaboration or tag moment included", critical: false },
    { id: "hook3", label: "First frame is visually arresting", critical: true },
    { id: "audio", label: "Original audio or trending audio referenced", critical: false },
    { id: "caption", label: "Caption hook in first line planned", critical: true },
    { id: "cta-comment", label: "CTA asks a debate-worthy question", critical: false },
  ],
};

// ─── PLATFORM CALIBRATION ────────────────────────────────────────────────────
const PLATFORM_CALIBRATION = {
  "yt-long": {
    "horizontal": { title: "Long-form Horizontal Algorithm Profile", rules: [
      { icon: Eye, text: "CTR drives initial exposure — title + thumbnail must be a unified promise." },
      { icon: Clock, text: "Average View Duration (AVD) above 40% signals 'recommended' status." },
      { icon: TrendingUp, text: "First 48h velocity determines long-tail recommendation shelf life." },
      { icon: BarChart3, text: "Chapter markers reduce drop-off by giving viewers navigation control." },
    ]},
    "vertical": { title: "Long-form Vertical Algorithm Profile", rules: [
      { icon: AlertTriangle, text: "Vertical long-form is a niche format — is non-negotiable." },
      { icon: Eye, text: "Thumbnail still matters, but renders smaller in Shorts feed — use bold text." },
      { icon: Clock, text: "Higher drop-off tolerance since format is uncommon — hook must still fire fast." },
      { icon: Layers, text: "Segment with tight cuts; vertical viewers have shorter patience windows." },
    ]},
  },
  "yt-short": {
    "vertical": { title: "YouTube Shorts Algorithm Profile", rules: [
      { icon: RefreshCw, text: "Loop completion rate is the #1 signal — engineer a seamless ending-to-beginning bridge." },
      { icon: Zap, text: "Under 60 seconds earns Shorts shelf; over 60 seconds falls into standard feed with no loop benefit." },
      { icon: Heart, text: "Like velocity in first hour signals breakout potential — CTA must be immediate." },
      { icon: Share2, text: "Shorts don't require subscribers to reach new viewers — go broad, not niche." },
    ]},
    "horizontal": { title: "YouTube Shorts (Horizontal) — Warning", rules: [
      { icon: AlertTriangle, text: "Horizontal Shorts receive significantly reduced algorithmic distribution — vertical is strongly advised." },
      { icon: Eye, text: "Content still renders in Shorts feed but with black bars — perceived quality drops sharply." },
      { icon: Shield, text: "This configuration is suboptimal. Only use if the visual content demands it." },
    ]},
  },
  "tiktok": {
    "vertical": { title: "TikTok FYP Algorithm Profile", rules: [
      { icon: Zap, text: "Completion rate + replays dominate FYP scoring above everything else." },
      { icon: Volume2, text: "Original audio or trending sound boosts discoverability by 2-3x." },
      { icon: Hash, text: "Spoken keywords are transcribed — SEO happens at the audio layer, not just caption." },
      { icon: Share2, text: "Shares to DMs are the highest-value signal for explosive growth velocity." },
    ]},
    "horizontal": { title: "TikTok Horizontal — Non-Standard", rules: [
      { icon: AlertTriangle, text: "TikTok is natively vertical — horizontal content faces a distribution penalty." },
      { icon: Eye, text: "If horizontal, ensure the center 9:16 crop is visually self-contained." },
      { icon: Info, text: "Gaming, reaction, or cinematic content may justify horizontal, but reach will be limited." },
    ]},
  },
  "reels": {
    "vertical": { title: "Instagram Reels Algorithm Profile", rules: [
      { icon: Bookmark, text: "Saves are the highest-value engagement signal — engineer a 'save-worthy' moment explicitly." },
      { icon: Share2, text: "Story reshares from followers amplify Explore page reach significantly." },
      { icon: Eye, text: "Watch-through rate at 3 seconds and 50% are key thresholds for Explore distribution." },
      { icon: Heart, text: "Comment triggers (asks, debates, completions) extend algorithmic lifespan by days." },
    ]},
    "horizontal": { title: "Instagram Reels (Horizontal) — Warning", rules: [
      { icon: AlertTriangle, text: "Horizontal Reels receive reduced Explore distribution." },
      { icon: Eye, text: "Feed preview crops to 4:5 — a horizontal Reel loses context in the feed thumbnail." },
      { icon: Shield, text: "Strongly recommend re-shooting or re-framing vertically for maximum reach." },
    ]},
  },
};

// ─── HOOK TEMPLATES (fallback) ────────────────────────────────────────────────
const HOOK_TEMPLATES = {
  "yt-long": [
    "Start with a bold, counter-intuitive claim: 'Everyone told me [X] was impossible — here's how I proved them wrong in 30 days.'",
    "Use the 'failure-to-formula' arc: 'I wasted $10,000 on [topic] before I discovered the 3 rules that changed everything.'",
    "Open with a visual promise: 'By the end of this video, you'll know exactly how to [outcome] — even if you've never tried before.'",
  ],
  "yt-short": [
    "One-line curiosity gap: 'Nobody talks about the [X] trick that 10x'd my [result] overnight.'",
    "Scroll-stopper directive: 'Stop scrolling. If you do [X], you're losing [Y] every single day.'",
    "Pattern-breaker opener: 'Here's the brutal truth about [niche topic] they don't teach you...'",
  ],
  "tiktok": [
    "POV bait: 'POV: you finally understand why [common thing] actually works like this.'",
    "Controversy + curiosity: '[Common belief] is completely wrong — and I'll prove it in 20 seconds.'",
    "Visual promise + speed: 'Watch me [impressive action] in under 60 seconds. For real.'",
  ],
  "singing": [
    { id: "songchoice", label: "Song choice is recognizable or trending", critical: true },
    { id: "vocals", label: "Vocals are clear and not drowned by backing track", critical: true },
    { id: "emotion", label: "Emotional delivery — listener feels something", critical: true },
    { id: "fullsong", label: "Full song or complete section performed", critical: false },
    { id: "facecam", label: "Face cam visible for emotional connection", critical: false },
    { id: "caption", label: "Song title/artist shown on screen", critical: false },
    { id: "loop", label: "Clip starts at most impactful part of song", critical: true },
  ],
  "reels": [
    "Save-trigger opener: '5 things I wish I knew before [relatable milestone] — save this.'",
    "Community-first hook: 'If you're into [niche], you NEED to hear this. Trust me.'",
    "Transformation bait: 'This one change went from [bad result] to [dream result] in [timeframe].'",
  ],
};

// ─── THUMBNAIL STUDIO CONSTANTS ───────────────────────────────────────────────
const THUMB_STYLES = [
  { id: "bold-yellow", label: "Bold Yellow", bg: "#FFD700", text: "#000000", shadow: "rgba(0,0,0,0.9)", font: "900 italic" },
  { id: "netflix-red", label: "Netflix Red", bg: "#E50914", text: "#FFFFFF", shadow: "rgba(0,0,0,0.9)", font: "900" },
  { id: "clean-white", label: "Clean White", bg: "rgba(255,255,255,0.15)", text: "#FFFFFF", shadow: "rgba(0,0,0,0.9)", font: "700" },
  { id: "dark-contrast", label: "Dark Contrast", bg: "rgba(0,0,0,0.6)", text: "#FFFFFF", shadow: "rgba(255,255,255,0.1)", font: "800" },
  { id: "neon-cyan", label: "Neon Cyan", bg: "rgba(0,210,210,0.15)", text: "#00D2D2", shadow: "rgba(0,0,0,0.9)", font: "900 italic" },
];

const THUMB_FONTS = [
  { id: "arial-black", label: "Impact", value: "Arial Black" },
  { id: "georgia", label: "Serif", value: "Georgia" },
  { id: "verdana", label: "Verdana", value: "Verdana" },
  { id: "courier", label: "Mono", value: "Courier New" },
  { id: "trebuchet", label: "Trebuchet", value: "Trebuchet MS" },
];

const THUMB_POSITIONS = [
  { id: "top", label: "Top", y: 0.12 },
  { id: "middle", label: "Middle", y: 0.5 },
  { id: "bottom", label: "Bottom", y: 0.82 },
];

const COLOR_GRADES = [
  { id: "none", label: "Normal", filter: (c, s) => `contrast(${c}%) saturate(${s}%)` },
  { id: "cinematic", label: "Cinematic", filter: (c, s) => `contrast(${c + 10}%) saturate(${s - 20}%) sepia(20%)` },
  { id: "warm", label: "Warm", filter: (c, s) => `contrast(${c}%) saturate(${s + 20}%) sepia(30%) hue-rotate(-10deg)` },
  { id: "cold", label: "Cold", filter: (c, s) => `contrast(${c + 5}%) saturate(${s}%) hue-rotate(30deg)` },
  { id: "hc", label: "High Contrast", filter: (c, s) => `contrast(${c + 30}%) saturate(${s + 10}%)` },
  { id: "bw", label: "B&W", filter: (c, s) => `contrast(${c + 20}%) saturate(0%) grayscale(100%)` },
];

const EMOJI_ACCENTS = ["🔥", "⚡", "👀", "💀", "😱", "🚨", "💥", "🎯", "👇", "❌", "✅", "💯"];

// ─── HEURISTICS ENGINE ────────────────────────────────────────────────────────
function analyzeScript(script, platform, format, niche, isTikTokShop = false, isLiveClip = false) {
  const words = script.trim().split(/\s/).filter(Boolean);
  const wordCount = words.length;
  const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const questionMarks = (script.match(/\?/g) || []).length;
  const exclamations = (script.match(/!/g) || []).length;
  const avgSentenceLen = sentences.length > 0 ? wordCount / sentences.length : 0;
  const hasHook = /^.{0,200}(you|imagine|what if|stop|wait|here's|nobody|the truth|secret|mistake|wrong|this)/i.test(script);
  const hasCTA = /(subscribe|follow|like|share|comment|save|click|link in bio)/i;
  const hasLoopEnd = sentences.length > 1 && sentences[sentences.length - 1].split(/\s+/).length < 15;
  const nicheKeywords = NICHE_CONFIG[niche]?.keywords || [];
  const nicheMatches = nicheKeywords.filter(kw => script.toLowerCase().includes(kw)).length;
  const config = PLATFORM_CONFIG[platform];
  const [minWords, maxWords] = config.idealWordCount;
  let score = 50, hookScore = 50;
  const flags = [], positives = [];
  if (wordCount === 0) return null;
  if (wordCount < minWords) { score -= 15; flags.push({ severity: "high", msg: `Script is too short (${wordCount} words). Minimum: ${minWords} for ${config.label}.` }); }
  else if (wordCount > maxWords) { score -= 12; flags.push({ severity: "high", msg: `Script is too long (${wordCount} words). Max: ~${maxWords} for ${config.label}.` }); }
  else { score += 15; positives.push(`Word count (${wordCount}) is optimal.`); }
  if (hasHook) { hookScore += 25; score += 8; positives.push("Opening line uses a recognized hook pattern."); }
  else { hookScore -= 20; flags.push({ severity: "high", msg: "No detectable hook in the first sentence. The algorithm rewards immediate pattern interrupts." }); }
  if (questionMarks > 0) { hookScore += 10; score += 5; positives.push(`${questionMarks} question(s) found — good for engagement and curiosity loops.`); }
  else { flags.push({ severity: "medium", msg: "No questions detected. Questions increase comment engagement." }); }
  if (exclamations > 3) { score += 3; positives.push("Emotional punctuation present."); }
  if (hasCTA.test(script)) { score += 8; positives.push("Call-to-action detected."); }
  else { score -= 8; flags.push({ severity: "medium", msg: "No CTA found. Always include a subscribe/follow/save prompt." }); }
  if (config.loopStrategy) {
    if (hasLoopEnd) { score += 10; positives.push("Short ending detected - good for loop potential."); }
    else { score -= 8; flags.push({ severity: "high", msg: "No loop-back ending detected. Short-form platforms prioritize re-watch rate." }); }
  }
  if (nicheMatches >= 3) { score += 8; positives.push(`Strong niche keyword density (${nicheMatches} matches).`); }
  else if (nicheMatches === 0) { score -= 5; flags.push({ severity: "low", msg: `No ${NICHE_CONFIG[niche]?.label} niche keywords detected.` }); }
  if (avgSentenceLen > 25) { score -= 8; flags.push({ severity: "medium", msg: `Average sentence length ${Math.round(avgSentenceLen)} words — too long for short-form pacing.` }); }
  else if (avgSentenceLen < 10 && avgSentenceLen > 0) { score += 5; positives.push("Tight sentence structure."); }
  if (isTikTokShop) {
    const hasProductMention = /(buy|shop|link|discount|code|price|sale|off|deal|product|review|unbox)/i.test(script);
    const hasCTAShop = /(tap|click|link in bio|shop now|grab yours|limited|stock)/i.test(script);
    if (hasProductMention) { score += 5; positives.push("Product mention detected — good for shop content."); }
    else { flags.push({ severity: "high", msg: "No product mention detected. Shop videos need clear product references." }); }
    if (hasCTAShop) { score += 5; positives.push("Shop CTA detected."); }
    else { flags.push({ severity: "high", msg: "No shop CTA detected. Add urgency: tap the link, shop now, limited stock." }); }
  }
  // Singing niche overrides — hook mechanics are different
  if (niche === "singing") {
    hookScore = 75;
    const singingFlags = flags.filter(f => !f.msg.includes("hook") && !f.msg.includes("CTA") && !f.msg.includes("question"));
    flags.length = 0;
    singingFlags.forEach(f => flags.push(f));
    positives.push("Singing content — hook is the performance itself.");
    if (hasCTA.test(script)) { score += 5; }
    score = Math.min(99, Math.max(30, score));
  }
  if (isLiveClip) {
    // Live clips have different mechanics — reactions ARE the hook
    if (hookScore < 60) hookScore = Math.min(hookScore + 20, 75);
    // Remove loop-back ending requirement — clips dont loop
    const loopFlagIdx = flags.findIndex(f => f.msg.includes("loop"));
    if (loopFlagIdx > -1) flags.splice(loopFlagIdx, 1);
    // Reduce filler word penalty — live speech expected
    const fillerFlagIdx = flags.findIndex(f => f.msg.includes("filler") || f.msg.includes("sentence length"));
    if (fillerFlagIdx > -1) flags.splice(fillerFlagIdx, 1);
    // Boost score floor — live clips have inherent authenticity value
    score = Math.min(99, Math.max(score, 35));
    positives.push("📡 Scored as livestream clip — reaction authenticity and energy weighted higher.");
  }
  hookScore = Math.min(100, Math.max(10, hookScore));
  score = Math.min(99, Math.max(8, score));
  const timeline = generateTimeline(sentences);
  const checklist = (PLATFORM_CHECKLIST[platform] || []).map(item => {
    let checked = false;
    if (["hook3", "hook30", "hook2"].includes(item.id)) checked = hasHook;
    if (["cta", "subscribe"].includes(item.id)) checked = hasCTA.test(script);
    if (["loop", "nohang"].includes(item.id)) checked = hasLoopEnd;
    if (item.id === "spoken-seo") checked = nicheMatches >= 2;
    if (item.id === "length") checked = wordCount <= maxWords;
    if (item.id === "seo") checked = nicheMatches >= 1;
    if (["share", "save"].includes(item.id)) checked = hasCTA.test(script);
    return { ...item, checked };
  });
  return {
    score, hookScore, wordCount, flags, positives, timeline, checklist,
    hookAlternatives: HOOK_TEMPLATES[platform] || HOOK_TEMPLATES["yt-long"],
    calibration: PLATFORM_CALIBRATION[platform]?.[format] || PLATFORM_CALIBRATION[platform]?.["vertical"],
  };
}

function generateTimeline(sentences) {
  const wpm = 140;
  const points = [];
  let cumWords = 0;
  sentences.slice(0, 12).forEach((sentence, i) => {
    const sw = sentence.trim().split(/\s+/).filter(Boolean).length;
    cumWords += sw;
    const sec = Math.round((cumWords / wpm) * 60);
    const timeStr = sec < 60 ? `0:${String(sec).padStart(2, "0")}` : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
    const s = sentence.toLowerCase();
    let type = "neutral", note = "";
    if (i === 0) { type = s.match(/(you|stop|wait|imagine|secret|truth|nobody|mistake)/) ? "positive" : "warning"; note = type === "positive" ? "Strong hook detected." : "Weak opening - no hook trigger."; }
    else if (sw > 30) { type = "warning"; note = "Long sentence - insert visual cut."; }
    else if (s.includes("?")) { type = "positive"; note = "Question creates curiosity gap."; }
    else if (s.match(/(but|however|twist|actually|wait|plot)/)) { type = "positive"; note = "Narrative pivot - strong pattern interrupt."; }
    else if (i % 3 === 0) { type = "warning"; note = "Predicted drop-off zone."; }
    else { note = "Standard pacing."; }
    points.push({ time: timeStr, sentence: sentence.trim().slice(0, 80) + (sentence.trim().length > 80 ? "..." : ""), type, note });
  });
  return points;
}

// ─── AI FUNCTIONS ─────────────────────────────────────────────────────────────
async function analyzeVideoHolistically(transcript, frameSummaries, platform, niche, duration, isTikTokShop = false, isLiveClip = false) {
  if (!ANTHROPIC_API_KEY) return null;
  const platformCfg = PLATFORM_CONFIG[platform];
  const nicheCfg = NICHE_CONFIG[niche];
  const frameContext = frameSummaries.slice(0, 8).map((f, i) => `Frame at ${f.label}: ${f.analysis?.slice(0, 400) || "no analysis"}`).join("\n");
  const TRANSCRIPT_LIMIT = 15000;
  const transcriptTruncated = String(transcript || "").length > TRANSCRIPT_LIMIT;
  const transcriptForPrompt = String(transcript || "").slice(0, TRANSCRIPT_LIMIT) + (transcriptTruncated ? "\n\n[SYSTEM NOTE: the transcript above was cut off here by the analysis tool to fit the request. This is a limitation of OUR pipeline, not a flaw in the video. Do NOT treat this cutoff as a missing payoff, an unfinished ending, a buried conclusion, or any kind of structural problem, and do not penalise the creator for it. Judge only the content you can actually see.]" : "");
  const shopBlock = isTikTokShop ? `
CONTENT MODE: TIKTOK SHOP / PRODUCT SELL. This video exists to convert, not merely to be watched. Judge it on that basis:
- Is the product on screen, and how early does it appear?
- Is the product clearly visible at the exact moment the CTA lands?
- Would price, discount, or offer text be legible at thumb size?
- Does the video DEMONSTRATE the product's claim, or only describe it?
- Is there a credible reason to buy now rather than later?
A video that holds attention perfectly but never shows the product has failed. Weight conversion intent above pure retention.` : "";
  const liveBlock = isLiveClip ? `
CONTENT MODE: LIVESTREAM CLIP. This was cut from a longer live broadcast — it was NOT purpose-shot short-form. Judge it accordingly:
- Nothing can be re-shot or re-staged. The only available levers are the trim in-point and out-point, captions, crop, and overlays.
- Never suggest re-filming, re-recording a line, or restaging a moment. Suggest a different trim point instead.
- Raw reaction and authenticity ARE the product. Do not penalise unscripted speech, filler words, imperfect framing, or the absence of a written hook.
- Judge the opening by whether the trim starts close enough to the payoff, not by whether it opens with a scripted hook.
- Do not expect a loop-back ending. Clips do not loop.` : "";
  const contentModeBlock = `${shopBlock}${liveBlock}`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 4000,
      messages: [{ role: "user", content: `You are the Chief Creative Officer at a world-class social media agency. You have reviewed thousands of pieces of content and know exactly what the ${platformCfg.label} algorithm rewards.

You are doing a FULL VIDEO ANALYSIS — not frame by frame, but the complete picture.

PLATFORM: ${platformCfg.label}
NICHE: ${nicheCfg?.label || niche}
DURATION: ${duration}s
HOOK WINDOW: ${platformCfg.hookWindow}
${contentModeBlock}

TRANSCRIPT:
${transcriptForPrompt}

KEY FRAME OBSERVATIONS:
${frameContext}

Deliver a complete video analysis covering:
1. NARRATIVE ARC: Does this video have a clear beginning, middle, and payoff? Does it earn its runtime?
2. VIRAL POTENTIAL: What is the single most shareable/rewatch-worthy moment and why?
3. ALGORITHM ALIGNMENT: How well does this video match what ${platformCfg.label} is currently rewarding?
4. AUDIENCE RETENTION PREDICTION: Where will viewers drop off and why?
5. VERDICT: One punchy paragraph — is this video ready to post, needs work, or needs a complete rethink?

Be direct, specific, and ruthless. No softening. Write like the creator is paying you to tell the truth.` }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Video analysis error");
  return data.content?.[0]?.text || null;
}

async function detectNicheWithClaude(transcript) {
  if (!ANTHROPIC_API_KEY || !transcript) return null;
  const niches = Object.entries(NICHE_CONFIG).map(([k, v]) => `${k}: ${v.label}`).join(", ");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 20,
      messages: [{ role: "user", content: `You are a content categorization expert. Based on this video transcript, identify the single best matching niche key. Reply with ONLY the key word, nothing else.\n\nAvailable niches: ${niches}\n\nTranscript: ${transcript.slice(0, 500)}` }] }),
  });
  const data = await res.json();
  const detected = data.content?.[0]?.text?.trim().toLowerCase();
  return Object.keys(NICHE_CONFIG).find(k => detected?.includes(k)) || null;
}

async function generateHookAlternatives(transcript, platform, niche, gameName = "", isTikTokShop = false, isLiveClip = false) {
  if (!ANTHROPIC_API_KEY || !transcript) return null;
  const platformCfg = PLATFORM_CONFIG[platform];
  const nicheCfg = NICHE_CONFIG[niche];
  const gameCtx = niche === "gaming" && gameName ? ` The game is ${gameName}.` : "";
  const hookShop = isTikTokShop ? `\n\nThis is a TikTok Shop product video. Every hook must create desire for the PRODUCT, not just curiosity about the video. Lead with the problem it solves, the result it delivers, or the price/value shock. Avoid hooks that entertain but never point at the product.` : "";
  const hookLive = isLiveClip ? `\n\nCRITICAL — THIS IS A LIVESTREAM CLIP. Nothing can be re-recorded, so you CANNOT write a new spoken line. Each of your 3 suggestions must be either (a) an ON-SCREEN TEXT hook to overlay on the existing footage, or (b) a SPECIFIC TRIM POINT, described by quoting the words already spoken where the clip should start. Never suggest the creator say something new. Prefix each with either "TEXT:" or "TRIM:".` : "";
  const hookModeBlock = `${hookShop}${hookLive}`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 900,
      messages: [{ role: "user", content: `You are the Head of Creative Strategy at a global social media powerhouse — the kind of agency that launches viral campaigns for Netflix, Nike, and the world's top creators. You have written hooks that have generated hundreds of millions of views across TikTok, YouTube Shorts, and Instagram Reels.\n\nYour task: write exactly 3 world-class hook alternatives for this ${platformCfg.label} video in the ${nicheCfg?.label || niche} space.${gameCtx}${hookModeBlock}\n\nSTRICT RULES:\n- Each hook must be ripped directly from the actual content of this transcript — zero generic placeholders\n- Engineered specifically for the ${platformCfg.hookWindow} attention window on ${platformCfg.label}\n- Must create an immediate curiosity gap, emotional spike, or pattern interrupt\n- Written in the creator's authentic voice — not corporate, not stiff\n- The kind of hook that makes someone stop mid-scroll and say "wait, what?"\n\nReturn ONLY a valid JSON array of exactly 3 strings. No markdown, no explanation, no preamble.\n\nTranscript: ${transcript.slice(0, 600)}` }] }),
  });
  const data = await res.json();
  try {
    const text = data.content?.[0]?.text?.trim().replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

async function analyzeFrameWithClaude(base64, timestamp, platform, niche, gameName = "", isTikTokShop = false, isLiveClip = false) {
  if (!ANTHROPIC_API_KEY) return `[Claude Vision not configured] Frame at ${timestamp} could not be analyzed.`;
  const platformCfg = PLATFORM_CONFIG[platform];
  const gameContext = niche === "gaming" && gameName ? ` The game being played is ${gameName}.` : "";
  const shopCtx = isTikTokShop ? ` This is a TikTok Shop product video, so also assess: is the product visible in this frame, is it lit and framed well enough to read, and would any price or offer text stay legible at thumbnail size? A frame with no product visible is a problem worth flagging.` : "";
  const liveCtx = isLiveClip ? ` This frame is from a LIVESTREAM CLIP, so judge it against live-broadcast norms (webcam plus game capture), not studio short-form. Do not suggest re-shooting, relighting, or restaging — the only fixes available are crop, zoom, caption, and overlay changes.` : "";
  const prompt = `You are a social media algorithm expert. Analyze this video frame at ${timestamp} from a ${platformCfg.label} video in the ${NICHE_CONFIG[niche]?.label || niche} niche.${gameContext}${shopCtx}${liveCtx} Provide a SHORT audit (3-4 sentences): 1. Visual hook strength - does this frame stop the scroll? 2. On-screen text/overlays effectiveness. 3. Framing and lighting quality. 4. One actionable improvement. Plain prose, no bullets.`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 500,
      messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } }, { type: "text", text: prompt }] }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Claude Vision error");
  return data.content?.[0]?.text || "No analysis returned.";
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
function CircularScore({ score }) {
  const r = 52, circ = 2 * Math.PI * r, pct = Math.min(100, Math.max(0, score));
  const dash = (pct / 100) * circ;
  const color = pct < 50 ? "#ef4444" : pct < 75 ? "#f59e0b" : "#22c55e";
  const glow = pct < 50 ? "rgba(239,68,68,0.4)" : pct < 75 ? "rgba(245,158,11,0.4)" : "rgba(34,197,94,0.4)";
  const label = pct < 50 ? "Needs Work" : pct < 75 ? "Promising" : "Viral-Ready";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ filter: `drop-shadow(0 0 16px ${glow})` }}>
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#1e2433" strokeWidth="10" />
          <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 64 64)" style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
          <text x="64" y="60" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="monospace">{pct}</text>
          <text x="64" y="76" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">/ 100</text>
        </svg>
      </div>
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color }}>{label}</span>
    </div>
  );
}

function ScoreBar({ label, value, color, explanation, whatDrivesIt, howToImprove }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1">
      <button onClick={() => setOpen(!open)} className="w-full text-left">
        <div className="flex justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">{label}
            <ChevronRight size={10} className={`text-slate-600 transition-transform ${open ? "rotate-90" : ""}`}/>
          </span>
          <span className="font-mono" style={{ color }}>{value}/100</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-lg bg-slate-900/80 border border-slate-700/50 space-y-2">
          {explanation && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1"><Info size={10} className="text-violet-400"/>What this measures</p>
              <p className="text-xs text-slate-500 leading-relaxed">{explanation}</p>
            </div>
          )}
          {whatDrivesIt && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1"><BarChart3 size={10} className="text-cyan-400"/>What drove your score</p>
              <p className="text-xs text-slate-500 leading-relaxed">{whatDrivesIt}</p>
            </div>
          )}
          {howToImprove && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1"><Zap size={10} className="text-amber-400"/>How to improve</p>
              <p className="text-xs text-slate-500 leading-relaxed">{howToImprove}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Tag({ children, variant = "default" }) {
  const cls = {
    default: "bg-slate-700/50 text-slate-300 border-slate-600/40",
    positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    accent: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  }[variant];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border font-medium ${cls}`}>{children}</span>;
}

// ─── PIPELINE STEPS ───────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  { id: "upload", icon: Upload, label: "Uploading video" },
  { id: "extract", icon: Film, label: "Extracting audio" },
  { id: "transcribe", icon: Mic, label: "Transcribing with Whisper" },
  { id: "frames", icon: Image, label: "Extracting keyframes" },
  { id: "vision", icon: Eye, label: "Claude Vision analyzing frames" },
];

// ─── VIDEO UPLOAD PANEL ───────────────────────────────────────────────────────
// ─── Version Comparison ──────────────────────────────────────────────────────
function normalizeFlagKey(msg) {
  return String(msg || "").toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
}

function compareVersions(prev, curr) {
  const pf = (prev.flags || []).map(f => ({ ...f, key: normalizeFlagKey(f.msg) }));
  const cf = (curr.flags || []).map(f => ({ ...f, key: normalizeFlagKey(f.msg) }));
  const pk = new Set(pf.map(f => f.key));
  const ck = new Set(cf.map(f => f.key));
  const pPos = new Set(prev.positives || []);
  const cPos = new Set(curr.positives || []);
  return {
    scoreDelta: (curr.score || 0) - (prev.score || 0),
    hookDelta: (curr.hookScore || 0) - (prev.hookScore || 0),
    durationDelta: (curr.duration || 0) - (prev.duration || 0),
    resolved: pf.filter(f => !ck.has(f.key)),
    persisting: cf.filter(f => pk.has(f.key)),
    introduced: cf.filter(f => !pk.has(f.key)),
    positivesGained: [...cPos].filter(p => !pPos.has(p)),
    positivesLost: [...pPos].filter(p => !cPos.has(p)),
    openingChanged: String(prev.transcript || "").slice(0, 200).trim() !== String(curr.transcript || "").slice(0, 200).trim(),
  };
}

async function generateProgressReview(prev, curr, diff) {
  if (!ANTHROPIC_API_KEY) return null;
  const list = arr => arr.length ? arr.map(f => `- ${f.msg || f}`).join("\n") : "- (none)";
  const prompt = `You are the same Chief Creative Officer who reviewed the previous cut of this video. The creator has come back with a new version. Your job is to tell them honestly whether they actually made it better.

PREVIOUS VERSION (v${prev.versionNumber}${prev.label ? ` - "${prev.label}"` : ""})
Score ${prev.score}/100, hook ${prev.hookScore}/100, ${prev.duration}s
Your review at the time: ${String(prev.holisticAnalysis || "(no prior review)").slice(0, 1500)}
Opening words: "${String(prev.transcript || "").slice(0, 200)}"

NEW VERSION (v${curr.versionNumber}${curr.label ? ` - "${curr.label}"` : ""})
Score ${curr.score}/100, hook ${curr.hookScore}/100, ${curr.duration}s
Opening words: "${String(curr.transcript || "").slice(0, 200)}"

MEASURED CHANGES
Score moved ${diff.scoreDelta >= 0 ? "+" : ""}${diff.scoreDelta}. Hook moved ${diff.hookDelta >= 0 ? "+" : ""}${diff.hookDelta}. Runtime moved ${diff.durationDelta >= 0 ? "+" : ""}${diff.durationDelta}s. Opening was ${diff.openingChanged ? "changed" : "left unchanged"}.

ISSUES THEY FIXED:
${list(diff.resolved)}

ISSUES STILL PRESENT FROM LAST TIME:
${list(diff.persisting)}

NEW ISSUES THAT DID NOT EXIST BEFORE:
${list(diff.introduced)}

STRENGTHS LOST SINCE LAST VERSION:
${list(diff.positivesLost)}

Be direct and specific. Rules:
- If they ignored your main note from last time, say so plainly.
- Treat new issues and lost strengths as REGRESSIONS and call them out clearly. Creators frequently over-correct: fixing a hook by cutting setup that the payoff depended on is a net loss even when the score rises.
- A higher score is not automatically an improvement. Judge whether the video is actually better.
- Do not congratulate them for changes they did not make.

Return ONLY valid JSON (no markdown):
{
  "headline": "one blunt sentence verdict on this revision",
  "direction": "better" or "worse" or "sideways",
  "what_improved": ["specific, tied to an actual change"],
  "what_regressed": ["specific regression, or empty array"],
  "ignored": ["advice from last time they did not act on, or empty array"],
  "next_single_change": "the one change to make before the next cut",
  "review": "2 to 3 flowing paragraphs, coach voice, no bullet points"
}`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1400, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    const text = (data.content || []).map(c => c.text || "").join("").replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (e) {
    console.warn("Progress review failed:", e.message);
    return null;
  }
}

function VersionTracker({ results, videoData, platform, niche, isTikTokShop, isLiveClip, holisticAnalysis }) {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [diff, setDiff] = useState(null);
  const [review, setReview] = useState(null);
  const [savedInfo, setSavedInfo] = useState(null);
  const [suggestion, setSuggestion] = useState(null);

  const transcript = videoData?.transcript || "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${BACKEND_URL}/content/list`);
        const d = await r.json();
        if (!cancelled) setItems(d.items || []);
      } catch {}
      if (!transcript.trim()) return;
      try {
        const r = await fetch(`${BACKEND_URL}/content/suggest-match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        });
        const d = await r.json();
        if (!cancelled && d.suggestion) {
          setSuggestion(d.suggestion);
          setSelectedId(d.suggestion.contentId);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [transcript]);

  const saveVersion = async () => {
    setSaving(true); setSaveError(null); setDiff(null); setReview(null);
    try {
      const payload = {
        contentId: selectedId || undefined,
        title: selectedId ? undefined : (title.trim() || videoData?.filename || "Untitled content"),
        version: {
          label, filename: videoData?.filename || "",
          duration: videoData?.duration || 0,
          platform, niche, isTikTokShop, isLiveClip,
          score: results.score, hookScore: results.hookScore, wordCount: results.wordCount,
          transcript,
          flags: results.flags, positives: results.positives,
          holisticAnalysis: holisticAnalysis || "",
          frameNotes: (videoData?.frames || []).map(f => ({ label: f.label, analysis: f.analysis })),
        },
      };
      const r = await fetch(`${BACKEND_URL}/content/save-version`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Save failed.");
      setSavedInfo(d);
      setSelectedId(d.contentId);
      setLabel("");
      try {
        const list = await (await fetch(`${BACKEND_URL}/content/list`)).json();
        setItems(list.items || []);
      } catch {}
      if (d.previousVersion) {
        const computed = compareVersions(d.previousVersion, d.currentVersion);
        setDiff(computed);
        const rev = await generateProgressReview(d.previousVersion, d.currentVersion, computed);
        setReview(rev);
      }
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const Delta = ({ value, suffix = "" }) => (
    <span className={value > 0 ? "text-emerald-400" : value < 0 ? "text-red-400" : "text-slate-500"}>
      {value > 0 ? "+" : ""}{value}{suffix}
    </span>
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
      <h4 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
        <Layers size={14} className="text-violet-400"/>Version Tracking
        {savedInfo && <Tag variant="accent">v{savedInfo.versionNumber} saved</Tag>}
      </h4>

      {suggestion && selectedId === suggestion.contentId && !savedInfo && (
        <p className="text-xs text-slate-500 leading-relaxed">
          This looks like a new cut of <span className="text-violet-400">{suggestion.title}</span> ({Math.round(suggestion.similarity * 100)}% transcript match, currently v{suggestion.versionCount}). Change the dropdown if that is wrong.
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500/50">
          <option value="">— Save as new content —</option>
          {items.map(it => (
            <option key={it.contentId} value={it.contentId}>{it.title} (v{it.versionCount}, last {it.latestScore})</option>
          ))}
        </select>
        {selectedId ? (
          <input type="text" placeholder="What changed in this cut?" value={label} onChange={e => setLabel(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/50"/>
        ) : (
          <input type="text" placeholder="Name this content" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/50"/>
        )}
      </div>

      <button onClick={saveVersion} disabled={saving}
        className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-sm font-semibold text-white transition-colors">
        {saving ? "Saving and comparing…" : selectedId ? "Save as next version" : "Save as version 1"}
      </button>

      {saveError && <p className="text-xs text-red-400">{saveError}</p>}
      {savedInfo && !savedInfo.previousVersion && (
        <p className="text-xs text-slate-500 leading-relaxed">Baseline saved. Re-upload an improved cut and select this item to get a progress review.</p>
      )}

      {diff && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
              <p className="text-xs text-slate-500">Score</p>
              <p className="text-lg font-bold font-mono"><Delta value={diff.scoreDelta}/></p>
            </div>
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
              <p className="text-xs text-slate-500">Hook</p>
              <p className="text-lg font-bold font-mono"><Delta value={diff.hookDelta}/></p>
            </div>
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
              <p className="text-xs text-slate-500">Runtime</p>
              <p className="text-lg font-bold font-mono"><Delta value={diff.durationDelta} suffix="s"/></p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1">
              <p className="heading text-xs font-semibold text-emerald-300">Fixed ({diff.resolved.length})</p>
              {diff.resolved.slice(0, 4).map((f, i) => <p key={i} className="text-xs text-slate-400 leading-relaxed">{f.msg}</p>)}
              {diff.resolved.length === 0 && <p className="text-xs text-slate-600">Nothing resolved.</p>}
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
              <p className="heading text-xs font-semibold text-amber-300">Still there ({diff.persisting.length})</p>
              {diff.persisting.slice(0, 4).map((f, i) => <p key={i} className="text-xs text-slate-400 leading-relaxed">{f.msg}</p>)}
              {diff.persisting.length === 0 && <p className="text-xs text-slate-600">All previous issues cleared.</p>}
            </div>
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-1">
              <p className="heading text-xs font-semibold text-red-300">New / regressed ({diff.introduced.length + diff.positivesLost.length})</p>
              {diff.introduced.slice(0, 3).map((f, i) => <p key={i} className="text-xs text-slate-400 leading-relaxed">{f.msg}</p>)}
              {diff.positivesLost.slice(0, 2).map((p, i) => <p key={`l${i}`} className="text-xs text-slate-500 leading-relaxed">Lost: {p}</p>)}
              {diff.introduced.length + diff.positivesLost.length === 0 && <p className="text-xs text-slate-600">No regressions.</p>}
            </div>
          </div>
        </div>
      )}

      {review && (
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.05] p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Tag variant={review.direction === "better" ? "positive" : review.direction === "worse" ? "danger" : "warning"}>
              {review.direction === "better" ? "Improved" : review.direction === "worse" ? "Worse" : "Sideways"}
            </Tag>
            <p className="text-sm text-slate-200 font-medium">{review.headline}</p>
          </div>
          {review.review && <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{review.review}</p>}
          {review.ignored?.length > 0 && (
            <div className="space-y-1">
              <p className="heading text-xs font-semibold text-amber-300">Advice you skipped</p>
              {review.ignored.map((x, i) => <p key={i} className="text-xs text-slate-400 leading-relaxed">{x}</p>)}
            </div>
          )}
          {review.what_regressed?.length > 0 && (
            <div className="space-y-1">
              <p className="heading text-xs font-semibold text-red-300">Regressions</p>
              {review.what_regressed.map((x, i) => <p key={i} className="text-xs text-slate-400 leading-relaxed">{x}</p>)}
            </div>
          )}
          {review.next_single_change && (
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <p className="text-xs text-violet-200 leading-relaxed"><span className="font-semibold">Next cut: </span>{review.next_single_change}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VideoUploadPanel({ onAnalysisComplete, platform, niche, gameName = "", isTikTokShop = false, isLiveClip = false }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pipelineStep, setPipelineStep] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith("video/")) { setError("Please upload a valid video file."); return; }
    setFile(f); setError(null); setPreview(URL.createObjectURL(f));
  }, []);

  const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }, [handleFile]);
  const delay = ms => new Promise(r => setTimeout(r, ms));

  const runPipeline = useCallback(async () => {
    if (!file) return; setError(null); setProgress(0);
    try {
      setPipelineStep("upload");
      const formData = new FormData(); formData.append("video", file);
      const serverResponse = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest(); xhr.open("POST", `${BACKEND_URL}/analyze`);
        xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 40)); };
        xhr.onload = () => { if (xhr.status === 200) resolve(JSON.parse(xhr.responseText)); else reject(new Error(JSON.parse(xhr.responseText)?.error || "Server error")); };
        xhr.onerror = () => reject(new Error("Network error — is the server running?")); xhr.send(formData);
      });
      setPipelineStep("extract"); await delay(400); setProgress(50);
      setPipelineStep("transcribe"); await delay(600); setProgress(65);
      setPipelineStep("frames"); await delay(400); setProgress(75);
      setPipelineStep("vision");
      const frames = serverResponse.frames || []; const analyzedFrames = [];
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i]; let analysis = "";
        try { analysis = await analyzeFrameWithClaude(frame.base64, frame.label, platform, niche, gameName, isTikTokShop, isLiveClip); }
        catch (e) { analysis = `Vision analysis unavailable: ${e.message}`; }
        analyzedFrames.push({ ...frame, analysis });
        setProgress(75 + Math.round(((i + 1) / frames.length) * 24));
      }
      setProgress(100); setPipelineStep(null);
      let detectedNiche = null;
      try { detectedNiche = await detectNicheWithClaude(serverResponse.transcription?.text || ""); } catch (e) {}
      let holisticAnalysis = null;
      try { holisticAnalysis = await analyzeVideoHolistically(serverResponse.transcription?.text || "", analyzedFrames, platform, detectedNiche || niche, serverResponse.duration, isTikTokShop, isLiveClip); } catch(e) { console.warn("Holistic analysis failed:", e.message); }
      onAnalysisComplete({
        transcript: serverResponse.transcription?.text || "",
        duration: serverResponse.duration,
        durationLabel: serverResponse.durationLabel,
        filename: serverResponse.filename,
        frames: analyzedFrames,
        segments: serverResponse.transcription?.segments || [],
        detectedNiche,
        holisticAnalysis,
      });
    } catch (e) { setError(e.message); setPipelineStep(null); setProgress(0); }
  }, [file, platform, niche, gameName, onAnalysisComplete]);

  const clear = () => { setFile(null); setPreview(null); setError(null); setPipelineStep(null); setProgress(0); };

  if (pipelineStep) return (
    <div className="rounded-xl border border-violet-500/20 bg-[#0d1120] p-6 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Cpu size={14} className="text-violet-400 animate-pulse" />
        <span className="heading text-sm font-semibold text-slate-200">Processing Pipeline</span>
      </div>
      {PIPELINE_STEPS.map((step, i) => {
        const stepIdx = PIPELINE_STEPS.findIndex(s => s.id === pipelineStep);
        const done = i < stepIdx; const active = i === stepIdx;
        return (
          <div key={step.id} className={`flex items-center gap-3 ${active || done ? "opacity-100" : "opacity-25"}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${done ? "bg-emerald-500/20 border-emerald-500/30" : active ? "bg-violet-500/20 border-violet-500/30" : "bg-slate-800 border-slate-700"}`}>
              {done ? <CheckCircle size={13} className="text-emerald-400" /> : active ? <Loader2 size={13} className="text-violet-400 animate-spin" /> : <step.icon size={13} className="text-slate-600" />}
            </div>
            <span className={`text-xs ${active ? "text-slate-200 font-medium" : done ? "text-slate-500 line-through" : "text-slate-600"}`}>{step.label}</span>
            {active && <span className="text-xs text-violet-400 font-mono ml-auto">{progress}%</span>}
          </div>
        );
      })}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1120] overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <span className="heading text-sm font-semibold text-slate-300 flex items-center gap-2"><FileVideo size={13} className="text-violet-400" />Video Upload</span>
        <Tag variant="blue"><Wifi size={9} />Server: {BACKEND_URL.split("//")[1]}</Tag>
      </div>
      {!file ? (
        <div className={`m-3 rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-8 cursor-pointer ${dragOver ? "border-violet-500 bg-violet-500/5" : "border-slate-700 hover:border-slate-600"}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          <Upload size={24} className={`mb-3 ${dragOver ? "text-violet-400" : "text-slate-600"}`} />
          <p className="text-xs text-slate-400 text-center">Drop a video or <span className="text-violet-400">click to browse</span></p>
          <p className="text-xs text-slate-600 mt-1">MP4, MOV, AVI, WebM  No size limit</p>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-slate-900">
            <video src={preview} className="w-full max-h-36 object-contain" controls />
            <button onClick={clear} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center"><X size={11} className="text-slate-400" /></button>
          </div>
          <div className="flex items-center gap-2">
            <FileVideo size={12} className="text-slate-500" />
            <span className="text-xs text-slate-400 truncate flex-1">{file.name}</span>
            <Tag variant="default">{(file.size / 1e6).toFixed(1)} MB</Tag>
          </div>
        </div>
      )}
      {error && (
        <div className="mx-3 mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <XCircle size={12} className="text-red-400 mt-0.5" /><p className="text-xs text-red-400">{error}</p>
        </div>
      )}
      {file && (
        <div className="px-3 pb-3">
          <button onClick={runPipeline} className="w-full py-2.5 rounded-lg text-xs font-bold heading flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white" }}>
            <Play size={12} />Analyze Video
          </button>
        </div>
      )}
    </div>
  );
}

// ─── FRAME STRIP ──────────────────────────────────────────────────────────────
function FrameStrip({ frames }) {
  const [selected, setSelected] = useState(0);
  if (!frames || frames.length === 0) return null;
  const frame = frames[selected];
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
      <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
        <Eye size={14} className="text-cyan-400" />Claude Vision — Frame Analysis
        <Tag variant="blue"><Film size={9} />{frames.length} frames</Tag>
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {frames.map((f, i) => (
          <button key={i} onClick={() => setSelected(i)} className={`shrink-0 rounded-lg overflow-hidden border-2 ${selected === i ? "border-cyan-500" : "border-slate-700"}`}>
            <div className="relative">
              <img src={`data:image/jpeg;base64,${f.base64}`} alt={`Frame ${f.label}`} className="w-20 h-12 object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center py-0.5">
                <span className="text-[9px] font-mono text-slate-300">{f.label}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
          <img src={`data:image/jpeg;base64,${frame.base64}`} alt={`Frame at ${frame.label}`} className="w-full object-contain max-h-52" />
          <div className="px-3 py-2 flex items-center gap-2">
            <Clock size={10} className="text-slate-500" />
            <span className="text-xs font-mono text-slate-400">{frame.label}</span>
            {selected === 0 && <Tag variant="danger"><Flame size={9} />Hook Frame</Tag>}
            {selected === 1 && <Tag variant="warning"><Zap size={9} />3-sec Test</Tag>}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3"><Cpu size={12} className="text-cyan-400" /><span className="text-xs font-semibold text-slate-300">Claude Vision Analysis</span></div>
            {frame.analysis ? <p className="text-xs text-slate-400 leading-relaxed">{frame.analysis}</p> : <div className="flex items-center gap-2 text-xs text-slate-600"><Loader2 size={11} className="animate-spin" />Analyzing...</div>}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setSelected(Math.max(0, selected - 1))} disabled={selected === 0} className="flex-1 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 disabled:opacity-30">← Prev</button>
            <button onClick={() => setSelected(Math.min(frames.length - 1, selected + 1))} disabled={selected === frames.length - 1} className="flex-1 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 disabled:opacity-30">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── THUMBNAIL STUDIO ─────────────────────────────────────────────────────────
function ThumbnailStudio({ frames, platform, format }) {
  const canvasRef = useRef(null);
  const imageInputRef = useRef(null);
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [titleText, setTitleText] = useState("");
  const [style, setStyle] = useState(THUMB_STYLES[0]);
  const [position, setPosition] = useState(THUMB_POSITIONS[2]);
  const [fontSize, setFontSize] = useState(72);
  const [contrast, setContrast] = useState(110);
  const [saturation, setSaturation] = useState(120);
  const [fontFamily, setFontFamily] = useState("Arial Black");
  const [showBg, setShowBg] = useState(true);
  const [showTextShadow, setShowTextShadow] = useState(true);
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [colorGrade, setColorGrade] = useState(COLOR_GRADES[0]);
  const [vignette, setVignette] = useState(true);
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [zoom, setZoom] = useState(100);
  const [panX, setPanX] = useState(0);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const isVertical = format === "vertical" && (platform === "yt-short" || platform === "tiktok" || platform === "reels");
  const CW = isVertical ? 1080 : 1920;
  const CH = isVertical ? 1920 : 1080;
  const frame = frames?.[selectedFrame];

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(" "); const lines = []; let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) { lines.push(current); current = word; }
      else current = test;
    }
    if (current) lines.push(current);
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  const drawThumbnail = useCallback(() => {
    const canvas = canvasRef.current;
    const imageSource = uploadedImage || (frame?.base64 ? `data:image/jpeg;base64,${frame.base64}` : null);
    if (!canvas || !imageSource) return;
    const ctx = canvas.getContext("2d");
    canvas.width = CW; canvas.height = CH;
    const img = new window.Image();
    img.onload = () => {
      ctx.save();
      const scale = zoom / 100;
      const tx = (CW - CW * scale) / 2 + panX;
      const ty = (CH - CH * scale) / 2;
      ctx.filter = colorGrade.filter(contrast, saturation);
      ctx.translate(tx, ty); ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, CW, CH);
      ctx.restore(); ctx.filter = "none";
      if (vignette) {
        const grad = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.3, CW / 2, CH / 2, CH * 0.85);
        grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(0,0,0,0.75)");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, CW, CH);
      }
      if (position.id === "bottom" || position.id === "middle") {
        const btmGrad = ctx.createLinearGradient(0, CH * 0.55, 0, CH);
        btmGrad.addColorStop(0, "rgba(0,0,0,0)"); btmGrad.addColorStop(1, "rgba(0,0,0,0.7)");
        ctx.fillStyle = btmGrad; ctx.fillRect(0, CH * 0.55, CW, CH * 0.45);
      }
      if (!titleText.trim() && !selectedEmoji) return;
      const padding = 40; const maxWidth = CW - padding * 2;
      const fontStr = `${style.font} ${fontSize}px "${fontFamily}", Arial, sans-serif`;
      ctx.font = fontStr;
      const lines = titleText.trim() ? wrapText(ctx, titleText.toUpperCase(), maxWidth) : [];
      const lineH = fontSize * 1.25; const totalH = lines.length * lineH;
      const yPos = position.y * CH; const startY = yPos - totalH / 2;
      if (showBg && lines.length > 0) {
        ctx.fillStyle = style.bg;
        lines.forEach((line, i) => {
          const tw = ctx.measureText(line).width;
          const px = (CW - tw) / 2 - padding * 0.6;
          const py = startY + i * lineH - fontSize * 0.85;
          roundRect(ctx, px, py, tw + padding * 1.2, lineH * 0.95, 10);
          ctx.fill();
        });
      }
      if (showTextShadow) { ctx.shadowColor = style.shadow; ctx.shadowBlur = 18; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4; }
      if (strokeWidth > 0) {
        ctx.strokeStyle = "#000000"; ctx.lineWidth = strokeWidth; ctx.lineJoin = "round";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = fontStr;
        lines.forEach((line, i) => ctx.strokeText(line, CW / 2, startY + i * lineH + lineH * 0.15));
      }
      ctx.fillStyle = style.text; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = fontStr;
      lines.forEach((line, i) => ctx.fillText(line, CW / 2, startY + i * lineH + lineH * 0.15));
      if (selectedEmoji) {
        ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        ctx.font = `${fontSize * 1.4}px serif`; ctx.textAlign = "center";
        const emojiY = position.id === "top" ? startY - fontSize * 1.6 : startY + totalH + fontSize * 0.8;
        ctx.fillText(selectedEmoji, CW / 2, emojiY);
      }
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    };
    img.src = imageSource;
  }, [frame, titleText, style, position, fontSize, contrast, saturation, fontFamily, showBg, showTextShadow, strokeWidth, colorGrade, vignette, selectedEmoji, zoom, panX, CW, CH, uploadedImage]);

  useEffect(() => { drawThumbnail(); }, [drawThumbnail]);

  const download = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const a = document.createElement("a"); a.download = "thumbnail.png";
    a.href = canvas.toDataURL("image/png"); a.click();
  };

  const analyzeThumbnail = async () => {
    const canvas = canvasRef.current; if (!canvas || !ANTHROPIC_API_KEY) return;
    setAnalyzing(true); setAnalysisResult(null);
    try {
      const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 400,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
            { type: "text", text: `You are a YouTube/TikTok thumbnail expert. Score this thumbnail out of 100 and give a 3-4 sentence analysis covering: scroll-stop power, text readability, subject visibility, color contrast, and one specific improvement. Return ONLY valid JSON: {"score": number, "analysis": "string", "improvements": ["string","string"]}` },
          ]}] }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text?.trim().replace(/```json\n?|\n?```/g, "").trim();
      setAnalysisResult(JSON.parse(text));
    } catch (e) { setAnalysisResult({ score: 0, analysis: "Analysis failed: " + e.message, improvements: [] }); }
    setAnalyzing(false);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
      <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
        <Image size={14} className="text-violet-400" />Thumbnail Studio
        <span className="text-xs font-normal text-slate-500 ml-1">{CW}×{CH} · {isVertical ? "9:16" : "16:9"} export</span>
      </h3>
      <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center" style={{ maxHeight: "400px" }}>
        <canvas ref={canvasRef} style={{ width: "100%", aspectRatio: isVertical ? "9/16" : "16/9", maxHeight: "400px", objectFit: "contain" }} />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">Image Source</p>
        <div className="flex gap-2">
          <button onClick={() => imageInputRef.current?.click()}
            className="flex-1 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 hover:border-violet-500/50 hover:text-violet-300 flex items-center justify-center gap-2">
            <Upload size={11} />Upload Custom Image
          </button>
          {uploadedImage && <button onClick={() => setUploadedImage(null)} className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-red-400">✕ Clear</button>}
        </div>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = ev => setUploadedImage(ev.target.result); reader.readAsDataURL(f); }} />
        {uploadedImage && <p className="text-xs text-emerald-400 mt-1">✓ Custom image loaded</p>}
      </div>
      {frames && frames.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-2">Select Frame</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {frames.map((f, i) => (
              <button key={i} onClick={() => setSelectedFrame(i)} className={`shrink-0 rounded-lg overflow-hidden border-2 ${selectedFrame === i ? "border-violet-500" : "border-slate-700"}`}>
                <img src={`data:image/jpeg;base64,${f.base64}`} alt={f.label} className="w-20 h-12 object-cover" />
                <div className="text-center py-0.5 bg-black/50"><span className="text-[9px] font-mono text-slate-400">{f.label}</span></div>
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="text-xs text-slate-500 mb-2">Title Text</p>
        <input type="text" placeholder="Enter your thumbnail title..." value={titleText} onChange={e => setTitleText(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/50" />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">Color Grade</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_GRADES.map(g => (
            <button key={g.id} onClick={() => setColorGrade(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${colorGrade.id === g.id ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 text-slate-400"}`}>
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">Text Style</p>
        <div className="flex flex-wrap gap-2">
          {THUMB_STYLES.map(s => (
            <button key={s.id} onClick={() => setStyle(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${style.id === s.id ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 text-slate-400"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">Font</p>
        <div className="flex flex-wrap gap-2">
          {THUMB_FONTS.map(f => (
            <button key={f.id} onClick={() => setFontFamily(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${fontFamily === f.value ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 text-slate-400"}`}
              style={{ fontFamily: f.value }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">Text Options</p>
        <div className="flex gap-2">
          <button onClick={() => setShowBg(!showBg)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${showBg ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 text-slate-400"}`}>
            {showBg ? "✓" : "○"} Background
          </button>
          <button onClick={() => setShowTextShadow(!showTextShadow)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${showTextShadow ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 text-slate-400"}`}>
            {showTextShadow ? "✓" : "○"} Text Shadow
          </button>
          <button onClick={() => setVignette(!vignette)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${vignette ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 text-slate-400"}`}>
            {vignette ? "✓" : "○"} Vignette
          </button>
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">Emoji Accent</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedEmoji("")} className={`px-2 py-1 rounded-lg text-xs border ${selectedEmoji === "" ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 text-slate-400"}`}>None</button>
          {EMOJI_ACCENTS.map(e => (
            <button key={e} onClick={() => setSelectedEmoji(e)} className={`px-2 py-1 rounded-lg text-sm border ${selectedEmoji === e ? "border-violet-500/50 bg-violet-500/10" : "border-slate-700"}`}>{e}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">Text Position</p>
        <div className="flex gap-2">
          {THUMB_POSITIONS.map(p => (
            <button key={p.id} onClick={() => setPosition(p)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${position.id === p.id ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" : "border-slate-700 text-slate-400"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><p className="text-xs text-slate-500 mb-1">Font Size <span className="font-mono text-slate-400">{fontSize}px</span></p><input type="range" min="28" max="140" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full accent-violet-500" /></div>
        <div><p className="text-xs text-slate-500 mb-1">Stroke <span className="font-mono text-slate-400">{strokeWidth}px</span></p><input type="range" min="0" max="12" value={strokeWidth} onChange={e => setStrokeWidth(Number(e.target.value))} className="w-full accent-violet-500" /></div>
        <div><p className="text-xs text-slate-500 mb-1">Contrast <span className="font-mono text-slate-400">{contrast}%</span></p><input type="range" min="80" max="180" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full accent-violet-500" /></div>
        <div><p className="text-xs text-slate-500 mb-1">Saturation <span className="font-mono text-slate-400">{saturation}%</span></p><input type="range" min="0" max="220" value={saturation} onChange={e => setSaturation(Number(e.target.value))} className="w-full accent-violet-500" /></div>
        <div><p className="text-xs text-slate-500 mb-1">Zoom <span className="font-mono text-slate-400">{zoom}%</span></p><input type="range" min="100" max="200" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full accent-violet-500" /></div>
        <div><p className="text-xs text-slate-500 mb-1">Pan X <span className="font-mono text-slate-400">{panX}px</span></p><input type="range" min="-300" max="300" value={panX} onChange={e => setPanX(Number(e.target.value))} className="w-full accent-violet-500" /></div>
      </div>
      <div className="flex gap-3">
        <button onClick={download} className="flex-1 py-3 rounded-xl text-sm font-bold heading flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white" }}>
          <Image size={14} />Download PNG
        </button>
        <button onClick={analyzeThumbnail} disabled={analyzing} className="flex-1 py-3 rounded-xl text-sm font-bold heading flex items-center justify-center gap-2 border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 disabled:opacity-40">
          {analyzing ? <><Loader2 size={14} className="animate-spin" />Analyzing...</> : <><Eye size={14} />Analyze Thumbnail</>}
        </button>
      </div>
      {analysisResult && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono" style={{ color: analysisResult.score >= 75 ? "#22c55e" : analysisResult.score >= 50 ? "#f59e0b" : "#ef4444" }}>{analysisResult.score}</div>
              <div className="text-xs text-slate-500">/100</div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed flex-1">{analysisResult.analysis}</p>
          </div>
          {analysisResult.improvements?.length > 0 && (
            <div className="space-y-1">
              {analysisResult.improvements.map((imp, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-400"><Zap size={10} className="mt-0.5 shrink-0" />{imp}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────


// ─── STREAM COACH ─────────────────────────────────────────────────────────────
function GradeCircle({ grade, size = "md" }) {
  const color = { A: "#22c55e", B: "#84cc16", C: "#f59e0b", D: "#ef4444", F: "#dc2626" }[grade?.[0]] || "#94a3b8";
  const sz = size === "lg" ? "w-16 h-16 text-2xl" : size === "sm" ? "w-8 h-8 text-sm" : "w-12 h-12 text-lg";
  return (
    <div className={`${sz} rounded-full border-2 flex items-center justify-center font-bold font-mono shrink-0`}
      style={{ borderColor: color, color }}>
      {grade || "?"}
    </div>
  );
}

function ReportSection({ title, icon: Icon, grade, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1120] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 flex items-center gap-3 text-left">
        <Icon size={14} className="text-violet-400 shrink-0" />
        <span className="heading text-sm font-semibold text-slate-200 flex-1">{title}</span>
        {grade && <GradeCircle grade={grade} size="sm" />}
        <ChevronRight size={14} className={`text-slate-500 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 space-y-3 border-t border-slate-800 pt-4">{children}</div>}
    </div>
  );
}

function CoachItem({ label, value, grade, note }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
      {grade && <GradeCircle grade={grade} size="sm" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-300">{label}</span>
          {value !== undefined && <span className="text-xs font-mono text-violet-400 shrink-0">{value}</span>}
        </div>
        {note && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{note}</p>}
      </div>
    </div>
  );
}

function StreamCoach() {
  const [scanMode, setScanMode] = useState("upload");
  const [vodFile, setVodFile] = useState(null);
  const [vodUrl, setVodUrl] = useState("");
  const [streamerName, setStreamerName] = useState("");
  const [deepVideoScan, setDeepVideoScan] = useState(false);
  const [category, setCategory] = useState("");
  const [coaching, setCoaching] = useState(false);
  const [previewClip, setPreviewClip] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const PROGRESS_STEPS = [
    [10, "Uploading VOD..."],
    [25, "Extracting audio..."],
    [40, "Transcribing with Whisper (this takes a while)..."],
    [60, "Detecting silence and dead air..."],
    [70, "Analyzing filler words..."],
    [80, "Running engagement analysis..."],
    [88, "Auditing your intro..."],
    [94, "Analyzing vocal habits..."],
    [100, "Building your report card..."],
  ];

  const runCoach = async () => {
    setCoaching(true); setError(null); setReport(null); setProgress(5);
    setProgressLabel("Preparing...");

    // Simulate progress while waiting for server
    let stepIdx = 0;
    const progressInterval = setInterval(() => {
      if (stepIdx < PROGRESS_STEPS.length - 1) {
        stepIdx++;
        setProgress(PROGRESS_STEPS[stepIdx][0]);
        setProgressLabel(PROGRESS_STEPS[stepIdx][1]);
      }
    }, 30000); // advance every 30s

    try {
      const formData = new FormData();
      if (scanMode === "upload" && vodFile) formData.append("vod", vodFile);
      if (scanMode === "url") formData.append("url", vodUrl.trim());
      if (streamerName) formData.append("streamerName", streamerName);
      if (deepVideoScan) formData.append("deepVideoScan", "true");
      if (category.trim()) formData.append("category", category.trim());

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BACKEND_URL}/coach-vod`);
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 20));
          setProgressLabel("Uploading VOD...");
        }
      };

      const data = await new Promise((resolve, reject) => {
        xhr.onload = () => xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error(JSON.parse(xhr.responseText)?.error || "Coach failed"));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });

      clearInterval(progressInterval);
      setProgress(100);
      setProgressLabel("Report ready!");
      setReport(data);
    } catch(e) {
      clearInterval(progressInterval);
      setError(e.message);
    } finally {
      setCoaching(false);
    }
  };

  const rc = report?.reportCards;

  return (
    <div className="space-y-4">{previewClip && results?.sessionId && (<VODPreviewPlayer sessionId={results.sessionId} startSec={previewClip.startSec} endSec={previewClip.endSec} onClose={() => setPreviewClip(null)}/>)}
      {/* Setup panel */}
      {!report && (
        <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
          <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Award size={14} className="text-amber-400" />Stream Coach
            <Tag variant="warning">AI Report Card</Tag>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">Upload a full stream VOD and get a detailed report card covering your intro, dead air, filler words, engagement density, and vocal habits.</p>

          {/* Source toggle */}
          <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
            {[["upload","Upload VOD",Upload],["url","URL (Twitch/YT)",Hash]].map(([mode,label,Icon]) => (
              <button key={mode} onClick={() => setScanMode(mode)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium ${scanMode===mode?"bg-violet-500/20 text-violet-300 border border-violet-500/30":"text-slate-500"}`}>
                <Icon size={11}/>{label}
              </button>
            ))}
          </div>

          {scanMode === "upload" ? (
            <div>
              <button onClick={() => fileInputRef.current?.click()}
                className={`w-full py-3 rounded-lg border-2 border-dashed text-xs flex items-center justify-center gap-2 ${vodFile?"border-violet-500/50 text-violet-300":"border-slate-700 text-slate-500 hover:border-slate-600"}`}>
                <Upload size={12}/>{vodFile ? vodFile.name : "Click to select VOD file"}
              </button>
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => setVodFile(e.target.files?.[0]||null)}/>
              {vodFile && <p className="text-xs text-slate-500 mt-1">{(vodFile.size/1e9).toFixed(2)} GB</p>}
            </div>
          ) : (
            <input type="text" placeholder="https://twitch.tv/videos/... or https://youtube.com/watch?v=..."
              value={vodUrl} onChange={e => setVodUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/50"/>
          )}

          <input type="text" placeholder="Your streamer name (optional)"
            value={streamerName} onChange={e => setStreamerName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/50"/>

          <div className="space-y-1">
            <input type="text" list="coach-categories" placeholder="Category / game (optional - auto-detected from URL)"
              value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/50"/>
            <datalist id="coach-categories">
              {["Just Chatting","Stardew Valley","Minecraft","VALORANT","League of Legends","Call of Duty","Elden Ring","Resident Evil","Art","Music","Software and Game Development","Talk Shows &amp; Podcasts"].map(c => <option key={c} value={c}/>)}
            </datalist>
            <p className="text-xs text-slate-600 leading-relaxed">Sets grading norms. Silence during a horror game is tension; the same gap in Just Chatting is a viewer leaving.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <XCircle size={12} className="text-red-400 mt-0.5"/><p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {coaching && (
            <div className="space-y-2">
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{width:`${progress}%`}}/>
              </div>
              <p className="text-xs text-slate-400 text-center">{progressLabel}</p>
              <p className="text-xs text-slate-600 text-center">Full analysis takes 5-15 minutes for a 2-hour stream</p>
            </div>
          )}

          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={deepVideoScan} onChange={e => setDeepVideoScan(e.target.checked)}
              className="mt-0.5 accent-violet-500"/>
            <span className="text-xs text-slate-400 leading-relaxed">
              Deep video scan <span className="text-slate-600">— detects frozen frames and black screens. Requires decoding the whole VOD, so it adds significant processing time on long streams.</span>
            </span>
          </label>

          <button onClick={runCoach} disabled={coaching||(scanMode==="upload"&&!vodFile)||(scanMode==="url"&&!vodUrl.trim())}
            className="w-full py-3 rounded-xl text-sm font-bold heading flex items-center justify-center gap-2 disabled:opacity-40"
            style={{background:"linear-gradient(135deg,#d97706,#b45309)",color:"white"}}>
            {coaching?<><Loader2 size={14} className="animate-spin"/>Coaching in Progress...</>:<><Award size={14}/>Generate Stream Report Card</>}
          </button>
        </div>
      )}

      {/* Report Card */}
      {report && (
        <div className="space-y-4">{previewClip && results?.sessionId && (<VODPreviewPlayer sessionId={results.sessionId} startSec={previewClip.startSec} endSec={previewClip.endSec} onClose={() => setPreviewClip(null)}/>)}
          {/* Header */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center gap-4">
              <GradeCircle grade={report.overallGrade} size="lg"/>
              <div className="flex-1">
                <h3 className="heading text-lg font-bold text-white">{report.streamerName || "Stream"} Report Card</h3>
                <p className="text-xs text-slate-400 mt-1">{report.meta.vodDuration} VOD · True start at {report.meta.trueStartAt} · {report.meta.totalWords?.toLocaleString()} words spoken</p>
                <p className="text-xs text-slate-400">{report.meta.wordsPerMinute} WPM · Active stream: {report.meta.streamerActiveDuration}</p>
              </div>
              <button onClick={() => setReport(null)} className="text-xs text-slate-500 border border-slate-700 px-3 py-1.5 rounded-lg hover:border-slate-600">New Scan</button>
            </div>
            {report.overallSummary && <p className="text-xs text-amber-300 mt-3 leading-relaxed italic">"{report.overallSummary}"</p>}
            {report.contentContext && (
              <div className="mt-3 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {report.contentContext.category && <Tag variant="accent"><Layers size={10}/>{report.contentContext.category}</Tag>}
                  {report.contentContext.profileLabel && <Tag variant="blue">{report.contentContext.profileLabel}</Tag>}
                  {report.contentContext.deadAirThresholdSecs && <Tag variant="default">Dead air &gt; {report.contentContext.deadAirThresholdSecs}s</Tag>}
                  {report.contentContext.chapters?.length > 1 && <Tag variant="warning">{report.contentContext.chapters.length} content switches</Tag>}
                  {report.contentContext.source === "manual" && <Tag variant="default">manual</Tag>}
                </div>
                {report.contentContext.title && <p className="text-xs text-slate-500 leading-relaxed">{report.contentContext.title}</p>}
                {report.contentContext.chapters?.length > 1 && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {report.contentContext.chapters.slice(0, 6).map((c, i) => (
                      <span key={i}><span className="font-mono text-violet-400">{c.at}</span> {c.title}{i < Math.min(5, report.contentContext.chapters.length - 1) ? " · " : ""}</span>
                    ))}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Head Coach's Verdict */}
          {report.fullReview && (
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.07] to-[#0d1120] p-5 space-y-4">
              <h4 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Award size={14} className="text-amber-400"/>Head Coach's Verdict
                <Tag variant="warning">Full Audit</Tag>
              </h4>

              {report.fullReview.verdict && (
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{report.fullReview.verdict}</p>
              )}

              {report.fullReview.one_liner && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-200 font-medium italic leading-relaxed">"{report.fullReview.one_liner}"</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                {report.fullReview.did_well?.length > 0 && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                    <p className="heading text-xs font-semibold text-emerald-300 flex items-center gap-2"><CheckCircle size={13}/>What Worked</p>
                    {report.fullReview.did_well.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle size={12} className="text-emerald-400 mt-0.5 shrink-0"/>
                        <p className="text-xs text-slate-300 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                )}

                {report.fullReview.work_on_next?.length > 0 && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                    <p className="heading text-xs font-semibold text-amber-300 flex items-center gap-2"><Target size={13}/>Work On Next Stream</p>
                    {report.fullReview.work_on_next.map((item, i) => (
                      <div key={i} className="space-y-0.5">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-amber-400 shrink-0">{i+1}.</span>
                          <p className="text-xs text-slate-200 font-medium leading-relaxed">{item.focus}</p>
                        </div>
                        {(item.where || item.why) && (
                          <p className="text-xs text-slate-500 leading-relaxed pl-4">
                            {item.where && item.where !== "throughout" && <span className="font-mono text-violet-400">{item.where} </span>}
                            {item.why}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Correlation */}
          {report.chatAnalysis && (
            <div className="rounded-xl border border-blue-500/25 bg-[#0d1120] p-5 space-y-4">
              <h4 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Radio size={14} className="text-blue-400"/>Chat Correlation
                {report.chatAnalysis.available
                  ? <Tag variant="blue">Responsiveness {report.chatAnalysis.grade}</Tag>
                  : <Tag variant="default">Unavailable</Tag>}
              </h4>

              {!report.chatAnalysis.available && (
                <p className="text-xs text-slate-500 leading-relaxed">{report.chatAnalysis.reason || "Chat replay was not available for this VOD."}</p>
              )}

              {report.chatAnalysis.available && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                      <p className="text-xs text-slate-500">Messages</p>
                      <p className="text-lg font-bold text-slate-200 font-mono">{report.chatAnalysis.totalMessages}</p>
                    </div>
                    <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                      <p className="text-xs text-slate-500">Chatters</p>
                      <p className="text-lg font-bold text-slate-200 font-mono">{report.chatAnalysis.uniqueChatters}</p>
                    </div>
                    <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                      <p className="text-xs text-slate-500">Msgs / min</p>
                      <p className="text-lg font-bold text-slate-200 font-mono">{report.chatAnalysis.messagesPerMinute}</p>
                    </div>
                    <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                      <p className="text-xs text-slate-500">You responded</p>
                      <p className="text-lg font-bold text-emerald-400 font-mono">{report.chatAnalysis.acknowledgementRate}</p>
                    </div>
                  </div>

                  {report.chatAnalysis.velocity?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Chat velocity across the stream</p>
                      <div className="flex items-end gap-px h-16 w-full">
                        {(() => {
                          const v = report.chatAnalysis.velocity;
                          const peak = Math.max(1, ...v.map(b => b.count));
                          const spikeSecs = new Set((report.chatAnalysis.spikes || []).map(s => s.atSec));
                          const missedSecs = new Set((report.chatAnalysis.missedMoments || []).map(s => s.atSec));
                          return v.map((b, i) => (
                            <div key={i} title={`${b.label} - ${b.count} messages`}
                              style={{ height: `${Math.max(2, (b.count / peak) * 100)}%` }}
                              className={`flex-1 rounded-sm ${missedSecs.has(b.start) ? "bg-red-400" : spikeSecs.has(b.start) ? "bg-emerald-400" : "bg-blue-500/40"}`} />
                          ));
                        })()}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block"/>spike you rode</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block"/>spike you missed</span>
                      </div>
                    </div>
                  )}

                  {report.chatAnalysis.peakMoment && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
                      <p className="heading text-xs font-semibold text-emerald-300 flex items-center gap-2">
                        <TrendingUp size={13}/>Peak Chat Moment
                        <span className="font-mono text-violet-400">{report.chatAnalysis.peakMoment.at}</span>
                        <span className="text-slate-500">{report.chatAnalysis.peakMoment.messages} msgs</span>
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">You were saying: <span className="text-slate-300 italic">"{report.chatAnalysis.peakMoment.youWereSaying}"</span></p>
                      {report.chatAnalysis.peakMoment.sampleChat?.map((c, i) => (
                        <p key={i} className="text-xs text-slate-500 font-mono leading-relaxed">{c}</p>
                      ))}
                    </div>
                  )}

                  {report.chatAnalysis.missedMoments?.length > 0 && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                      <p className="heading text-xs font-semibold text-red-300 flex items-center gap-2"><AlertTriangle size={13}/>Missed Chat Spikes</p>
                      {report.chatAnalysis.missedMoments.map((m, i) => (
                        <div key={i} className="space-y-0.5">
                          <p className="text-xs text-slate-300">
                            <span className="font-mono text-violet-400">{m.at}</span> — {m.messages} messages
                            {m.multiplier && <span className="text-slate-500"> ({m.multiplier}x normal)</span>}
                            <span className="text-slate-500"> · you said {m.streamerWordsAfter} words in the next 45s</span>
                          </p>
                          {m.sampleChat?.slice(0, 2).map((c, k) => (
                            <p key={k} className="text-xs text-slate-500 font-mono pl-3">{c}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {report.chatAnalysis.deadAirCorrelation?.length > 0 && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                      <p className="heading text-xs font-semibold text-amber-300 flex items-center gap-2"><Volume2 size={13}/>Dead Air vs Chat</p>
                      {report.chatAnalysis.deadAirCorrelation.map((d, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="font-mono text-violet-400 text-xs shrink-0">{d.at}</span>
                          <div className="space-y-0.5">
                            <p className="text-xs text-slate-300">
                              {d.duration} silent · chat {d.chatState} ({d.chatMessages} msgs)
                            </p>
                            <p className="text-xs text-slate-500 leading-relaxed">{d.verdict}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {report.chatAnalysis.topChatters?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500">Top chatters:</span>
                      {report.chatAnalysis.topChatters.map((c, i) => (
                        <Tag key={i} variant="default">{c.user} · {c.count}</Tag>
                      ))}
                    </div>
                  )}

                  {report.chatAnalysis.coachingNote && (
                    <p className="text-xs text-blue-200 leading-relaxed italic">{report.chatAnalysis.coachingNote}</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Technical Audit */}
          {report.technicalAudit && (
            <div className="rounded-xl border border-slate-700 bg-[#0d1120] p-5 space-y-4">
              <h4 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Wifi size={14} className="text-cyan-400"/>Technical Health
                <Tag variant={report.technicalAudit.confirmedCount > 0 ? "danger" : report.technicalAudit.incidentCount > 0 ? "warning" : "positive"}>
                  Grade {report.technicalAudit.grade}
                </Tag>
                {!report.technicalAudit.videoScanned && <Tag variant="default">audio only</Tag>}
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                  <p className="text-xs text-slate-500">Incidents</p>
                  <p className="text-lg font-bold text-slate-200 font-mono">{report.technicalAudit.incidentCount}</p>
                </div>
                <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                  <p className="text-xs text-slate-500">Confirmed</p>
                  <p className={`text-lg font-bold font-mono ${report.technicalAudit.confirmedCount > 0 ? "text-red-400" : "text-emerald-400"}`}>{report.technicalAudit.confirmedCount}</p>
                </div>
                <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                  <p className="text-xs text-slate-500">Stream affected</p>
                  <p className="text-lg font-bold text-slate-200 font-mono">{report.technicalAudit.impactPercentage}%</p>
                </div>
                <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                  <p className="text-xs text-slate-500">Loudness</p>
                  <p className="text-lg font-bold text-slate-200 font-mono">{report.technicalAudit.audioHealth?.integratedLufs ?? "n/a"}<span className="text-xs text-slate-500"> LUFS</span></p>
                </div>
              </div>

              {report.technicalAudit.audioHealth?.integratedLufs !== null && report.technicalAudit.audioHealth?.integratedLufs !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>-30</span><span className="text-emerald-400">target -14 LUFS</span><span>-5</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="absolute inset-y-0 bg-emerald-500/30" style={{left:"56%",width:"20%"}}/>
                    <div className="absolute inset-y-0 w-1 bg-cyan-400 rounded-full"
                      style={{left:`${Math.min(98, Math.max(0, ((report.technicalAudit.audioHealth.integratedLufs + 30) / 25) * 100))}%`}}/>
                  </div>
                </div>
              )}

              {report.technicalAudit.audioHealth?.warnings?.length > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                  <p className="heading text-xs font-semibold text-amber-300 flex items-center gap-2"><Mic size={13}/>Audio Setup</p>
                  {report.technicalAudit.audioHealth.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-slate-400 leading-relaxed">{w}</p>
                  ))}
                </div>
              )}

              {report.technicalAudit.incidents?.length > 0 && (
                <div className="space-y-2">
                  <p className="heading text-xs font-semibold text-slate-300 flex items-center gap-2"><AlertTriangle size={13} className="text-red-400"/>Detected Incidents</p>
                  {report.technicalAudit.incidents.map((inc, i) => (
                    <div key={i} className={`rounded-lg border p-3 space-y-1 ${inc.confidence === "confirmed" ? "border-red-500/25 bg-red-500/5" : inc.confidence === "likely" ? "border-amber-500/20 bg-amber-500/5" : "border-slate-800 bg-slate-900/40"}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-violet-400 text-xs">{inc.at}</span>
                        <Tag variant={inc.confidence === "confirmed" ? "danger" : inc.confidence === "likely" ? "warning" : "default"}>{inc.confidence}</Tag>
                        <span className="text-xs text-slate-500">{inc.durationSec}s</span>
                        {inc.viewerReported && <Tag variant="blue">viewers noticed</Tag>}
                      </div>
                      {inc.details?.map((d, k) => (
                        <p key={k} className="text-xs text-slate-400 leading-relaxed">{d}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {report.technicalAudit.coachingNote && (
                <p className="text-xs text-cyan-200 leading-relaxed italic">{report.technicalAudit.coachingNote}</p>
              )}

              {!report.technicalAudit.videoScanned && (
                <p className="text-xs text-slate-600 leading-relaxed">Video freeze and black-screen detection was not run. Enable "Deep video scan" before your next audit to catch purely visual faults.</p>
              )}
            </div>
          )}

          {/* Action Plan */}
          {report.actionPlan?.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-2">
              <h4 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2"><Zap size={13} className="text-amber-400"/>Action Plan</h4>
              {report.actionPlan.map((item, i) => (
                <div key={i} className={`text-xs p-3 rounded-lg border leading-relaxed ${item.startsWith("🔴")?"bg-red-500/5 border-red-500/20 text-red-300":item.startsWith("🟡")?"bg-amber-500/5 border-amber-500/20 text-amber-300":"bg-emerald-500/5 border-emerald-500/20 text-emerald-300"}`}>
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* Intro Audit */}
          {rc?.introAudit && (
            <ReportSection title="Intro Audit" icon={Play} grade={rc.introAudit.overall_intro_grade} defaultOpen={true}>
              <div className="text-xs text-slate-500 mb-2">True start detected at <span className="text-violet-400 font-mono">{rc.introAudit.trueStartDetectedAt}</span></div>
              {rc.introAudit.hook_text && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Opening words:</p>
                  <p className="text-xs text-slate-300 italic">"{rc.introAudit.hook_text}"</p>
                </div>
              )}
              <CoachItem label="Hook Quality" grade={rc.introAudit.hook_grade} note={rc.introAudit.hook_feedback}/>
              <CoachItem label="Value Proposition" grade={rc.introAudit.value_proposition_present?"A":"D"} note={rc.introAudit.value_proposition_feedback}/>
              <CoachItem label="Energy Level" grade={rc.introAudit.energy_grade} note={rc.introAudit.energy_feedback}/>
              <CoachItem label="Self-Introduced" grade={rc.introAudit.self_introduced?"A":"C"} note={rc.introAudit.self_introduced?"Good — you introduced yourself for new viewers.":"Consider introducing yourself early for new viewers."}/>
              {rc.introAudit.rewrite_suggestion && (
                <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                  <p className="text-xs text-violet-400 font-semibold mb-1">💡 Suggested rewrite:</p>
                  <p className="text-xs text-slate-300 italic">"{rc.introAudit.rewrite_suggestion}"</p>
                </div>
              )}
            </ReportSection>
          )}

          {/* Dead Air */}
          {rc?.deadAir && (
            <ReportSection title="Dead Air Analysis" icon={Volume2} grade={rc.deadAir.grade}>
              <CoachItem label="Total Dead Air" value={`${rc.deadAir.totalSeconds}s`} grade={rc.deadAir.grade} note={`${rc.deadAir.totalInstances} instances (${rc.deadAir.percentage}% of stream)`}/>
              {rc.deadAir.longestInstance !== "None" && <CoachItem label="Longest Gap" value={rc.deadAir.longestInstance}/>}
              {rc.deadAir.worstMoments?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-semibold">Worst moments:</p>
                  {rc.deadAir.worstMoments.map((m,i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-violet-400">{m.at}</span>
                      <span className="text-slate-500">{m.duration} of silence</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500 leading-relaxed">{rc.deadAir.coachingNote}</p>
            </ReportSection>
          )}

          {/* Filler Words */}
          {rc?.fillerWords && (
            <ReportSection title="Filler Words" icon={Mic} grade={rc.fillerWords.grade}>
              <CoachItem label="Filler Rate" value={`${rc.fillerWords.fillerRate} per 100 words`} grade={rc.fillerWords.grade} note={`${rc.fillerWords.totalFillers} total fillers in ${rc.fillerWords.totalWords?.toLocaleString()} words`}/>
              {Object.keys(rc.fillerWords.topOffenders||{}).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-semibold">Top offenders:</p>
                  {Object.entries(rc.fillerWords.topOffenders).map(([word, count]) => (
                    <div key={word} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-amber-400">"{word}"</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500/50 rounded-full" style={{width:`${Math.min(100,(count/rc.fillerWords.totalFillers)*100*3)}%`}}/>
                      </div>
                      <span className="text-xs font-mono text-slate-500">{count}x</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500 leading-relaxed">{rc.fillerWords.coachingNote}</p>
            </ReportSection>
          )}

          {/* Engagement */}
          {rc?.engagement && (
            <ReportSection title="Engagement Density" icon={Heart} grade={rc.engagement.overall_engagement_grade}>
              <CoachItem label="Questions to Chat" value={`${rc.engagement.questions_to_chat?.count} (${rc.engagement.questions_to_chat?.rate_per_hour}/hr)`} grade={rc.engagement.questions_to_chat?.grade} note={rc.engagement.questions_to_chat?.feedback}/>
              <CoachItem label="Calls to Action" value={rc.engagement.calls_to_action?.count} grade={rc.engagement.calls_to_action?.grade} note={rc.engagement.calls_to_action?.feedback}/>
              <CoachItem label="Chat Acknowledgments" value={rc.engagement.chat_acknowledgments?.count} grade={rc.engagement.chat_acknowledgments?.grade} note={rc.engagement.chat_acknowledgments?.feedback}/>
              <CoachItem label="Personal Connection" value={rc.engagement.personal_connection_moments?.count} grade={rc.engagement.personal_connection_moments?.grade} note={rc.engagement.personal_connection_moments?.feedback}/>
              {rc.engagement.questions_to_chat?.examples?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-semibold">Example questions detected:</p>
                  {rc.engagement.questions_to_chat.examples.map((ex,i) => (
                    <p key={i} className="text-xs text-slate-400 italic">"{ex}"</p>
                  ))}
                </div>
              )}
            </ReportSection>
          )}

          {/* Vocal Habits */}
          {rc?.vocalHabits && (
            <ReportSection title="Vocal Habits" icon={Radio} grade={rc.vocalHabits.overall_vocal_grade}>
              <CoachItem label="Speaking Pace" grade={rc.vocalHabits.pace_grade}/>
              <CoachItem label="Sentence Variety" grade={rc.vocalHabits.variety_grade}/>
              <CoachItem label="Trailing Off" value={`${rc.vocalHabits.trailing_off_instances}x`}/>
              <CoachItem label="Self-Interruptions" value={`${rc.vocalHabits.self_interruptions}x`}/>
              {rc.vocalHabits.repetitive_phrases?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-semibold">Repetitive phrases:</p>
                  {rc.vocalHabits.repetitive_phrases.slice(0,5).map((p,i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-cyan-400">"{p.phrase}"</span>
                      <span className="text-slate-500">~{p.approximate_count}x</span>
                    </div>
                  ))}
                </div>
              )}
              {rc.vocalHabits.top_exercise && (
                <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                  <p className="text-xs text-cyan-400 font-semibold mb-1">💪 Pre-stream exercise:</p>
                  <p className="text-xs text-slate-300">{rc.vocalHabits.top_exercise}</p>
                </div>
              )}
            </ReportSection>
          )}
        </div>
      )}
    </div>
  );
}



// ─── VOD PREVIEW PLAYER ───────────────────────────────────────────────────────
function VODPreviewPlayer({ sessionId, startSec, endSec, onClose }) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const streamUrl = `${BACKEND_URL}/vod-stream/${sessionId}`;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = startSec;
    }
  }, [startSec]);

  const handleLoaded = () => {
    setLoading(false);
    if (videoRef.current) {
      videoRef.current.currentTime = startSec;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= endSec) {
      videoRef.current.pause();
    }
  };

  const downloadClip = async (label) => {
    setDownloading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/extract-clip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, startSec, endSec, label }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(label||"clip").replace(/[^a-zA-Z0-9_-]/g,"_")}_${Math.round(startSec)}s.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      setError(e.message);
    }
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0d1120] border border-slate-700 rounded-2xl overflow-hidden w-full max-w-3xl space-y-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <span className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Play size={13} className="text-violet-400"/>Clip Preview
            <span className="text-xs font-mono text-slate-500">{Math.floor(startSec/60)}:{String(Math.round(startSec)%60).padStart(2,"0")} → {Math.floor(endSec/60)}:{String(Math.round(endSec)%60).padStart(2,"0")}</span>
          </span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={16}/></button>
        </div>
        <div className="relative bg-black" style={{aspectRatio:"16/9"}}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={24} className="text-violet-400 animate-spin"/>
            </div>
          )}
          <video
            ref={videoRef}
            src={streamUrl}
            className="w-full h-full"
            controls
            onLoadedMetadata={handleLoaded}
            onTimeUpdate={handleTimeUpdate}
            onError={() => setError("Failed to load VOD stream. The session may have expired.")}
          />
        </div>
        <div className="px-4 py-3 flex items-center gap-3 border-t border-slate-800">
          {error && <p className="text-xs text-red-400 flex-1">{error}</p>}
          {!error && <p className="text-xs text-slate-500 flex-1">Playing {Math.round(endSec-startSec)}s clip · VOD cached for 24 hours</p>}
          <button onClick={() => downloadClip("clip")} disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold heading disabled:opacity-40"
            style={{background:"linear-gradient(135deg,#7c3aed,#4f46e5)",color:"white"}}>
            {downloading?<><Loader2 size={11} className="animate-spin"/>Extracting...</>:<><Upload size={11}/>Download Clip</>}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── CLIP SCANNER ─────────────────────────────────────────────────────────────
function ClipScanner() {
  const [scanMode, setScanMode] = useState("upload"); // "upload" | "url"
  const [vodFile, setVodFile] = useState(null);
  const [vodUrl, setVodUrl] = useState("");
  const [topics, setTopics] = useState("");
  const [minClipLen, setMinClipLen] = useState(30);
  const [maxClips, setMaxClips] = useState(10);
  const [scanning, setScanning] = useState(false);
  const [scanFormat, setScanFormat] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedClip, setSelectedClip] = useState(null);
  const [auditingClip, setAuditingClip] = useState(null);
  const [clipAudit, setClipAudit] = useState({});
  const [previewClip, setPreviewClip] = useState(null);
  const fileInputRef = useRef(null);

  const runScan = async () => {
    setScanning(true); setError(null); setResults(null); setProgress(0);
    try {
      const formData = new FormData();
      if (scanMode === "upload" && vodFile) formData.append("vod", vodFile);
      if (scanMode === "url") formData.append("url", vodUrl.trim());
      formData.append("topics", topics);
      formData.append("minClipLen", String(minClipLen));
      formData.append("maxClips", String(maxClips));
      if (scanFormat) formData.append("format", scanFormat);

      setProgressLabel("Uploading VOD...");
      setProgress(5);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BACKEND_URL}/scan-vod`);

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 30));
          setProgressLabel("Uploading VOD...");
        }
      };

      const response = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
          else reject(new Error(JSON.parse(xhr.responseText)?.error || "Scan failed"));
        };
        xhr.onerror = () => reject(new Error("Network error — is the server running?"));
        xhr.send(formData);
      });

      setProgress(100);
      setProgressLabel(`Found ${response.clips.length} viral moments!`);
      setResults(response);
    } catch (e) {
      setError(e.message);
    } finally {
      setScanning(false);
    }
  };

  const auditClip = async (clip) => {
    if (!clip.thumbnail || clipAudit[clip.index]) return;
    setAuditingClip(clip.index);
    try {
      const analysis = await analyzeFrameWithClaude(clip.thumbnail, clip.startLabel, "tiktok", "streaming", "", false, true);
      const hooks = await generateHookAlternatives(clip.transcript, "tiktok", "streaming", "", false, true);
      setClipAudit(prev => ({ ...prev, [clip.index]: { analysis, hooks } }));
    } catch (e) {
      setClipAudit(prev => ({ ...prev, [clip.index]: { analysis: "Audit failed: " + e.message, hooks: null } }));
    }
    setAuditingClip(null);
  };

  const copyTimestamps = () => {
    if (!results?.clips) return;
    const text = results.clips.map((c, i) => `Clip ${i + 1}: ${c.startLabel} - ${c.endLabel} (Score: ${c.score})\n${c.reasons.join(", ")}\n"${c.transcript.slice(0, 100)}..."`).join("\n\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">{previewClip && results?.sessionId && (<VODPreviewPlayer sessionId={results.sessionId} startSec={previewClip.startSec} endSec={previewClip.endSec} onClose={() => setPreviewClip(null)}/>)}
      <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
        <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Zap size={14} className="text-violet-400" />VOD Clip Scanner
          <Tag variant="accent">Beta</Tag>
        </h3>

        {/* Source toggle */}
        <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
          {[["upload", "Upload VOD", Upload], ["url", "URL (Twitch/YT)", Hash]].map(([mode, label, Icon]) => (
            <button key={mode} onClick={() => setScanMode(mode)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium ${scanMode === mode ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-slate-500"}`}>
              <Icon size={11} />{label}
            </button>
          ))}
        </div>

        {/* VOD source */}
        {scanMode === "upload" ? (
          <div>
            <button onClick={() => fileInputRef.current?.click()}
              className={`w-full py-3 rounded-lg border-2 border-dashed text-xs flex items-center justify-center gap-2 ${vodFile ? "border-violet-500/50 text-violet-300" : "border-slate-700 text-slate-500 hover:border-slate-600"}`}>
              <Upload size={12} />{vodFile ? vodFile.name : "Click to select VOD file"}
            </button>
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
              onChange={e => setVodFile(e.target.files?.[0] || null)} />
            {vodFile && <p className="text-xs text-slate-500 mt-1">{(vodFile.size / 1e9).toFixed(2)} GB</p>}
          </div>
        ) : (
          <input type="text" placeholder="https://twitch.tv/videos/... or https://youtube.com/watch?v=..."
            value={vodUrl} onChange={e => setVodUrl(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/50" />
        )}

        {/* Format selector */}
        <div>
          <p className="text-xs text-slate-400 font-semibold mb-1">Content Format <span className="text-slate-600 font-normal">(auto-detected if blank)</span></p>
          <div className="flex flex-wrap gap-2">
            {[["","Auto Detect"],["gaming_tactical","Tactical Gaming"],["gaming_interactive","Chat/Interactive"],["irl_review","IRL / Review"],["variety","Variety"]].map(([val, label]) => (
              <button key={val} onClick={() => setScanFormat(val)}
                className={"px-2.5 py-1 rounded-lg text-xs border " + (scanFormat === val ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 text-slate-500")}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {/* Topic keywords */}
        <div>
          <p className="text-xs text-slate-400 font-semibold mb-1">Topic Keywords <span className="text-slate-600 font-normal">(optional)</span></p>
          <textarea
            placeholder="e.g. self promotion, streaming growth, subscriber tips, raid&#10;Separate with commas or new lines"
            value={topics} onChange={e => setTopics(e.target.value)}
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/50 resize-none" />
        </div>

        {/* Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Min Clip Length <span className="font-mono text-slate-400">{minClipLen}s</span></p>
            <input type="range" min="15" max="120" step="15" value={minClipLen} onChange={e => setMinClipLen(Number(e.target.value))} className="w-full accent-violet-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Max Clips <span className="font-mono text-slate-400">{maxClips}</span></p>
            <input type="range" min="5" max="30" step="5" value={maxClips} onChange={e => setMaxClips(Number(e.target.value))} className="w-full accent-violet-500" />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <XCircle size={12} className="text-red-400 mt-0.5" /><p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {scanning && (
          <div className="space-y-2">
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-500 text-center">{progressLabel || "Processing VOD..."}</p>
            <p className="text-xs text-slate-600 text-center">This may take several minutes for long streams</p>
          </div>
        )}

        <button onClick={runScan}
          disabled={scanning || (scanMode === "upload" && !vodFile) || (scanMode === "url" && !vodUrl.trim())}
          className="w-full py-3 rounded-xl text-sm font-bold heading flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white" }}>
          {scanning ? <><Loader2 size={14} className="animate-spin" />Scanning VOD...</> : <><Zap size={14} />Scan for Viral Moments</>}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="heading text-sm font-semibold text-slate-200">{results.clips.length} Viral Moments Found</h3>
              <p className="text-xs text-slate-500">VOD length: {results.durationLabel} · {results.totalWindows} windows · Format: {results.formatLabel}</p>
            </div>
            <button onClick={copyTimestamps}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 hover:border-violet-500/50 hover:text-violet-300 flex items-center gap-1">
              <CheckSquare size={10} />Copy Timestamps
            </button>
          </div>

          {results.clips.map((clip, i) => (
            <div key={clip.index} className={`rounded-xl border bg-[#0d1120] overflow-hidden transition-all ${selectedClip === clip.index ? "border-violet-500/40" : "border-slate-800"}`}>
              <button className="w-full p-4 flex items-start gap-4 text-left" onClick={() => setSelectedClip(selectedClip === clip.index ? null : clip.index)}>
                {/* Thumbnail */}
                {clip.thumbnail ? (
                  <img src={`data:image/jpeg;base64,${clip.thumbnail}`} alt={`Clip ${i + 1}`} className="w-24 h-14 object-cover rounded-lg shrink-0 border border-slate-700" />
                ) : (
                  <div className="w-24 h-14 rounded-lg bg-slate-800 shrink-0 flex items-center justify-center"><Film size={16} className="text-slate-600" /></div>
                )}
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-violet-400">#{i + 1}</span>
                    <span className="text-xs font-mono text-slate-400">{clip.startLabel} → {clip.endLabel}</span>
                    {clip.narrativeType && clip.narrativeType !== "unknown" && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{clip.narrativeType}</span>}
                    <div className="ml-auto flex items-center gap-1">
                      <div className="text-sm font-bold font-mono" style={{ color: clip.score >= 75 ? "#22c55e" : clip.score >= 50 ? "#f59e0b" : "#ef4444" }}>{clip.score}</div>
                      <span className="text-xs text-slate-600">/100</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {clip.reasons.map((r, ri) => <span key={ri} className="text-xs text-slate-400">{r}</span>)}
                  </div>
                  {clip.clipTitle && <p className="text-xs font-semibold text-violet-300 truncate">📌 {clip.clipTitle}</p>}
                  {clip.hookText && <p className="text-xs text-cyan-400 truncate italic">🎣 "{clip.hookText}"</p>}
                  <p className="text-xs text-slate-500 truncate italic mt-1">"{clip.transcript.slice(0, 100)}..."</p>
                </div>
              </button>

              {/* Expanded view */}
              {selectedClip === clip.index && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">
                  <p className="text-xs text-slate-400 leading-relaxed">"{clip.transcript}"</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPreviewClip(clip)} className="flex-1 py-2 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium flex items-center justify-center gap-1"><Play size={11}/>Preview</button>
                    <button onClick={() => auditClip(clip)} disabled={auditingClip === clip.index || !!clipAudit[clip.index]}
                      className="flex-1 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-40">
                      {auditingClip === clip.index ? <><Loader2 size={11} className="animate-spin" />Auditing...</> : clipAudit[clip.index] ? <><CheckCircle size={11} />Audited</> : <><Eye size={11} />Deep Audit</>}
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(`${clip.startLabel} - ${clip.endLabel}`)}
                      className="px-3 py-2 rounded-lg border border-slate-700 text-slate-400 text-xs flex items-center gap-1">
                      <CheckSquare size={11} />Copy Time
                    </button>
                  </div>
                  {clipAudit[clip.index] && (
                    <div className="space-y-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                      <div>
                        <p className="text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1"><Eye size={10} />Vision Analysis</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{clipAudit[clip.index].analysis}</p>
                      </div>
                      {clipAudit[clip.index].hooks && (
                        <div>
                          <p className="text-xs font-semibold text-violet-400 mb-2 flex items-center gap-1"><Scissors size={10} />Hook Alternatives</p>
                          {clipAudit[clip.index].hooks.map((h, hi) => (
                            <div key={hi} className="mb-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                              <span className="text-xs font-mono text-violet-400 mr-2">#{hi + 1}</span>
                              <span className="text-xs text-slate-300">{h}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export default function ViralAuditAI() {
  const [script, setScript] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [format, setFormat] = useState("vertical");
  const [niche, setNiche] = useState("tech");
  const [gameName, setGameName] = useState("");
  const [isTikTokShop, setIsTikTokShop] = useState(false);
  const [isLiveClip, setIsLiveClip] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("hook");
  const [checklistState, setChecklistState] = useState({});
  const [animIn, setAnimIn] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [inputMode, setInputMode] = useState("text");
  const [videoUrl, setVideoUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);

  const wordCount = useMemo(() => script.trim().split(/\s+/).filter(Boolean).length, [script]);
  const platformCfg = PLATFORM_CONFIG[platform];

  const handleVideoAnalysisComplete = useCallback(data => {
    setVideoData(data);
    if (data.transcript) setScript(data.transcript);
    if (data.detectedNiche) setNiche(data.detectedNiche);
  }, []);

  async function runAudit() {
    if (!script.trim()) return;
    setLoading(true); setResults(null); setAnimIn(false);
    setTimeout(async () => {
      const r = analyzeScript(script, platform, format, niche, isTikTokShop, isLiveClip);
      // Recompute the CCO Review with CURRENT toggle/niche state — it was first
      // generated at upload time, before Shop / Live-clip / niche may have been set.
      if (videoData?.transcript) {
        try {
          const freshReview = await analyzeVideoHolistically(
            videoData.transcript,
            videoData.frames || [],
            platform,
            niche,
            videoData.duration || 0,
            isTikTokShop,
            isLiveClip
          );
          if (freshReview) setVideoData(prev => ({ ...prev, holisticAnalysis: freshReview }));
        } catch (e) { console.warn("CCO Review re-run failed:", e.message); }
      }
      const aiHooks = await generateHookAlternatives(script, platform, niche, gameName || "", isTikTokShop, isLiveClip);
      if (aiHooks) r.hookAlternatives = aiHooks;
      const initialChecklist = {};
      r.checklist.forEach(item => { initialChecklist[item.id] = item.checked; });
      setChecklistState(initialChecklist);
      setResults(r); setLoading(false); setActiveTab("hook");
      setTimeout(() => setAnimIn(true), 50);
    }, 800);
  }

  return (
    <div className="min-h-screen bg-[#090c14] text-slate-100" style={{ fontFamily: "'DM Mono','Fira Code',monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
        .heading { font-family: 'Space Grotesk', sans-serif; }
        .fade-up { opacity: 0; transform: translateY(16px); transition: opacity .5s ease, transform .5s ease; }
        .fade-up.in { opacity: 1; transform: translateY(0); }
        .fade-up.in.d1 { transition-delay: .05s; }
        .fade-up.in.d2 { transition-delay: .12s; }
        .fade-up.in.d3 { transition-delay: .2s; }
        .fade-up.in.d4 { transition-delay: .28s; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f1320; }
        ::-webkit-scrollbar-thumb { background: #2a3050; border-radius: 2px; }
        .grid-bg { background-image: linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px); background-size: 32px 32px; }
      `}</style>

      <header className="border-b border-slate-800/60 bg-[#090c14]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center"><Cpu size={14} className="text-violet-400" /></div>
            <span className="heading font-bold text-lg text-white">ViralAudit <span className="text-violet-400">AI</span></span>
            <Tag variant="accent"><Zap size={10} />v3.0</Tag>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="hidden sm:inline">Vision + Whisper Engine</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">ONLINE</span>
          </div>
        </div>
      </header>

      <div className={`max-w-screen-xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 gap-6 ${inputMode === "coach" ? "" : "lg:grid-cols-[400px_1fr]"}`}>
        <aside className="space-y-4">
          {/* Input mode tabs */}
          <div className="flex flex-wrap gap-1 bg-[#0d1120] border border-slate-800 rounded-xl p-1">
            {[["text", "Script / Text", Scissors], ["video", "Video Upload", FileVideo], ["url", "URL Import", Hash], ["scanner", "Clip Scanner", Film], ["coach", "Stream Coach", Award]].map(([mode, label, Icon]) => (
              <button key={mode} onClick={() => setInputMode(mode)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium ${inputMode === mode ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-slate-500"}`}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>

          {/* Script input */}
          {inputMode === "text" && (
            <div className="rounded-xl border border-slate-800 bg-[#0d1120] overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="heading text-sm font-semibold text-slate-300">Script / Transcript</span>
                <span className="text-xs font-mono text-slate-500">{wordCount} words</span>
              </div>
              <textarea className="w-full bg-transparent p-4 text-sm text-slate-300 placeholder:text-slate-600 resize-none outline-none leading-relaxed"
                rows={12} placeholder="Paste your script or switch to Video Upload..."
                value={script} onChange={e => setScript(e.target.value)} />
              {wordCount > 0 && (
                <div className="px-4 pb-3">
                  <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
                    <div style={{ width: `${Math.min(100, (wordCount / PLATFORM_CONFIG[platform].idealWordCount[1]) * 100)}%`, backgroundColor: wordCount > PLATFORM_CONFIG[platform].idealWordCount[1] ? "#ef4444" : wordCount < PLATFORM_CONFIG[platform].idealWordCount[0] ? "#f59e0b" : "#22c55e" }} className="h-full rounded-full transition-all duration-300" />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Ideal: {PLATFORM_CONFIG[platform].idealWordCount[0]}-{PLATFORM_CONFIG[platform].idealWordCount[1]} words for {platformCfg.label}</p>
                </div>
              )}
            </div>
          )}

          {/* Video upload */}
          {inputMode === "video" && (
            <>
              <VideoUploadPanel onAnalysisComplete={handleVideoAnalysisComplete} platform={platform} niche={niche} gameName={gameName} isTikTokShop={isTikTokShop} isLiveClip={isLiveClip} />
              {videoData && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2"><CheckCircle size={13} className="text-emerald-400" /><span className="heading text-sm font-semibold text-emerald-300">Video Processed</span></div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-slate-400">Duration <span className="text-slate-200 font-mono">{videoData.durationLabel}</span></div>
                    <div className="text-slate-400">Frames <span className="text-slate-200 font-mono">{videoData.frames?.length || 0}</span></div>
                  </div>
                  <p className="text-xs text-slate-500 italic">"{videoData.transcript?.slice(0, 100)}..."</p>
                  <button onClick={() => setInputMode("text")} className="w-full text-xs py-1.5 rounded-lg border border-slate-700 text-slate-400 flex items-center justify-center gap-1">
                    <Scissors size={10} />Edit Transcript
                  </button>
                </div>
              )}
            </>
          )}

          {/* URL import */}
          {inputMode === "scanner" && (<ClipScanner />)}{inputMode === "coach" && (<StreamCoach />)}
          {inputMode === "url" && (
            <div className="rounded-xl border border-slate-800 bg-[#0d1120] overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="heading text-sm font-semibold text-slate-300 flex items-center gap-2"><Hash size={13} className="text-violet-400" />URL Import</span>
                <div className="flex gap-2"><span className="text-xs text-slate-500">YouTube</span><span className="text-xs text-slate-600">·</span><span className="text-xs text-slate-500">TikTok</span></div>
              </div>
              <div className="p-4 space-y-3">
                <input type="text" placeholder="https://youtube.com/watch?v=... or https://tiktok.com/@user/video/..."
                  value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/50" />
                {urlError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <XCircle size={12} className="text-red-400 mt-0.5" /><p className="text-xs text-red-400">{urlError}</p>
                  </div>
                )}
                <button onClick={async () => {
                  if (!videoUrl.trim()) return;
                  setUrlLoading(true); setUrlError(null);
                  try {
                    const res = await fetch(`${BACKEND_URL}/analyze-url`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: videoUrl.trim() }) });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Server error");
                    let detectedNiche = null;
                    try { detectedNiche = await detectNicheWithClaude(data.transcription?.text || ""); } catch (e) {}
                    if (detectedNiche) setNiche(detectedNiche);
                    const frames = data.frames || []; const analyzedFrames = [];
                    for (let i = 0; i < frames.length; i++) {
                      const frame = frames[i]; let analysis = "";
                      try { analysis = await analyzeFrameWithClaude(frame.base64, frame.label, platform, niche, gameName || "", isTikTokShop, isLiveClip); }
                      catch (e) { analysis = `Vision unavailable: ${e.message}`; }
                      analyzedFrames.push({ ...frame, analysis });
                    }
                    handleVideoAnalysisComplete({ transcript: data.transcription?.text || "", duration: data.duration, durationLabel: data.durationLabel, filename: data.filename, frames: analyzedFrames, segments: data.transcription?.segments || [], detectedNiche, urlStats: data.stats, urlPlatform: data.platform, channel: data.channel, url: data.url });
                  } catch (e) { setUrlError(e.message); }
                  finally { setUrlLoading(false); }
                }} disabled={!videoUrl.trim() || urlLoading}
                  className="w-full py-2.5 rounded-lg text-xs font-bold heading flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: videoUrl.trim() && !urlLoading ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#1e2433", color: "white" }}>
                  {urlLoading ? <><Loader2 size={12} className="animate-spin" />Downloading & Analyzing...</> : <><Zap size={12} />Analyze URL</>}
                </button>
              </div>
            </div>
          )}

          {/* Platform */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-4 space-y-3">
            <span className="heading text-sm font-semibold text-slate-300 block">Platform</span>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => setPlatform(key)}
                  className={`rounded-lg px-3 py-2.5 text-xs font-medium border text-left ${platform === key ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 bg-slate-800/30 text-slate-400"}`}>
                  <span className="block text-base mb-1">{cfg.icon}</span>{cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-4 space-y-3">
            <span className="heading text-sm font-semibold text-slate-300 block">Format</span>
            <div className="flex gap-2">
              {[["vertical", "Vertical 9:16", "▯"], ["horizontal", "Horizontal 16:9", "▭"]].map(([val, label, icon]) => (
                <button key={val} onClick={() => setFormat(val)}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-medium border ${format === val ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" : "border-slate-700 bg-slate-800/30 text-slate-400"}`}>
                  <span className="block text-lg mb-0.5">{icon}</span>{label}
                </button>
              ))}
            </div>
          </div>

          {/* Niche */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-4 space-y-3">
            <span className="heading text-sm font-semibold text-slate-300 block">Content Niche</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(NICHE_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => setNiche(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${niche === key ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 text-slate-400"}`}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Game name */}
          {niche === "gaming" && (
            <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-4 space-y-2">
              <span className="heading text-sm font-semibold text-slate-300 block flex items-center gap-2">🎮 Which Game?</span>
              <input type="text" placeholder="e.g. Fortnite, Minecraft, Valorant..."
                value={gameName} onChange={e => setGameName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/50" />
            </div>
          )}

          {/* TikTok Shop */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-4">
            <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => setIsTikTokShop(!isTikTokShop)}>
              <div className="flex items-center gap-2">
                <span className="text-base">🛍️</span>
                <div>
                  <p className="text-xs font-semibold text-slate-300">TikTok Shop / Product Sell</p>
                  <p className="text-xs text-slate-500">Video includes a product you are promoting or selling</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isTikTokShop ? "bg-violet-500 border-violet-500" : "border-slate-600"}`}>
                {isTikTokShop && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-4">
            <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => setIsLiveClip(!isLiveClip)}>
              <div className="flex items-center gap-2">
                <span className="text-base">📡</span>
                <div>
                  <p className="text-xs font-semibold text-slate-300">Livestream Clip</p>
                  <p className="text-xs text-slate-500">This video was clipped from a live broadcast</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isLiveClip ? "bg-violet-500 border-violet-500" : "border-slate-600"}`}>
                {isLiveClip && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              </div>
            </div>
          </div>
          {/* Run Audit button */}
          <button onClick={runAudit} disabled={!script.trim() || loading}
            className="w-full rounded-xl py-4 font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 heading"
            style={{ background: script.trim() && !loading ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#1e2433", color: "white", boxShadow: script.trim() && !loading ? "0 0 24px rgba(124,58,237,0.3)" : undefined }}>
            {loading ? <><Loader2 size={16} className="animate-spin" />Running Audit...</> : <><Zap size={16} />Run Algorithmic Audit</>}
          </button>

          {loading && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-2">
              {["Parsing script...", "Calibrating heuristics...", "Running hook analysis...", "Generating timeline..."].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={10} className="animate-spin text-violet-400" style={{ animationDelay: `${i * 0.2}s` }} />{step}
                </div>
              ))}
            </div>
          )}

          {/* Thumbnail Studio - always visible */}
          {inputMode !== "coach" && <ThumbnailStudio frames={videoData?.frames || []} platform={platform} format={format} />}
        </aside>

        <main className={`space-y-5 ${inputMode === "coach" ? "hidden" : ""}`}>
          {!results && !loading && (
            <div className="grid-bg rounded-2xl border border-slate-800/50 min-h-[600px] flex flex-col items-center justify-center text-center p-12">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
                <BarChart3 size={28} className="text-violet-400" />
              </div>
              <h2 className="heading text-2xl font-bold text-slate-300 mb-3">Awaiting Audit Input</h2>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">Paste a script or upload a video. The AI will transcribe, analyze key frames with Claude Vision, and run a full algorithmic audit.</p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                {["Hook Surgery", "Retention Timeline", "Platform Calibration", "Frame-by-Frame Vision", "Whisper Transcription"].map(f => (
                  <Tag key={f} variant="accent"><Zap size={10} />{f}</Tag>
                ))}
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-5">
              {/* Version History */}
              <VersionTracker
                results={results}
                videoData={videoData}
                platform={platform}
                niche={niche}
                isTikTokShop={isTikTokShop}
                isLiveClip={isLiveClip}
                holisticAnalysis={videoData?.holisticAnalysis || ""}
              />
              {/* Score card */}
              <div className={`fade-up ${animIn ? "in d1" : ""} rounded-xl border border-slate-800 bg-[#0d1120] p-6`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <CircularScore score={results.score} />
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="heading text-xl font-bold text-white">Virality Score: {results.score}/100</h2>
                      <p className="text-sm text-slate-400 mt-1">{results.score < 50 ? "Significant structural issues detected." : results.score < 75 ? "Solid foundation with key optimization opportunities remaining." : "Strong algorithmic alignment."}</p>
                      {videoData && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Tag variant="blue"><Film size={9} />{videoData.filename}</Tag>
                          <Tag variant="blue"><Clock size={9} />{videoData.durationLabel}</Tag>
                          <Tag variant="positive"><Mic size={9} />Whisper transcribed</Tag>
                          {isTikTokShop && <Tag variant="warning"><span>🛍️</span>TikTok Shop</Tag>}
                          {isLiveClip && <Tag variant="accent"><span>📡</span>Livestream Clip</Tag>}
                          {videoData.urlStats && (
                            <>
                              <Tag variant="default"><Eye size={9} />{videoData.urlStats.viewCount?.toLocaleString()} views</Tag>
                              <Tag variant="default"><Heart size={9} />{videoData.urlStats.likeCount?.toLocaleString()} likes</Tag>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <ScoreBar
                        label="Hook Strength"
                        value={results.hookScore}
                        color={results.hookScore < 50 ? "#ef4444" : results.hookScore < 75 ? "#f59e0b" : "#22c55e"}
                        explanation="The hook is the most critical factor in short-form performance. The algorithm measures drop-off in the first 3 seconds — if viewers leave immediately, the content stops being distributed."
                        whatDrivesIt={results.hookScore >= 75 ? "Strong hook pattern detected in your opening line. The algorithm rewards immediate pattern interrupts." : results.hookScore >= 50 ? "Partial hook detected but could be stronger. Your opening has some engagement signals but lacks a clear pattern interrupt." : "No strong hook pattern detected in the opening line. Your content may be starting with a generic greeting or slow setup."}
                        howToImprove="Open mid-action or mid-thought. Never start with greetings. Use question, contradiction, or reaction patterns in your very first sentence."
                      />
                      <ScoreBar
                        label="Pacing & Structure"
                        value={Math.min(100, 40 + results.positives.length * 10)}
                        color="#818cf8"
                        explanation="Pacing measures how well your content maintains viewer attention throughout. The algorithm tracks average view duration — content that holds attention gets pushed to more people."
                        whatDrivesIt={results.positives.length > 0 ? results.positives.slice(0, 2).join(" ") : "No positive pacing signals detected. Your script may lack variety or momentum."}
                        howToImprove="Keep sentences short and punchy. Insert a pattern interrupt every 60-90 seconds. Avoid sentences longer than 20 words."
                      />
                      <ScoreBar
                        label="Platform Alignment"
                        value={Math.min(100, 35 + results.checklist.filter(c => checklistState[c.id]).length * 8)}
                        color="#22d3ee"
                        explanation={`Platform alignment measures how well your content follows ${platformCfg.label}'s specific algorithm requirements. Each platform has different signals it rewards.`}
                        whatDrivesIt={`${results.checklist.filter(c => checklistState[c.id]).length} of ${results.checklist.length} checklist items detected. ${results.checklist.filter(c => !checklistState[c.id] && c.critical).length > 0 ? "Missing critical items: " + results.checklist.filter(c => !checklistState[c.id] && c.critical).map(c => c.label).slice(0, 2).join(", ") : "All critical items present."}`}
                        howToImprove={`Review the Checklist tab for specific ${platformCfg.label} requirements. Focus on critical items first.`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Tag variant={results.flags.some(f => f.severity === "high") ? "danger" : "warning"}><AlertTriangle size={10} />{results.flags.filter(f => f.severity === "high").length} Critical Issues</Tag>
                      <Tag variant="positive"><CheckCircle size={10} />{results.positives.length} Strengths</Tag>
                      <Tag variant="default"><Target size={10} />{platformCfg.label} {format === "vertical" ? "9:16" : "16:9"}</Tag>
                    </div>
                  </div>
                </div>
              </div>

              {/* Frame analysis */}
              {videoData?.frames?.length > 0 && (
                <div className={`fade-up ${animIn ? "in d2" : ""}`}>
                  <FrameStrip frames={videoData.frames} />
                </div>
              )}

              {/* Holistic Video Analysis */}
              {videoData?.holisticAnalysis && (
                <div className={`fade-up ${animIn ? "in d2" : ""} rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3`}>
                  <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Cpu size={14} className="text-amber-400"/>Full Video Analysis
                    <Tag variant="warning">CCO Review</Tag>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{videoData.holisticAnalysis}</p>
                </div>
              )}
              {/* Platform calibration */}
              {results.calibration && (
                <div className={`fade-up ${animIn ? "in d2" : ""} rounded-xl border bg-[#0d1120] p-5 ${platformCfg.bgClass}`}>
                  <div className="flex items-center gap-2 mb-4"><Radio size={14} className={platformCfg.accentClass} /><h3 className="heading text-sm font-semibold text-slate-200">{results.calibration.title}</h3></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.calibration.rules.map((rule, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                        <rule.icon size={14} className={`mt-0.5 ${platformCfg.accentClass}`} />
                        <p className="text-xs text-slate-400 leading-relaxed">{rule.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className={`fade-up ${animIn ? "in d3" : ""} flex gap-1 bg-[#0d1120] border border-slate-800 rounded-xl p-1`}>
                {[{ id: "hook", icon: Scissors, label: "Hook Surgery" }, { id: "timeline", icon: Clock, label: "Retention Timeline" }, { id: "checklist", icon: ListChecks, label: "Checklist" }].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium ${activeTab === tab.id ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-slate-500"}`}>
                    <tab.icon size={12} /><span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className={`fade-up ${animIn ? "in d4" : ""}`}>
                {/* Hook tab */}
                {activeTab === "hook" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
                      <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2"><Scissors size={14} className="text-violet-400" />Hook Analysis · {platformCfg.hookWindow}</h3>
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                        <div className="text-center">
                          <div className="text-2xl font-bold font-mono" style={{ color: results.hookScore < 50 ? "#ef4444" : results.hookScore < 75 ? "#f59e0b" : "#22c55e" }}>{results.hookScore}</div>
                          <div className="text-xs text-slate-500">Hook Score</div>
                        </div>
                        <div className="flex-1 space-y-2">
                          {results.flags.filter(f => f.severity === "high").slice(0, 2).map((f, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-red-400"><XCircle size={11} className="mt-0.5" />{f.msg}</div>
                          ))}
                          {results.positives.slice(0, 2).map((p, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-emerald-400"><CheckCircle size={11} className="mt-0.5" />{p}</div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Star size={11} className="text-amber-400" />3 Optimized Hook Alternatives</h4>
                        {results.hookAlternatives.map((hook, i) => (
                          <div key={i} className="p-4 rounded-lg border border-slate-700/50 bg-slate-900/40 hover:border-violet-500/30 transition-colors">
                            <div className="flex items-start gap-3">
                              <span className="text-xs font-mono text-violet-400">#{i + 1}</span>
                              <p className="text-xs text-slate-300 leading-relaxed">{hook}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {results.flags.length > 0 && (
                      <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-3">
                        <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-400" />Detected Issues</h3>
                        {results.flags.map((flag, i) => (
                          <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-xs border ${flag.severity === "high" ? "bg-red-500/5 border-red-500/20 text-red-300" : flag.severity === "medium" ? "bg-amber-500/5 border-amber-500/20 text-amber-300" : "bg-slate-800/40 border-slate-700/40 text-slate-400"}`}>
                            <span className={`uppercase font-bold font-mono ${flag.severity === "high" ? "text-red-400" : flag.severity === "medium" ? "text-amber-400" : "text-slate-500"}`}>{flag.severity}</span>
                            <span className="leading-relaxed">{flag.msg}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline tab */}
                {activeTab === "timeline" && (
                  <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
                    <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2"><Clock size={14} className="text-cyan-400" />Retention & Pacing Timeline</h3>
                    <p className="text-xs text-slate-500">Predicted viewer behavior mapped to your script at ~140 WPM delivery.</p>
                    <div className="relative space-y-0">
                      {results.timeline.map((point, i) => (
                        <div key={i} className="flex gap-4 group">
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full mt-3 shrink-0 border-2 ${point.type === "positive" ? "bg-emerald-500 border-emerald-400" : point.type === "warning" ? "bg-amber-500 border-amber-400" : "bg-slate-600 border-slate-500"}`} />
                            {i < results.timeline.length - 1 && <div className="w-px flex-1 bg-slate-800 my-1" />}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-start gap-3">
                              <span className="font-mono text-xs text-slate-500 mt-2.5 shrink-0 w-10">{point.time}</span>
                              <div className={`flex-1 p-3 rounded-lg border transition-colors duration-200 ${point.type === "positive" ? "bg-emerald-500/5 border-emerald-500/20 group-hover:border-emerald-500/40" : point.type === "warning" ? "bg-amber-500/5 border-amber-500/20 group-hover:border-amber-500/40" : "bg-slate-900/40 border-slate-800 group-hover:border-slate-700"}`}>
                                <p className="text-xs text-slate-400 italic mb-1.5 leading-relaxed">"{point.sentence}"</p>
                                <p className={`text-xs font-medium ${point.type === "positive" ? "text-emerald-400" : point.type === "warning" ? "text-amber-400" : "text-slate-500"}`}>{point.note}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist tab */}
                {activeTab === "checklist" && (
                  <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2"><ListChecks size={14} className="text-emerald-400" />Platform Checklist · {platformCfg.label}</h3>
                      <span className="text-xs font-mono text-slate-500">{Object.values(checklistState).filter(Boolean).length}/{results.checklist.length} complete</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(Object.values(checklistState).filter(Boolean).length / results.checklist.length) * 100}%` }} />
                    </div>
                    <div className="space-y-2">
                      {results.checklist.map(item => (
                        <button key={item.id} onClick={() => setChecklistState(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                          className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all duration-200 ${checklistState[item.id] ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-900/30 border-slate-800 hover:border-slate-700"}`}>
                          <div className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-colors ${checklistState[item.id] ? "bg-emerald-500 border-emerald-500" : "border-slate-600"}`}>
                            {checklistState[item.id] && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                          <span className={`text-xs leading-relaxed flex-1 ${checklistState[item.id] ? "text-slate-400 line-through" : "text-slate-300"}`}>{item.label}</span>
                          {item.critical && !checklistState[item.id] && <Tag variant="danger"><Flame size={9} />Critical</Tag>}
                        </button>
                      ))}
                    </div>
                    {results.positives.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Award size={11} className="text-emerald-400" />Detected Strengths</h4>
                        {results.positives.map((p, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-emerald-400"><CheckCircle size={11} className="mt-0.5" />{p}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}