import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authMiddleware } from "../middleware/auth.js";
import Post from "../models/Post.js";
import fs from "fs";

const router = express.Router();

// ── Create uploads dir if not exists ─────────────────────────────
const uploadsDir = "uploads/";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Multer setup ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Images and videos only!"));
  }
});

// ── POST /api/posts ───────────────────────────────────────────────
router.post("/", authMiddleware, upload.single("media"), async (req, res) => {
  try {
    const { type, emotion, caption } = req.body;

    if (!["post", "story"].includes(type)) {
      return res.status(400).json({ message: "Type must be post or story" });
    }

    const baseUrl = process.env.BACKEND_URL || "http://localhost:3000";

    const mediaUrl = req.file
      ? `${baseUrl}/uploads/${req.file.filename}`
      : null;

    const mediaType = req.file
      ? req.file.mimetype.startsWith("video") ? "video" : "image"
      : null;

    const expiresAt = type === "story"
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : null;

    const post = await Post.create({
      anonymousName: req.user.anonymousName,
      type,
      emotion,
      caption: caption?.trim() || "",
      mediaUrl,
      mediaType,
      expiresAt
    });

    res.status(201).json({ message: "Posted ✅", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to post ❌" });
  }
});

// ── GET /api/posts ────────────────────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ type: "post" })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(posts);
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

// ── GET /api/posts/stories ────────────────────────────────────────
router.get("/stories", authMiddleware, async (req, res) => {
  try {
    const stories = await Post.find({
      type: "story",
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    res.json(stories);
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

// ── POST /api/posts/:id/like ──────────────────────────────────────
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const name = req.user.anonymousName;
    const liked = post.likes.includes(name);

    if (liked) {
      post.likes = post.likes.filter(n => n !== name);
    } else {
      post.likes.push(name);
    }

    await post.save();
    res.json({ liked: !liked, count: post.likes.length });
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

// ── POST /api/posts/:id/view ──────────────────────────────────────
router.post("/:id/view", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Not found" });

    const name = req.user.anonymousName;
    if (!post.views.includes(name)) {
      post.views.push(name);
      await post.save();
    }
    res.json({ views: post.views.length });
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

// ── DELETE /api/posts/:id ─────────────────────────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Not found" });
    if (post.anonymousName !== req.user.anonymousName) {
      return res.status(403).json({ message: "Not your post ❌" });
    }
    await post.deleteOne();
    res.json({ message: "Deleted ✅" });
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

export default router;
```

---

// ## Fix 2 — Add `BACKEND_URL` to Render environment variables

Go to Render → Your service → **Environment** → Add:
```
BACKEND_URL = https://annomuss-backend.onrender.com