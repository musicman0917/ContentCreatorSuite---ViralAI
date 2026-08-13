# restore-server.ps1
$outFile = "D:\Coding\ViralAI\viral-audit-server.js"
$sb = [System.Text.StringBuilder]::new(30000)
[void]$sb.Append('/**
')
[void]$sb.Append(' * ViralAudit AI — Backend Processing Server
')
[void]$sb.Append(' * PM2 service on port 3015
')
[void]$sb.Append(' *
')
[void]$sb.Append(' * Responsibilities:
')
[void]$sb.Append(' *   - Accept video uploads (multipart/form-data)
')
[void]$sb.Append(' *   - Extract audio via ffmpeg → transcribe via OpenAI Whisper
')
[void]$sb.Append(' *   - Extract keyframes at 0s, 3s, 10s, 30s, 60s via ffmpeg
')
[void]$sb.Append(' *   - Return transcript + base64 JPEG frames to frontend
')
[void]$sb.Append(' *   - Clean up all temp files after response
')
[void]$sb.Append(' *
')
[void]$sb.Append(' * Setup:
')
[void]$sb.Append(' *   npm install express multer cors openai uuid
')
[void]$sb.Append(' *   pm2 start viral-audit-server.js --name viral-audit-server
')
[void]$sb.Append(' *
')
[void]$sb.Append(' * Required env vars (add to your .env or pm2 ecosystem.config.js):
')
[void]$sb.Append(' *   OPENAI_API_KEY=sk-...          (for Whisper transcription)
')
[void]$sb.Append(' *   VIRAL_AUDIT_PORT=3015          (optional, defaults to 3015)
')
[void]$sb.Append(' *   VIRAL_AUDIT_MAX_MB=500         (optional, defaults to 500MB)
')
[void]$sb.Append(' *   VIRAL_AUDIT_CORS_ORIGIN=*      (optional, restrict to your frontend origin)
')
[void]$sb.Append(' */
')
[void]$sb.Append('
')
[void]$sb.Append('require("dotenv").config();
')
[void]$sb.Append('
')
[void]$sb.Append('const express = require("express");
')
[void]$sb.Append('const multer = require("multer");
')
[void]$sb.Append('const cors = require("cors");
')
[void]$sb.Append('const { exec } = require("child_process");
')
[void]$sb.Append('const { promisify } = require("util");
')
[void]$sb.Append('const fs = require("fs");
')
[void]$sb.Append('const path = require("path");
')
[void]$sb.Append('const os = require("os");
')
[void]$sb.Append('const { v4: uuidv4 } = require("uuid");
')
[void]$sb.Append('const OpenAI = require("openai");
')
[void]$sb.Append('
')
[void]$sb.Append('const execAsync = promisify(exec);
')
[void]$sb.Append('const app = express();
')
[void]$sb.Append('const PORT = parseInt(process.env.VIRAL_AUDIT_PORT || "3015");
')
[void]$sb.Append('const MAX_MB = parseInt(process.env.VIRAL_AUDIT_MAX_MB || "500");
')
[void]$sb.Append('const CORS_ORIGIN = process.env.VIRAL_AUDIT_CORS_ORIGIN || "*";
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── OpenAI Client ────────────────────────────────────────────────────────────
')
[void]$sb.Append('const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── CORS ────────────────────────────────────────────────────────────────────
')
[void]$sb.Append('app.use(cors({
')
[void]$sb.Append('  origin: CORS_ORIGIN,
')
[void]$sb.Append('  methods: ["GET", "POST", "OPTIONS"],
')
[void]$sb.Append('  allowedHeaders: ["Content-Type", "Authorization"],
')
[void]$sb.Append('}));
')
[void]$sb.Append('
')
[void]$sb.Append('app.use(express.json());
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── Multer — temp disk storage ───────────────────────────────────────────────
')
[void]$sb.Append('const storage = multer.diskStorage({
')
[void]$sb.Append('  destination: (req, file, cb) => cb(null, os.tmpdir()),
')
[void]$sb.Append('  filename: (req, file, cb) => {
')
[void]$sb.Append('    const ext = path.extname(file.originalname) || ".mp4";
')
[void]$sb.Append('    cb(null, `viral-audit-${uuidv4()}${ext}`);
')
[void]$sb.Append('  },
')
[void]$sb.Append('});
')
[void]$sb.Append('
')
[void]$sb.Append('const upload = multer({
')
[void]$sb.Append('  storage,
')
[void]$sb.Append('  limits: { fileSize: MAX_MB * 1024 * 1024 },
')
[void]$sb.Append('  fileFilter: (req, file, cb) => {
')
[void]$sb.Append('    const allowed = /\.(mp4|mov|avi|mkv|webm|m4v|flv|wmv)$/i;
')
[void]$sb.Append('    if (allowed.test(path.extname(file.originalname))) {
')
[void]$sb.Append('      cb(null, true);
')
[void]$sb.Append('    } else {
')
[void]$sb.Append('      cb(new Error("Unsupported video format. Accepted: mp4, mov, avi, mkv, webm, m4v, flv, wmv"));
')
[void]$sb.Append('    }
')
[void]$sb.Append('  },
')
[void]$sb.Append('});
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── Utility: cleanup files ───────────────────────────────────────────────────
')
[void]$sb.Append('function cleanup(...filePaths) {
')
[void]$sb.Append('  for (const fp of filePaths) {
')
[void]$sb.Append('    try {
')
[void]$sb.Append('      if (fp && fs.existsSync(fp)) fs.unlinkSync(fp);
')
[void]$sb.Append('    } catch (e) {
')
[void]$sb.Append('      console.warn(`[cleanup] Could not delete ${fp}:`, e.message);
')
[void]$sb.Append('    }
')
[void]$sb.Append('  }
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── Utility: get video duration in seconds ───────────────────────────────────
')
[void]$sb.Append('async function getVideoDuration(videoPath) {
')
[void]$sb.Append('  try {
')
[void]$sb.Append('    const { stdout } = await execAsync(
')
[void]$sb.Append('      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
')
[void]$sb.Append('    );
')
[void]$sb.Append('    return parseFloat(stdout.trim()) || 0;
')
[void]$sb.Append('  } catch {
')
[void]$sb.Append('    return 0;
')
[void]$sb.Append('  }
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── Utility: extract audio → WAV for Whisper ─────────────────────────────────
')
[void]$sb.Append('async function extractAudio(videoPath, outPath) {
')
[void]$sb.Append('  // 16kHz mono WAV — optimal for Whisper
')
[void]$sb.Append('  await execAsync(
')
[void]$sb.Append('    `ffmpeg -y -i "${videoPath}" -vn -ar 16000 -ac 1 -f wav "${outPath}"`
')
[void]$sb.Append('  );
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── Utility: extract keyframes at specific timestamps ────────────────────────
')
[void]$sb.Append('async function extractKeyframes(videoPath, duration, outDir, sessionId) {
')
[void]$sb.Append('  // Choose timestamps based on video length
')
[void]$sb.Append('  const candidates = [0, 1, 3, 5, 10, 20, 30, 45, 60, 90, 120];
')
[void]$sb.Append('  const timestamps = candidates.filter(t => t < duration);
')
[void]$sb.Append('
')
[void]$sb.Append('  // Always include the very last frame bucket
')
[void]$sb.Append('  if (duration > 0 && timestamps[timestamps.length - 1] < duration - 2) {
')
[void]$sb.Append('    timestamps.push(Math.floor(duration - 1));
')
[void]$sb.Append('  }
')
[void]$sb.Append('
')
[void]$sb.Append('  // Cap at 8 frames to keep response size sane
')
[void]$sb.Append('  const selected = timestamps.slice(0, 8);
')
[void]$sb.Append('  const frames = [];
')
[void]$sb.Append('
')
[void]$sb.Append('  for (const ts of selected) {
')
[void]$sb.Append('    const framePath = path.join(outDir, `${sessionId}-frame-${ts}s.jpg`);
')
[void]$sb.Append('    try {
')
[void]$sb.Append('      await execAsync(
')
[void]$sb.Append('        `ffmpeg -y -ss ${ts} -i "${videoPath}" -frames:v 1 -q:v 3 -vf "scale=960:-1" "${framePath}"`
')
[void]$sb.Append('      );
')
[void]$sb.Append('      if (fs.existsSync(framePath)) {
')
[void]$sb.Append('        const data = fs.readFileSync(framePath);
')
[void]$sb.Append('        frames.push({
')
[void]$sb.Append('          timestamp: ts,
')
[void]$sb.Append('          label: formatTimestamp(ts),
')
[void]$sb.Append('          base64: data.toString("base64"),
')
[void]$sb.Append('          path: framePath, // tracked for cleanup
')
[void]$sb.Append('        });
')
[void]$sb.Append('      }
')
[void]$sb.Append('    } catch (e) {
')
[void]$sb.Append('      console.warn(`[frames] Could not extract frame at ${ts}s:`, e.message);
')
[void]$sb.Append('    }
')
[void]$sb.Append('  }
')
[void]$sb.Append('
')
[void]$sb.Append('  return frames;
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('function formatTimestamp(sec) {
')
[void]$sb.Append('  const m = Math.floor(sec / 60);
')
[void]$sb.Append('  const s = sec % 60;
')
[void]$sb.Append('  return `${m}:${String(s).padStart(2, "0")}`;
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── Utility: transcribe audio with Whisper ───────────────────────────────────
')
[void]$sb.Append('async function transcribeAudio(audioPath) {
')
[void]$sb.Append('  const audioStream = fs.createReadStream(audioPath);
')
[void]$sb.Append('  const response = await openai.audio.transcriptions.create({
')
[void]$sb.Append('    model: "whisper-1",
')
[void]$sb.Append('    file: audioStream,
')
[void]$sb.Append('    response_format: "verbose_json", // gives us word-level timestamps if needed
')
[void]$sb.Append('    language: "en",
')
[void]$sb.Append('  });
')
[void]$sb.Append('  return {
')
[void]$sb.Append('    text: response.text || "",
')
[void]$sb.Append('    duration: response.duration || 0,
')
[void]$sb.Append('    language: response.language || "en",
')
[void]$sb.Append('    // segments available if verbose_json
')
[void]$sb.Append('    segments: (response.segments || []).map(s => ({
')
[void]$sb.Append('      start: s.start,
')
[void]$sb.Append('      end: s.end,
')
[void]$sb.Append('      text: s.text,
')
[void]$sb.Append('    })),
')
[void]$sb.Append('  };
')
[void]$sb.Append('}
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── Health check ─────────────────────────────────────────────────────────────
')
[void]$sb.Append('app.get("/health", (req, res) => {
')
[void]$sb.Append('  res.json({ status: "ok", service: "viral-audit-server", port: PORT });
')
[void]$sb.Append('});
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── Main endpoint: POST /analyze ────────────────────────────────────────────
')
[void]$sb.Append('app.post("/analyze", upload.single("video"), async (req, res) => {
')
[void]$sb.Append('  if (!req.file) {
')
[void]$sb.Append('    return res.status(400).json({ error: "No video file uploaded." });
')
[void]$sb.Append('  }
')
[void]$sb.Append('
')
[void]$sb.Append('  const sessionId = uuidv4().slice(0, 8);
')
[void]$sb.Append('  const videoPath = req.file.path;
')
[void]$sb.Append('  const audioPath = path.join(os.tmpdir(), `viral-audit-audio-${sessionId}.wav`);
')
[void]$sb.Append('  const framePaths = []; // collected during extraction for cleanup
')
[void]$sb.Append('
')
[void]$sb.Append('  console.log(`[${sessionId}] Starting analysis: ${req.file.originalname} (${(req.file.size / 1e6).toFixed(1)} MB)`);
')
[void]$sb.Append('
')
[void]$sb.Append('  try {
')
[void]$sb.Append('    // ── Step 1: Get video metadata ──────────────────────────────────────────
')
[void]$sb.Append('    const duration = await getVideoDuration(videoPath);
')
[void]$sb.Append('    console.log(`[${sessionId}] Duration: ${duration.toFixed(1)}s`);
')
[void]$sb.Append('
')
[void]$sb.Append('    // ── Step 2: Extract audio ───────────────────────────────────────────────
')
[void]$sb.Append('    console.log(`[${sessionId}] Extracting audio...`);
')
[void]$sb.Append('    await extractAudio(videoPath, audioPath);
')
[void]$sb.Append('
')
[void]$sb.Append('    // ── Step 3: Transcribe ──────────────────────────────────────────────────
')
[void]$sb.Append('    console.log(`[${sessionId}] Transcribing with Whisper...`);
')
[void]$sb.Append('    const transcription = await transcribeAudio(audioPath);
')
[void]$sb.Append('    console.log(`[${sessionId}] Transcript: ${transcription.text.slice(0, 80)}...`);
')
[void]$sb.Append('
')
[void]$sb.Append('    // ── Step 4: Extract keyframes ───────────────────────────────────────────
')
[void]$sb.Append('    console.log(`[${sessionId}] Extracting keyframes...`);
')
[void]$sb.Append('    const frames = await extractKeyframes(videoPath, duration, os.tmpdir(), sessionId);
')
[void]$sb.Append('    frames.forEach(f => framePaths.push(f.path));
')
[void]$sb.Append('    console.log(`[${sessionId}] Extracted ${frames.length} frames`);
')
[void]$sb.Append('
')
[void]$sb.Append('    // ── Step 5: Build response ──────────────────────────────────────────────
')
[void]$sb.Append('    const responsePayload = {
')
[void]$sb.Append('      sessionId,
')
[void]$sb.Append('      filename: req.file.originalname,
')
[void]$sb.Append('      fileSize: req.file.size,
')
[void]$sb.Append('      duration: Math.round(duration),
')
[void]$sb.Append('      durationLabel: formatTimestamp(Math.round(duration)),
')
[void]$sb.Append('      transcription: {
')
[void]$sb.Append('        text: transcription.text,
')
[void]$sb.Append('        language: transcription.language,
')
[void]$sb.Append('        segments: transcription.segments,
')
[void]$sb.Append('      },
')
[void]$sb.Append('      frames: frames.map(f => ({
')
[void]$sb.Append('        timestamp: f.timestamp,
')
[void]$sb.Append('        label: f.label,
')
[void]$sb.Append('        base64: f.base64,
')
[void]$sb.Append('        // path not sent to client
')
[void]$sb.Append('      })),
')
[void]$sb.Append('    };
')
[void]$sb.Append('
')
[void]$sb.Append('    res.json(responsePayload);
')
[void]$sb.Append('    console.log(`[${sessionId}] Response sent successfully`);
')
[void]$sb.Append('
')
[void]$sb.Append('  } catch (err) {
')
[void]$sb.Append('    console.error(`[${sessionId}] Error during analysis:`, err);
')
[void]$sb.Append('
')
[void]$sb.Append('    // Provide helpful error messages
')
[void]$sb.Append('    let message = err.message || "Unknown error during video processing.";
')
[void]$sb.Append('    if (message.includes("ffmpeg")) message = "ffmpeg error: " + message;
')
[void]$sb.Append('    if (message.includes("OpenAI") || message.includes("whisper")) message = "Transcription error: " + message;
')
[void]$sb.Append('
')
[void]$sb.Append('    res.status(500).json({ error: message, sessionId });
')
[void]$sb.Append('
')
[void]$sb.Append('  } finally {
')
[void]$sb.Append('    // ── Cleanup ALL temp files ──────────────────────────────────────────────
')
[void]$sb.Append('    cleanup(videoPath, audioPath, ...framePaths);
')
[void]$sb.Append('    console.log(`[${sessionId}] Temp files cleaned up`);
')
[void]$sb.Append('  }
')
[void]$sb.Append('});
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── Error handler ────────────────────────────────────────────────────────────
')
[void]$sb.Append('app.use((err, req, res, next) => {
')
[void]$sb.Append('  if (err instanceof multer.MulterError) {
')
[void]$sb.Append('    if (err.code === "LIMIT_FILE_SIZE") {
')
[void]$sb.Append('      return res.status(413).json({ error: `File too large. Maximum size is ${MAX_MB}MB.` });
')
[void]$sb.Append('    }
')
[void]$sb.Append('  }
')
[void]$sb.Append('  console.error("[server error]", err.message);
')
[void]$sb.Append('  res.status(500).json({ error: err.message || "Internal server error" });
')
[void]$sb.Append('});
')
[void]$sb.Append('
')
[void]$sb.Append('// ─── Start ────────────────────────────────────────────────────────────────────
')
[void]$sb.Append('app.listen(PORT, () => {
')
[void]$sb.Append('  console.log(`\n✅ ViralAudit Server running on port ${PORT}`);
')
[void]$sb.Append('  console.log(`   Max upload size : ${MAX_MB}MB`);
')
[void]$sb.Append('  console.log(`   CORS origin     : ${CORS_ORIGIN}`);
')
[void]$sb.Append('  console.log(`   Temp dir        : ${os.tmpdir()}`);
')
[void]$sb.Append('  console.log(`   OpenAI key      : ${process.env.OPENAI_API_KEY ? "✓ set" : "✗ MISSING"}\n`);
')
[void]$sb.Append('});
')
[System.IO.File]::WriteAllText($outFile, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "viral-audit-server.js restored!" -ForegroundColor Green