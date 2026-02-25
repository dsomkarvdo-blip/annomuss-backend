// =============================================
// FILE: backend/routes/reels.js
// =============================================

import express from "express";
import multer from "multer";
import path from "path";
import { authMiddleware } from "../middleware/auth.js";
import Reel from "../models/reel.js";

const router = express.Router();

// ── Multer setup ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "reel-" + unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|mov|webm|ogg|mp3|wav|m4a/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) cb(null, true);
    else cb(new Error("Video/audio files only!"));
  }
});

// ── POST /api/reels — Create a reel ──────────────────────────────
router.post("/", authMiddleware, upload.single("media"), async (req, res) => {
  try {
    const { emotion, caption, poeticCaption, type, avatarStyle, voiceStyle, bgTheme, duration, duetOf } = req.body;

    const validEmotions = ["happy","sad","lonely","anxious","angry","neutral","excited","grateful","overwhelmed","hopeful","heartbroken","funny","calm"];
    if (!emotion || !validEmotions.includes(emotion)) {
      return res.status(400).json({ message: "Valid emotion required ❌" });
    }

    const mediaUrl = req.file ? `http://localhost:3000/uploads/${req.file.filename}` : null;
    const mediaType = req.file ? (req.file.mimetype.startsWith("video") ? "video" : "audio") : null;

    const reel = await Reel.create({
      anonymousName: req.user.anonymousName,
      emotion,
      caption:       caption?.trim() || "",
      poeticCaption: poeticCaption?.trim() || "",
      type:          type || "avatar",
      avatarStyle:   avatarStyle || "adventurer",
      voiceStyle:    voiceStyle || "original",
      bgTheme:       bgTheme || "none",
      duration:      parseInt(duration) || 0,
      mediaUrl,
      mediaType,
      duetOf: duetOf || null,
      isDuet: !!duetOf
    });

    res.status(201).json({ message: "Reel posted ✅", reel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to post reel ❌" });
  }
});

// ── GET /api/reels — Feed (newest first) ─────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const reels = await Reel.find({ isDuet: false }).sort({ createdAt: -1 }).limit(30);
    res.json(reels);
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

// ── GET /api/reels/my — Current user's reels ─────────────────────
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const reels = await Reel.find({ anonymousName: req.user.anonymousName }).sort({ createdAt: -1 });
    res.json(reels);
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

// ── GET /api/reels/:id — Single reel ─────────────────────────────
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Not found" });
    res.json(reel);
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

// ── GET /api/reels/:id/duets — Duets of a reel ───────────────────
router.get("/:id/duets", authMiddleware, async (req, res) => {
  try {
    const duets = await Reel.find({ duetOf: req.params.id }).sort({ createdAt: -1 });
    res.json(duets);
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

// ── POST /api/reels/:id/react — Toggle reaction ───────────────────
router.post("/:id/react", authMiddleware, async (req, res) => {
  try {
    const { reaction } = req.body;
    const validReactions = ["felt_this","not_alone","same_here","sending_strength","tell_more"];
    if (!validReactions.includes(reaction)) {
      return res.status(400).json({ message: "Invalid reaction ❌" });
    }

    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Not found" });

    const name = req.user.anonymousName;
    const isAdding = !reel.reactions[reaction].includes(name);

    // Remove from all reaction arrays first
    for (const key of validReactions) {
      reel.reactions[key] = reel.reactions[key].filter(n => n !== name);
    }
    if (isAdding) reel.reactions[reaction].push(name);

    await reel.save();

    const totals = {};
    for (const key of validReactions) totals[key] = reel.reactions[key].length;

    res.json({ reacted: isAdding ? reaction : null, totals, userReaction: isAdding ? reaction : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed ❌" });
  }
});

// ── POST /api/reels/:id/view — Mark viewed ───────────────────────
router.post("/:id/view", authMiddleware, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Not found" });
    const name = req.user.anonymousName;
    if (!reel.views.includes(name)) { reel.views.push(name); await reel.save(); }
    res.json({ views: reel.views.length });
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

// ── DELETE /api/reels/:id — Delete own reel ──────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Not found" });
    if (reel.anonymousName !== req.user.anonymousName) {
      return res.status(403).json({ message: "Not your reel ❌" });
    }
    await reel.deleteOne();
    res.json({ message: "Deleted ✅" });
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

export default router;
