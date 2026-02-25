import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Create uploads folder if it doesn't exist
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed ❌"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// POST /api/upload
router.post("/", authMiddleware, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded ❌" });

  const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
  const isImage = req.file.mimetype.startsWith("image/");

  res.json({
    message: "File uploaded ✅",
    url: fileUrl,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    isImage
  });
});

export default router;