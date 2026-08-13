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
// Point this at your PM2 server
const BACKEND_URL = "http://192.168.6.228:3015";
// Your Anthropic API key for Claude Vision (called directly from browser)
const ANTHROPIC_API_KEY = ""; // ← paste your key here

// ─── HEURISTICS ENGINE ───────────────────────────────────────────────────────

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

const NICHE_CONFIG = {
  tech: { label: "Tech", keywords: ["tutorial","how to","review","vs","best","ai","build"] },
  music: { label: "Music", keywords: ["cover","original","beat","melody","chord","song","performance"] },
  story: { label: "Storytelling", keywords: ["then","suddenly","but","plot twist","you won't believe","story time"] },
  education: { label: "Education", keywords: ["learn","explain","why","what","fact","study","tip","mistake"] },
  comedy: { label: "Comedy", keywords: ["imagine","when you","relatable","nobody","literally","okay but"] },
};

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
  "reels": [
    "Save-trigger opener: '5 things I wish I knew before [relatable milestone] — save this.'",
    "Community-first hook: 'If you're into [niche], you NEED to hear this. Trust me.'",
    "Transformation bait: 'This one change went from [bad result] to [dream result] in [timeframe].'",
  ],
};

const PLATFORM_CALIBRATION = {
  "yt-long": {
    "horizontal": { title: "Long-form Horizontal Algorithm Profile", rules: [
      { icon: Eye, text: "CTR drives initial exposure — title + thumbnail must be a unified promise." },
      { icon: Clock, text: "Average View Duration (AVD) above 40% signals 'recommended' status." },
      { icon: TrendingUp, text: "First 48h velocity determines long-tail recommendation shelf life." },
      { icon: BarChart3, text: "Chapter markers reduce drop-off by giving viewers navigation control." },
    ]},
    "vertical": { title: "Long-form Vertical Algorithm Profile", rules: [
      { icon: AlertTriangle, text: "Vertical long-form is a niche format — mobile-first framing is non-negotiable." },
      { icon: Eye, text: "Thumbnail still matters, but it renders smaller in Shorts feed — use bold text." },
      { icon: Clock, text: "Higher drop-off tolerance since format is uncommon — but hook must still fire fast." },
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
      { icon: Shield, text: "This configuration is suboptimal. Only use if the visual content demands it (e.g., cinematic footage)." },
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
      { icon: AlertTriangle, text: "Horizontal Reels receive reduced Explore distribution — Instagram enforces vertical-first norms." },
      { icon: Eye, text: "Feed preview crops to 4:5 — a horizontal Reel loses context in the feed thumbnail." },
      { icon: Shield, text: "Strongly recommend re-shooting or re-framing vertically for maximum algorithmic reach." },
    ]},
  },
};

// ─── HEURISTICS ──────────────────────────────────────────────────────────────

function analyzeScript(script, platform, format, niche) {
  const words = script.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const questionMarks = (script.match(/\?/g) || []).length;
  const exclamations = (script.match(/!/g) || []).length;
  const avgSentenceLen = sentences.length > 0 ? wordCount / sentences.length : 0;
  const hasHook = /^.{0,200}(you|imagine|what if|stop|wait|here's|nobody|the truth|secret|mistake|wrong|this)/i.test(script);
  const hasCTA = /(subscribe|follow|like|share|comment|save|click|link in bio)/i.test(script);
  const hasLoopEnd = sentences.length > 1 && sentences[sentences.length - 1].split(/\s+/).length < 15;
  const nicheKeywords = NICHE_CONFIG[niche]?.keywords || [];
  const nicheMatches = nicheKeywords.filter(kw => script.toLowerCase().includes(kw)).length;
  const config = PLATFORM_CONFIG[platform];
  const [minWords, maxWords] = config.idealWordCount;

  let score = 50, hookScore = 50;
  const flags = [], positives = [];

  if (wordCount === 0) return null;
  if (wordCount < minWords) { score -= 15; flags.push({ severity:"high", msg:`Script is too short (${wordCount} words). Minimum recommended: ${minWords} words for ${config.label}.` }); }
  else if (wordCount > maxWords) { score -= 12; flags.push({ severity:"high", msg:`Script is too long (${wordCount} words). Maximum for ${config.label}: ~${maxWords} words. Risk: viewer drop-off.` }); }
  else { score += 15; positives.push(`Word count (${wordCount}) is optimal for ${config.label}.`); }

  if (hasHook) { hookScore += 25; score += 8; positives.push("Opening line uses a recognized hook pattern."); }
  else { hookScore -= 20; flags.push({ severity:"high", msg:"No detectable hook in the first sentence. The algorithm rewards immediate pattern interrupts." }); }

  if (questionMarks > 0) { hookScore += 10; score += 5; positives.push(`${questionMarks} question(s) found — good for engagement and curiosity loops.`); }
  else { flags.push({ severity:"medium", msg:"No questions detected. Questions increase comment engagement." }); }

  if (exclamations > 3) { score += 3; positives.push("Emotional punctuation present — good for energy and pacing."); }

  if (hasCTA) { score += 8; positives.push("Call-to-action detected."); }
  else { score -= 8; flags.push({ severity:"medium", msg:"No CTA found. Missing subscribe/follow/save/share directive." }); }

  if (config.loopStrategy) {
    if (hasLoopEnd) { score += 10; positives.push("Short ending detected — good for loop potential."); }
    else { score -= 8; flags.push({ severity:"high", msg:"No loop-back ending detected. Short-form platforms prioritize re-watch rate." }); }
  }

  if (nicheMatches >= 3) { score += 8; positives.push(`Strong niche keyword density (${nicheMatches} matches).`); }
  else if (nicheMatches === 0) { score -= 5; flags.push({ severity:"low", msg:`No ${NICHE_CONFIG[niche]?.label} niche keywords detected.` }); }

  if (avgSentenceLen > 25) { score -= 8; flags.push({ severity:"medium", msg:`Average sentence length is ${Math.round(avgSentenceLen)} words — too long for short-form pacing.` }); }
  else if (avgSentenceLen < 10 && avgSentenceLen > 0) { score += 5; positives.push("Tight sentence structure — great for punchy delivery."); }

  hookScore = Math.min(100, Math.max(10, hookScore));
  score = Math.min(99, Math.max(8, score));

  const timeline = generateTimeline(sentences, wordCount);
  const checklist = (PLATFORM_CHECKLIST[platform] || []).map(item => {
    let checked = false;
    if (["hook3","hook30","hook2"].includes(item.id)) checked = hasHook;
    if (["cta","subscribe"].includes(item.id)) checked = hasCTA;
    if (["loop","nohang"].includes(item.id)) checked = hasLoopEnd;
    if (item.id === "spoken-seo") checked = nicheMatches >= 2;
    if (item.id === "length") checked = wordCount <= maxWords;
    if (item.id === "seo") checked = nicheMatches >= 1;
    if (["share","save"].includes(item.id)) checked = hasCTA;
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
    const timeStr = sec < 60 ? `0:${String(sec).padStart(2,"0")}` : `${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`;
    const s = sentence.toLowerCase();
    let type = "neutral", note = "";
    if (i === 0) {
      type = s.match(/(you|stop|wait|imagine|secret|truth|nobody|mistake)/) ? "positive" : "warning";
      note = type === "positive" ? "Strong hook — algorithm rewards immediate pattern interrupt." : "Weak opening — no hook trigger detected.";
    } else if (sw > 30) { type = "warning"; note = "Long sentence — risk of monotone pacing. Insert visual cut here."; }
    else if (s.includes("?")) { type = "positive"; note = "Question creates curiosity gap — good for retention."; }
    else if (s.match(/(but|however|twist|actually|wait|plot)/)) { type = "positive"; note = "Narrative pivot — strong pattern interrupt."; }
    else if (i % 3 === 0) { type = "warning"; note = "Predicted drop-off zone. Inject visual element or emotional escalation."; }
    else { note = "Standard pacing — monitor with analytics after publish."; }
    points.push({ time: timeStr, sentence: sentence.trim().slice(0, 80) + (sentence.trim().length > 80 ? "…" : ""), type, note });
  });
  return points;
}

// ─── CLAUDE VISION ───────────────────────────────────────────────────────────

async function analyzeFrameWithClaude(base64, timestamp, platform, niche) {
  if (!ANTHROPIC_API_KEY) {
    return `[Claude Vision not configured — add your ANTHROPIC_API_KEY to the app] Frame at ${timestamp} could not be analyzed.`;
  }
  const platformCfg = PLATFORM_CONFIG[platform];
  const prompt = `You are a social media algorithm expert and video content strategist. Analyze this video frame captured at timestamp ${timestamp} from a ${platformCfg.label} video in the ${NICHE_CONFIG[niche]?.label || niche} niche.

Provide a SHORT, punchy audit (3-4 sentences max) covering:
1. Visual hook strength — does this frame stop the scroll?
2. On-screen text, captions, or overlays present and their effectiveness
3. Framing, composition, and lighting quality for this platform
4. One specific, actionable improvement

Be direct, specific, and use creator language. Format as plain prose, no bullet points.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
          { type: "text", text: prompt },
        ],
      }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Claude Vision error");
  return data.content?.[0]?.text || "No analysis returned.";
}

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────

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
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 64 64)"
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
          <text x="64" y="60" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="monospace">{pct}</text>
          <text x="64" y="76" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">/ 100</text>
        </svg>
      </div>
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color }}>{label}</span>
    </div>
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span><span className="font-mono" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
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
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border font-medium ${cls}`}>
      {children}
    </span>
  );
}

// ─── VIDEO UPLOAD PANEL ──────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { id: "upload",      icon: Upload,   label: "Uploading video" },
  { id: "extract",     icon: Film,     label: "Extracting audio" },
  { id: "transcribe",  icon: Mic,      label: "Transcribing with Whisper" },
  { id: "frames",      icon: Image,    label: "Extracting keyframes" },
  { id: "vision",      icon: Eye,      label: "Claude Vision analyzing frames" },
];

function VideoUploadPanel({ onAnalysisComplete, platform, niche }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pipelineStep, setPipelineStep] = useState(null); // null | step id
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith("video/")) { setError("Please upload a valid video file."); return; }
    if (f.size > 500 * 1024 * 1024) { setError("File must be under 500MB."); return; }
    setFile(f);
    setError(null);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const runPipeline = useCallback(async () => {
    if (!file) return;
    setError(null);
    setProgress(0);

    try {
      // Step 1: Upload + server processing (transcription + frames)
      setPipelineStep("upload");
      const formData = new FormData();
      formData.append("video", file);

      // XHR for upload progress
      const serverResponse = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${BACKEND_URL}/analyze`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 40));
        };
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
          else reject(new Error(JSON.parse(xhr.responseText)?.error || "Server error"));
        };
        xhr.onerror = () => reject(new Error("Network error — is the server running?"));
        xhr.send(formData);
      });

      setPipelineStep("extract");
      await delay(400);
      setProgress(50);

      setPipelineStep("transcribe");
      await delay(600);
      setProgress(65);

      setPipelineStep("frames");
      await delay(400);
      setProgress(75);

      // Step 2: Claude Vision on each frame
      setPipelineStep("vision");
      const frames = serverResponse.frames || [];
      const analyzedFrames = [];
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        let analysis = "";
        try {
          analysis = await analyzeFrameWithClaude(frame.base64, frame.label, platform, niche);
        } catch (e) {
          analysis = `Vision analysis unavailable: ${e.message}`;
        }
        analyzedFrames.push({ ...frame, analysis });
        setProgress(75 + Math.round(((i + 1) / frames.length) * 24));
      }

      setProgress(100);
      setPipelineStep(null);

      onAnalysisComplete({
        transcript: serverResponse.transcription?.text || "",
        duration: serverResponse.duration,
        durationLabel: serverResponse.durationLabel,
        filename: serverResponse.filename,
        frames: analyzedFrames,
        segments: serverResponse.transcription?.segments || [],
      });

    } catch (e) {
      setError(e.message);
      setPipelineStep(null);
      setProgress(0);
    }
  }, [file, platform, niche, onAnalysisComplete]);

  const clear = () => { setFile(null); setPreview(null); setError(null); setPipelineStep(null); setProgress(0); };

  if (pipelineStep) {
    return (
      <div className="rounded-xl border border-violet-500/20 bg-[#0d1120] p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Cpu size={14} className="text-violet-400 animate-pulse" />
          <span className="heading text-sm font-semibold text-slate-200">Processing Pipeline</span>
        </div>
        {PIPELINE_STEPS.map((step, i) => {
          const stepIdx = PIPELINE_STEPS.findIndex(s => s.id === pipelineStep);
          const myIdx = i;
          const done = myIdx < stepIdx;
          const active = myIdx === stepIdx;
          return (
            <div key={step.id} className={`flex items-center gap-3 transition-opacity duration-300 ${active || done ? "opacity-100" : "opacity-25"}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${done ? "bg-emerald-500/20 border-emerald-500/30" : active ? "bg-violet-500/20 border-violet-500/30" : "bg-slate-800 border-slate-700"}`}>
                {done ? <CheckCircle size={13} className="text-emerald-400" /> :
                  active ? <Loader2 size={13} className="text-violet-400 animate-spin" /> :
                  <step.icon size={13} className="text-slate-600" />}
              </div>
              <span className={`text-xs ${active ? "text-slate-200 font-medium" : done ? "text-slate-500 line-through" : "text-slate-600"}`}>{step.label}</span>
              {active && <span className="text-xs text-violet-400 font-mono ml-auto">{progress}%</span>}
            </div>
          );
        })}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1120] overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <span className="heading text-sm font-semibold text-slate-300 flex items-center gap-2">
          <FileVideo size={13} className="text-violet-400" />Video Upload
        </span>
        <Tag variant="blue"><Wifi size={9} />Server: {BACKEND_URL.split("//")[1]}</Tag>
      </div>

      {!file ? (
        <div
          className={`m-3 rounded-lg border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-8 cursor-pointer ${dragOver ? "border-violet-500 bg-violet-500/5" : "border-slate-700 hover:border-slate-600"}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          <Upload size={24} className={`mb-3 ${dragOver ? "text-violet-400" : "text-slate-600"}`} />
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Drop a video here or <span className="text-violet-400">click to browse</span>
          </p>
          <p className="text-xs text-slate-600 mt-1">MP4, MOV, AVI, WebM · Max 500MB</p>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-slate-900">
            <video src={preview} className="w-full max-h-36 object-contain" controls />
            <button onClick={clear} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/40 transition-colors">
              <X size={11} className="text-slate-400" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <FileVideo size={12} className="text-slate-500 shrink-0" />
            <span className="text-xs text-slate-400 truncate flex-1">{file.name}</span>
            <Tag variant="default">{(file.size / 1e6).toFixed(1)} MB</Tag>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-3 mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {file && (
        <div className="px-3 pb-3">
          <button
            onClick={runPipeline}
            className="w-full py-2.5 rounded-lg text-xs font-bold heading flex items-center justify-center gap-2 transition-all duration-200"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", boxShadow: "0 0 20px rgba(124,58,237,0.25)" }}
          >
            <Play size={12} />Analyze Video
          </button>
        </div>
      )}
    </div>
  );
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ─── FRAME STRIP ─────────────────────────────────────────────────────────────

function FrameStrip({ frames }) {
  const [selected, setSelected] = useState(0);
  if (!frames || frames.length === 0) return null;
  const frame = frames[selected];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
      <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
        <Eye size={14} className="text-cyan-400" />Claude Vision · Frame Analysis
        <Tag variant="blue"><Film size={9} />{frames.length} frames</Tag>
      </h3>

      {/* Filmstrip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {frames.map((f, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-150 ${selected === i ? "border-cyan-500" : "border-slate-700 hover:border-slate-500"}`}
          >
            <div className="relative">
              <img src={`data:image/jpeg;base64,${f.base64}`} alt={`Frame ${f.label}`} className="w-20 h-12 object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center py-0.5">
                <span className="text-[9px] font-mono text-slate-300">{f.label}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected frame detail */}
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
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={12} className="text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300">Claude Vision Analysis</span>
            </div>
            {frame.analysis ? (
              <p className="text-xs text-slate-400 leading-relaxed">{frame.analysis}</p>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Loader2 size={11} className="animate-spin" />Analyzing...
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setSelected(Math.max(0, selected - 1))} disabled={selected === 0} className="flex-1 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 disabled:opacity-30 hover:border-slate-500 transition-colors">← Prev</button>
            <button onClick={() => setSelected(Math.min(frames.length - 1, selected + 1))} disabled={selected === frames.length - 1} className="flex-1 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 disabled:opacity-30 hover:border-slate-500 transition-colors">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function ViralAuditAI() {
  const [script, setScript] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [format, setFormat] = useState("vertical");
  const [niche, setNiche] = useState("tech");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("hook");
  const [checklistState, setChecklistState] = useState({});
  const [animIn, setAnimIn] = useState(false);
  const [videoData, setVideoData] = useState(null); // frames + metadata from pipeline
  const [inputMode, setInputMode] = useState("text"); // "text" | "video"

  const wordCount = useMemo(() => script.trim().split(/\s+/).filter(Boolean).length, [script]);
  const platformCfg = PLATFORM_CONFIG[platform];

  const handleVideoAnalysisComplete = useCallback((data) => {
    setVideoData(data);
    if (data.transcript) {
      setScript(data.transcript);
    }
  }, []);

  function runAudit() {
    if (!script.trim()) return;
    setLoading(true);
    setResults(null);
    setAnimIn(false);
    setTimeout(() => {
      const r = analyzeScript(script, platform, format, niche);
      const initialChecklist = {};
      r.checklist.forEach(item => { initialChecklist[item.id] = item.checked; });
      setChecklistState(initialChecklist);
      setResults(r);
      setLoading(false);
      setActiveTab("hook");
      setTimeout(() => setAnimIn(true), 50);
    }, 1800);
  }

  return (
    <div className="min-h-screen bg-[#090c14] text-slate-100" style={{ fontFamily: "'DM Mono','Fira Code',monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
        .heading { font-family: 'Space Grotesk', sans-serif; }
        .fade-up { opacity:0; transform:translateY(16px); transition:opacity .5s ease,transform .5s ease; }
        .fade-up.in { opacity:1; transform:translateY(0); }
        .fade-up.in.d1 { transition-delay:.05s; } .fade-up.in.d2 { transition-delay:.12s; }
        .fade-up.in.d3 { transition-delay:.2s; }  .fade-up.in.d4 { transition-delay:.28s; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0f1320} ::-webkit-scrollbar-thumb{background:#2a3050;border-radius:2px}
        .grid-bg{background-image:linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px);background-size:32px 32px}
      `}</style>

      {/* Header */}
      <header className="border-b border-slate-800/60 bg-[#090c14]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Cpu size={14} className="text-violet-400" />
            </div>
            <span className="heading font-bold text-lg tracking-tight text-white">ViralAudit <span className="text-violet-400">AI</span></span>
            <Tag variant="accent"><Zap size={10} />v3.0</Tag>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="hidden sm:inline">Vision + Whisper Engine</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">ONLINE</span>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

        {/* ── SIDEBAR ── */}
        <aside className="space-y-4">

          {/* Input mode toggle */}
          <div className="flex gap-1 bg-[#0d1120] border border-slate-800 rounded-xl p-1">
            {[["text","Script / Text", Scissors], ["video","Video Upload", FileVideo]].map(([mode, label, Icon]) => (
              <button key={mode} onClick={() => setInputMode(mode)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${inputMode === mode ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-slate-500 hover:text-slate-300"}`}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>

          {/* Script Input */}
          {inputMode === "text" && (
            <div className="rounded-xl border border-slate-800 bg-[#0d1120] overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="heading text-sm font-semibold text-slate-300">Script / Transcript</span>
                <span className="text-xs font-mono text-slate-500">{wordCount} words</span>
              </div>
              <textarea
                className="w-full bg-transparent p-4 text-sm text-slate-300 placeholder:text-slate-600 resize-none outline-none leading-relaxed"
                rows={12}
                placeholder={"Paste your script, or switch to Video Upload to auto-transcribe...\n\nExample:\n\"Wait — before you close this tab, what if I told you there's a way to grow 10k followers in 30 days?\""}
                value={script}
                onChange={e => setScript(e.target.value)}
              />
              {wordCount > 0 && (
                <div className="px-4 pb-3">
                  <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (wordCount / PLATFORM_CONFIG[platform].idealWordCount[1]) * 100)}%`,
                        backgroundColor: wordCount > PLATFORM_CONFIG[platform].idealWordCount[1] ? "#ef4444" : wordCount < PLATFORM_CONFIG[platform].idealWordCount[0] ? "#f59e0b" : "#22c55e" }} />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Ideal: {PLATFORM_CONFIG[platform].idealWordCount[0]}–{PLATFORM_CONFIG[platform].idealWordCount[1]} words for {platformCfg.label}</p>
                </div>
              )}
            </div>
          )}

          {/* Video Upload */}
          {inputMode === "video" && (
            <>
              <VideoUploadPanel onAnalysisComplete={handleVideoAnalysisComplete} platform={platform} niche={niche} />
              {videoData && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={13} className="text-emerald-400" />
                    <span className="heading text-sm font-semibold text-emerald-300">Video Processed</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-slate-400">Duration <span className="text-slate-200 font-mono ml-1">{videoData.durationLabel}</span></div>
                    <div className="text-slate-400">Frames <span className="text-slate-200 font-mono ml-1">{videoData.frames?.length || 0}</span></div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 italic">"{videoData.transcript?.slice(0, 100)}…"</p>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setInputMode("text")} className="flex-1 text-xs py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-500 transition-colors flex items-center justify-center gap-1">
                      <Scissors size={10} />Edit Transcript
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Platform */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-4 space-y-3">
            <span className="heading text-sm font-semibold text-slate-300 block">Platform</span>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => setPlatform(key)}
                  className={`rounded-lg px-3 py-2.5 text-xs font-medium border transition-all duration-200 text-left ${platform === key ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600"}`}>
                  <span className="block text-base leading-none mb-1">{cfg.icon}</span>{cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-4 space-y-3">
            <span className="heading text-sm font-semibold text-slate-300 block">Format</span>
            <div className="flex gap-2">
              {[["vertical","Vertical 9:16","▯"],["horizontal","Horizontal 16:9","▭"]].map(([val, label, icon]) => (
                <button key={val} onClick={() => setFormat(val)}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-medium border transition-all duration-200 ${format === val ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600"}`}>
                  <span className="block text-lg leading-none mb-0.5">{icon}</span>{label}
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${niche === key ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600"}`}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Run Audit */}
          <button onClick={runAudit} disabled={!script.trim() || loading}
            className="w-full rounded-xl py-4 font-bold text-sm tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 heading"
            style={{ background: script.trim() && !loading ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : undefined, backgroundColor: !script.trim() || loading ? "#1e2433" : undefined, color:"white", boxShadow: script.trim() && !loading ? "0 0 24px rgba(124,58,237,0.3)" : undefined }}>
            {loading ? <><Loader2 size={16} className="animate-spin" />Running Audit...</> : <><Zap size={16} />Run Algorithmic Audit</>}
          </button>

          {loading && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-2">
              {["Parsing script structure...","Calibrating platform heuristics...","Running hook analysis...","Generating retention timeline..."].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={10} className="animate-spin text-violet-400" style={{ animationDelay:`${i*0.2}s` }} />
                  {step}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── MAIN ── */}
        <main className="space-y-5">
          {!results && !loading && (
            <div className="grid-bg rounded-2xl border border-slate-800/50 min-h-[600px] flex flex-col items-center justify-center text-center p-12">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
                <BarChart3 size={28} className="text-violet-400" />
              </div>
              <h2 className="heading text-2xl font-bold text-slate-300 mb-3">Awaiting Audit Input</h2>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">Paste a script or upload a video. The AI will transcribe, analyze key frames with Claude Vision, and run a full algorithmic audit.</p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                {["Hook Surgery","Retention Timeline","Platform Calibration","Frame-by-Frame Vision","Whisper Transcription"].map(f => (
                  <Tag key={f} variant="accent"><Zap size={10} />{f}</Tag>
                ))}
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-5">
              {/* Score Header */}
              <div className={`fade-up ${animIn?"in d1":""} rounded-xl border border-slate-800 bg-[#0d1120] p-6`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <CircularScore score={results.score} />
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="heading text-xl font-bold text-white">Virality Score: {results.score}/100</h2>
                      <p className="text-sm text-slate-400 mt-1">
                        {results.score < 50 ? "Significant structural issues detected. High drop-off risk." :
                         results.score < 75 ? "Solid foundation with key optimization opportunities remaining." :
                         "Strong algorithmic alignment. Minor polish needed for peak performance."}
                      </p>
                      {videoData && (
                        <div className="flex items-center gap-2 mt-2">
                          <Tag variant="blue"><Film size={9} />{videoData.filename}</Tag>
                          <Tag variant="blue"><Clock size={9} />{videoData.durationLabel}</Tag>
                          <Tag variant="positive"><Mic size={9} />Whisper transcribed</Tag>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <ScoreBar label="Hook Strength" value={results.hookScore} color={results.hookScore < 50 ? "#ef4444" : results.hookScore < 75 ? "#f59e0b" : "#22c55e"} />
                      <ScoreBar label="Pacing & Structure" value={Math.min(100, 40 + results.positives.length * 10)} color="#818cf8" />
                      <ScoreBar label="Platform Alignment" value={Math.min(100, 35 + results.checklist.filter(c => checklistState[c.id]).length * 8)} color="#22d3ee" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Tag variant={results.flags.some(f=>f.severity==="high")?"danger":"warning"}>
                        <AlertTriangle size={10} />{results.flags.filter(f=>f.severity==="high").length} Critical Issues
                      </Tag>
                      <Tag variant="positive"><CheckCircle size={10} />{results.positives.length} Strengths</Tag>
                      <Tag variant="default"><Target size={10} />{platformCfg.label} · {format === "vertical"?"9:16":"16:9"}</Tag>
                    </div>
                  </div>
                </div>
              </div>

              {/* Frame Strip — only if video was uploaded */}
              {videoData?.frames?.length > 0 && (
                <div className={`fade-up ${animIn?"in d2":""}`}>
                  <FrameStrip frames={videoData.frames} />
                </div>
              )}

              {/* Platform Calibration */}
              {results.calibration && (
                <div className={`fade-up ${animIn?"in d2":""} rounded-xl border bg-[#0d1120] p-5 ${platformCfg.bgClass}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Radio size={14} className={platformCfg.accentClass} />
                    <h3 className="heading text-sm font-semibold text-slate-200">{results.calibration.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.calibration.rules.map((rule, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                        <rule.icon size={14} className={`mt-0.5 shrink-0 ${platformCfg.accentClass}`} />
                        <p className="text-xs text-slate-400 leading-relaxed">{rule.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Bar */}
              <div className={`fade-up ${animIn?"in d3":""} flex gap-1 bg-[#0d1120] border border-slate-800 rounded-xl p-1`}>
                {[
                  { id:"hook", icon:Scissors, label:"Hook Surgery" },
                  { id:"timeline", icon:Clock, label:"Retention Timeline" },
                  { id:"checklist", icon:ListChecks, label:"Checklist" },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${activeTab===tab.id ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-slate-500 hover:text-slate-300"}`}>
                    <tab.icon size={12} /><span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className={`fade-up ${animIn?"in d4":""}`}>

                {activeTab === "hook" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
                      <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <Scissors size={14} className="text-violet-400" />Hook Analysis · {platformCfg.hookWindow}
                      </h3>
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                        <div className="text-center">
                          <div className="text-2xl font-bold font-mono" style={{ color: results.hookScore < 50 ? "#ef4444" : results.hookScore < 75 ? "#f59e0b" : "#22c55e" }}>{results.hookScore}</div>
                          <div className="text-xs text-slate-500">Hook Score</div>
                        </div>
                        <div className="flex-1 space-y-2">
                          {results.flags.filter(f=>f.severity==="high").slice(0,2).map((f,i)=>(
                            <div key={i} className="flex items-start gap-2 text-xs text-red-400"><XCircle size={11} className="mt-0.5 shrink-0" />{f.msg}</div>
                          ))}
                          {results.positives.slice(0,2).map((p,i)=>(
                            <div key={i} className="flex items-start gap-2 text-xs text-emerald-400"><CheckCircle size={11} className="mt-0.5 shrink-0" />{p}</div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Star size={11} className="text-amber-400" />3 Optimized Hook Alternatives
                        </h4>
                        {results.hookAlternatives.map((hook,i)=>(
                          <div key={i} className="p-4 rounded-lg border border-slate-700/50 bg-slate-900/40 hover:border-violet-500/30 transition-colors duration-200">
                            <div className="flex items-start gap-3">
                              <span className="text-xs font-mono text-violet-400 mt-0.5 shrink-0">#{i+1}</span>
                              <p className="text-xs text-slate-300 leading-relaxed">{hook}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {results.flags.length > 0 && (
                      <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-3">
                        <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
                          <AlertTriangle size={14} className="text-amber-400" />Detected Issues
                        </h3>
                        {results.flags.map((flag,i)=>(
                          <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-xs border ${flag.severity==="high"?"bg-red-500/5 border-red-500/20 text-red-300":flag.severity==="medium"?"bg-amber-500/5 border-amber-500/20 text-amber-300":"bg-slate-800/40 border-slate-700/40 text-slate-400"}`}>
                            <span className={`uppercase font-bold text-xs shrink-0 font-mono ${flag.severity==="high"?"text-red-400":flag.severity==="medium"?"text-amber-400":"text-slate-500"}`}>{flag.severity}</span>
                            <span className="leading-relaxed">{flag.msg}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "timeline" && (
                  <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
                    <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Clock size={14} className="text-cyan-400" />Retention & Pacing Timeline
                    </h3>
                    <p className="text-xs text-slate-500">Predicted viewer behavior mapped to your script at ~140 WPM delivery.</p>
                    <div className="relative space-y-0">
                      {results.timeline.map((point,i)=>(
                        <div key={i} className="flex gap-4 group">
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full mt-3 shrink-0 border-2 ${point.type==="positive"?"bg-emerald-500 border-emerald-400":point.type==="warning"?"bg-amber-500 border-amber-400":"bg-slate-600 border-slate-500"}`} />
                            {i < results.timeline.length-1 && <div className="w-px flex-1 bg-slate-800 my-1" />}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-start gap-3">
                              <span className="font-mono text-xs text-slate-500 mt-2.5 shrink-0 w-10">{point.time}</span>
                              <div className={`flex-1 p-3 rounded-lg border transition-colors duration-200 ${point.type==="positive"?"bg-emerald-500/5 border-emerald-500/20 group-hover:border-emerald-500/40":point.type==="warning"?"bg-amber-500/5 border-amber-500/20 group-hover:border-amber-500/40":"bg-slate-900/40 border-slate-800 group-hover:border-slate-700"}`}>
                                <p className="text-xs text-slate-400 italic mb-1.5 leading-relaxed">"{point.sentence}"</p>
                                <p className={`text-xs font-medium ${point.type==="positive"?"text-emerald-400":point.type==="warning"?"text-amber-400":"text-slate-500"}`}>{point.note}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "checklist" && (
                  <div className="rounded-xl border border-slate-800 bg-[#0d1120] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="heading text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <ListChecks size={14} className="text-emerald-400" />Platform Checklist · {platformCfg.label}
                      </h3>
                      <span className="text-xs font-mono text-slate-500">
                        {Object.values(checklistState).filter(Boolean).length}/{results.checklist.length} complete
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width:`${(Object.values(checklistState).filter(Boolean).length/results.checklist.length)*100}%` }} />
                    </div>
                    <div className="space-y-2">
                      {results.checklist.map(item=>(
                        <button key={item.id} onClick={()=>setChecklistState(prev=>({...prev,[item.id]:!prev[item.id]}))}
                          className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all duration-200 ${checklistState[item.id]?"bg-emerald-500/5 border-emerald-500/20":"bg-slate-900/30 border-slate-800 hover:border-slate-700"}`}>
                          <div className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-colors ${checklistState[item.id]?"bg-emerald-500 border-emerald-500":"border-slate-600"}`}>
                            {checklistState[item.id] && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span className={`text-xs leading-relaxed flex-1 ${checklistState[item.id]?"text-slate-400 line-through":"text-slate-300"}`}>{item.label}</span>
                          {item.critical && !checklistState[item.id] && <Tag variant="danger"><Flame size={9} />Critical</Tag>}
                        </button>
                      ))}
                    </div>
                    {results.positives.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Award size={11} className="text-emerald-400" />Detected Strengths
                        </h4>
                        {results.positives.map((p,i)=>(
                          <div key={i} className="flex items-start gap-2 text-xs text-emerald-400">
                            <CheckCircle size={11} className="mt-0.5 shrink-0" />{p}
                          </div>
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