/**
 * ViralAudit AI — Backend Processing Server (Groq Edition)
 * PM2 service on port 3015
 *
 * Uses Groq whisper-large-v3-turbo for transcription (free + fast)
 * No OpenAI dependency.
 *
 * Required env vars in .env:
 *   GROQ_API_KEY=gsk_...
 *   VIRAL_AUDIT_PORT=3015
 *   VIRAL_AUDIT_MAX_MB=500
 *   VIRAL_AUDIT_CORS_ORIGIN=*
 */

require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");
const Groq = require("groq-sdk");

const execAsync = (cmd, opts = {}) => promisify(exec)(cmd, { maxBuffer: 1024 * 1024 * 50, ...opts });
const app = express();
const PORT = parseInt(process.env.VIRAL_AUDIT_PORT || "3015");
const MAX_MB = 999999;
const CORS_ORIGIN = process.env.VIRAL_AUDIT_CORS_ORIGIN || "*";

// ─── Groq Client ──────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ─── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".mp4";
    cb(null, `viral-audit-${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Infinity },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(mp4|mov|avi|mkv|webm|m4v|flv|wmv)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported format. Accepted: mp4, mov, avi, mkv, webm, m4v, flv, wmv"));
    }
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cleanup(...filePaths) {
  for (const fp of filePaths) {
    try {
      if (fp && fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch (e) {
      console.warn(`[cleanup] Could not delete ${fp}:`, e.message);
    }
  }
}

function formatTimestamp(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function getVideoDuration(videoPath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    );
    return parseFloat(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

async function extractAudio(videoPath, outPath) {
  // 16kHz mono WAV — optimal for Whisper
  await execAsync(
    `ffmpeg -y -i "${videoPath}" -vn -ar 16000 -ac 1 -f wav "${outPath}"`
  );
}

async function extractKeyframes(videoPath, duration, outDir, sessionId) {
  const candidates = [0, 1, 3, 5, 10, 20, 30, 45, 60, 90, 120];
  const timestamps = candidates.filter(t => t < duration);
  if (duration > 0 && timestamps[timestamps.length - 1] < duration - 2) {
    timestamps.push(Math.floor(duration - 1));
  }
  const selected = timestamps.slice(0, 8);
  const frames = [];

  for (const ts of selected) {
    const framePath = path.join(outDir, `${sessionId}-frame-${ts}s.jpg`);
    try {
      await execAsync(
        `ffmpeg -y -ss ${ts} -i "${videoPath}" -frames:v 1 -q:v 3 -vf "scale=960:-1" "${framePath}"`
      );
      if (fs.existsSync(framePath)) {
        const data = fs.readFileSync(framePath);
        frames.push({
          timestamp: ts,
          label: formatTimestamp(ts),
          base64: data.toString("base64"),
          path: framePath,
        });
      }
    } catch (e) {
      console.warn(`[frames] Could not extract frame at ${ts}s:`, e.message);
    }
  }

  return frames;
}

async function transcribeAudio(audioPath) {
  const audioStream = fs.createReadStream(audioPath);
  const response = await groq.audio.transcriptions.create({
    file: audioStream,
    model: "whisper-large-v3-turbo",
    response_format: "verbose_json",
    language: "en",
  });
  return {
    text: response.text || "",
    duration: response.duration || 0,
    language: response.language || "en",
    segments: (response.segments || []).map(s => ({
      start: s.start,
      end: s.end,
      text: s.text,
    })),
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "viral-audit-server", port: PORT });
});

app.post("/analyze", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video file uploaded." });
  }

  const sessionId = uuidv4().slice(0, 8);
  const videoPath = req.file.path;
  const audioPath = path.join(os.tmpdir(), `viral-audit-audio-${sessionId}.wav`);
  const framePaths = [];

  console.log(`[${sessionId}] Starting: ${req.file.originalname} (${(req.file.size / 1e6).toFixed(1)} MB)`);

  try {
    const duration = await getVideoDuration(videoPath);
    console.log(`[${sessionId}] Duration: ${duration.toFixed(1)}s`);

    console.log(`[${sessionId}] Extracting audio...`);
    await extractAudio(videoPath, audioPath);

    console.log(`[${sessionId}] Transcribing with Groq Whisper...`);
    const transcription = await transcribeAudio(audioPath);
    console.log(`[${sessionId}] Transcript: ${transcription.text.slice(0, 80)}...`);

    console.log(`[${sessionId}] Extracting keyframes...`);
    const frames = await extractKeyframes(videoPath, duration, os.tmpdir(), sessionId);
    frames.forEach(f => framePaths.push(f.path));
    console.log(`[${sessionId}] Extracted ${frames.length} frames`);

    res.json({
      sessionId,
      filename: req.file.originalname,
      fileSize: req.file.size,
      duration: Math.round(duration),
      durationLabel: formatTimestamp(Math.round(duration)),
      transcription: {
        text: transcription.text,
        language: transcription.language,
        segments: transcription.segments,
      },
      frames: frames.map(f => ({
        timestamp: f.timestamp,
        label: f.label,
        base64: f.base64,
      })),
    });

    console.log(`[${sessionId}] Done.`);

  } catch (err) {
    console.error(`[${sessionId}] Error:`, err.message);
    let message = err.message || "Unknown error during video processing.";
    if (message.includes("ffmpeg")) message = "ffmpeg error: " + message;
    if (message.includes("groq") || message.includes("whisper")) message = "Transcription error: " + message;
    res.status(500).json({ error: message, sessionId });

  } finally {
    cleanup(videoPath, audioPath, ...framePaths);
    console.log(`[${sessionId}] Temp files cleaned up`);
  }
});


// ─── URL Analysis endpoint: POST /analyze-url ─────────────────────────────────
app.post("/analyze-url", express.json(), async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided." });

  // Validate URL is YouTube or TikTok
  const isYouTube = /youtube\.com|youtu\.be/.test(url);
  const isTikTok = /tiktok\.com/.test(url);
  if (!isYouTube && !isTikTok) {
    return res.status(400).json({ error: "Only YouTube and TikTok URLs are supported." });
  }

  const sessionId = uuidv4().slice(0, 8);
  const videoPath = path.join(os.tmpdir(), `viral-audit-url-${sessionId}.mp4`);
  const audioPath = path.join(os.tmpdir(), `viral-audit-audio-${sessionId}.wav`);
  const framePaths = [];

  console.log(`[${sessionId}] URL analysis: ${url}`);

  try {
    // ── Step 1: Get video metadata without downloading ──────────────────────
    console.log(`[${sessionId}] Fetching metadata...`);
    const { stdout: metaRaw } = await execAsync(
      `yt-dlp --dump-json --no-download "${url}"`
    );
    const meta = JSON.parse(metaRaw);
    const title = meta.title || "Unknown";
    const viewCount = meta.view_count || 0;
    const likeCount = meta.like_count || 0;
    const commentCount = meta.comment_count || 0;
    const uploadDate = meta.upload_date || "";
    const description = (meta.description || "").slice(0, 500);
    const channel = meta.uploader || meta.channel || "Unknown";
    const platform = isYouTube ? "YouTube" : "TikTok";

    console.log(`[${sessionId}] Title: ${title} | Views: ${viewCount}`);

    // ── Step 2: Download video ──────────────────────────────────────────────
    console.log(`[${sessionId}] Downloading video...`);
    await execAsync(
      `yt-dlp -f "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${videoPath}" "${url}"`
    );

    if (!fs.existsSync(videoPath)) {
      throw new Error("Video download failed — file not found after yt-dlp.");
    }

    // ── Step 3: Get duration ────────────────────────────────────────────────
    const duration = await getVideoDuration(videoPath);
    console.log(`[${sessionId}] Duration: ${duration.toFixed(1)}s`);

    // ── Step 4: Extract audio + transcribe ─────────────────────────────────
    console.log(`[${sessionId}] Extracting audio...`);
    await extractAudio(videoPath, audioPath);

    console.log(`[${sessionId}] Transcribing with Groq Whisper...`);
    const transcription = await transcribeAudio(audioPath);
    console.log(`[${sessionId}] Transcript: ${transcription.text.slice(0, 80)}...`);

    // ── Step 5: Extract keyframes ───────────────────────────────────────────
    console.log(`[${sessionId}] Extracting keyframes...`);
    const frames = await extractKeyframes(videoPath, duration, os.tmpdir(), sessionId);
    frames.forEach(f => framePaths.push(f.path));
    console.log(`[${sessionId}] Extracted ${frames.length} frames`);

    res.json({
      sessionId,
      filename: title,
      url,
      platform,
      channel,
      duration: Math.round(duration),
      durationLabel: formatTimestamp(Math.round(duration)),
      stats: { viewCount, likeCount, commentCount, uploadDate },
      description,
      transcription: {
        text: transcription.text,
        language: transcription.language,
        segments: transcription.segments,
      },
      frames: frames.map(f => ({
        timestamp: f.timestamp,
        label: f.label,
        base64: f.base64,
      })),
    });

    console.log(`[${sessionId}] URL analysis done.`);

  } catch (err) {
    console.error(`[${sessionId}] Error:`, err.message);
    let message = err.message || "Unknown error.";
    if (message.includes("yt-dlp")) message = "Download error: " + message;
    if (message.includes("ffmpeg")) message = "Processing error: " + message;
    res.status(500).json({ error: message, sessionId });

  } finally {
    cleanup(videoPath, audioPath, ...framePaths);
    console.log(`[${sessionId}] Temp files cleaned up`);
  }
});



// ─── VOD Cache System ─────────────────────────────────────────────────────────
const VOD_CACHE_DIR = "D:\\Full VODs extraction";

// Ensure cache dir exists on startup
if (!fs.existsSync(VOD_CACHE_DIR)) {
  fs.mkdirSync(VOD_CACHE_DIR, { recursive: true });
  console.log(`[vod-cache] Created cache dir: ${VOD_CACHE_DIR}`);
}

// Auto-cleanup VODs older than 24 hours
function cleanupOldVODs() {
  try {
    const files = fs.readdirSync(VOD_CACHE_DIR);
    const now = Date.now();
    let cleaned = 0;
    for (const file of files) {
      const filePath = path.join(VOD_CACHE_DIR, file);
      const stat = fs.statSync(filePath);
      const ageHours = (now - stat.mtimeMs) / (1000 * 60 * 60);
      if (ageHours > 24) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    }
    if (cleaned > 0) console.log(`[vod-cache] Cleaned up ${cleaned} old VOD(s)`);
  } catch(e) {
    console.warn("[vod-cache] Cleanup error:", e.message);
  }
}

// Run cleanup on startup and every hour
cleanupOldVODs();
setInterval(cleanupOldVODs, 60 * 60 * 1000);

// Stream a cached VOD to the browser
app.get("/vod-stream/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  // Sanitize sessionId - alphanumeric only
  if (!/^[a-zA-Z0-9]+$/.test(sessionId)) {
    return res.status(400).json({ error: "Invalid session ID" });
  }
  const vodPath = path.join(VOD_CACHE_DIR, `${sessionId}.mp4`);
  if (!fs.existsSync(vodPath)) {
    return res.status(404).json({ error: "VOD not found in cache. It may have expired." });
  }
  const stat = fs.statSync(vodPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(vodPath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(vodPath).pipe(res);
  }
});

// Extract and download a specific clip
app.post("/extract-clip", express.json(), async (req, res) => {
  const { sessionId, startSec, endSec, label } = req.body;
  if (!sessionId || startSec === undefined || endSec === undefined) {
    return res.status(400).json({ error: "Missing sessionId, startSec, or endSec" });
  }
  if (!/^[a-zA-Z0-9]+$/.test(sessionId)) {
    return res.status(400).json({ error: "Invalid session ID" });
  }
  const vodPath = path.join(VOD_CACHE_DIR, `${sessionId}.mp4`);
  if (!fs.existsSync(vodPath)) {
    return res.status(404).json({ error: "VOD not found in cache. It may have expired (24h limit)." });
  }
  const duration = endSec - startSec;
  const clipId = uuidv4().slice(0, 8);
  const safeLabel = (label || "clip").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
  const clipPath = path.join(os.tmpdir(), `clip-${clipId}-${safeLabel}.mp4`);

  try {
    console.log(`[extract-clip] Extracting ${startSec}s-${endSec}s from ${sessionId}...`);
    // Fast extract with stream copy (no re-encoding)
    await execAsync(
      `ffmpeg -y -ss ${startSec} -i "${vodPath}" -t ${duration} -c copy "${clipPath}"`
    );
    if (!fs.existsSync(clipPath)) throw new Error("Clip extraction failed.");
    const filename = `${safeLabel}_${formatTimestamp(Math.round(startSec)).replace(":", "-")}.mp4`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "video/mp4");
    const stream = fs.createReadStream(clipPath);
    stream.pipe(res);
    stream.on("end", () => {
      try { fs.unlinkSync(clipPath); } catch {}
      console.log(`[extract-clip] Done: ${filename}`);
    });
  } catch(e) {
    try { if (fs.existsSync(clipPath)) fs.unlinkSync(clipPath); } catch {}
    res.status(500).json({ error: e.message });
  }
});


// ─── VOD Clip Scanner v2: POST /scan-vod ─────────────────────────────────────
// Smart chunking via silence detection + sentence boundaries
// Semantic scoring via Claude + format-aware weights

const FORMAT_PROFILES = {
  gaming_tactical: {
    label: "Tactical Gaming",
    keywords: ["draw","attack","block","lethal","top deck","concede","arena","brawl","commander","spell","play","cast","win","lose","damage","counter"],
    weights: { energy: 1.2, narrative: 1.5, hook: 1.3, density: 0.8 },
    idealDuration: [25, 60],
  },
  gaming_interactive: {
    label: "Interactive/Chat Gaming",
    keywords: ["chat","you guys","why would you","oh no","thank you chat","stardew","farm","chaos","sabotage","viewers","twitch","stream"],
    weights: { energy: 1.0, narrative: 1.2, hook: 1.4, density: 1.2 },
    idealDuration: [30, 75],
  },
  irl_review: {
    label: "IRL / Review",
    keywords: ["taste","try","review","recipe","snack","actually","surprised","honestly","disgusting","amazing","weird","looks","smell","texture","bite","eat"],
    weights: { energy: 0.6, narrative: 1.8, hook: 1.6, density: 1.3 },
    idealDuration: [20, 45],
  },
  variety: {
    label: "Variety",
    keywords: [],
    weights: { energy: 1.0, narrative: 1.0, hook: 1.0, density: 1.0 },
    idealDuration: [30, 60],
  },
};

const WEAK_OPENERS = [
  "hey guys","hey everyone","welcome back","what's up guys",
  "hello everyone","hi everyone","so today we","alright so",
  "okay so","so basically","um so","uh so",
];

const HYPE_WORDS = [
  "let's go","lets go","oh my god","omg","no way","clip it","clip that",
  "poggers","insane","crazy","holy","got him","got them","incredible",
  "unbelievable","are you kidding","seriously","finally","perfect",
  "amazing","wait what","what the","oh no","yes yes yes","come on",
  "there it is","that's it","i can't believe","never seen","first time",
];

function detectFormat(transcriptSample, manualFormat) {
  if (manualFormat && FORMAT_PROFILES[manualFormat]) return manualFormat;
  const text = transcriptSample.toLowerCase();
  const scores = {};
  for (const [id, profile] of Object.entries(FORMAT_PROFILES)) {
    scores[id] = profile.keywords.filter(kw => text.includes(kw)).length;
  }
  const best = Object.entries(scores).sort((a,b) => b[1]-a[1])[0];
  return best[1] > 0 ? best[0] : "variety";
}

function scoreHook(firstSegmentText) {
  const text = (firstSegmentText || "").toLowerCase().trim();
  
  // Weak opener check
  if (WEAK_OPENERS.some(w => text.startsWith(w))) {
    return { score: 5, type: "weak_opener", note: "Starts with generic greeting" };
  }
  
  let score = 10; let type = "neutral";
  
  if (text.slice(0, 100).includes("?")) { score = 28; type = "question"; }
  else if (HYPE_WORDS.some(w => text.slice(0, 80).includes(w))) { score = 32; type = "reaction_peak"; }
  else if (["never","always","everyone","nobody","most people"].some(w => text.slice(0, 80).includes(w))) { score = 22; type = "contradiction"; }
  else if (["just","finally","actually","honestly","wait"].some(w => text.slice(0, 60).includes(w))) { score = 18; type = "confession"; }
  
  // Punchy = good
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 8) score += 8;
  else if (wordCount > 20) score -= 8;
  
  return { score: Math.min(40, Math.max(0, score)), type };
}

// Auto-selects best available Groq chat model
let _cachedGroqModel = null;
async function getBestGroqModel() {
  if (_cachedGroqModel) return _cachedGroqModel;
  try {
    const Groq = require("groq-sdk");
    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const list = await groqClient.models.list();
    const preferred = [
      "llama-3.1-8b-instant",
      "llama-3.2-3b-preview", 
      "llama3-8b-8192",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ];
    const available = list.data.map(m => m.id);
    console.log(`[groq] Available models: ${available.join(", ")}`);
    for (const model of preferred) {
      if (available.includes(model)) {
        _cachedGroqModel = model;
        console.log(`[groq] Selected model: ${model}`);
        return model;
      }
    }
    // Fallback: pick any chat model that is not whisper
    const fallback = available.find(m => !m.includes("whisper") && !m.includes("vision"));
    _cachedGroqModel = fallback || "llama-3.1-8b-instant";
    console.log(`[groq] Fallback model: ${_cachedGroqModel}`);
    return _cachedGroqModel;
  } catch(e) {
    console.warn("[groq] Model list failed, using default:", e.message.slice(0, 60));
    return "llama-3.1-8b-instant";
  }
}

async function scoreWithClaude(transcript, formatProfile, duration, topicKeywords) {
  if (!process.env.GROQ_API_KEY) return null; // skip if no key configured
  
  const topicCtx = topicKeywords.length > 0 
    ? `\nThe streamer wants to find moments about: ${topicKeywords.join(", ")}` 
    : "";
  
  const prompt = `You are a viral content analyst for TikTok and YouTube Shorts.

Analyze this ${duration}s transcript from a ${formatProfile.label} stream.${topicCtx}

TRANSCRIPT:
${transcript.slice(0, 700)}

Return ONLY valid JSON (no markdown):
{
  "narrative_score": 0-40,
  "hook_score": 0-25,
  "emotion_score": 0-20,
  "rewatch_score": 0-15,
  "narrative_type": "reaction|story|tutorial|rant|achievement|review|interaction|other",
  "hook_text": "the first sentence that would work as a hook",
  "clip_title": "suggested viral title",
  "reason": "one sentence on viral potential",
  "has_topic_match": true/false
}`;

  try {
    const Groq = require("groq-sdk");
    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groqClient.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const data = JSON.parse(response.choices[0].message.content);
    return data;
  } catch (e) {
    console.warn("Claude scoring failed:", e.message.slice(0, 80));
    return null;
  }
}

async function getAudioEnergy(audioPath) {
  try {
    const { stderr } = await execAsync(`ffmpeg -i "${audioPath}" -af volumedetect -f null NUL`);
    const meanMatch = stderr.match(/mean_volume:\s*([\-\d.]+)\s*dB/);
    if (meanMatch) {
      const meanVol = parseFloat(meanMatch[1]);
      return Math.max(0, Math.min(100, (meanVol + 40) * 2.5));
    }
  } catch {}
  return 0;
}

async function getSilencePoints(audioPath, silenceThresh = -35, minSilence = 0.8) {
  try {
    const { stderr } = await execAsync(
      `ffmpeg -i "${audioPath}" -af "silencedetect=noise=${silenceThresh}dB:d=${minSilence}" -f null NUL`
    );
    const starts = [...stderr.matchAll(/silence_start: ([\d.]+)/g)].map(m => parseFloat(m[1]));
    const ends = [...stderr.matchAll(/silence_end: ([\d.]+)/g)].map(m => parseFloat(m[1]));
    return starts.map((s, i) => ({ start: s, end: ends[i] || s + minSilence }));
  } catch {
    return [];
  }
}

function buildSmartWindows(segments, silencePoints, minLen = 20, maxLen = 90, targetLen = 45) {
  if (!segments || segments.length === 0) return [];
  
  const windows = [];
  let i = 0;
  
  while (i < segments.length) {
    const winStart = segments[i].start;
    let winEnd = winStart;
    let j = i + 1;
    let lastHardBoundary = i;
    
    while (j < segments.length) {
      const candidateEnd = segments[j].end;
      const duration = candidateEnd - winStart;
      
      if (duration < minLen) { j++; continue; }
      
      const text = segments[j].text.trim();
      const isHardBoundary = /[.!?]$/.test(text);
      const isEmotional = /[!?]$/.test(text);
      
      if (isHardBoundary) lastHardBoundary = j;
      
      // Check if this boundary falls in a silence point
      const inSilence = silencePoints.some(s => 
        candidateEnd >= s.start && candidateEnd <= s.end + 0.5
      );
      
      if (duration >= targetLen && (isEmotional || (isHardBoundary && inSilence))) {
        winEnd = candidateEnd;
        break;
      }
      
      if (duration >= maxLen) {
        // Force cut at last hard boundary
        winEnd = segments[lastHardBoundary].end;
        j = lastHardBoundary;
        break;
      }
      
      j++;
    }
    
    if (winEnd <= winStart + minLen && j < segments.length) {
      winEnd = segments[Math.min(j, segments.length - 1)].end;
    }
    
    const windowSegs = segments.slice(i, j + 1);
    const fullTranscript = windowSegs.map(s => s.text).join(" ").trim();
    
    if (winEnd > winStart + minLen && fullTranscript.length > 20) {
      windows.push({
        start: winStart,
        end: winEnd,
        duration: winEnd - winStart,
        transcript: fullTranscript,
        firstSegment: segments[i].text,
        segments: windowSegs,
      });
    }
    
    // Advance with 10s overlap so we don't miss cross-boundary moments
    const overlapTarget = winStart + Math.max(targetLen * 0.7, 20);
    while (i < segments.length && segments[i].start < overlapTarget) i++;
    if (i >= j) i = j + 1;
  }
  
  return windows;
}

app.post("/scan-vod", upload.single("vod"), async (req, res) => {
  const sessionId = uuidv4().slice(0, 8);
  const url = req.body?.url;
  const topics = req.body?.topics || "";
  const maxClips = parseInt(req.body?.maxClips || "10");
  const manualFormat = req.body?.format || null;
  const topicKeywords = topics.split(/[,\n]+/).map(t => t.trim().toLowerCase()).filter(Boolean);

  let vodPath = req.file?.path || null;
  const tempFiles = [];
  let vodGame = null; let vodCategory = null; let vodTitle = null;

  console.log(`[${sessionId}] VOD scan v2 started. Format hint: ${manualFormat || "auto"}`);

  try {
    // ── Step 1: Get VOD ────────────────────────────────────────────────────
    if (url && !vodPath) {
      vodPath = path.join(os.tmpdir(), `vod-scan-${sessionId}.mp4`);
      tempFiles.push(vodPath);
      console.log(`[${sessionId}] Downloading VOD...`);
      await execAsync(`yt-dlp -f "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${vodPath}" "${url}"`);
      if (!fs.existsSync(vodPath)) throw new Error("VOD download failed.");
    } else if (vodPath) {
      tempFiles.push(vodPath);
    }
    if (!vodPath) throw new Error("No VOD file or URL provided.");

    const duration = await getVideoDuration(vodPath);
    console.log(`[${sessionId}] Duration: ${duration.toFixed(1)}s`);

    // ── Step 2: Extract full audio once ───────────────────────────────────
    const fullAudioPath = path.join(os.tmpdir(), `vod-audio-full-${sessionId}.wav`);
    tempFiles.push(fullAudioPath);
    console.log(`[${sessionId}] Extracting full audio...`);
    await extractAudio(vodPath, fullAudioPath);

    // ── Step 3: Transcribe full audio + get silence points in parallel ─────
    // ── Step 3: Transcribe in 10-min chunks + silence detection in parallel ──
    console.log(`[${sessionId}] Transcribing in chunks + detecting silence...`);
    const chunkSecs = 600; // 10 minutes per chunk
    const numAudioChunks = Math.ceil(duration / chunkSecs);
    const allSegments = [];
    for (let ci = 0; ci < numAudioChunks; ci++) {
      const chunkStart = ci * chunkSecs;
      const chunkAudioPath = path.join(os.tmpdir(), `vod-trans-${sessionId}-${ci}.wav`);
      tempFiles.push(chunkAudioPath);
      try {
        await execAsync(`ffmpeg -y -ss ${chunkStart} -i "${fullAudioPath}" -t ${chunkSecs} "${chunkAudioPath}"`);
        const t = await transcribeAudio(chunkAudioPath);
        const offsetSegs = (t.segments || []).map(s => ({ ...s, start: s.start + chunkStart, end: s.end + chunkStart }));
        allSegments.push(...offsetSegs);
        console.log(`[${sessionId}] Chunk ${ci+1}/${numAudioChunks} transcribed (${offsetSegs.length} segs)`);
      } catch(e) { console.warn(`[${sessionId}] Chunk ${ci} failed:`, e.message.slice(0,80)); }
    }
    const silencePoints = await getSilencePoints(fullAudioPath);
    const segments = allSegments;
    console.log(`[${sessionId}] ${segments.length} total segments, ${silencePoints.length} silence points`);

    // ── Step 4: Auto-detect format ─────────────────────────────────────────
    const sampleText = segments.slice(0, 30).map(s => s.text).join(" ");
    const detectedFormat = detectFormat(sampleText, manualFormat, vodGame || null, vodCategory || null);
    const formatProfile = FORMAT_PROFILES[detectedFormat];
    console.log(`[${sessionId}] Format: ${formatProfile.label}`);

    // ── Step 5: Build smart windows ────────────────────────────────────────
    console.log(`[${sessionId}] Building smart clip windows...`);
    const windows = buildSmartWindows(
      segments, silencePoints,
      20,   // min length
      90,   // max length  
      45,   // target length
    );
    console.log(`[${sessionId}] ${windows.length} candidate windows built`);

    // ── Step 6: Fast-score all windows ─────────────────────────────────────
    const fastScored = windows.map(win => {
      const text = win.transcript.toLowerCase();
      
      // Audio energy from transcript density (fast proxy without re-processing)
      const wordCount = win.transcript.split(/\s+/).filter(Boolean).length;
      const wordsPerSecond = wordCount / win.duration;
      const densityScore = Math.min(30, wordsPerSecond * 15);
      
      // Hype word detection
      const hypeMatches = HYPE_WORDS.filter(w => text.includes(w));
      const hypeScore = Math.min(30, hypeMatches.length * 10);
      
      // Topic keyword matching
      const topicMatches = topicKeywords.filter(kw => text.includes(kw));
      const topicScore = Math.min(40, topicMatches.length * 15 + (topicMatches.length >= 2 ? 10 : 0));
      
      // Hook score
      const hookResult = scoreHook(win.firstSegment);
      
      // Format duration fit
      const [idealMin, idealMax] = formatProfile.idealDuration;
      const durationFit = win.duration >= idealMin && win.duration <= idealMax ? 10 : 0;
      
      const fastScore = Math.min(100, 
        hypeScore * formatProfile.weights.energy +
        densityScore * formatProfile.weights.density +
        topicScore +
        hookResult.score * 0.3 +
        durationFit
      );

      return {
        ...win,
        fastScore,
        hypeMatches,
        topicMatches,
        hookResult,
        detectedFormat,
        formatLabel: formatProfile.label,
      };
    });

    // ── Step 7: Take top 20 candidates for LLM deep scoring ───────────────
    const topCandidates = fastScored
      .sort((a, b) => b.fastScore - a.fastScore)
      .slice(0, 20);

    console.log(`[${sessionId}] LLM scoring top ${topCandidates.length} candidates...`);

    const deepScored = [];
    for (let idx = 0; idx < topCandidates.length; idx++) {
      const win = topCandidates[idx];
      await new Promise(r => setTimeout(r, 500)); // 500ms between calls to avoid rate limit
      const result = await (async (win, idx) => {
      // Extract audio segment for energy measurement
      let audioEnergy = 0;
      const segAudioPath = path.join(os.tmpdir(), `vod-seg-${sessionId}-${idx}.wav`);
      tempFiles.push(segAudioPath);
      try {
        await execAsync(`ffmpeg -y -ss ${win.start} -i "${fullAudioPath}" -t ${win.duration} "${segAudioPath}"`);
        audioEnergy = await getAudioEnergy(segAudioPath);
      } catch {}

      // LLM semantic scoring
      const llmScore = await scoreWithClaude(win.transcript, formatProfile, win.duration, topicKeywords);

      // Extract thumbnail
      let thumbnail = null;
      const thumbPath = path.join(os.tmpdir(), `vod-thumb-${sessionId}-${idx}.jpg`);
      tempFiles.push(thumbPath);
      try {
        const thumbTime = win.start + win.duration * 0.2; // 20% into clip for best frame
        await execAsync(`ffmpeg -y -ss ${thumbTime} -i "${vodPath}" -frames:v 1 -q:v 3 -vf "scale=480:-1" "${thumbPath}"`);
        if (fs.existsSync(thumbPath)) thumbnail = fs.readFileSync(thumbPath).toString("base64");
      } catch {}

      // Combine scores
      let finalScore = win.fastScore;
      const reasons = [];
      let clipTitle = null;
      let hookText = win.firstSegment;
      let narrativeType = "unknown";

      if (llmScore) {
        const llmTotal = (llmScore.narrative_score || 0) + (llmScore.hook_score || 0) + 
                         (llmScore.emotion_score || 0) + (llmScore.rewatch_score || 0);
        
        // Energy corroboration
        let energyMult = 1.0;
        if ((llmScore.emotion_score || 0) > 15 && audioEnergy < 25) energyMult = 0.75;
        if ((llmScore.emotion_score || 0) > 15 && audioEnergy > 55) energyMult = 1.25;

        finalScore = Math.min(100, 
          llmTotal * energyMult * formatProfile.weights.narrative +
          audioEnergy * formatProfile.weights.energy * 0.3 +
          win.hookResult.score * formatProfile.weights.hook * 0.3
        );

        clipTitle = llmScore.clip_title;
        hookText = llmScore.hook_text || win.firstSegment;
        narrativeType = llmScore.narrative_type || "unknown";
        if (llmScore.reason) reasons.push(`🎯 ${llmScore.reason}`);
        if (llmScore.has_topic_match) reasons.push(`💬 Topic match found`);
      }

      // Add signal reasons
      if (audioEnergy > 60) reasons.push("🔊 High audio energy spike");
      else if (audioEnergy > 40) reasons.push("🔊 Elevated audio energy");
      if (win.hypeMatches.length > 0) reasons.push(`🔥 Hype: ${win.hypeMatches.slice(0, 2).join(", ")}`);
      if (win.topicMatches.length > 0) reasons.push(`💬 Topics: ${win.topicMatches.slice(0, 3).join(", ")}`);
      if (win.hookResult.type === "reaction_peak") reasons.push("⚡ Strong hook opener");
      if (win.hookResult.type === "weak_opener") reasons.push("⚠️ Weak opener — consider trimming start");

      console.log(`[${sessionId}] Candidate ${idx + 1}: score=${Math.round(finalScore)} energy=${audioEnergy.toFixed(1)} type=${narrativeType} "${win.transcript.slice(0, 50)}..."`);

      return {
        startSec: win.start,
        endSec: win.end,
        startLabel: formatTimestamp(Math.round(win.start)),
        endLabel: formatTimestamp(Math.round(win.end)),
        duration: Math.round(win.duration),
        score: Math.round(finalScore),
        transcript: win.transcript,
        hookText,
        clipTitle,
        narrativeType,
        reasons,
        hookType: win.hookResult.type,
        audioEnergy: Math.round(audioEnergy),
        thumbnail,
        detectedFormat,
        formatLabel: formatProfile.label,
        topicMatches: win.topicMatches,
      };
      })(win, idx);
      deepScored.push(result);
      console.log(`[${sessionId}] Scored ${idx+1}/${topCandidates.length}`);
    }

    // ── Step 8: Final ranking ──────────────────────────────────────────────
    const finalClips = deepScored
      .filter(c => c.score > 15)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxClips);

    // Cache VOD for clip preview/download
    const cachedVodPath = path.join(VOD_CACHE_DIR, `${sessionId}.mp4`);
    try {
      fs.copyFileSync(vodPath, cachedVodPath);
      console.log(`[${sessionId}] VOD cached: ${cachedVodPath}`);
    } catch(e) { console.warn(`[${sessionId}] VOD cache failed:`, e.message); }

    console.log(`[${sessionId}] Scan complete. ${finalClips.length} clips. Format: ${formatProfile.label}`);

    res.json({
      sessionId,
      duration: Math.round(duration),
      durationLabel: formatTimestamp(Math.round(duration)),
      totalWindows: windows.length,
      detectedFormat,
      formatLabel: formatProfile.label,
      clips: finalClips,
    });

  } catch (err) {
    console.error(`[${sessionId}] VOD scan error:`, err.message);
    res.status(500).json({ error: err.message, sessionId });
  } finally {
    cleanup(...tempFiles);
    console.log(`[${sessionId}] Cleanup done`);
  }
});



// ─── Stream Coach: POST /coach-vod ───────────────────────────────────────────
const FILLER_WORDS = {
  thinking: ["um","uh","er","uhh","umm","hmm"],
  hedging: ["like","you know","kind of","sort of","basically","literally","honestly"],
  stalling: ["so","right","okay so","alright so","i mean","anyway","whatever"],
  stream_specific: ["moving on","next up","so yeah","and stuff","or whatever"],
};

const HYPE_WORDS_COACH = ["let's go","lets go","oh my god","omg","no way","insane","crazy","holy","yes","incredible","unbelievable","finally","amazing","wow"];

function findTrueStart(segments, clusterWindowSecs = 30, minWordsInWindow = 40) {
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  for (let i = 0; i < sorted.length; i++) {
    const windowStart = sorted[i].start;
    const windowEnd = windowStart + clusterWindowSecs;
    const windowSegs = sorted.filter(s => s.start >= windowStart && s.start <= windowEnd);
    const wordCount = windowSegs.reduce((acc, s) => acc + s.text.trim().split(/\s+/).length, 0);
    if (wordCount >= minWordsInWindow) {
      return {
        trueStartSec: sorted[i].start,
        trueStartLabel: formatTimestamp(Math.round(sorted[i].start)),
        preStreamDuration: Math.round(sorted[i].start),
        preStreamLabel: formatTimestamp(Math.round(sorted[i].start)),
        firstWords: sorted[i].text.trim(),
      };
    }
  }
  return { trueStartSec: sorted[0]?.start || 0, trueStartLabel: "0:00", preStreamDuration: 0, preStreamLabel: "0:00", firstWords: sorted[0]?.text || "" };
}

function analyzeDeadAir(silencePoints, trueStartSec, totalDuration, profile = null) {
  const minSecs = profile?.deadAirMinSecs ?? 15;
  const midSecs = Math.max(8, Math.round(minSecs * 0.5));
  const postStart = silencePoints.filter(s => s.start >= trueStartSec && s.duration >= 4);
  const brief = postStart.filter(s => s.duration >= 4 && s.duration < midSecs);
  const moderate = postStart.filter(s => s.duration >= midSecs && s.duration < minSecs);
  const deadAir = postStart.filter(s => s.duration >= minSecs);
  const totalDeadSecs = deadAir.reduce((a, s) => a + s.duration, 0);
  const streamDuration = totalDuration - trueStartSec || 1;
  const deadAirPct = (totalDeadSecs / streamDuration) * 100;
  const grade = bandGrade(deadAirPct, profile?.deadAirBands || [2, 5, 10, 15]);
  return {
    grade,
    totalInstances: deadAir.length,
    totalSeconds: Math.round(totalDeadSecs),
    percentage: deadAirPct.toFixed(1),
    longestInstance: deadAir.length > 0 ? `${Math.round(Math.max(...deadAir.map(s => s.duration)))}s at ${formatTimestamp(Math.round(deadAir.sort((a,b)=>b.duration-a.duration)[0].start))}` : "None",
    worstMoments: deadAir.sort((a,b) => b.duration - a.duration).slice(0,5).map(s => ({ at: formatTimestamp(Math.round(s.start)), duration: `${Math.round(s.duration)}s` })),
    moderateCount: moderate.length,
    thresholdSecs: minSecs,
    categoryLabel: profile?.label || null,
    coachingNote: deadAir.length === 0
      ? "Excellent! No significant dead air detected. Keep narrating your thought process."
      : `${deadAir.length} dead air gaps averaging ${Math.round(totalDeadSecs/deadAir.length)}s each. When gameplay slows, narrate out loud: 'okay thinking about this...' — silence is the #1 reason viewers tab out.`,
  };
}

function analyzeFillerWords(segments, trueStartSec, profile = null) {
  const postSegs = segments.filter(s => s.start >= trueStartSec);
  const fullText = postSegs.map(s => s.text.toLowerCase()).join(" ");
  const totalWords = fullText.split(/\s+/).filter(Boolean).length;
  const results = {}; let totalFillers = 0;
  const instances = [];
  for (const [cat, words] of Object.entries(FILLER_WORDS)) {
    results[cat] = {};
    for (const filler of words) {
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      const matches = fullText.match(regex) || [];
      if (matches.length > 0) {
        results[cat][filler] = matches.length;
        totalFillers += matches.length;
        if (matches.length > 5) {
          postSegs.slice(0, 50).forEach(seg => {
            if (seg.text.toLowerCase().includes(filler)) {
              instances.push({ word: filler, at: formatTimestamp(Math.round(seg.start)), context: seg.text.trim().slice(0,80) });
            }
          });
        }
      }
    }
  }
  const fillerRate = totalWords > 0 ? ((totalFillers / totalWords) * 100).toFixed(1) : "0.0";
  const allCounts = Object.values(results).flatMap(cat => Object.entries(cat));
  const topOffenders = Object.fromEntries(allCounts.sort((a,b) => b[1]-a[1]).slice(0,5));
  const grade = bandGrade(parseFloat(fillerRate), profile?.fillerBands || [2, 4, 7, 10]);
  const topFiller = allCounts.sort((a,b)=>b[1]-a[1])[0];
  return {
    grade, totalFillers, totalWords, fillerRate,
    topOffenders, byCategory: results,
    worstInstances: instances.slice(0,8),
    coachingNote: totalFillers === 0
      ? "Excellent vocal clarity! Very few filler words detected."
      : topFiller
        ? `"${topFiller[0]}" appeared ${topFiller[1]} times. Replace with a deliberate 1-second pause — silence is less distracting than fillers. Recording yourself for 10 minutes builds awareness fast.`
        : "Work on reducing filler words with deliberate pauses.",
  };
}

async function runCoachLLM(promptText, sessionId, label, maxTokens = 600) {
  try {
    const Groq = require("groq-sdk");
    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const model = await getBestGroqModel();
    const response = await groqClient.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: promptText }],
      response_format: { type: "json_object" },
    });
    const text = response.choices[0].message.content;
    console.log(`[${sessionId}] LLM ${label} done`);
    return JSON.parse(text);
  } catch(e) {
    console.warn(`[${sessionId}] LLM ${label} failed:`, e.message.slice(0,80));
    return null;
  }
}

function computeOverallGrade(grades) {
  const gradeMap = { "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7, "C+": 2.3, "C": 2.0, "C-": 1.7, "D": 1.0, "F": 0.0 };
  const reverseMap = { 4.0:"A", 3.7:"A-", 3.3:"B+", 3.0:"B", 2.7:"B-", 2.3:"C+", 2.0:"C", 1.7:"C-", 1.0:"D", 0.0:"F" };
  const values = grades.map(g => gradeMap[g] ?? 2.0).filter(v => !isNaN(v));
  if (values.length === 0) return "C";
  const avg = values.reduce((a,b) => a+b, 0) / values.length;
  const rounded = Math.round(avg * 3) / 3;
  const closest = Object.entries(reverseMap).sort((a,b) => Math.abs(parseFloat(a[0])-rounded) - Math.abs(parseFloat(b[0])-rounded))[0];
  return closest[1];
}

// ─── Twitch VOD Chat Replay Analysis ─────────────────────────────────────────
// Requires TwitchDownloaderCLI on PATH, or set TWITCH_DL_PATH in .env
const TWITCH_DL = process.env.TWITCH_DL_PATH || "TwitchDownloaderCLI";

function extractTwitchVodId(url) {
  if (!url) return null;
  const m = String(url).match(/twitch\.tv\/videos\/(\d+)/);
  return m ? m[1] : null;
}

async function downloadTwitchChat(vodId, outPath, sessionId) {
  try {
    console.log(`[${sessionId}] Downloading Twitch chat replay for VOD ${vodId}...`);
    await execAsync(`"${TWITCH_DL}" chatdownload --id ${vodId} -o "${outPath}"`);
    if (!fs.existsSync(outPath)) throw new Error("Chat file was not created.");
    return true;
  } catch (e) {
    console.warn(`[${sessionId}] Chat download failed: ${String(e.message).slice(0, 200)}`);
    return false;
  }
}

function parseChatJson(chatPath) {
  const raw = JSON.parse(fs.readFileSync(chatPath, "utf8"));
  const comments = raw.comments || [];
  return comments
    .map(c => ({
      offset: typeof c.content_offset_seconds === "number" ? c.content_offset_seconds : 0,
      user: c.commenter?.display_name || c.commenter?.name || "unknown",
      text: (typeof c.message === "string" ? c.message : (c.message?.body || "")) || "",
    }))
    .filter(m => m.text)
    .sort((a, b) => a.offset - b.offset);
}

function medianOf(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function buildChatVelocity(messages, duration, bucketSecs = 30) {
  const n = Math.max(1, Math.ceil(duration / bucketSecs));
  const buckets = Array.from({ length: n }, (_, i) => ({ start: i * bucketSecs, count: 0, users: new Set() }));
  for (const m of messages) {
    const idx = Math.floor(m.offset / bucketSecs);
    if (idx >= 0 && idx < n) { buckets[idx].count++; buckets[idx].users.add(m.user); }
  }
  return buckets.map(b => ({ start: b.start, label: formatTimestamp(b.start), count: b.count, uniqueUsers: b.users.size }));
}

function findChatSpikes(velocity, trueStartSec, maxSpikes = 8) {
  const active = velocity.filter(b => b.start >= trueStartSec);
  const med = medianOf(active.map(b => b.count));
  const threshold = Math.max(med * 2, med + 3, 3);
  return active
    .filter(b => b.count >= threshold)
    .sort((a, b) => b.count - a.count)
    .slice(0, maxSpikes)
    .sort((a, b) => a.start - b.start)
    .map(b => ({
      at: b.label,
      atSec: b.start,
      messages: b.count,
      uniqueUsers: b.uniqueUsers,
      multiplier: med > 0 ? Number((b.count / med).toFixed(1)) : null,
    }));
}

function tagSpikeAcknowledgement(spikes, segments, messages, windowSecs = 45) {
  return spikes.map(sp => {
    const after = segments.filter(s => s.start >= sp.atSec && s.start <= sp.atSec + windowSecs);
    const words = after.reduce((a, s) => a + s.text.trim().split(/\s+/).filter(Boolean).length, 0);
    const sample = messages
      .filter(m => m.offset >= sp.atSec && m.offset < sp.atSec + 30)
      .slice(0, 3)
      .map(m => `${m.user}: ${m.text.slice(0, 60)}`);
    return { ...sp, streamerWordsAfter: words, acknowledged: words >= 25, sampleChat: sample };
  });
}

function correlateDeadAirWithChat(silences, trueStartSec, velocity, messages) {
  const gaps = silences.filter(s => s.start >= trueStartSec && s.duration >= 15);
  const active = velocity.filter(b => b.start >= trueStartSec);
  const medPer30 = medianOf(active.map(b => b.count));
  const medPerMin = medPer30 * 2;
  return gaps
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 6)
    .map(g => {
      const during = messages.filter(m => m.offset >= g.start && m.offset <= g.end);
      const perMin = g.duration > 0 ? during.length / (g.duration / 60) : 0;
      const hot = medPerMin > 0 ? perMin > medPerMin * 1.2 : during.length >= 3;
      return {
        at: formatTimestamp(Math.round(g.start)),
        duration: `${Math.round(g.duration)}s`,
        chatMessages: during.length,
        chatState: hot ? "active" : "quiet",
        verdict: hot
          ? "Chat kept talking while you went silent — a missed chance to jump in and ride the moment."
          : "Chat went quiet too — the room flattened together. A question or prompt here would have restarted it.",
        sampleChat: during.slice(0, 3).map(m => `${m.user}: ${m.text.slice(0, 60)}`),
      };
    });
}

function analyzeChatEngagement(messages, duration, trueStartSec, silences, segments) {
  const velocity = buildChatVelocity(messages, duration, 30);
  const spikes = tagSpikeAcknowledgement(findChatSpikes(velocity, trueStartSec), segments, messages);
  const deadAirCorrelation = correlateDeadAirWithChat(silences, trueStartSec, velocity, messages);

  const activeSecs = Math.max(1, duration - trueStartSec);
  const postMessages = messages.filter(m => m.offset >= trueStartSec);
  const uniqueChatters = new Set(postMessages.map(m => m.user)).size;
  const msgsPerMin = Number((postMessages.length / (activeSecs / 60)).toFixed(1));

  const activeBuckets = velocity.filter(b => b.start >= trueStartSec);
  const peakBucket = [...activeBuckets].sort((a, b) => b.count - a.count)[0] || null;
  let peakMoment = null;
  if (peakBucket) {
    const said = segments
      .filter(s => s.start >= peakBucket.start - 15 && s.start <= peakBucket.start + 30)
      .map(s => s.text.trim()).join(" ").slice(0, 220);
    peakMoment = {
      at: peakBucket.label,
      messages: peakBucket.count,
      uniqueUsers: peakBucket.uniqueUsers,
      youWereSaying: said || "(no speech detected here)",
      sampleChat: messages
        .filter(m => m.offset >= peakBucket.start && m.offset < peakBucket.start + 30)
        .slice(0, 4).map(m => `${m.user}: ${m.text.slice(0, 60)}`),
    };
  }

  const missedMoments = spikes.filter(s => !s.acknowledged);
  const ackRate = spikes.length ? (spikes.length - missedMoments.length) / spikes.length : 1;
  const grade = spikes.length === 0 ? "B"
    : ackRate >= 0.85 ? "A" : ackRate >= 0.65 ? "B" : ackRate >= 0.45 ? "C" : ackRate >= 0.25 ? "D" : "F";

  const topChatters = Object.entries(
    postMessages.reduce((acc, m) => { acc[m.user] = (acc[m.user] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([user, count]) => ({ user, count }));

  const hotDeadAir = deadAirCorrelation.filter(d => d.chatState === "active");

  const coachingNote = missedMoments.length > 0
    ? `Chat spiked ${spikes.length} time(s) and you rode ${spikes.length - missedMoments.length} of them. The ${missedMoments.length} you missed (starting ${missedMoments[0].at}) are free retention — when chat pops, say something within 30 seconds, even just reading a message out loud.`
    : spikes.length > 0
      ? `You reacted to every chat spike — that responsiveness is exactly what turns viewers into regulars. Keep it up.`
      : `Chat stayed at a steady low volume. Try asking one direct, easy-to-answer question every 20 minutes to prime participation.`;

  return {
    available: true,
    grade,
    totalMessages: postMessages.length,
    uniqueChatters,
    messagesPerMinute: msgsPerMin,
    acknowledgementRate: `${Math.round(ackRate * 100)}%`,
    velocity: activeBuckets,
    spikes,
    missedMoments,
    peakMoment,
    deadAirCorrelation,
    hotDeadAirCount: hotDeadAir.length,
    topChatters,
    coachingNote,
  };
}

function buildChatBrief(ca) {
  if (!ca || !ca.available) return "CHAT REPLAY: unavailable for this VOD (not a Twitch URL, chat replay disabled, or VOD expired). Do not speculate about chat.";
  const spikeList = (ca.spikes || []).map(s => `${s.at} (${s.messages} msgs${s.multiplier ? `, ${s.multiplier}x normal` : ""})${s.acknowledged ? " - you responded" : " - YOU DID NOT RESPOND"}`).join("; ") || "none";
  const hotGaps = (ca.deadAirCorrelation || []).filter(d => d.chatState === "active")
    .map(d => `${d.at} (${d.duration} silent, chat sent ${d.chatMessages} msgs during it)`).join("; ") || "none";
  return [
    `CHAT REPLAY (responsiveness grade ${ca.grade}): ${ca.totalMessages} messages from ${ca.uniqueChatters} unique chatters, ${ca.messagesPerMinute} msgs/min. You responded to ${ca.acknowledgementRate} of chat spikes.`,
    `CHAT SPIKES: ${spikeList}.`,
    `DEAD AIR WHILE CHAT WAS ACTIVE (missed opportunities): ${hotGaps}.`,
    ca.peakMoment ? `PEAK CHAT MOMENT: ${ca.peakMoment.at} with ${ca.peakMoment.messages} messages. You were saying: "${String(ca.peakMoment.youWereSaying).slice(0, 160)}".` : "",
  ].filter(Boolean).join("\n");
}
// ─── Content Context & Category Profiles ─────────────────────────────────────
// Different formats have different norms. A 20s silence in a horror game is
// tension; the same silence in Just Chatting is a viewer leaving.
const CATEGORY_PROFILES = {
  talk: {
    label: "Talk / Just Chatting",
    match: ["just chatting","talk show","podcast","asmr","travel","food","drink","politics","watch part","reaction","react","irl","body art","beauty","fitness"],
    deadAirMinSecs: 10,
    deadAirBands: [1.5, 4, 8, 12],
    fillerBands: [2, 4, 6, 9],
    guidance: "This is a talk-driven format. Silence is expensive here because the audience came for the voice, so gaps over about 10 seconds read as dead air. Filler words are far more noticeable since there is no gameplay to hide behind. Chat interaction and storytelling matter more than anything else.",
  },
  competitive: {
    label: "Competitive Gaming",
    match: ["valorant","counter-strike","cs2","league of legends","dota","overwatch","apex legends","rocket league","fortnite","call of duty","rainbow six","street fighter","tekken","mortal kombat","teamfight tactics","pubg","escape from tarkov","marvel rivals","deadlock","chess"],
    deadAirMinSecs: 20,
    deadAirBands: [4, 9, 15, 22],
    fillerBands: [3, 6, 9, 13],
    guidance: "This is a competitive format. Short silences during high-pressure play are natural and should not be penalised heavily. Long silences between rounds, in queue, or on death screens are the real lost engagement. Prioritise narrating decisions and reads over eliminating filler words.",
  },
  narrative: {
    label: "Narrative / Story Game",
    match: ["horror","resident evil","silent hill","the last of us","outlast","phasmophobia","detroit","life is strange","visual novel","point and click","adventure","final fantasy","elden ring","dark souls","baldur's gate","cyberpunk","mass effect","witcher","alan wake","fallout","skyrim","rpg"],
    deadAirMinSecs: 25,
    deadAirBands: [5, 11, 18, 26],
    fillerBands: [3, 5, 8, 12],
    guidance: "This is a narrative format. Deliberate silence is often tension and atmosphere rather than dead air, especially during cutscenes, exploration, or scripted beats. Judge silence by whether it felt intentional and earned. Reward genuine reaction and commentary over constant talking.",
  },
  cozy: {
    label: "Cozy / Simulation",
    match: ["stardew","animal crossing","minecraft","terraria","the sims","farming","cities: skylines","planet coaster","planet zoo","factorio","satisfactory","cooking","slime rancher","palia","coral island","dredge","spiritfarer","unpacking","house flipper","powerwash"],
    deadAirMinSecs: 18,
    deadAirBands: [3, 7, 13, 19],
    fillerBands: [3, 5, 8, 11],
    guidance: "This is a cozy, low-stakes format where the community is the main draw. Viewers stay for conversation and vibe, not mechanics, so chat interaction matters more than gameplay commentary. Comfortable pauses are acceptable but extended ones lose the room.",
  },
  creative: {
    label: "Creative / Development",
    match: ["art","music","software and game development","science & technology","makers","game development","digital art","animation","writing","dj","producing","music production","3d","blender","programming","coding"],
    deadAirMinSecs: 25,
    deadAirBands: [5, 11, 18, 25],
    fillerBands: [3, 6, 9, 13],
    guidance: "This is a creative or technical format. Deep-focus silence while working is expected, but the strongest creative streamers narrate their process out loud. Judge silence by whether the audience could still follow what was being made and why.",
  },
  variety: {
    label: "Variety / Unspecified",
    match: [],
    deadAirMinSecs: 15,
    deadAirBands: [2, 5, 10, 15],
    fillerBands: [2, 4, 7, 10],
    guidance: "Format was not specifically identified, so apply general streaming best practice: keep narration flowing, avoid long unexplained silences, and interact with chat regularly.",
  },
};

function bandGrade(value, bands) {
  const [a, b, c, d] = bands;
  if (isNaN(value)) return "C";
  return value < a ? "A" : value < b ? "B" : value < c ? "C" : value < d ? "D" : "F";
}

function resolveCategoryProfile(category, title) {
  const hay = `${category || ""} ${title || ""}`.toLowerCase();
  if (hay.trim()) {
    for (const [id, p] of Object.entries(CATEGORY_PROFILES)) {
      if (p.match.length && p.match.some(k => hay.includes(k))) return { id, ...p };
    }
  }
  return { id: "variety", ...CATEGORY_PROFILES.variety };
}

async function fetchVodContext(url, sessionId) {
  const ctx = { title: null, category: null, channel: null, chapters: [], source: "none" };
  if (!url) return ctx;
  try {
    const { stdout } = await execAsync(`yt-dlp --dump-json --no-download "${url}"`);
    const meta = JSON.parse(stdout);
    ctx.title = meta.title || null;
    ctx.channel = meta.uploader || meta.channel || null;
    ctx.category = meta.game || meta.game_name ||
      (Array.isArray(meta.categories) && meta.categories.length ? meta.categories[0] : null) || null;
    if (Array.isArray(meta.chapters) && meta.chapters.length) {
      ctx.chapters = meta.chapters
        .filter(ch => ch && (ch.title || ch.start_time !== undefined))
        .map(ch => ({
          title: ch.title || "Unknown",
          startSec: Math.round(ch.start_time || 0),
          at: formatTimestamp(Math.round(ch.start_time || 0)),
        }));
    }
    ctx.source = "yt-dlp";
  } catch (e) {
    console.warn(`[${sessionId}] VOD metadata fetch failed: ${String(e.message).slice(0, 140)}`);
  }
  return ctx;
}

// When a stream switches games, weight by time spent rather than taking the first
function dominantCategory(chapters, duration) {
  if (!chapters || chapters.length === 0) return null;
  const agg = {};
  chapters.forEach((ch, i) => {
    const end = i + 1 < chapters.length ? chapters[i + 1].startSec : duration;
    agg[ch.title] = (agg[ch.title] || 0) + Math.max(0, end - ch.startSec);
  });
  const top = Object.entries(agg).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

function buildCoachContextLine(ctx, profile) {
  const parts = [];
  parts.push(`STREAM CONTEXT: ${ctx.title ? `Titled "${ctx.title}". ` : ""}Category: ${ctx.category || "unknown"}. Format profile: ${profile.label}.`);
  if (ctx.chapters && ctx.chapters.length > 1) {
    parts.push(`The streamer changed content ${ctx.chapters.length} times: ${ctx.chapters.slice(0, 8).map(c => `${c.title} at ${c.at}`).join(", ")}.`);
  }
  parts.push(`FORMAT GUIDANCE: ${profile.guidance}`);
  parts.push(`Judge this stream against the norms of its own category, not generic streaming advice. Do not give feedback that would be wrong for this format.`);
  return parts.join("\n");
}
// ─── Technical Issue Detection ───────────────────────────────────────────────
// Corroborates independent signals: audio faults, video faults, viewer reports,
// and the streamer's own on-air acknowledgements.

const TECH_CHAT_PATTERNS = [
  "audio is gone","no audio","no sound","cant hear","can't hear","cannot hear","audio died","sound died",
  "you're muted","youre muted","muted","mic is","mic died","mic quiet","too quiet","too loud","volume",
  "lagging","lag","laggy","frozen","freeze","froze","buffering","stuttering","choppy","pixelated","potato quality",
  "black screen","no video","screen is","stream died","stream is down","disconnected","dropped frames",
  "desync","out of sync","echo","static","robot voice","distorted","clipping","peaking","fix your audio",
];

const TECH_SPEECH_PATTERNS = [
  "sorry about that","my bad","is my audio","can you hear me","can you guys hear","am i lagging","is it lagging",
  "technical difficulties","technical issue","let me fix","give me a sec","give me a second","one second",
  "hold on","restart","dropped frames","my internet","wifi","disconnect","froze","obs","stream deck",
  "audio issue","sound issue","mic issue","is that better","how about now","did that fix",
];

function techGrade(pct) {
  if (isNaN(pct)) return "C";
  return pct < 1 ? "A" : pct < 3 ? "B" : pct < 7 ? "C" : pct < 12 ? "D" : "F";
}

async function getLoudnessStats(audioPath) {
  const out = { integratedLufs: null, loudnessRange: null, truePeakDb: null, maxVolumeDb: null, meanVolumeDb: null };
  try {
    const { stderr } = await execAsync(`ffmpeg -hide_banner -i "${audioPath}" -af ebur128=peak=true -f null NUL`);
    const iM = [...stderr.matchAll(/I:\s*(-?[\d.]+)\s*LUFS/g)];
    const lraM = [...stderr.matchAll(/LRA:\s*(-?[\d.]+)\s*LU/g)];
    const pkM = [...stderr.matchAll(/Peak:\s*(-?[\d.]+)\s*dBFS/g)];
    if (iM.length) out.integratedLufs = parseFloat(iM[iM.length - 1][1]);
    if (lraM.length) out.loudnessRange = parseFloat(lraM[lraM.length - 1][1]);
    if (pkM.length) out.truePeakDb = parseFloat(pkM[pkM.length - 1][1]);
  } catch (e) {
    console.warn("[tech] ebur128 failed:", String(e.message).slice(0, 80));
  }
  try {
    const { stderr } = await execAsync(`ffmpeg -hide_banner -i "${audioPath}" -af volumedetect -f null NUL`);
    const mx = stderr.match(/max_volume:\s*(-?[\d.]+)\s*dB/);
    const mn = stderr.match(/mean_volume:\s*(-?[\d.]+)\s*dB/);
    if (mx) out.maxVolumeDb = parseFloat(mx[1]);
    if (mn) out.meanVolumeDb = parseFloat(mn[1]);
  } catch {}
  return out;
}

// Hard silence (below room tone) usually means the audio feed died, not a pause
async function getAudioDropouts(audioPath, minSecs = 4) {
  try {
    const { stderr } = await execAsync(
      `ffmpeg -hide_banner -i "${audioPath}" -af "silencedetect=noise=-50dB:d=${minSecs}" -f null NUL`
    );
    const starts = [...stderr.matchAll(/silence_start:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));
    const ends = [...stderr.matchAll(/silence_end:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));
    return starts.map((s, i) => ({ start: s, end: ends[i] ?? s + minSecs, duration: (ends[i] ?? s + minSecs) - s }));
  } catch {
    return [];
  }
}

// Optional: full video decode. Expensive on long VODs, so this is opt-in.
async function detectVideoGlitches(videoPath, sessionId) {
  const out = { scanned: false, freezes: [], blackScreens: [] };
  try {
    console.log(`[${sessionId}] Deep video scan (freeze + black frame)...`);
    const { stderr } = await execAsync(
      `ffmpeg -hide_banner -i "${videoPath}" -vf "fps=2,scale=320:-2,freezedetect=n=-60dB:d=4,blackdetect=d=3:pix_th=0.10" -an -f null NUL`,
      { timeout: 45 * 60 * 1000 }
    );
    const fStarts = [...stderr.matchAll(/freeze_start:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));
    const fDurs = [...stderr.matchAll(/freeze_duration:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));
    out.freezes = fStarts.map((s, i) => ({ start: s, duration: fDurs[i] ?? 4 }));
    out.blackScreens = [...stderr.matchAll(/black_start:([\d.]+)\s+black_end:([\d.]+)/g)]
      .map(m => ({ start: parseFloat(m[1]), duration: parseFloat(m[2]) - parseFloat(m[1]) }));
    out.scanned = true;
    console.log(`[${sessionId}] Video scan: ${out.freezes.length} freezes, ${out.blackScreens.length} black screens`);
  } catch (e) {
    console.warn(`[${sessionId}] Video glitch scan failed/timed out: ${String(e.message).slice(0, 100)}`);
  }
  return out;
}

function findViewerReportedIssues(chatMessages, bucketSecs = 60) {
  if (!chatMessages || chatMessages.length === 0) return [];
  const buckets = {};
  for (const m of chatMessages) {
    const text = m.text.toLowerCase();
    const hit = TECH_CHAT_PATTERNS.find(p => text.includes(p));
    if (!hit) continue;
    const key = Math.floor(m.offset / bucketSecs);
    if (!buckets[key]) buckets[key] = { start: key * bucketSecs, complaints: [], terms: new Set() };
    buckets[key].complaints.push(`${m.user}: ${m.text.slice(0, 70)}`);
    buckets[key].terms.add(hit);
  }
  return Object.values(buckets)
    .filter(b => b.complaints.length >= 3)
    .map(b => ({
      start: b.start,
      count: b.complaints.length,
      terms: [...b.terms].slice(0, 4),
      samples: b.complaints.slice(0, 3),
    }))
    .sort((a, b) => a.start - b.start);
}

function findStreamerAcknowledgements(segments) {
  const hits = [];
  for (const s of segments) {
    const text = s.text.toLowerCase();
    const hit = TECH_SPEECH_PATTERNS.find(p => text.includes(p));
    if (hit) hits.push({ start: s.start, phrase: hit, quote: s.text.trim().slice(0, 90) });
  }
  // collapse to one per 90s so a single incident does not produce ten entries
  const collapsed = [];
  for (const h of hits) {
    if (!collapsed.length || h.start - collapsed[collapsed.length - 1].start > 90) collapsed.push(h);
  }
  return collapsed;
}

function buildTechIncidents(signals, mergeWindow = 90) {
  const sorted = [...signals].sort((a, b) => a.atSec - b.atSec);
  const groups = [];
  for (const s of sorted) {
    const last = groups[groups.length - 1];
    if (last && s.atSec - last.endSec <= mergeWindow) {
      last.endSec = Math.max(last.endSec, s.atSec + (s.durationSec || 0));
      last.signals.push(s);
    } else {
      groups.push({ startSec: s.atSec, endSec: s.atSec + (s.durationSec || 0), signals: [s] });
    }
  }
  return groups.map(g => {
    const types = [...new Set(g.signals.map(s => s.type))];
    const viewerReported = types.includes("viewer_reports");
    let confidence = types.length >= 3 ? "confirmed" : types.length === 2 ? "likely" : "possible";
    if (viewerReported && types.length >= 2) confidence = "confirmed";
    const severity = confidence === "confirmed" ? "high" : confidence === "likely" ? "medium" : "low";
    return {
      at: formatTimestamp(Math.round(g.startSec)),
      atSec: Math.round(g.startSec),
      durationSec: Math.max(5, Math.round(g.endSec - g.startSec)),
      confidence,
      severity,
      signalTypes: types,
      viewerReported,
      details: g.signals.map(s => s.detail).slice(0, 6),
    };
  });
}

function analyzeTechnicalIssues({ loudness, dropouts, videoGlitches, chatMessages, segments, duration, trueStartSec }) {
  const signals = [];

  for (const d of dropouts.filter(d => d.start >= trueStartSec)) {
    signals.push({
      atSec: d.start, durationSec: d.duration, type: "audio_dropout",
      detail: `Hard audio silence for ${Math.round(d.duration)}s (below room tone — likely a dead audio feed, not a pause)`,
    });
  }

  for (const f of (videoGlitches.freezes || []).filter(f => f.start >= trueStartSec)) {
    signals.push({
      atSec: f.start, durationSec: f.duration, type: "video_freeze",
      detail: `Video frozen for ${Math.round(f.duration)}s`,
    });
  }

  for (const b of (videoGlitches.blackScreens || []).filter(b => b.start >= trueStartSec)) {
    signals.push({
      atSec: b.start, durationSec: b.duration, type: "black_screen",
      detail: `Black screen for ${Math.round(b.duration)}s`,
    });
  }

  const viewerReports = findViewerReportedIssues(chatMessages).filter(v => v.start >= trueStartSec);
  for (const v of viewerReports) {
    signals.push({
      atSec: v.start, durationSec: 60, type: "viewer_reports",
      detail: `${v.count} viewers reported an issue (${v.terms.join(", ")}) — e.g. ${v.samples[0]}`,
    });
  }

  const acks = findStreamerAcknowledgements(segments.filter(s => s.start >= trueStartSec));
  for (const a of acks) {
    signals.push({
      atSec: a.start, durationSec: 0, type: "streamer_acknowledged",
      detail: `You said: "${a.quote}"`,
    });
  }

  // A lone streamer phrase like "hold on" is not an incident by itself
  const incidents = buildTechIncidents(signals)
    .filter(i => !(i.signalTypes.length === 1 && i.signalTypes[0] === "streamer_acknowledged"));

  const activeSecs = Math.max(1, duration - trueStartSec);
  const impactedSecs = incidents.reduce((a, i) => a + i.durationSec, 0);
  const impactPct = (impactedSecs / activeSecs) * 100;

  // Audio health, judged separately from discrete incidents
  const audioWarnings = [];
  if (loudness.integratedLufs !== null) {
    if (loudness.integratedLufs < -22) audioWarnings.push(`Overall loudness is ${loudness.integratedLufs} LUFS — well below the -14 LUFS streaming platforms normalise toward. Viewers are having to turn you up, and you sound quiet next to other channels.`);
    else if (loudness.integratedLufs > -9) audioWarnings.push(`Overall loudness is ${loudness.integratedLufs} LUFS — hotter than the -14 LUFS target. Platform normalisation will pull this down and it may sound compressed or harsh.`);
  }
  if (loudness.maxVolumeDb !== null && loudness.maxVolumeDb > -0.5) {
    audioWarnings.push(`Peaks are hitting ${loudness.maxVolumeDb} dB — that is clipping. Add a limiter around -3 dB in OBS to stop distortion on your loud reactions.`);
  }
  if (loudness.loudnessRange !== null && loudness.loudnessRange > 14) {
    audioWarnings.push(`Loudness range is ${loudness.loudnessRange} LU — a big gap between your quietest and loudest moments. Light compression would even out mic vs game audio.`);
  }

  const confirmed = incidents.filter(i => i.confidence === "confirmed");
  const grade = techGrade(impactPct);

  const coachingNote = incidents.length === 0 && audioWarnings.length === 0
    ? "No technical issues detected. Audio levels look healthy and neither chat nor you flagged anything."
    : confirmed.length > 0
      ? `${confirmed.length} confirmed technical incident(s), the first at ${confirmed[0].at}. Viewers noticed these — technical faults are the fastest way to lose a session, so check your OBS logs around these timestamps.`
      : incidents.length > 0
        ? `${incidents.length} possible technical issue(s) detected but not corroborated by chat. Worth spot-checking the VOD at these timestamps before assuming they were real.`
        : "No discrete incidents, but your audio setup has room to improve — see the warnings below.";

  return {
    grade,
    incidentCount: incidents.length,
    confirmedCount: confirmed.length,
    impactedSeconds: Math.round(impactedSecs),
    impactPercentage: impactPct.toFixed(1),
    incidents: incidents.slice(0, 12),
    audioHealth: {
      integratedLufs: loudness.integratedLufs,
      loudnessRange: loudness.loudnessRange,
      truePeakDb: loudness.truePeakDb,
      maxVolumeDb: loudness.maxVolumeDb,
      meanVolumeDb: loudness.meanVolumeDb,
      targetLufs: -14,
      warnings: audioWarnings,
    },
    videoScanned: !!videoGlitches.scanned,
    coachingNote,
  };
}

function buildTechBrief(ta) {
  if (!ta) return "TECHNICAL: not analysed.";
  const inc = (ta.incidents || []).map(i =>
    `${i.at} (${i.confidence}, ${i.durationSec}s${i.viewerReported ? ", viewers complained" : ""}): ${i.details[0] || i.signalTypes.join("+")}`
  ).join("; ") || "none detected";
  return [
    `TECHNICAL HEALTH (grade ${ta.grade}): ${ta.incidentCount} incident(s), ${ta.confirmedCount} confirmed by multiple signals, affecting ${ta.impactPercentage}% of the stream.`,
    `INCIDENTS: ${inc}.`,
    ta.audioHealth?.warnings?.length ? `AUDIO SETUP: ${ta.audioHealth.warnings.join(" ")}` : `AUDIO SETUP: levels look healthy (${ta.audioHealth?.integratedLufs ?? "n/a"} LUFS).`,
    ta.videoScanned ? "" : "Video freeze/black-frame scanning was not run for this VOD, so purely visual faults may be missing.",
  ].filter(Boolean).join("\n");
}
app.post("/coach-vod", upload.single("vod"), async (req, res) => {
  const sessionId = uuidv4().slice(0, 8);
  const url = req.body?.url;
  const streamerName = req.body?.streamerName || "Streamer";
  const manualCategory = (req.body?.category || "").trim() || null;
  const deepVideoScan = String(req.body?.deepVideoScan || "") === "true";
  let vodPath = req.file?.path || null;
  const tempFiles = [];

  console.log(`[${sessionId}] Stream Coach started for: ${streamerName}`);

  try {
    // ── Step 1: Get VOD ──────────────────────────────────────────────────────
    if (url && !vodPath) {
      vodPath = path.join(os.tmpdir(), `coach-vod-${sessionId}.mp4`);
      tempFiles.push(vodPath);
      console.log(`[${sessionId}] Downloading VOD...`);
      await execAsync(`yt-dlp -f "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${vodPath}" "${url}"`);
      if (!fs.existsSync(vodPath)) throw new Error("VOD download failed.");
    } else if (vodPath) {
      tempFiles.push(vodPath);
    }
    if (!vodPath) throw new Error("No VOD file or URL provided.");

    const duration = await getVideoDuration(vodPath);
    console.log(`[${sessionId}] Duration: ${duration.toFixed(1)}s`);

    // ── Step 2: Extract full audio ───────────────────────────────────────────
    const fullAudioPath = path.join(os.tmpdir(), `coach-audio-${sessionId}.wav`);
    tempFiles.push(fullAudioPath);
    console.log(`[${sessionId}] Extracting audio...`);
    await extractAudio(vodPath, fullAudioPath);

    // ── Step 3: Transcribe in chunks + silence detection in parallel ─────────
    console.log(`[${sessionId}] Transcribing + silence detection...`);
    const chunkSecs = 600;
    const numChunks = Math.ceil(duration / chunkSecs);
    const allSegments = [];

    for (let ci = 0; ci < numChunks; ci++) {
      const chunkStart = ci * chunkSecs;
      const chunkPath = path.join(os.tmpdir(), `coach-chunk-${sessionId}-${ci}.wav`);
      tempFiles.push(chunkPath);
      try {
        await execAsync(`ffmpeg -y -ss ${chunkStart} -i "${fullAudioPath}" -t ${chunkSecs} "${chunkPath}"`);
        const t = await transcribeAudio(chunkPath);
        const offsetSegs = (t.segments || []).map(s => ({ ...s, start: s.start + chunkStart, end: s.end + chunkStart }));
        allSegments.push(...offsetSegs);
        console.log(`[${sessionId}] Chunk ${ci+1}/${numChunks} transcribed (${offsetSegs.length} segs)`);
      } catch(e) { console.warn(`[${sessionId}] Chunk ${ci} failed:`, e.message.slice(0,80)); }
    }

    const silencePoints = await getSilencePoints(fullAudioPath);
    // Add duration to each silence point
    const silencesWithDuration = silencePoints.map(s => ({ ...s, duration: s.end - s.start }));
    console.log(`[${sessionId}] ${allSegments.length} segments, ${silencePoints.length} silence points`);

    // ── Step 4: Find true start ──────────────────────────────────────────────
    const trueStart = findTrueStart(allSegments);
    console.log(`[${sessionId}] True start: ${trueStart.trueStartLabel} (pre-stream: ${trueStart.preStreamLabel})`);

    // ── Step 5: Pure JS analysis (fast, no API) ──────────────────────────────
    // ── Step 4.5: Content context (title / category / chapters) ─────────────
    const vodContext = await fetchVodContext(url, sessionId);
    const dominant = dominantCategory(vodContext.chapters, duration);
    if (dominant) vodContext.category = dominant;
    if (manualCategory) { vodContext.category = manualCategory; vodContext.source = "manual"; }
    const categoryProfile = resolveCategoryProfile(vodContext.category, vodContext.title);
    const contentContext = {
      title: vodContext.title,
      category: vodContext.category,
      channel: vodContext.channel,
      chapters: vodContext.chapters,
      source: vodContext.source,
      profileId: categoryProfile.id,
      profileLabel: categoryProfile.label,
      deadAirThresholdSecs: categoryProfile.deadAirMinSecs,
    };
    const coachContextLine = buildCoachContextLine(contentContext, categoryProfile);
    console.log(`[${sessionId}] Content: "${vodContext.title || "unknown"}" | Category: ${vodContext.category || "unknown"} | Profile: ${categoryProfile.label} (dead air threshold ${categoryProfile.deadAirMinSecs}s)`);

    const deadAirAnalysis = analyzeDeadAir(silencesWithDuration, trueStart.trueStartSec, duration, categoryProfile);
    const fillerAnalysis = analyzeFillerWords(allSegments, trueStart.trueStartSec, categoryProfile);

    // ── Step 5.5: Twitch chat replay correlation ────────────────────────────
    let chatAnalysis = { available: false, reason: "No Twitch VOD URL supplied." };
    let chatBrief = buildChatBrief(null);
    const twitchVodId = extractTwitchVodId(url);
    if (twitchVodId) {
      const chatPath = path.join(os.tmpdir(), `coach-chat-${sessionId}.json`);
      tempFiles.push(chatPath);
      const gotChat = await downloadTwitchChat(twitchVodId, chatPath, sessionId);
      if (gotChat) {
        try {
          const chatMessages = parseChatJson(chatPath);
          console.log(`[${sessionId}] Chat replay: ${chatMessages.length} messages parsed`);
          if (chatMessages.length > 0) {
            chatAnalysis = analyzeChatEngagement(chatMessages, duration, trueStart.trueStartSec, silencesWithDuration, allSegments);
            Object.defineProperty(chatAnalysis, "__rawMessages", { value: chatMessages, enumerable: false });
            chatBrief = buildChatBrief(chatAnalysis);
            console.log(`[${sessionId}] Chat analysis: grade ${chatAnalysis.grade}, ${chatAnalysis.spikes.length} spikes, ${chatAnalysis.missedMoments.length} missed`);
          } else {
            chatAnalysis = { available: false, reason: "Chat replay was empty for this VOD." };
          }
        } catch (e) {
          console.warn(`[${sessionId}] Chat parse failed:`, String(e.message).slice(0, 150));
          chatAnalysis = { available: false, reason: "Chat replay could not be parsed." };
        }
      } else {
        chatAnalysis = { available: false, reason: "Chat replay unavailable (sub-only chat, disabled replay, expired VOD, or TwitchDownloaderCLI not installed)." };
      }
    }

    // Basic engagement stats from transcript
    const postStartSegs = allSegments.filter(s => s.start >= trueStart.trueStartSec);
    const fullTranscript = postStartSegs.map(s => s.text).join(" ");
    const totalWords = fullTranscript.split(/\s+/).filter(Boolean).length;
    const wordsPerMinute = Math.round(totalWords / ((duration - trueStart.trueStartSec) / 60));
    const introTranscript = postStartSegs.filter(s => s.start <= trueStart.trueStartSec + 300).map(s => s.text).join(" ");

    // ── Step 5.7: Technical issue audit ─────────────────────────────────────
    console.log(`[${sessionId}] Running technical audit...`);
    const loudness = await getLoudnessStats(fullAudioPath);
    const dropouts = await getAudioDropouts(fullAudioPath);
    const videoGlitches = deepVideoScan
      ? await detectVideoGlitches(vodPath, sessionId)
      : { scanned: false, freezes: [], blackScreens: [] };
    const technicalAudit = analyzeTechnicalIssues({
      loudness,
      dropouts,
      videoGlitches,
      chatMessages: chatAnalysis?.available ? (chatAnalysis.__rawMessages || []) : [],
      segments: allSegments,
      duration,
      trueStartSec: trueStart.trueStartSec,
    });
    const techBrief = buildTechBrief(technicalAudit);
    console.log(`[${sessionId}] Technical audit: grade ${technicalAudit.grade}, ${technicalAudit.incidentCount} incidents (${technicalAudit.confirmedCount} confirmed)`);

    // ── Step 6: LLM analysis (sequential, rate-limit safe) ───────────────────
    console.log(`[${sessionId}] Running LLM analysis...`);
    await new Promise(r => setTimeout(r, 500));

    const engagementResult = await runCoachLLM(`You are an expert Twitch and YouTube streaming coach.

${coachContextLine}

TRANSCRIPT (post-intro):
${fullTranscript.slice(0, 2500)}

Count and evaluate:
1. QUESTIONS TO CHAT: Direct questions asked to viewers
2. CALLS TO ACTION: Requests for follows, subs, likes, raids, chat participation
3. CHAT ACKNOWLEDGMENTS: Times streamer read/responded to chat by name or comment
4. PERSONAL STORIES: Moments of genuine personal connection or vulnerability

Return ONLY valid JSON:
{
  "questions_to_chat": { "count": number, "rate_per_hour": number, "examples": ["quote1","quote2"], "grade": "letter", "feedback": "coaching note" },
  "calls_to_action": { "count": number, "types_used": ["follow","chat"], "grade": "letter", "feedback": "coaching note" },
  "chat_acknowledgments": { "count": number, "grade": "letter", "feedback": "coaching note" },
  "personal_connection_moments": { "count": number, "grade": "letter", "feedback": "coaching note" },
  "overall_engagement_grade": "letter",
  "top_coaching_tip": "single most impactful improvement"
}`, sessionId, "engagement");

    await new Promise(r => setTimeout(r, 800));

    const introResult = await runCoachLLM(`You are an expert streaming coach. Viewers decide in 30-90 seconds if they stay.

${coachContextLine}

FIRST 5 MINUTES of stream (after Starting Soon screen):
${introTranscript.slice(0, 1500)}

Evaluate the intro:
1. HOOK: Did they open compellingly or with a weak greeting?
2. VALUE PROPOSITION: Did they tell viewers what today's stream is about?
3. ENERGY: High energy and welcoming, or flat and distracted?
4. SELF-INTRODUCTION: Did they introduce themselves for new viewers?
5. ACTIVITY SETUP: Did they explain what they're doing and why?

Return ONLY valid JSON:
{
  "hook_grade": "letter",
  "hook_text": "their actual opening words",
  "hook_feedback": "specific coaching note",
  "value_proposition_present": true/false,
  "value_proposition_feedback": "coaching note",
  "energy_grade": "letter",
  "energy_feedback": "coaching note",
  "self_introduced": true/false,
  "activity_explained": true/false,
  "overall_intro_grade": "letter",
  "rewrite_suggestion": "a better opening line based on what they actually said",
  "top_fix": "single most important intro improvement"
}`, sessionId, "intro");

    await new Promise(r => setTimeout(r, 800));

    const vocalResult = await runCoachLLM(`You are a speech coach analyzing a live streamer's vocal patterns.

${coachContextLine}

TRANSCRIPT SAMPLE:
${fullTranscript.slice(0, 2000)}

Identify:
1. REPETITIVE PHRASES used so often they become invisible
2. TRAILING OFF: sentences that fade out incomplete
3. SELF-INTERRUPTION: sentences started and abandoned
4. PACE: rushing or dragging sections
5. SENTENCE VARIETY: varied lengths or monotonous rhythm

Return ONLY valid JSON:
{
  "repetitive_phrases": [{"phrase": "string", "approximate_count": number}],
  "trailing_off_instances": number,
  "self_interruptions": number,
  "pace_grade": "letter",
  "variety_grade": "letter",
  "overall_vocal_grade": "letter",
  "strongest_habit": "most notable pattern positive or negative",
  "top_exercise": "one specific practice to do before next stream"
}`, sessionId, "vocal");

    // ── Step 7: Build action plan ────────────────────────────────────────────
    const grades = [
      deadAirAnalysis.grade,
      fillerAnalysis.grade,
      engagementResult?.overall_engagement_grade || "C",
      introResult?.overall_intro_grade || "C",
      vocalResult?.overall_vocal_grade || "C",
    ];
    const overallGrade = computeOverallGrade(grades);

    const actionPlan = [];
    if (introResult?.overall_intro_grade === "D" || introResult?.overall_intro_grade === "F") {
      actionPlan.push(`🔴 CRITICAL: ${introResult.top_fix}`);
    }
    if (deadAirAnalysis.totalInstances > 5) {
      actionPlan.push(`🔴 CRITICAL: ${deadAirAnalysis.coachingNote}`);
    }
    if (engagementResult?.calls_to_action?.count < 3) {
      actionPlan.push(`🟡 HIGH: Add a soft CTA every 30 minutes — you're doing the engagement work but not converting it.`);
    }
    if (parseFloat(fillerAnalysis.fillerRate) > 5) {
      actionPlan.push(`🟡 HIGH: ${fillerAnalysis.coachingNote}`);
    }
    if (engagementResult?.top_coaching_tip) {
      actionPlan.push(`🟢 MEDIUM: ${engagementResult.top_coaching_tip}`);
    }
    if (vocalResult?.top_exercise) {
      actionPlan.push(`🟢 MEDIUM: ${vocalResult.top_exercise}`);
    }
    if (chatAnalysis?.available && chatAnalysis.missedMoments?.length > 0) {
      const first = chatAnalysis.missedMoments[0];
      actionPlan.push(`🔴 CRITICAL: Chat spiked at ${first.at} (${first.messages} messages) and you didn't react within 30s. You missed ${chatAnalysis.missedMoments.length} spike(s) — reacting to these is the cheapest retention win you have.`);
    }
    if (chatAnalysis?.available && chatAnalysis.hotDeadAirCount > 0) {
      actionPlan.push(`🟡 HIGH: ${chatAnalysis.hotDeadAirCount} of your dead-air gaps happened while chat was actively talking. When you go quiet, read chat out loud — they already handed you the content.`);
    }
    if (technicalAudit?.confirmedCount > 0) {
      const firstConfirmed = technicalAudit.incidents.find(i => i.confidence === "confirmed");
      actionPlan.push(`🔴 CRITICAL: Confirmed technical fault at ${firstConfirmed.at} — ${firstConfirmed.details[0]}. Check your OBS log for this timestamp before your next stream.`);
    }
    if (technicalAudit?.audioHealth?.warnings?.length > 0) {
      actionPlan.push(`🟡 HIGH: ${technicalAudit.audioHealth.warnings[0]}`);
    }
    if (wordsPerMinute < 100) {
      actionPlan.push(`🟢 MEDIUM: Speaking pace is low (${wordsPerMinute} WPM). Try to maintain 120-150 WPM for short-form clips.`);
    }

    // ── Step 7.5: Head Coach's Verdict (narrative synthesis) ────────────────
    console.log(`[${sessionId}] Generating Head Coach's Verdict...`);
    await new Promise(r => setTimeout(r, 800));

    const deadAirMoments = (deadAirAnalysis.worstMoments || [])
      .map(m => `${m.duration} of silence at ${m.at}`).join("; ") || "none significant";
    const fillerSampleMoments = (fillerAnalysis.worstInstances || [])
      .slice(0, 5).map(i => `"${i.word}" at ${i.at}`).join("; ") || "none significant";
    const topFillerList = Object.entries(fillerAnalysis.topOffenders || {})
      .map(([w, c]) => `"${w}" x${c}`).join(", ") || "none";
    const repetitivePhrases = (vocalResult?.repetitive_phrases || [])
      .map(p => `"${p.phrase}" (~${p.approximate_count}x)`).join(", ") || "none";

    const verdictBrief = [
      `STREAMER: ${streamerName}`,
      techBrief,
      coachContextLine,
      `STREAM LENGTH (active): ${formatTimestamp(Math.round(duration - trueStart.trueStartSec))}`,
      `OVERALL GRADE: ${overallGrade}`,
      `SPEAKING PACE: ${wordsPerMinute} WPM`,
      ``,
      `INTRO (grade ${introResult?.overall_intro_grade || "N/A"}): opened with "${(trueStart.firstWords || "").slice(0, 120)}". Hook feedback: ${introResult?.hook_feedback || "N/A"}. Energy grade: ${introResult?.energy_grade || "N/A"}. Value prop present: ${introResult?.value_proposition_present}. Self-introduced: ${introResult?.self_introduced}.`,
      ``,
      `DEAD AIR (grade ${deadAirAnalysis.grade}): ${deadAirAnalysis.totalInstances} gaps over 15s, ${deadAirAnalysis.percentage}% of active stream. Worst moments: ${deadAirMoments}.`,
      ``,
      `FILLER WORDS (grade ${fillerAnalysis.grade}): rate ${fillerAnalysis.fillerRate}%. Top offenders: ${topFillerList}. Sample moments: ${fillerSampleMoments}.`,
      ``,
      `ENGAGEMENT (grade ${engagementResult?.overall_engagement_grade || "N/A"}): ${engagementResult?.questions_to_chat?.count ?? "?"} questions to chat, ${engagementResult?.calls_to_action?.count ?? "?"} CTAs, ${engagementResult?.chat_acknowledgments?.count ?? "?"} chat acknowledgments. Top engagement tip: ${engagementResult?.top_coaching_tip || "N/A"}.`,
      ``,
      `VOCAL HABITS (grade ${vocalResult?.overall_vocal_grade || "N/A"}): pace ${vocalResult?.pace_grade || "N/A"}, variety ${vocalResult?.variety_grade || "N/A"}. Strongest habit: ${vocalResult?.strongest_habit || "N/A"}. Repetitive phrases: ${repetitivePhrases}.`,
      ``,
      chatBrief,
    ].join("\n");

    await new Promise(r => setTimeout(r, 800));
    const fullReview = await runCoachLLM(`You are ${streamerName}'s personal head streaming coach delivering the final post-stream verdict. You have already graded every category individually. Now write the human summary that ties everything together into something that actually makes them a better streamer.

Speak directly to them using "you", like a real coach who watched the entire stream start to finish. Warm but honest — do not flatter and do not pile on. Reference SPECIFIC timestamps and moments from the data below so they can go back and rewatch. NEVER invent a timestamp; only use timestamps that appear in the data. Do not use bullet points or lists inside the verdict paragraphs.

STREAM DATA:
${verdictBrief}

Return ONLY valid JSON (no markdown):
{
  "verdict": "3 to 4 flowing paragraphs. Open with the arc of the stream (how it started, how it developed, where it peaked or dipped). Call out the 1-2 habits costing the most retention, each tied to a specific timestamp from the data. Genuinely acknowledge what worked. Close with the single most important change for next stream.",
  "did_well": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "work_on_next": [
    { "focus": "the specific fix to make next stream", "where": "a real timestamp/moment from the data, or 'throughout' if it is a global habit", "why": "one sentence on the payoff" },
    { "focus": "second fix", "where": "timestamp or 'throughout'", "why": "payoff" },
    { "focus": "third fix", "where": "timestamp or 'throughout'", "why": "payoff" }
  ],
  "one_liner": "a single punchy coaching sentence they can screenshot and remember"
}`, sessionId, "verdict", 1200);

    console.log(`[${sessionId}] Coach report complete. Overall grade: ${overallGrade}`);

    res.json({
      sessionId,
      streamerName,
      meta: {
        vodDuration: formatTimestamp(Math.round(duration)),
        trueStartAt: trueStart.trueStartLabel,
        preStreamDuration: trueStart.preStreamLabel,
        streamerActiveDuration: formatTimestamp(Math.round(duration - trueStart.trueStartSec)),
        totalWords,
        wordsPerMinute,
      },
      overallGrade,
      overallSummary: engagementResult?.top_coaching_tip || "Review your report card for detailed feedback on each category.",
      fullReview,
      chatAnalysis,
      contentContext,
      technicalAudit,
      reportCards: {
        introAudit: {
          ...introResult,
          trueStartDetectedAt: trueStart.trueStartLabel,
          firstWords: trueStart.firstWords,
        },
        deadAir: deadAirAnalysis,
        fillerWords: fillerAnalysis,
        engagement: engagementResult,
        vocalHabits: vocalResult,
      },
      actionPlan,
    });

  } catch(err) {
    console.error(`[${sessionId}] Coach error:`, err.message);
    res.status(500).json({ error: err.message, sessionId });
  } finally {
    cleanup(...tempFiles);
    console.log(`[${sessionId}] Cleanup done`);
  }
});


// ─── Content Version History ─────────────────────────────────────────────────
// Stores analysis snapshots so a re-uploaded cut can be compared to its predecessor.
const HISTORY_DIR = process.env.VIRAL_HISTORY_DIR || "D:\\ViralAudit history";

if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
  console.log(`[history] Created history dir: ${HISTORY_DIR}`);
}

function safeContentId(id) {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(String(id || "")) ? String(id) : null;
}

function historyPath(contentId) {
  return path.join(HISTORY_DIR, `${contentId}.json`);
}

function readContentItem(contentId) {
  const p = historyPath(contentId);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

// Snapshots are text only - base64 frames would balloon these files
function trimVersionPayload(v) {
  return {
    versionId: uuidv4().slice(0, 8),
    savedAt: new Date().toISOString(),
    label: String(v.label || "").slice(0, 200),
    filename: String(v.filename || "").slice(0, 200),
    duration: Number(v.duration) || 0,
    platform: v.platform || null,
    niche: v.niche || null,
    isTikTokShop: !!v.isTikTokShop,
    isLiveClip: !!v.isLiveClip,
    score: Number(v.score) || 0,
    hookScore: Number(v.hookScore) || 0,
    wordCount: Number(v.wordCount) || 0,
    transcript: String(v.transcript || "").slice(0, 4000),
    flags: Array.isArray(v.flags) ? v.flags.slice(0, 30).map(f => ({ severity: f.severity, msg: String(f.msg || "").slice(0, 300) })) : [],
    positives: Array.isArray(v.positives) ? v.positives.slice(0, 30).map(p => String(p).slice(0, 300)) : [],
    holisticAnalysis: String(v.holisticAnalysis || "").slice(0, 6000),
    frameNotes: Array.isArray(v.frameNotes) ? v.frameNotes.slice(0, 10).map(f => ({ label: f.label, analysis: String(f.analysis || "").slice(0, 500) })) : [],
  };
}

// Cheap bag-of-words overlap, used only to pre-select a likely match in the UI
function transcriptSimilarity(a, b) {
  const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 3);
  const A = new Set(norm(a).slice(0, 400));
  const B = new Set(norm(b).slice(0, 400));
  if (A.size === 0 || B.size === 0) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / Math.min(A.size, B.size);
}

app.get("/content/list", (req, res) => {
  try {
    const files = fs.readdirSync(HISTORY_DIR).filter(f => f.endsWith(".json"));
    const items = files.map(f => {
      try {
        const item = JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, f), "utf8"));
        const latest = item.versions?.[item.versions.length - 1];
        return {
          contentId: item.contentId,
          title: item.title,
          versionCount: item.versions?.length || 0,
          lastSaved: latest?.savedAt || item.createdAt,
          latestScore: latest?.score ?? null,
          platform: latest?.platform || null,
          latestTranscript: String(latest?.transcript || "").slice(0, 1200),
        };
      } catch { return null; }
    }).filter(Boolean).sort((a, b) => String(b.lastSaved).localeCompare(String(a.lastSaved)));
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Suggests which existing item a new transcript most likely belongs to
app.post("/content/suggest-match", express.json({ limit: "2mb" }), (req, res) => {
  try {
    const transcript = String(req.body?.transcript || "");
    if (!transcript.trim()) return res.json({ suggestion: null });
    const files = fs.readdirSync(HISTORY_DIR).filter(f => f.endsWith(".json"));
    let best = null;
    for (const f of files) {
      try {
        const item = JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, f), "utf8"));
        const latest = item.versions?.[item.versions.length - 1];
        if (!latest) continue;
        const score = transcriptSimilarity(transcript, latest.transcript);
        if (!best || score > best.similarity) {
          best = { contentId: item.contentId, title: item.title, versionCount: item.versions.length, similarity: score };
        }
      } catch {}
    }
    res.json({ suggestion: best && best.similarity >= 0.35 ? best : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/content/item/:contentId", (req, res) => {
  const id = safeContentId(req.params.contentId);
  if (!id) return res.status(400).json({ error: "Invalid content id." });
  const item = readContentItem(id);
  if (!item) return res.status(404).json({ error: "Content item not found." });
  res.json(item);
});

app.post("/content/save-version", express.json({ limit: "5mb" }), (req, res) => {
  try {
    const { contentId, title, version } = req.body || {};
    if (!version) return res.status(400).json({ error: "No version payload supplied." });

    let item = null;
    let id = safeContentId(contentId);

    if (id) {
      item = readContentItem(id);
      if (!item) return res.status(404).json({ error: "Content item not found - it may have been deleted." });
    } else {
      id = uuidv4().slice(0, 12);
      item = { contentId: id, title: String(title || "Untitled content").slice(0, 200), createdAt: new Date().toISOString(), versions: [] };
    }

    const previousVersion = item.versions.length > 0 ? item.versions[item.versions.length - 1] : null;
    const snapshot = trimVersionPayload(version);
    snapshot.versionNumber = item.versions.length + 1;
    item.versions.push(snapshot);
    if (item.versions.length > 25) item.versions = item.versions.slice(-25);

    fs.writeFileSync(historyPath(id), JSON.stringify(item, null, 2), "utf8");
    console.log(`[history] Saved "${item.title}" v${snapshot.versionNumber} (score ${snapshot.score})`);

    res.json({ contentId: id, title: item.title, versionNumber: snapshot.versionNumber, currentVersion: snapshot, previousVersion });
  } catch (e) {
    console.error("[history] Save failed:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: `File too large. Maximum size is ${MAX_MB}MB.` });
    }
  }
  console.error("[server error]", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ ViralAudit Server running on port ${PORT}`);
  console.log(`   Max upload size : ${MAX_MB}MB`);
  console.log(`   CORS origin     : ${CORS_ORIGIN}`);
  console.log(`   Temp dir        : ${os.tmpdir()}`);
  console.log(`   Groq key        : ${process.env.GROQ_API_KEY ? "✓ set" : "✗ MISSING"}\n`);
});