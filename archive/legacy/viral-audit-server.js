/**
 * ViralAudit AI — Backend Processing Server
 * PM2 service on port 3015
 *
 * Responsibilities:
 *   - Accept video uploads (multipart/form-data)
 *   - Extract audio via ffmpeg → transcribe via OpenAI Whisper
 *   - Extract keyframes at 0s, 3s, 10s, 30s, 60s via ffmpeg
 *   - Return transcript + base64 JPEG frames to frontend
 *   - Clean up all temp files after response
 *
 * Setup:
 *   npm install express multer cors openai uuid
 *   pm2 start viral-audit-server.js --name viral-audit-server
 *
 * Required env vars (add to your .env or pm2 ecosystem.config.js):
 *   OPENAI_API_KEY=sk-...          (for Whisper transcription)
 *   VIRAL_AUDIT_PORT=3015          (optional, defaults to 3015)
 *   VIRAL_AUDIT_MAX_MB=500         (optional, defaults to 500MB)
 *   VIRAL_AUDIT_CORS_ORIGIN=*      (optional, restrict to your frontend origin)
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
const OpenAI = require("openai");

const execAsync = promisify(exec);
const app = express();
const PORT = parseInt(process.env.VIRAL_AUDIT_PORT || "3015");
const MAX_MB = parseInt(process.env.VIRAL_AUDIT_MAX_MB || "500");
const CORS_ORIGIN = process.env.VIRAL_AUDIT_CORS_ORIGIN || "*";

// ─── OpenAI Client ────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ─── Multer — temp disk storage ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".mp4";
    cb(null, `viral-audit-${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(mp4|mov|avi|mkv|webm|m4v|flv|wmv)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported video format. Accepted: mp4, mov, avi, mkv, webm, m4v, flv, wmv"));
    }
  },
});

// ─── Utility: cleanup files ───────────────────────────────────────────────────
function cleanup(...filePaths) {
  for (const fp of filePaths) {
    try {
      if (fp && fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch (e) {
      console.warn(`[cleanup] Could not delete ${fp}:`, e.message);
    }
  }
}

// ─── Utility: get video duration in seconds ───────────────────────────────────
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

// ─── Utility: extract audio → WAV for Whisper ─────────────────────────────────
async function extractAudio(videoPath, outPath) {
  // 16kHz mono WAV — optimal for Whisper
  await execAsync(
    `ffmpeg -y -i "${videoPath}" -vn -ar 16000 -ac 1 -f wav "${outPath}"`
  );
}

// ─── Utility: extract keyframes at specific timestamps ────────────────────────
async function extractKeyframes(videoPath, duration, outDir, sessionId) {
  // Choose timestamps based on video length
  const candidates = [0, 1, 3, 5, 10, 20, 30, 45, 60, 90, 120];
  const timestamps = candidates.filter(t => t < duration);

  // Always include the very last frame bucket
  if (duration > 0 && timestamps[timestamps.length - 1] < duration - 2) {
    timestamps.push(Math.floor(duration - 1));
  }

  // Cap at 8 frames to keep response size sane
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
          path: framePath, // tracked for cleanup
        });
      }
    } catch (e) {
      console.warn(`[frames] Could not extract frame at ${ts}s:`, e.message);
    }
  }

  return frames;
}

function formatTimestamp(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Utility: transcribe audio with Whisper ───────────────────────────────────
async function transcribeAudio(audioPath) {
  const audioStream = fs.createReadStream(audioPath);
  const response = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: audioStream,
    response_format: "verbose_json", // gives us word-level timestamps if needed
    language: "en",
  });
  return {
    text: response.text || "",
    duration: response.duration || 0,
    language: response.language || "en",
    // segments available if verbose_json
    segments: (response.segments || []).map(s => ({
      start: s.start,
      end: s.end,
      text: s.text,
    })),
  };
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "viral-audit-server", port: PORT });
});

// ─── Main endpoint: POST /analyze ────────────────────────────────────────────
app.post("/analyze", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video file uploaded." });
  }

  const sessionId = uuidv4().slice(0, 8);
  const videoPath = req.file.path;
  const audioPath = path.join(os.tmpdir(), `viral-audit-audio-${sessionId}.wav`);
  const framePaths = []; // collected during extraction for cleanup

  console.log(`[${sessionId}] Starting analysis: ${req.file.originalname} (${(req.file.size / 1e6).toFixed(1)} MB)`);

  try {
    // ── Step 1: Get video metadata ──────────────────────────────────────────
    const duration = await getVideoDuration(videoPath);
    console.log(`[${sessionId}] Duration: ${duration.toFixed(1)}s`);

    // ── Step 2: Extract audio ───────────────────────────────────────────────
    console.log(`[${sessionId}] Extracting audio...`);
    await extractAudio(videoPath, audioPath);

    // ── Step 3: Transcribe ──────────────────────────────────────────────────
    console.log(`[${sessionId}] Transcribing with Whisper...`);
    const transcription = await transcribeAudio(audioPath);
    console.log(`[${sessionId}] Transcript: ${transcription.text.slice(0, 80)}...`);

    // ── Step 4: Extract keyframes ───────────────────────────────────────────
    console.log(`[${sessionId}] Extracting keyframes...`);
    const frames = await extractKeyframes(videoPath, duration, os.tmpdir(), sessionId);
    frames.forEach(f => framePaths.push(f.path));
    console.log(`[${sessionId}] Extracted ${frames.length} frames`);

    // ── Step 5: Build response ──────────────────────────────────────────────
    const responsePayload = {
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
        // path not sent to client
      })),
    };

    res.json(responsePayload);
    console.log(`[${sessionId}] Response sent successfully`);

  } catch (err) {
    console.error(`[${sessionId}] Error during analysis:`, err);

    // Provide helpful error messages
    let message = err.message || "Unknown error during video processing.";
    if (message.includes("ffmpeg")) message = "ffmpeg error: " + message;
    if (message.includes("OpenAI") || message.includes("whisper")) message = "Transcription error: " + message;

    res.status(500).json({ error: message, sessionId });

  } finally {
    // ── Cleanup ALL temp files ──────────────────────────────────────────────
    cleanup(videoPath, audioPath, ...framePaths);
    console.log(`[${sessionId}] Temp files cleaned up`);
  }
});

// ─── Error handler ────────────────────────────────────────────────────────────
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
  console.log(`   OpenAI key      : ${process.env.OPENAI_API_KEY ? "✓ set" : "✗ MISSING"}\n`);
});
